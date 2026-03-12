import assert from 'node:assert/strict';
import test from 'node:test';

import { getKundenRecordById } from '@/lib/kunden/mock-data';
import { getKundenTransitionBlockers, transitionKundenStatus } from '@/lib/kunden/state-machine';

test('state-machine: aktiviert Kunden mit Objekt und primaerem Kontakt', () => {
  const record = getKundenRecordById('k-1001');
  assert.ok(record);
  const result = transitionKundenStatus(record, 'RUHEND');
  assert.equal(result.ok, true);
});

test('state-machine: blockiert Aktivierung ohne primaeren Kontakt', () => {
  const record = getKundenRecordById('k-1002');
  assert.ok(record);
  record.ansprechpartner = [];
  const blockers = getKundenTransitionBlockers(record, 'AKTIV');
  assert.equal(blockers.length > 0, true);
});

test('state-machine: verbietet ungueltigen Direktwechsel', () => {
  const record = getKundenRecordById('k-1001');
  assert.ok(record);
  const result = transitionKundenStatus(record, 'ARCHIVIERT');
  assert.equal(result.ok, false);
});
