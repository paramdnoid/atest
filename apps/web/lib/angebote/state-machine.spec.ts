import assert from 'node:assert/strict';
import test from 'node:test';

import { getQuoteRecordById } from '@/lib/angebote/mock-data';
import { getTransitionBlockers, transitionQuoteStatus } from '@/lib/angebote/state-machine';

test('state-machine: blockiert Freigabe bei ungültigem Gültigkeitsdatum', () => {
  const source = getQuoteRecordById('q-1002');
  const record = source ? structuredClone(source) : undefined;
  assert.ok(record);
  record.status = 'IN_APPROVAL';
  record.selectedOptionId = 'does-not-matter';
  record.validUntil = 'invalid-date';

  const blockers = getTransitionBlockers(record, 'APPROVED');
  assert.equal(blockers.some((entry) => entry.includes('Gültigkeitsdatum ist nicht gesetzt oder ungültig.')), true);
});

test('state-machine: erlaubt Konvertierung nur aus SENT', () => {
  const sentSource = getQuoteRecordById('q-1003');
  const sent = sentSource ? structuredClone(sentSource) : undefined;
  assert.ok(sent);
  const sentResult = transitionQuoteStatus(sent, 'CONVERTED_TO_ORDER');
  assert.equal(sentResult.ok, true);

  const draftSource = getQuoteRecordById('q-1002');
  const draft = draftSource ? structuredClone(draftSource) : undefined;
  assert.ok(draft);
  const draftResult = transitionQuoteStatus(draft, 'CONVERTED_TO_ORDER');
  assert.equal(draftResult.ok, false);
});

test('state-machine: liefert blocker-text für unzulässige quick-convert transition', () => {
  const source = getQuoteRecordById('q-1002');
  const draft = source ? structuredClone(source) : undefined;
  assert.ok(draft);
  const blockers = getTransitionBlockers(draft, 'CONVERTED_TO_ORDER');
  assert.equal(blockers.length > 0, true);
});
