import assert from 'node:assert/strict';
import test from 'node:test';

import { getKundenIntelligenceSignals, getNextBestAction } from '@/lib/kunden/intelligence';
import { getKundenRecordById, getKundenRecords } from '@/lib/kunden/mock-data';

test('intelligence: liefert consent signal bei offenem consent', () => {
  const records = getKundenRecords();
  const lead = getKundenRecordById('k-1002');
  assert.ok(lead);
  const signals = getKundenIntelligenceSignals(lead, records);
  assert.equal(signals.some((signal) => signal.title.includes('Consent')), true);
});

test('intelligence: next best action ist gesetzt', () => {
  const record = getKundenRecordById('k-1001');
  assert.ok(record);
  const action = getNextBestAction(record);
  assert.equal(action.length > 5, true);
});
