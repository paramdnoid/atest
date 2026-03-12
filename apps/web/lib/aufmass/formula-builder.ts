import type {
  FormulaAst,
  FormulaBinaryOperator,
  FormulaEvaluation,
  FormulaMigrationStatus,
  FormulaNode,
  FormulaTemplateId,
  FormulaVariableKey,
  AufmassUnit,
} from '@/lib/aufmass/types';

export type BuilderInputValues = Partial<Record<FormulaVariableKey, number>>;
export type LegacyMigrationResult = {
  status: FormulaMigrationStatus;
  ast?: FormulaAst;
  normalizedFormula?: string;
  reason?: string;
};

const MAX_MIGRATION_NODE_COUNT = 40;
const MAX_MIGRATION_DEPTH = 6;

type FormulaTemplateDefinition = {
  id: FormulaTemplateId;
  label: string;
  compatibleUnits: AufmassUnit[];
  requiredKeys: FormulaVariableKey[];
  build: (values: BuilderInputValues) => FormulaNode;
};

function numberNode(value: number): FormulaNode {
  return { kind: 'number', value };
}

function variableNode(key: FormulaVariableKey): FormulaNode {
  return { kind: 'variable', key };
}

function binaryNode(op: FormulaBinaryOperator, left: FormulaNode, right: FormulaNode): FormulaNode {
  return { kind: 'binary', op, left, right };
}

export const formulaTemplates: FormulaTemplateDefinition[] = [
  {
    id: 'wall_area',
    label: 'Wandfläche ((L+B)*2*H - Öffnungen)',
    compatibleUnits: ['m2'],
    requiredKeys: ['length', 'width', 'height', 'openings'],
    build: () =>
      binaryNode(
        'sub',
        binaryNode(
          'mul',
          binaryNode('mul', binaryNode('add', variableNode('length'), variableNode('width')), numberNode(2)),
          variableNode('height'),
        ),
        variableNode('openings'),
      ),
  },
  {
    id: 'ceiling_area',
    label: 'Deckenfläche (L*B)',
    compatibleUnits: ['m2'],
    requiredKeys: ['length', 'width'],
    build: () => binaryNode('mul', variableNode('length'), variableNode('width')),
  },
  {
    id: 'linear_length',
    label: 'Länge (L*Anzahl*Faktor)',
    compatibleUnits: ['m'],
    requiredKeys: ['length', 'count', 'factor'],
    build: () =>
      binaryNode(
        'mul',
        binaryNode('mul', variableNode('length'), variableNode('count')),
        variableNode('factor'),
      ),
  },
  {
    id: 'piece_count',
    label: 'Stückzahl (Anzahl)',
    compatibleUnits: ['stk'],
    requiredKeys: ['count'],
    build: () => variableNode('count'),
  },
];

export function getTemplateById(templateId: FormulaTemplateId): FormulaTemplateDefinition | null {
  return formulaTemplates.find((template) => template.id === templateId) ?? null;
}

export function getTemplatesForUnit(unit: AufmassUnit): FormulaTemplateDefinition[] {
  return formulaTemplates.filter((template) => template.compatibleUnits.includes(unit));
}

export function buildFormulaAst(
  templateId: FormulaTemplateId,
  values: BuilderInputValues,
): FormulaAst | null {
  const template = getTemplateById(templateId);
  if (!template) return null;
  return {
    version: 1,
    templateId,
    root: template.build(values),
    variables: values,
  };
}

export function evaluateFormulaAst(ast: FormulaAst): FormulaEvaluation {
  function resolveNode(node: FormulaNode): number {
    if (node.kind === 'number') return node.value;
    if (node.kind === 'variable') {
      const value = ast.variables[node.key] ?? 0;
      return value;
    }

    const left = resolveNode(node.left);
    const right = resolveNode(node.right);
    switch (node.op) {
      case 'add':
        return left + right;
      case 'sub':
        return left - right;
      case 'mul':
        return left * right;
      case 'div':
        if (right === 0) throw new Error('Division durch 0.');
        return left / right;
      default:
        return left;
    }
  }

  try {
    const value = resolveNode(ast.root);
    if (!Number.isFinite(value)) {
      return { ok: false, error: 'Formelergebnis ist nicht endlich.' };
    }
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Formel ungültig.' };
  }
}

function formatNode(node: FormulaNode): string {
  if (node.kind === 'number') return node.value.toString();
  if (node.kind === 'variable') return node.key;

  const left = formatNode(node.left);
  const right = formatNode(node.right);
  const op = node.op === 'add' ? '+' : node.op === 'sub' ? '-' : node.op === 'mul' ? '*' : '/';
  return `(${left} ${op} ${right})`;
}

export function serializeFormulaAst(ast: FormulaAst): string {
  return formatNode(ast.root);
}

const LEGACY_FORMULA_REGEX = /^[0-9+\-*/().,\s]+$/;

function precedence(op: string): number {
  if (op === '+' || op === '-') return 1;
  if (op === '*' || op === '/') return 2;
  return 0;
}

function applyOperator(values: number[], op: string): boolean {
  const right = values.pop();
  const left = values.pop();
  if (left === undefined || right === undefined) return false;

  if (op === '+') values.push(left + right);
  else if (op === '-') values.push(left - right);
  else if (op === '*') values.push(left * right);
  else if (op === '/') {
    if (right === 0) throw new Error('Division durch 0.');
    values.push(left / right);
  } else {
    return false;
  }
  return true;
}

export function evaluateLegacyFormula(formula: string): FormulaEvaluation {
  const normalized = formula.replaceAll(',', '.').replace(/\s+/g, '').trim();
  if (!normalized) return { ok: false, error: 'Formel fehlt.' };
  if (!LEGACY_FORMULA_REGEX.test(normalized)) {
    return { ok: false, error: 'Legacy-Formel enthält ungültige Zeichen.' };
  }

  if (/[^0-9+\-*/().]/.test(normalized)) {
    return { ok: false, error: 'Legacy-Formel enthält nicht erlaubte Zeichen.' };
  }

  const values: number[] = [];
  const operators: string[] = [];

  try {
    let i = 0;
    while (i < normalized.length) {
      const char = normalized[i];

      if (((char >= '0' && char <= '9') || char === '.')) {
        let numberText = char;
        i += 1;
        while (i < normalized.length) {
          const next = normalized[i];
          if ((next >= '0' && next <= '9') || next === '.') {
            numberText += next;
            i += 1;
          } else {
            break;
          }
        }
        const parsed = Number(numberText);
        if (!Number.isFinite(parsed)) return { ok: false, error: 'Ungültige Zahl in Legacy-Formel.' };
        values.push(parsed);
        continue;
      }

      if (char === '(') {
        operators.push(char);
        i += 1;
        continue;
      }

      if (char === ')') {
        while (operators.length > 0 && operators[operators.length - 1] !== '(') {
          const op = operators.pop();
          if (!op || !applyOperator(values, op)) return { ok: false, error: 'Legacy-Syntaxfehler.' };
        }
        if (operators.pop() !== '(') return { ok: false, error: 'Klammerfehler in Legacy-Formel.' };
        i += 1;
        continue;
      }

      if (char === '+' || char === '-' || char === '*' || char === '/') {
        while (
          operators.length > 0 &&
          operators[operators.length - 1] !== '(' &&
          precedence(operators[operators.length - 1]) >= precedence(char)
        ) {
          const op = operators.pop();
          if (!op || !applyOperator(values, op)) return { ok: false, error: 'Legacy-Syntaxfehler.' };
        }
        operators.push(char);
        i += 1;
        continue;
      }

      return { ok: false, error: 'Legacy-Syntaxfehler.' };
    }

    while (operators.length > 0) {
      const op = operators.pop();
      if (!op || op === '(' || op === ')' || !applyOperator(values, op)) {
        return { ok: false, error: 'Legacy-Syntaxfehler.' };
      }
    }

    if (values.length !== 1 || !Number.isFinite(values[0])) {
      return { ok: false, error: 'Legacy-Formel nicht numerisch.' };
    }
    return { ok: true, value: values[0] };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Legacy-Syntaxfehler.' };
  }
}

export function evaluateFormulaInput(formula: string, ast?: FormulaAst): FormulaEvaluation {
  if (ast) {
    return evaluateFormulaAst(ast);
  }
  return evaluateLegacyFormula(formula);
}

function tokenToOperator(token: string): FormulaBinaryOperator | null {
  if (token === '+') return 'add';
  if (token === '-') return 'sub';
  if (token === '*') return 'mul';
  if (token === '/') return 'div';
  return null;
}

function toAstFromRpn(rpn: string[]): FormulaAst | null {
  const stack: FormulaNode[] = [];

  for (const token of rpn) {
    const operator = tokenToOperator(token);
    if (!operator) {
      const value = Number(token);
      if (!Number.isFinite(value)) return null;
      stack.push({ kind: 'number', value });
      continue;
    }

    const right = stack.pop();
    const left = stack.pop();
    if (!left || !right) return null;
    stack.push({ kind: 'binary', op: operator, left, right });
  }

  const root = stack.pop();
  if (!root || stack.length > 0) return null;
  return {
    version: 1,
    root,
    variables: {},
  };
}

export function parseLegacyFormulaToAst(formula: string): FormulaAst | null {
  const normalized = formula.replaceAll(',', '.').replace(/\s+/g, '').trim();
  if (!normalized) return null;
  if (/[^0-9+\-*/().]/.test(normalized)) return null;

  const outputQueue: string[] = [];
  const operators: string[] = [];

  let i = 0;
  while (i < normalized.length) {
    const char = normalized[i];

    if (((char >= '0' && char <= '9') || char === '.')) {
      let numberText = char;
      i += 1;
      while (i < normalized.length) {
        const next = normalized[i];
        if ((next >= '0' && next <= '9') || next === '.') {
          numberText += next;
          i += 1;
        } else {
          break;
        }
      }
      const parsed = Number(numberText);
      if (!Number.isFinite(parsed)) return null;
      outputQueue.push(numberText);
      continue;
    }

    if (char === '(') {
      operators.push(char);
      i += 1;
      continue;
    }

    if (char === ')') {
      while (operators.length > 0 && operators[operators.length - 1] !== '(') {
        const op = operators.pop();
        if (!op) return null;
        outputQueue.push(op);
      }
      if (operators.pop() !== '(') return null;
      i += 1;
      continue;
    }

    if (char === '+' || char === '-' || char === '*' || char === '/') {
      while (
        operators.length > 0 &&
        operators[operators.length - 1] !== '(' &&
        precedence(operators[operators.length - 1]) >= precedence(char)
      ) {
        const op = operators.pop();
        if (!op) return null;
        outputQueue.push(op);
      }
      operators.push(char);
      i += 1;
      continue;
    }

    return null;
  }

  while (operators.length > 0) {
    const op = operators.pop();
    if (!op || op === '(' || op === ')') return null;
    outputQueue.push(op);
  }

  return toAstFromRpn(outputQueue);
}

export function migrateLegacyFormula(formula: string): LegacyMigrationResult {
  const trimmed = formula.trim();
  if (!trimmed) {
    return {
      status: 'legacy_unparsed',
      reason: 'Leere Formel kann nicht migriert werden.',
    };
  }

  const ast = parseLegacyFormulaToAst(trimmed);
  if (ast) {
    const metrics = (function getAstMetrics(root: FormulaNode): { nodes: number; depth: number } {
      if (root.kind !== 'binary') return { nodes: 1, depth: 1 };
      const left = getAstMetrics(root.left);
      const right = getAstMetrics(root.right);
      return {
        nodes: 1 + left.nodes + right.nodes,
        depth: 1 + Math.max(left.depth, right.depth),
      };
    })(ast.root);
    if (metrics.nodes > MAX_MIGRATION_NODE_COUNT || metrics.depth > MAX_MIGRATION_DEPTH) {
      return {
        status: 'migrated_partial',
        reason: 'Formel ist zu komplex für sichere automatische Migration.',
      };
    }
    const normalizedFormula = serializeFormulaAst(ast);
    return {
      status: 'migrated_confident',
      ast,
      normalizedFormula,
    };
  }

  const numericOnlyAttempt = evaluateLegacyFormula(trimmed);
  if (numericOnlyAttempt.ok) {
    return {
      status: 'migrated_partial',
      reason: 'Numerisch auswertbar, aber nicht sicher als AST parsebar.',
    };
  }

  return {
    status: 'legacy_unparsed',
    reason: 'Formel konnte nicht migriert werden.',
  };
}
