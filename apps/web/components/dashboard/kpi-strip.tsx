import type { ComponentType } from 'react';

import { StatCard } from '@/components/dashboard/stat-card';
import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';
import { cn } from '@/lib/utils';

export type KpiStripItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  trialLabel?: string;
  accent?: boolean;
  tone?: 'neutral' | 'primary' | 'amber' | 'rose' | 'emerald' | 'teal' | 'blue';
};

export function KpiStrip({ items, dense = false }: { items: KpiStripItem[]; dense?: boolean }) {
  const gridClassName =
    items.length === 3
      ? 'grid gap-2 grid-cols-1 sm:grid-cols-3'
      : items.length === 4
        ? 'grid gap-2 grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        : dashboardUiTokens.kpiGrid;

  return (
    <div className={cn(gridClassName)}>
      {items.map((item) => (
        <StatCard
          key={item.label}
          icon={item.icon}
          label={item.label}
          value={item.value}
          subtitle={item.subtitle}
          trialLabel={item.trialLabel}
          accent={item.accent}
          tone={item.tone}
          compact
          dense={dense}
        />
      ))}
    </div>
  );
}

export function SidebarKpiGrid({ items }: { items: KpiStripItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-md border border-border/70 bg-sidebar/35 px-2.5 py-2"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {item.label}
          </p>
          <p className={item.accent ? 'mt-1 text-sm font-semibold text-primary' : 'mt-1 text-sm font-semibold'}>
            {item.value}
          </p>
          {item.subtitle ? <p className="mt-0.5 text-[11px] text-muted-foreground">{item.subtitle}</p> : null}
        </div>
      ))}
    </div>
  );
}
