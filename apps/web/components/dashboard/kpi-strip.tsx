import type { ComponentType } from 'react';

import { StatCard } from '@/components/dashboard/stat-card';
import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';

export type KpiStripItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  trialLabel?: string;
  accent?: boolean;
};

export function KpiStrip({ items }: { items: KpiStripItem[] }) {
  return (
    <div className={dashboardUiTokens.kpiGrid}>
      {items.map((item) => (
        <StatCard
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
          subtitle={item.subtitle}
          trialLabel={item.trialLabel}
          accent={item.accent}
        />
      ))}
    </div>
  );
}
