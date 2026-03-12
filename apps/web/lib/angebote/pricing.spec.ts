import assert from 'node:assert/strict';
import test from 'node:test';

import { getQuoteRecordById } from '@/lib/angebote/mock-data';
import { getPositionRevenueNet, getQuoteTotals } from '@/lib/angebote/pricing';

test('pricing: berechnet Positionsumsatz mit Rabatt korrekt', () => {
  const record = getQuoteRecordById('q-1004');
  assert.ok(record);
  const position = record.positions.find((entry) => entry.id === 'p-9');
  assert.ok(position);

  const revenue = getPositionRevenueNet(position);
  assert.equal(revenue, 7726.05);
});

test('pricing: berechnet Angebotskennzahlen konsistent', () => {
  const record = getQuoteRecordById('q-1001');
  assert.ok(record);

  const totals = getQuoteTotals(record);
  assert.equal(totals.totalNet > 0, true);
  assert.equal(totals.totalCostNet > 0, true);
  assert.equal(totals.marginNet, Number((totals.totalNet - totals.totalCostNet).toFixed(2)));
  assert.equal(totals.marginPercent > 0, true);
});
