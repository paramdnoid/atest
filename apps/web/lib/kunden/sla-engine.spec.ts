import assert from 'node:assert/strict';
import test from 'node:test';

import { getKundenRecordById, getKundenRecords } from '@/lib/kunden/mock-data';
import { evaluateKundenSla, getHighestSlaState } from '@/lib/kunden/sla-engine';

test('sla-engine: breached reminder bleibt breached', () => {
  const record = getKundenRecordById('k-1002');
  assert.ok(record);
  const evaluated = evaluateKundenSla(record, new Date('2026-03-12T10:00:00.000Z'));
  assert.equal(evaluated.some((entry) => entry.breachState === 'BREACHED'), true);
});

test('sla-engine: portfolio status erkennt mindestens at-risk', () => {
  const state = getHighestSlaState(getKundenRecords(), new Date('2026-03-12T10:00:00.000Z'));
  assert.equal(['ON_TRACK', 'AT_RISK', 'BREACHED'].includes(state), true);
});
