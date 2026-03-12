import assert from 'node:assert/strict';
import test from 'node:test';

import { getAufmassRecords } from '@/lib/aufmass/mock-data';
import { getForecastSnapshot } from '@/lib/aufmass/predictive';

test('forecast liefert positionsdaten mit totals', () => {
  const records = getAufmassRecords();
  const current = records.find((record) => record.id === 'am-26-001');
  assert.ok(current);

  const snapshot = getForecastSnapshot(current!, records);
  assert.ok(snapshot.positions.length > 0);
  assert.ok(snapshot.totals.effortHours > 0);
  assert.ok(snapshot.totals.materialQuantity > 0);
});

test('forecast markiert geringe datenbasis als risiko', () => {
  const records = getAufmassRecords();
  const current = records.find((record) => record.id === 'am-26-002');
  assert.ok(current);

  const snapshot = getForecastSnapshot(current!, records.slice(0, 2));
  const hasLowSampleRisk = snapshot.positions.some((position) =>
    position.riskNotes.some((note) => note.includes('Geringe Datenbasis')),
  );
  assert.equal(hasLowSampleRisk, true);
});
