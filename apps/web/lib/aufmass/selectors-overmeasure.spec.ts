import assert from 'node:assert/strict';
import test from 'node:test';

import { getAufmassRecordById } from '@/lib/aufmass/mock-data';
import { getPositionSummaries, getRecordOvermeasureIssues } from '@/lib/aufmass/selectors';

test('position summaries enthalten brutto/abzug/netto', () => {
  const record = getAufmassRecordById('am-26-001');
  assert.ok(record);

  const summaries = getPositionSummaries(record);
  const wallSummary = summaries.find((summary) => summary.position.id === 'pos-1');
  assert.ok(wallSummary);
  assert.ok(wallSummary.gross >= wallSummary.quantity);
  assert.ok(wallSummary.deducted >= 0);
});

test('record issues enthalten overmeasure checks zusätzlich zu bestehenden issues', () => {
  const record = getAufmassRecordById('am-26-001');
  assert.ok(record);

  const issues = getRecordOvermeasureIssues(record);
  assert.ok(issues.length >= record.reviewIssues.length);
});
