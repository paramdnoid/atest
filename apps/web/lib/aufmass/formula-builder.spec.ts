import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildFormulaAst,
  evaluateFormulaAst,
  evaluateFormulaInput,
  evaluateLegacyFormula,
  migrateLegacyFormula,
  parseLegacyFormulaToAst,
  serializeFormulaAst,
} from '@/lib/aufmass/formula-builder';

test('builder-template wall_area liefert erwarteten wert', () => {
  const ast = buildFormulaAst('wall_area', {
    length: 5,
    width: 4,
    height: 2.8,
    openings: 2,
  });

  assert.ok(ast);
  assert.equal(serializeFormulaAst(ast!), '((((length + width) * 2) * height) - openings)');
  const result = evaluateFormulaAst(ast!);
  assert.equal(result.ok, true);
  assert.equal(result.value, 48.4);
});

test('legacy-formel wird ohne eval sicher ausgewertet', () => {
  const result = evaluateLegacyFormula('((10 + 5) * 2) / 3');
  assert.equal(result.ok, true);
  assert.equal(result.value, 10);
});

test('legacy-formel blockiert ungültige zeichen', () => {
  const result = evaluateLegacyFormula('Math.max(1,2)');
  assert.equal(result.ok, false);
  assert.match(result.error ?? '', /ungültige Zeichen|nicht erlaubte Zeichen/i);
});

test('evaluateFormulaInput priorisiert AST vor string', () => {
  const ast = buildFormulaAst('piece_count', { count: 12 });
  const result = evaluateFormulaInput('1+1', ast ?? undefined);
  assert.equal(result.ok, true);
  assert.equal(result.value, 12);
});

test('legacy parser konvertiert formel in AST', () => {
  const ast = parseLegacyFormulaToAst('(6.2+5.5)*2.7-4.1');
  assert.ok(ast);
  assert.equal(serializeFormulaAst(ast!), '(((6.2 + 5.5) * 2.7) - 4.1)');
});

test('legacy migration klassifiziert confident/partial/unparsed', () => {
  const confident = migrateLegacyFormula('(2+3)*4');
  assert.equal(confident.status, 'migrated_confident');
  assert.ok(confident.ast);

  const partial = migrateLegacyFormula('(((((((1+2)+3)+4)+5)+6)+7)+8)');
  assert.equal(partial.status, 'migrated_partial');

  const unparsed = migrateLegacyFormula('L*B');
  assert.equal(unparsed.status, 'legacy_unparsed');
});
