import assert from 'node:assert/strict';
import test from 'node:test';

import { getQuoteRecords } from '@/lib/angebote/mock-data';
import { getQuoteIntelligenceSignals } from '@/lib/angebote/intelligence';

test('intelligence: liefert Signale fuer unvollstaendige Angebote', () => {
  const records = getQuoteRecords();
  const draft = records.find((record) => record.id === 'q-1002');
  assert.ok(draft);

  const signals = getQuoteIntelligenceSignals(draft, records);
  assert.equal(signals.length > 0, true);
  assert.equal(signals.some((signal) => signal.type === 'MISSING_CORE_POSITION'), true);
});

test('intelligence: erkennt Margenrisiko in kritischen Faellen', () => {
  const records = getQuoteRecords();
  const source = records.find((record) => record.id === 'q-1002');
  assert.ok(source);
  const quote = {
    ...source,
    positions: source.positions.map((position) => ({
      ...position,
      unitPriceNet: position.unitPriceNet * 0.25,
    })),
  };

  const signals = getQuoteIntelligenceSignals(quote, records);
  assert.equal(signals.some((signal) => signal.type === 'MARGIN_RISK'), true);
});
