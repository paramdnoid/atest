import assert from 'node:assert/strict';
import test from 'node:test';

import { parseFormulaTemplateId, parseOpeningKind } from '@/lib/aufmass/guards';

test('parseFormulaTemplateId akzeptiert nur erlaubte template ids', () => {
  const allowed = ['wall_area', 'ceiling_area'] as const;
  assert.equal(parseFormulaTemplateId('wall_area', [...allowed]), 'wall_area');
  assert.equal(parseFormulaTemplateId('piece_count', [...allowed]), null);
});

test('parseOpeningKind validiert opening kind zuverlässig', () => {
  assert.equal(parseOpeningKind('OPENING'), 'OPENING');
  assert.equal(parseOpeningKind('NICHE'), 'NICHE');
  assert.equal(parseOpeningKind('OTHER'), null);
});
