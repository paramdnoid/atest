import assert from 'node:assert/strict';
import test from 'node:test';

import { getAbnahmeRecordById } from '@/lib/abnahmen/mock-data';
import { getEvidenceBlockingMessages, getEvidencePolicyIssues } from '@/lib/abnahmen/evidence-policy';

test('policy meldet blockierende issues bei personenbezogenen nicht-redigierten fotos', () => {
  const record = getAbnahmeRecordById('abn-26-001');
  assert.ok(record);

  const issues = getEvidencePolicyIssues(record.defects);
  assert.ok(issues.some((entry) => entry.level === 'blocking'));
});

test('blocking messages sind leer wenn evidenz bereinigt ist', () => {
  const record = getAbnahmeRecordById('abn-26-001');
  assert.ok(record);

  const sanitizedDefects = record.defects.map((defect) => ({
    ...defect,
    evidence: defect.evidence.map((evidence) => ({ ...evidence, redacted: true, legalBasis: 'contract' as const })),
  }));

  const blockers = getEvidenceBlockingMessages(sanitizedDefects);
  assert.equal(blockers.length, 0);
});
