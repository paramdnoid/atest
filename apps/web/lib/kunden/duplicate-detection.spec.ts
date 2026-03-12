import assert from 'node:assert/strict';
import test from 'node:test';

import { detectDuplicateCandidates, resolveDuplicateCandidate } from '@/lib/kunden/duplicate-detection';
import { getKundenRecords } from '@/lib/kunden/mock-data';

test('duplicate detection: findet aehnliche baukontor datensaetze', () => {
  const candidates = detectDuplicateCandidates(getKundenRecords(), 0.75);
  assert.equal(candidates.some((candidate) => candidate.leftEntityId === 'k-1002' || candidate.rightEntityId === 'k-1002'), true);
});

test('duplicate detection: setzt resolution auf merged', () => {
  const candidates = detectDuplicateCandidates(getKundenRecords(), 0.75);
  const first = candidates[0];
  assert.ok(first);
  const resolved = resolveDuplicateCandidate(candidates, first.id, 'MERGED');
  assert.equal(resolved.find((entry) => entry.id === first.id)?.resolution, 'MERGED');
});
