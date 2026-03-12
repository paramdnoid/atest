import { getPositionSummaries } from '@/lib/aufmass/selectors';
import type { AufmassMeasurement, AufmassRecord, AufmassUnit } from '@/lib/aufmass/types';

export type ForecastConfidence = 'low' | 'medium' | 'high';

export type PositionForecast = {
  positionId: string;
  positionCode: string;
  positionTitle: string;
  unit: AufmassUnit;
  quantity: number;
  sampleCount: number;
  predictedEffortHours: number;
  effortInterval: [number, number];
  predictedMaterialQuantity: number;
  materialInterval: [number, number];
  confidence: ForecastConfidence;
  riskNotes: string[];
};

export type ForecastTotals = {
  effortHours: number;
  materialQuantity: number;
  confidence: ForecastConfidence;
};

export type AufmassForecastSnapshot = {
  positions: PositionForecast[];
  totals: ForecastTotals;
  generatedAt: string;
};

type HistoricalSample = {
  quantity: number;
  effortRate: number;
  materialRate: number;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function deriveEffortHours(measurement: AufmassMeasurement): number {
  if (measurement.actualEffortHours && measurement.actualEffortHours > 0) {
    return measurement.actualEffortHours;
  }
  const defaultRate = measurement.unit === 'm2' ? 0.11 : measurement.unit === 'm' ? 0.06 : 0.2;
  const complexityBoost = Math.max(0, (measurement.openingsOrNiches?.length ?? 0) * 0.03);
  return measurement.quantity * (defaultRate + complexityBoost);
}

function deriveMaterialQuantity(measurement: AufmassMeasurement): number {
  if (measurement.actualMaterialQuantity && measurement.actualMaterialQuantity > 0) {
    return measurement.actualMaterialQuantity;
  }
  const defaultRate = measurement.unit === 'm2' ? 0.09 : measurement.unit === 'm' ? 0.04 : 0.12;
  return measurement.quantity * defaultRate;
}

function toConfidence(sampleCount: number, variation: number): ForecastConfidence {
  if (sampleCount >= 6 && variation < 0.2) return 'high';
  if (sampleCount >= 3 && variation < 0.35) return 'medium';
  return 'low';
}

function aggregateConfidence(values: ForecastConfidence[]): ForecastConfidence {
  if (values.length === 0) return 'low';
  if (values.every((value) => value === 'high')) return 'high';
  if (values.some((value) => value === 'low')) return 'low';
  return 'medium';
}

function collectHistoricalSamples(
  targetRecord: AufmassRecord,
  allRecords: AufmassRecord[],
  positionId: string,
): HistoricalSample[] {
  const samples: HistoricalSample[] = [];
  for (const record of allRecords) {
    if (record.id === targetRecord.id) continue;
    for (const measurement of record.measurements) {
      if (measurement.positionId !== positionId || measurement.quantity <= 0) continue;
      const effort = deriveEffortHours(measurement);
      const material = deriveMaterialQuantity(measurement);
      samples.push({
        quantity: measurement.quantity,
        effortRate: effort / measurement.quantity,
        materialRate: material / measurement.quantity,
      });
    }
  }
  return samples;
}

export function getForecastSnapshot(
  record: AufmassRecord,
  allRecords: AufmassRecord[],
): AufmassForecastSnapshot {
  const summaries = getPositionSummaries(record).filter((summary) => summary.quantity > 0);
  const positionForecasts: PositionForecast[] = summaries.map((summary) => {
    const samples = collectHistoricalSamples(record, allRecords, summary.position.id);

    const fallbackEffortRate = summary.unit === 'm2' ? 0.11 : summary.unit === 'm' ? 0.06 : 0.2;
    const fallbackMaterialRate = summary.unit === 'm2' ? 0.09 : summary.unit === 'm' ? 0.04 : 0.12;

    const effortRates = samples.map((sample) => sample.effortRate);
    const materialRates = samples.map((sample) => sample.materialRate);
    const quantities = samples.map((sample) => sample.quantity);

    const effortMedian = effortRates.length > 0 ? median(effortRates) : fallbackEffortRate;
    const materialMedian = materialRates.length > 0 ? median(materialRates) : fallbackMaterialRate;
    const effortQ1 = effortRates.length > 1 ? percentile(effortRates, 0.25) : effortMedian;
    const effortQ3 = effortRates.length > 1 ? percentile(effortRates, 0.75) : effortMedian;
    const materialQ1 = materialRates.length > 1 ? percentile(materialRates, 0.25) : materialMedian;
    const materialQ3 = materialRates.length > 1 ? percentile(materialRates, 0.75) : materialMedian;

    const quantityMean = avg(quantities);
    const quantityStd = stdDev(quantities, quantityMean);
    const quantityVariation = quantityMean > 0 ? quantityStd / quantityMean : 1;

    const confidence = toConfidence(samples.length, quantityVariation);

    const riskNotes: string[] = [];
    if (samples.length < 3) {
      riskNotes.push('Geringe Datenbasis für belastbare Prognose.');
    }
    if (quantityMean > 0 && summary.quantity > quantityMean * 1.25) {
      riskNotes.push('Zielmenge deutlich über historischem Mittelwert.');
    }
    if (quantityMean > 0 && summary.quantity < quantityMean * 0.75) {
      riskNotes.push('Zielmenge deutlich unter historischem Mittelwert.');
    }
    if (quantityVariation > 0.35) {
      riskNotes.push('Historische Streuung ist hoch.');
    }

    return {
      positionId: summary.position.id,
      positionCode: summary.position.code,
      positionTitle: summary.position.title,
      unit: summary.unit,
      quantity: round2(summary.quantity),
      sampleCount: samples.length,
      predictedEffortHours: round2(summary.quantity * effortMedian),
      effortInterval: [round2(summary.quantity * effortQ1), round2(summary.quantity * effortQ3)],
      predictedMaterialQuantity: round2(summary.quantity * materialMedian),
      materialInterval: [round2(summary.quantity * materialQ1), round2(summary.quantity * materialQ3)],
      confidence,
      riskNotes,
    };
  });

  const totals: ForecastTotals = {
    effortHours: round2(positionForecasts.reduce((sum, forecast) => sum + forecast.predictedEffortHours, 0)),
    materialQuantity: round2(
      positionForecasts.reduce((sum, forecast) => sum + forecast.predictedMaterialQuantity, 0),
    ),
    confidence: aggregateConfidence(positionForecasts.map((entry) => entry.confidence)),
  };

  return {
    positions: positionForecasts,
    totals,
    generatedAt: new Date().toISOString(),
  };
}
