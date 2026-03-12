import assert from 'node:assert/strict';
import test from 'node:test';

import { getAbnahmenRecords } from '@/lib/abnahmen/mock-data';
import { filterAbnahmen, getKpiSummary, getOpenDefectsBySeverity } from '@/lib/abnahmen/selectors';

test('filter kombiniert status, query und flags', () => {
  const records = getAbnahmenRecords();
  const filtered = filterAbnahmen(records, {
    query: 'Isarpark',
    status: 'DEFECTS_OPEN',
    onlyCritical: true,
    onlyOverdue: true,
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'abn-26-001');
});

test('kpi summary aggregiert kritische und überfällige mängel', () => {
  const records = getAbnahmenRecords();
  const summary = getKpiSummary(records);

  assert.ok(summary.openAbnahmen >= 1);
  assert.ok(summary.criticalDefects >= getOpenDefectsBySeverity(records[0], 'critical'));
});
