import { CheckCircle2, CircleDollarSign, Gauge, ShieldAlert } from 'lucide-react';

import { KpiStrip, type KpiStripItem } from '@/components/dashboard/kpi-strip';
import type { QuoteKpis } from '@/lib/angebote/types';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function getAngeboteKpiItems(kpis: QuoteKpis): KpiStripItem[] {
  return [
    {
      icon: CircleDollarSign,
      label: 'Pipeline Netto',
      value: formatCurrency(kpis.pipelineNet),
      subtitle: 'Offene Angebotswerte',
      tone: 'teal',
    },
    {
      icon: ShieldAlert,
      label: 'Offene Freigaben',
      value: kpis.openApprovals,
      subtitle: 'Status IN_APPROVAL',
      accent: true,
      tone: 'amber',
    },
    {
      icon: CheckCircle2,
      label: 'Konvertierungsquote',
      value: `${kpis.conversionRate.toFixed(1)}%`,
      subtitle: 'SENT -> CONVERTED',
      tone: 'emerald',
    },
    {
      icon: Gauge,
      label: 'Durchschnittsmarge',
      value: `${kpis.averageMarginPercent.toFixed(1)}%`,
      subtitle: 'Alle Angebote',
      tone: 'blue',
    },
  ];
}

export function AngeboteKpiStrip({ kpis }: { kpis: QuoteKpis }) {
  const items = getAngeboteKpiItems(kpis);

  return <KpiStrip items={items} />;
}
