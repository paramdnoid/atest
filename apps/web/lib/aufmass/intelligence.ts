import type { AufmassRecord } from '@/lib/aufmass/types';
import { getRecordOvermeasureIssues } from '@/lib/aufmass/selectors';
import { evaluateFormulaInput, serializeFormulaAst } from '@/lib/aufmass/formula-builder';
import { getForecastSnapshot } from '@/lib/aufmass/predictive';

export type FormulaEvaluation = {
  ok: boolean;
  value?: number;
  error?: string;
};

export type FormulaQuality = {
  score: number;
  warnings: string[];
  evaluation: FormulaEvaluation;
  delta?: number;
};

export type PositionPlausibilitySignal = {
  positionId: string;
  mean: number;
  deviation: number;
  outlierCount: number;
};

export type AufmassIntelligenceSnapshot = {
  readinessScore: number;
  blockers: string[];
  warnings: string[];
  signals: PositionPlausibilitySignal[];
  nextBestActions: string[];
  forecast: ReturnType<typeof getForecastSnapshot>;
};

export function getFormulaQuality(
  formula: string,
  quantity: number,
  formulaAst?: AufmassRecord['measurements'][number]['formulaAst'],
): FormulaQuality {
  const evaluation = evaluateFormulaInput(formula, formulaAst);
  const warnings: string[] = [];
  let score = 100;

  if (!evaluation.ok) {
    return { score: 0, warnings: [evaluation.error ?? 'Ungültige Formel'], evaluation };
  }

  const formulaText = formulaAst ? serializeFormulaAst(formulaAst) : formula;
  if (formulaText.length < 5) {
    warnings.push('Formel ist sehr kurz und ggf. nicht prüffähig dokumentiert.');
    score -= 10;
  }

  const computed = evaluation.value ?? 0;
  const delta = Math.abs(computed - quantity);
  const tolerance = Math.max(0.05, quantity * 0.02);

  if (delta > tolerance) {
    warnings.push(
      `Mengenabweichung zwischen Formel (${computed.toFixed(2)}) und Eingabe (${quantity.toFixed(2)}).`,
    );
    score -= 35;
  }

  if (!formulaText.includes('*') && !formulaText.includes('+') && !formulaText.includes('-')) {
    warnings.push('Formel ist nicht herleitungsstark (keine sichtbare Rechenlogik).');
    score -= 15;
  }

  return { score: Math.max(0, score), warnings, evaluation, delta };
}

function getAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function getPlausibilitySignals(record: AufmassRecord): PositionPlausibilitySignal[] {
  return record.positions.map((position) => {
    const quantities = record.measurements
      .filter((measurement) => measurement.positionId === position.id)
      .map((measurement) => measurement.quantity);
    const mean = getAverage(quantities);
    const deviation = getStdDev(quantities, mean);
    const outlierCount =
      deviation === 0
        ? 0
        : quantities.filter((value) => Math.abs(value - mean) > deviation * 2.5).length;
    return {
      positionId: position.id,
      mean,
      deviation,
      outlierCount,
    };
  });
}

export function getNextBestActions(record: AufmassRecord): string[] {
  const actions: string[] = [];
  if (record.status === 'DRAFT') {
    actions.push('Offene Räume vollständig erfassen und Positionen zuordnen.');
    actions.push('Formeln mit nachvollziehbarer Herleitung ergänzen.');
  }
  if (record.status === 'IN_REVIEW') {
    actions.push('Blockierende Prüfpunkte beheben und erneut freigeben.');
    actions.push('Warnungen mit Kommentar nachvollziehbar dokumentieren.');
  }
  if (record.status === 'APPROVED') {
    actions.push('Abrechnungsvorschau prüfen und Datensatz als BILLED abschließen.');
  }
  if (record.status === 'BILLED') {
    actions.push('Revision nur bei fachlicher Änderung als neuer Entwurf anlegen.');
  }
  if (actions.length === 0) {
    actions.push('Datensatz prüfen und nächste workflowrelevante Aktion wählen.');
  }
  return actions;
}

export function getIntelligenceSnapshot(
  record: AufmassRecord,
  allRecords: AufmassRecord[] = [record],
): AufmassIntelligenceSnapshot {
  const allIssues = getRecordOvermeasureIssues(record);
  const blockers = allIssues
    .filter((issue) => issue.severity === 'blocking')
    .map((issue) => issue.title);
  const warnings = allIssues
    .filter((issue) => issue.severity === 'warning')
    .map((issue) => issue.title);

  const formulaScores = record.measurements.map((measurement) =>
    getFormulaQuality(measurement.formula, measurement.quantity, measurement.formulaAst),
  );
  const formulaAvg =
    formulaScores.length === 0
      ? 30
      : formulaScores.reduce((sum, quality) => sum + quality.score, 0) / formulaScores.length;

  let readinessScore = Math.round(formulaAvg);
  readinessScore -= blockers.length * 20;
  readinessScore -= warnings.length * 8;
  if (record.mappings.length === 0) readinessScore -= 20;
  if (record.measurements.length === 0) readinessScore -= 20;
  const forecast = getForecastSnapshot(record, allRecords);
  if (forecast.positions.some((entry) => entry.confidence === 'low')) readinessScore -= 6;

  return {
    readinessScore: Math.max(0, Math.min(100, readinessScore)),
    blockers,
    warnings,
    signals: getPlausibilitySignals(record),
    nextBestActions: getNextBestActions(record),
    forecast,
  };
}
