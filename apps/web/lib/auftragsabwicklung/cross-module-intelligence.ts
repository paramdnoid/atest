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

function moduleBasePath(module: ProzessModul): string {
  switch (module) {
    case 'KUNDEN':
      return '/kunden';
    case 'AUFMASS':
      return '/aufmass';
    case 'ANGEBOTE':
      return '/angebote';
    case 'ABNAHMEN':
      return '/abnahmen';
    default:
      return '/';
  }
}

export function getVerknuepfungSnapshot(
  module: ProzessModul,
  id: string,
): VerknuepfungsSnapshot {
  if (!id) {
    return {
      confidenceAverage: 0,
      processCoverage: 0,
      related: [],
      suggestions: ['Kein Datensatz gewählt. Verknüpfung wird nachgeladen.'],
    };
  }
  return {
    confidenceAverage: 0,
    processCoverage: 0,
    related: [],
    suggestions: [
      `Verknüpfungen für ${module.toLowerCase()} werden kontextbasiert nachgeladen.`,
      'Bis dahin konservative Ansicht ohne Querverweise.',
    ],
  };
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
  const basePath = moduleBasePath(module);
  const sourceIds = ids ?? [];
  const entries = sourceIds.slice(0, 5).map<VerknuepfungsPortfolioEntry>((id, index) => ({
    id,
    href: `${basePath}/${id}`,
    label: `${module} ${index + 1}`,
    processCoverage: 0,
    confidenceAverage: 0,
    suggestions: ['Keine belastbaren Cross-Module-Links verfügbar.'],
  }));
  if (entries.length === 0) {
    return {
      averageCoverage: 0,
      averageConfidence: 0,
      weakLinks: 0,
      entries: [],
    };
  }

  return {
    averageCoverage: 0,
    averageConfidence: 0,
    weakLinks: entries.length,
    entries,
  };
}
