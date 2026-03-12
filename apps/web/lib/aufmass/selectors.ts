import type { AufmassPosition, AufmassRecord, AufmassUnit } from '@/lib/aufmass/types';
import {
  getOvermeasureBreakdown,
  getOvermeasureReviewIssues,
} from '@/lib/aufmass/overmeasure-engine';
import { serializeFormulaAst } from '@/lib/aufmass/formula-builder';

type QuantityTotals = Record<AufmassUnit, number>;

export function matchesAufmassQuery(record: AufmassRecord, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    record.number.toLowerCase().includes(normalized) ||
    record.projectName.toLowerCase().includes(normalized) ||
    record.customerName.toLowerCase().includes(normalized) ||
    record.siteName.toLowerCase().includes(normalized)
  );
}

export function getMeasurementTotalsByUnit(record: AufmassRecord): QuantityTotals {
  const totals: QuantityTotals = { m2: 0, m: 0, stk: 0 };
  for (const measurement of record.measurements) {
    totals[measurement.unit] += measurement.quantity;
  }
  return totals;
}

export function getOpenBlockersCount(record: AufmassRecord): number {
  return record.reviewIssues.filter((issue) => issue.severity === 'blocking').length;
}

export function getNextReviewDate(record: AufmassRecord): string | undefined {
  if (record.status !== 'IN_REVIEW') return undefined;
  return record.dueDate;
}

export type PositionSummary = {
  position: AufmassPosition;
  quantity: number;
  gross: number;
  deducted: number;
  overmeasured: number;
  unit: AufmassUnit;
  formulas: string[];
  reasons: string[];
};

export function getPositionSummaries(record: AufmassRecord): PositionSummary[] {
  return record.positions.map((position) => {
    const related = record.measurements.filter((measurement) => measurement.positionId === position.id);
    const breakdowns = related.map((measurement) =>
      getOvermeasureBreakdown(measurement, position.code),
    );

    const gross = breakdowns.reduce((sum, breakdown) => sum + breakdown.gross, 0);
    const deducted = breakdowns.reduce((sum, breakdown) => sum + breakdown.deducted, 0);
    const overmeasured = breakdowns.reduce((sum, breakdown) => sum + breakdown.overmeasured, 0);
    const net = breakdowns.reduce((sum, breakdown) => sum + breakdown.net, 0);
    const reasons = breakdowns.flatMap((breakdown) =>
      breakdown.decisions.map((decision) => `${decision.appliedRuleId}: ${decision.reason}`),
    );

    return {
      position,
      quantity: net,
      gross,
      deducted,
      overmeasured,
      unit: position.unit,
      formulas: related.map((entry) => (entry.formulaAst ? serializeFormulaAst(entry.formulaAst) : entry.formula)),
      reasons,
    };
  });
}

export function getRecordOvermeasureIssues(record: AufmassRecord) {
  const generated = record.measurements.flatMap((measurement) => {
    const positionCode = record.positions.find((position) => position.id === measurement.positionId)?.code;
    return getOvermeasureReviewIssues(measurement, positionCode);
  });

  const existingIds = new Set(record.reviewIssues.map((issue) => issue.id));
  return [
    ...record.reviewIssues,
    ...generated.filter((issue) => !existingIds.has(issue.id)),
  ];
}
