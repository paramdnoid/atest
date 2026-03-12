import type { DuplicateCandidate, KundenRecord } from '@/lib/kunden/types';

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[^a-z0-9]/g, '');
}

function calculateSimilarity(left: KundenRecord, right: KundenRecord): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  if (normalize(left.name) === normalize(right.name)) {
    score += 0.55;
    reasons.push('Name identisch');
  } else if (
    normalize(left.name).includes(normalize(right.name).slice(0, 8)) ||
    normalize(right.name).includes(normalize(left.name).slice(0, 8))
  ) {
    score += 0.35;
    reasons.push('Name aehnlich');
  }

  if (left.region === right.region) {
    score += 0.2;
    reasons.push('Gleiche Region');
  }

  const leftPhones = new Set(left.ansprechpartner.map((contact) => normalize(contact.telefon)));
  const hasSharedPhone = right.ansprechpartner.some((contact) => leftPhones.has(normalize(contact.telefon)));
  if (hasSharedPhone) {
    score += 0.25;
    reasons.push('Kontakttelefon identisch');
  }

  const bounded = Math.min(1, Number(score.toFixed(2)));
  return { score: bounded, reasons };
}

export function detectDuplicateCandidates(records: KundenRecord[], threshold = 0.75): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];
  for (let i = 0; i < records.length; i += 1) {
    for (let j = i + 1; j < records.length; j += 1) {
      const left = records[i];
      const right = records[j];
      if (!left || !right) continue;
      const { score, reasons } = calculateSimilarity(left, right);
      if (score >= threshold) {
        candidates.push({
          id: `dup-${left.id}-${right.id}`,
          leftEntityId: left.id,
          rightEntityId: right.id,
          score,
          reasons,
          resolution: 'OPEN',
        });
      }
    }
  }
  return candidates;
}

export function resolveDuplicateCandidate(
  candidates: DuplicateCandidate[],
  id: string,
  resolution: 'MERGED' | 'DISMISSED',
): DuplicateCandidate[] {
  return candidates.map((candidate) =>
    candidate.id === id ? { ...candidate, resolution } : candidate,
  );
}
