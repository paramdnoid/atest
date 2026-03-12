import type { QuotePosition, QuoteRecord } from '@/lib/angebote/types';

export type QuoteTotals = {
  totalNet: number;
  totalCostNet: number;
  marginNet: number;
  marginPercent: number;
};

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getPositionRevenueNet(position: QuotePosition): number {
  const gross = position.quantity * position.unitPriceNet;
  const discountFactor = 1 - (position.discountPercent ?? 0) / 100;
  return roundCurrency(gross * discountFactor);
}

export function getPositionCostNet(position: QuotePosition): number {
  return roundCurrency(position.materialCostNet + position.laborCostNet);
}

export function getPositionMarginNet(position: QuotePosition): number {
  return roundCurrency(getPositionRevenueNet(position) - getPositionCostNet(position));
}

export function getQuoteTotals(record: QuoteRecord, positionIds?: string[]): QuoteTotals {
  const relevant = positionIds
    ? record.positions.filter((position) => positionIds.includes(position.id))
    : record.positions;

  const totalNet = roundCurrency(relevant.reduce((sum, position) => sum + getPositionRevenueNet(position), 0));
  const totalCostNet = roundCurrency(relevant.reduce((sum, position) => sum + getPositionCostNet(position), 0));
  const marginNet = roundCurrency(totalNet - totalCostNet);
  const marginPercent = totalNet <= 0 ? 0 : roundCurrency((marginNet / totalNet) * 100);

  return { totalNet, totalCostNet, marginNet, marginPercent };
}
