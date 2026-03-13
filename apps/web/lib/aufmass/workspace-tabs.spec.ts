import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getReviewBadgeLabel,
  getTabAriaLabel,
  getWorkspaceTabByKey,
  hasReviewBadge,
} from '@/lib/aufmass/workspace-tabs';

test('getWorkspaceTabByKey wechselt zyklisch mit pfeiltasten', () => {
  assert.equal(getWorkspaceTabByKey(0, 'ArrowRight'), 'review');
  assert.equal(getWorkspaceTabByKey(2, 'ArrowRight'), 'capture');
  assert.equal(getWorkspaceTabByKey(0, 'ArrowLeft'), 'billing');
});

test('getWorkspaceTabByKey unterstuetzt Home und End', () => {
  assert.equal(getWorkspaceTabByKey(1, 'Home'), 'capture');
  assert.equal(getWorkspaceTabByKey(1, 'End'), 'billing');
  assert.equal(getWorkspaceTabByKey(1, 'Enter'), null);
});

test('review badge helper erzeugen konsistente labels', () => {
  assert.equal(hasReviewBadge('review', 2), true);
  assert.equal(hasReviewBadge('capture', 2), false);
  assert.equal(getTabAriaLabel('review', 'Prüfung', 3), 'Prüfung, 3 offene Prüfblocker');
  assert.equal(getTabAriaLabel('billing', 'Abrechnung', 3), 'Abrechnung');
  assert.equal(getReviewBadgeLabel(4), '4 offene Prüfblocker');
});
