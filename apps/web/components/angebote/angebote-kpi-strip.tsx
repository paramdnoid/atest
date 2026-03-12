import { CheckCircle2, CircleDollarSign, Gauge, ShieldAlert } from 'lucide-react';
import type { ComponentType } from 'react';

import { StatCard } from '@/components/dashboard/stat-card';
import type { QuoteKpis } from '@/lib/angebote/types';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function AngeboteKpiStrip({ kpis }: { kpis: QuoteKpis }) {
  const items: Array<{
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    subtitle: string;
    accent?: boolean;
  }> = [
    {
      icon: CircleDollarSign,
      label: 'Pipeline Netto',
      value: formatCurrency(kpis.pipelineNet),
      subtitle: 'Offene Angebotswerte',
    },
    {
      icon: ShieldAlert,
      label: 'Offene Freigaben',
      value: kpis.openApprovals,
      subtitle: 'Status IN_APPROVAL',
      accent: true,
    },
    {
      icon: CheckCircle2,
      label: 'Konvertierungsquote',
      value: `${kpis.conversionRate.toFixed(1)}%`,
      subtitle: 'SENT -> CONVERTED',
    },
    {
      icon: Gauge,
      label: 'Durchschnittsmarge',
      value: `${kpis.averageMarginPercent.toFixed(1)}%`,
      subtitle: 'Alle Angebote',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <StatCard
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
          subtitle={item.subtitle}
          accent={item.accent}
        />
      ))}
    </div>
  );
}
