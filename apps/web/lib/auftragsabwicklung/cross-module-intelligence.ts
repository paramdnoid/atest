import { getAbnahmenRecords } from '@/lib/abnahmen/mock-data';
import type { AbnahmeRecord } from '@/lib/abnahmen/types';
import { getQuoteRecords } from '@/lib/angebote/mock-data';
import type { QuoteRecord } from '@/lib/angebote/types';
import { getAufmassRecords } from '@/lib/aufmass/mock-data';
import type { AufmassRecord } from '@/lib/aufmass/types';
import { getKundenRecords } from '@/lib/kunden/mock-data';
import type { KundenRecord } from '@/lib/kunden/types';

export type ProzessModul = 'KUNDEN' | 'AUFMASS' | 'ANGEBOTE' | 'ABNAHMEN';

export type VerknuepfungsTreffer = {
  module: ProzessModul;
  id: string;
  href: string;
  label: string;
  subtitle: string;
  status: string;
  confidence: number;
  reasons: string[];
};

export type VerknuepfungsSnapshot = {
  confidenceAverage: number;
  processCoverage: number;
  related: VerknuepfungsTreffer[];
  suggestions: string[];
};

export type VerknuepfungsKontext = {
  module: ProzessModul;
  id: string;
  customerName?: string;
  projectName?: string;
  siteName?: string;
};

export type HandoffAction = {
  id: string;
  label: string;
  href: string;
};

export type VerknuepfungsPortfolioEntry = {
  id: string;
  href: string;
  label: string;
  processCoverage: number;
  confidenceAverage: number;
  suggestions: string[];
};

export type VerknuepfungsPortfolioSnapshot = {
  averageCoverage: number;
  averageConfidence: number;
  weakLinks: number;
  entries: VerknuepfungsPortfolioEntry[];
};

type ProzessDatensatz = {
  module: ProzessModul;
  id: string;
  href: string;
  label: string;
  subtitle: string;
  status: string;
  customerName?: string;
  projectName?: string;
  siteName?: string;
};

type MatchScore = {
  score: number;
  reasons: string[];
};

const STOP_WORDS = new Set([
  'gmbh',
  'ag',
  'kg',
  'mbh',
  'und',
  'the',
  'der',
  'die',
  'das',
  'haus',
  'projekt',
  'objekt',
  'strasse',
  'straße',
  'road',
  'park',
]);

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/\bmfh\b/g, 'mehrfamilienhaus')
    .replace(/\bwg\b/g, 'wohnungsgenossenschaft')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value?: string): string[] {
  if (!value) return [];
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function jaccard(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) return 0;
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let intersection = 0;
  for (const entry of leftSet) {
    if (rightSet.has(entry)) intersection += 1;
  }
  const union = new Set([...leftSet, ...rightSet]).size;
  return union === 0 ? 0 : intersection / union;
}

function toProcessDataset(entries: {
  kunden: KundenRecord[];
  aufmass: AufmassRecord[];
  angebote: QuoteRecord[];
  abnahmen: AbnahmeRecord[];
}): ProzessDatensatz[] {
  const kundenDatasets = entries.kunden.map<ProzessDatensatz>((record) => ({
    module: 'KUNDEN',
    id: record.id,
    href: `/kunden/${record.id}`,
    label: `${record.number} · ${record.name}`,
    subtitle: `${record.region} · ${record.objekte.length} Objekte`,
    status: record.status,
    customerName: record.name,
    projectName: record.objekte[0]?.name,
    siteName: record.objekte[0]?.adresse,
  }));

  const aufmassDatasets = entries.aufmass.map<ProzessDatensatz>((record) => ({
    module: 'AUFMASS',
    id: record.id,
    href: `/aufmass/${record.id}`,
    label: `${record.number} · ${record.projectName}`,
    subtitle: `${record.customerName} · ${record.siteName}`,
    status: record.status,
    customerName: record.customerName,
    projectName: record.projectName,
    siteName: record.siteName,
  }));

  const angeboteDatasets = entries.angebote.map<ProzessDatensatz>((record) => ({
    module: 'ANGEBOTE',
    id: record.id,
    href: `/angebote/${record.id}`,
    label: `${record.number} · ${record.projectName}`,
    subtitle: `${record.customerName} · ${record.tradeLabel}`,
    status: record.status,
    customerName: record.customerName,
    projectName: record.projectName,
  }));

  const abnahmenDatasets = entries.abnahmen.map<ProzessDatensatz>((record) => ({
    module: 'ABNAHMEN',
    id: record.id,
    href: `/abnahmen/${record.id}`,
    label: `${record.number} · ${record.projectName}`,
    subtitle: `${record.customerName} · ${record.siteName}`,
    status: record.status,
    customerName: record.customerName,
    projectName: record.projectName,
    siteName: record.siteName,
  }));

  return [...kundenDatasets, ...aufmassDatasets, ...angeboteDatasets, ...abnahmenDatasets];
}

function scoreMatch(anchor: ProzessDatensatz, candidate: ProzessDatensatz): MatchScore {
  const reasons: string[] = [];
  const customerSimilarity = jaccard(tokenize(anchor.customerName), tokenize(candidate.customerName));
  const projectSimilarity = jaccard(tokenize(anchor.projectName), tokenize(candidate.projectName));
  const siteSimilarity = jaccard(tokenize(anchor.siteName), tokenize(candidate.siteName));

  let score = 0;
  score += customerSimilarity * 55;
  score += projectSimilarity * 30;
  score += siteSimilarity * 15;

  if (customerSimilarity >= 0.45) reasons.push('Kundenstamm stimmt stark überein');
  else if (customerSimilarity >= 0.2) reasons.push('Kundenbezug wahrscheinlich');

  if (projectSimilarity >= 0.45) reasons.push('Projektbezeichnung passt');
  else if (projectSimilarity >= 0.2) reasons.push('Projektkontext ähnelt');

  if (siteSimilarity >= 0.45) reasons.push('Standort ist konsistent');
  else if (siteSimilarity >= 0.2) reasons.push('Standort überlappt teilweise');

  if (anchor.module === 'AUFMASS' && candidate.module === 'ANGEBOTE') {
    score += 8;
    reasons.push('Typische Prozessfolge Aufmaß -> Angebot');
  }
  if (anchor.module === 'ANGEBOTE' && candidate.module === 'ABNAHMEN') {
    score += 8;
    reasons.push('Angebot kann in Ausführung/Abnahme übergehen');
  }
  if (anchor.module === 'KUNDEN' && candidate.module !== 'KUNDEN') {
    score += 5;
    reasons.push('Kundenakte als führender Kontext');
  }

  return {
    score: Math.min(100, Math.round(score)),
    reasons,
  };
}

function buildSuggestions(module: ProzessModul, related: VerknuepfungsTreffer[]): string[] {
  const suggestions: string[] = [];
  const moduleSet = new Set(related.map((entry) => entry.module));

  if (!moduleSet.has('KUNDEN')) {
    suggestions.push('Kundenbezug fehlt: Kundenakte verknüpfen und Stammdaten synchronisieren.');
  }
  if (!moduleSet.has('AUFMASS')) {
    suggestions.push('Kein Aufmaßtreffer: Mengenbasis für Folgemodule ergänzen.');
  }
  if (!moduleSet.has('ANGEBOTE')) {
    suggestions.push('Angebotsbezug fehlt: kaufmännische Kette schließen.');
  }
  if (!moduleSet.has('ABNAHMEN')) {
    suggestions.push('Abnahmebezug fehlt: Qualitätssicherung und Abschlussfluss verbinden.');
  }

  if (module === 'ANGEBOTE' && !related.some((entry) => entry.module === 'AUFMASS' && entry.confidence >= 60)) {
    suggestions.push('Für dieses Angebot ist kein belastbares Aufmaß mit hoher Confidence gefunden.');
  }

  return suggestions.slice(0, 3);
}

function toSnapshot(anchor: ProzessDatensatz, universe: ProzessDatensatz[]): VerknuepfungsSnapshot {
  const related = universe
    .filter((entry) => entry.id !== anchor.id || entry.module !== anchor.module)
    .filter((entry) => entry.module !== anchor.module)
    .map((entry) => {
      const scoring = scoreMatch(anchor, entry);
      return {
        ...entry,
        confidence: scoring.score,
        reasons: scoring.reasons,
      };
    })
    .filter((entry) => entry.confidence >= 25)
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, 8);

  const confidenceAverage =
    related.length === 0
      ? 0
      : Math.round(related.reduce((sum, entry) => sum + entry.confidence, 0) / related.length);

  const moduleCoverage = new Set(related.map((entry) => entry.module)).size;
  const processCoverage = Math.round((moduleCoverage / 3) * 100);

  return {
    confidenceAverage,
    processCoverage,
    suggestions: buildSuggestions(anchor.module, related),
    related,
  };
}

function getUniverse(): ProzessDatensatz[] {
  return toProcessDataset({
    kunden: getKundenRecords(),
    aufmass: getAufmassRecords(),
    angebote: getQuoteRecords(),
    abnahmen: getAbnahmenRecords(),
  });
}

export function getVerknuepfungSnapshot(
  module: ProzessModul,
  id: string,
): VerknuepfungsSnapshot {
  const universe = getUniverse();
  const anchor = universe.find((entry) => entry.module === module && entry.id === id);
  if (!anchor) {
    return {
      confidenceAverage: 0,
      processCoverage: 0,
      related: [],
      suggestions: ['Datensatz nicht gefunden – Verknüpfung konnte nicht berechnet werden.'],
    };
  }
  return toSnapshot(anchor, universe);
}

function encodeHandoffQuery(context: VerknuepfungsKontext): string {
  const params = new URLSearchParams();
  params.set('handoffFrom', context.module);
  params.set('handoffSourceId', context.id);
  if (context.customerName) params.set('handoffCustomer', context.customerName);
  if (context.projectName) params.set('handoffProject', context.projectName);
  if (context.siteName) params.set('handoffSite', context.siteName);
  return params.toString();
}

export function getHandoffActions(context: VerknuepfungsKontext): HandoffAction[] {
  const query = encodeHandoffQuery(context);
  switch (context.module) {
    case 'KUNDEN':
      return [
        { id: 'to-aufmass', label: 'Aufmass aus Kundenkontext starten', href: `/aufmass?${query}` },
        { id: 'to-angebote', label: 'Angebot aus Kundenkontext vorbereiten', href: `/angebote?${query}` },
      ];
    case 'AUFMASS':
      return [
        { id: 'to-angebote', label: 'Angebot aus Aufmass ableiten', href: `/angebote?${query}` },
        { id: 'to-abnahmen', label: 'Abnahmekontext vormerken', href: `/abnahmen?${query}` },
      ];
    case 'ANGEBOTE':
      return [
        { id: 'to-abnahmen', label: 'Abnahme aus Angebotskontext öffnen', href: `/abnahmen?${query}` },
        { id: 'to-kunden', label: 'Kundenakte mit Kontext öffnen', href: `/kunden?${query}` },
      ];
    case 'ABNAHMEN':
      return [
        { id: 'to-kunden', label: 'Kundenakte für Nacharbeit öffnen', href: `/kunden?${query}` },
        { id: 'to-angebote', label: 'Nachtragsangebot vorbereiten', href: `/angebote?${query}` },
      ];
    default:
      return [];
  }
}

export function getVerknuepfungPortfolioSnapshot(
  module: ProzessModul,
  ids?: string[],
): VerknuepfungsPortfolioSnapshot {
  const universe = getUniverse();
  const idFilter = ids ? new Set(ids) : null;
  const anchors = universe.filter(
    (entry) => entry.module === module && (!idFilter || idFilter.has(entry.id)),
  );

  if (anchors.length === 0) {
    return {
      averageCoverage: 0,
      averageConfidence: 0,
      weakLinks: 0,
      entries: [],
    };
  }

  const entries = anchors
    .map<VerknuepfungsPortfolioEntry>((anchor) => {
      const snapshot = toSnapshot(anchor, universe);
      return {
        id: anchor.id,
        href: anchor.href,
        label: anchor.label,
        processCoverage: snapshot.processCoverage,
        confidenceAverage: snapshot.confidenceAverage,
        suggestions: snapshot.suggestions,
      };
    })
    .sort((left, right) => left.processCoverage - right.processCoverage)
    .slice(0, 5);

  const averageCoverage = Math.round(
    entries.reduce((sum, entry) => sum + entry.processCoverage, 0) / entries.length,
  );
  const averageConfidence = Math.round(
    entries.reduce((sum, entry) => sum + entry.confidenceAverage, 0) / entries.length,
  );
  const weakLinks = entries.filter(
    (entry) => entry.processCoverage < 67 || entry.confidenceAverage < 45,
  ).length;

  return {
    averageCoverage,
    averageConfidence,
    weakLinks,
    entries,
  };
}
