import assert from 'node:assert/strict';
import test from 'node:test';

import { getOvermeasureBreakdown, getOvermeasureReviewIssues } from '@/lib/aufmass/overmeasure-engine';
import type { AufmassMeasurement } from '@/lib/aufmass/types';

const measurementBase: AufmassMeasurement = {
  id: 'm-test',
  roomId: 'r-1',
  positionId: 'p-1',
  label: 'Test',
  formula: '10',
  quantity: 10,
  unit: 'm2',
  createdAt: '2026-01-01T00:00:00Z',
};

test('overmeasure <= 2.5 m2 wird nicht abgezogen', () => {
  const breakdown = getOvermeasureBreakdown(
    {
      ...measurementBase,
      openingsOrNiches: [
        { id: 'o-1', kind: 'OPENING', roomId: 'r-1', positionId: 'p-1', width: 1, height: 1, count: 2 },
      ],
    },
    '01.01',
  );

  assert.equal(breakdown.gross, 10);
  assert.equal(breakdown.deducted, 0);
  assert.equal(breakdown.net, 10);
});

test('abzug > 2.5 m2 reduziert netto', () => {
  const breakdown = getOvermeasureBreakdown(
    {
      ...measurementBase,
      openingsOrNiches: [
        { id: 'o-2', kind: 'OPENING', roomId: 'r-1', positionId: 'p-1', width: 2, height: 2, count: 1 },
      ],
    },
    '01.01',
  );

  assert.equal(breakdown.deducted, 4);
  assert.equal(breakdown.net, 6);
  assert.equal(breakdown.decisions[0]?.appliedRuleId, 'opening-over-2_5-deduct');
});

test('regelwahl berücksichtigt schwelle bei 2.5 m2 korrekt', () => {
  const atThreshold = getOvermeasureBreakdown(
    {
      ...measurementBase,
      openingsOrNiches: [
        { id: 'o-threshold', kind: 'OPENING', roomId: 'r-1', positionId: 'p-1', width: 2.5, height: 1, count: 1 },
      ],
    },
    '01.01',
  );
  assert.equal(atThreshold.deducted, 0);
  assert.equal(atThreshold.decisions[0]?.appliedRuleId, 'opening-under-2_5-overmeasure');
});

test('ungültige zahlen erzeugen keinen NaN-abzug', () => {
  const breakdown = getOvermeasureBreakdown(
    {
      ...measurementBase,
      openingsOrNiches: [
        { id: 'o-nan', kind: 'OPENING', roomId: 'r-1', positionId: 'p-1', width: Number.NaN, height: 1, count: 1 },
      ],
    },
    '01.01',
  );

  assert.equal(Number.isFinite(breakdown.deducted), true);
  assert.equal(Number.isFinite(breakdown.net), true);
  assert.equal(breakdown.deducted, 0);
});

test('fehlende Maße erzeugen blocking issue', () => {
  const issues = getOvermeasureReviewIssues(
    {
      ...measurementBase,
      openingsOrNiches: [
        { id: 'o-3', kind: 'NICHE', roomId: 'r-1', positionId: 'p-1', width: 0, height: 1.2, count: 1 },
      ],
    },
    '01.01',
  );

  assert.equal(issues.length, 1);
  assert.equal(issues[0].severity, 'blocking');
});
