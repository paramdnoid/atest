import type { FormulaTemplateId, OpeningOrNiche } from '@/lib/aufmass/types';

export function parseFormulaTemplateId(
  value: string,
  allowed: FormulaTemplateId[],
): FormulaTemplateId | null {
  return allowed.includes(value as FormulaTemplateId) ? (value as FormulaTemplateId) : null;
}

export function parseOpeningKind(value: string): OpeningOrNiche['kind'] | null {
  if (value === 'OPENING' || value === 'NICHE') return value;
  return null;
}
