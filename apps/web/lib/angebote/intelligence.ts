import type { QuoteIntelligenceSignal, QuoteRecord } from '@/lib/angebote/types';
import { getQuoteTotals } from '@/lib/angebote/pricing';

const CORE_TEMPLATES = ['grundierung', 'deckanstrich'];

export function getQuoteIntelligenceSignals(record: QuoteRecord, allRecords: QuoteRecord[]): QuoteIntelligenceSignal[] {
  const signals: QuoteIntelligenceSignal[] = [];
  const totals = getQuoteTotals(record);

  if (totals.marginPercent < 18) {
    signals.push({
      id: `margin-${record.id}`,
      type: 'MARGIN_RISK',
      severity: totals.marginPercent < 12 ? 'blocking' : 'warning',
      title: 'Marge unter Zielkorridor',
      message: `Aktuelle Marge ${totals.marginPercent.toFixed(1)}% liegt unter dem Zielwert von 18%.`,
    });
  }

  for (const template of CORE_TEMPLATES) {
    if (!record.positions.some((position) => position.templateKey === template)) {
      signals.push({
        id: `missing-core-${record.id}-${template}`,
        type: 'MISSING_CORE_POSITION',
        severity: 'warning',
        title: 'Pflichtposition fehlt',
        message: `Die Kernposition "${template}" ist nicht enthalten.`,
      });
    }
  }

  const peerPrices = allRecords.flatMap((entry) => entry.positions.map((position) => position.unitPriceNet));
  const peerAverage = peerPrices.length > 0 ? peerPrices.reduce((sum, price) => sum + price, 0) / peerPrices.length : 0;
  const hasOutlier = record.positions.some((position) => peerAverage > 0 && position.unitPriceNet > peerAverage * 1.8);
  if (hasOutlier) {
    signals.push({
      id: `outlier-${record.id}`,
      type: 'PRICE_OUTLIER',
      severity: 'info',
      title: 'Preis-Ausreißer erkannt',
      message: 'Mindestens eine Position liegt deutlich ueber dem Durchschnitt vergleichbarer Angebote.',
    });
  }

  if (!record.positions.some((position) => position.templateKey === 'schutzanstrich')) {
    signals.push({
      id: `upsell-${record.id}`,
      type: 'UPSELL_TEMPLATE',
      severity: 'info',
      title: 'Upsell-Potenzial',
      message: 'Vorlage "Schutzanstrich Premium" passt zum aktuellen Leistungsumfang.',
    });
  }

  return signals;
}
