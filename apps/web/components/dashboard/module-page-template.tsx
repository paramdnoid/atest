import type { ReactNode } from 'react';

import { PageHeader } from '@/components/dashboard/page-header';
import { KpiStrip } from '@/components/dashboard/kpi-strip';
import type { KpiStripItem } from '@/components/dashboard/kpi-strip';
import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';
import { cn } from '@/lib/utils';

type ModulePageTemplateProps = {
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  kpis: KpiStripItem[];
  mainContent: ReactNode;
  sideContent?: ReactNode;
  topMessage?: ReactNode;
  mainGridClassName?: string;
  compact?: boolean;
};

export function ModulePageTemplate({
  title,
  description,
  badge,
  actions,
  kpis,
  mainContent,
  sideContent,
  topMessage,
  mainGridClassName,
  compact = false,
}: ModulePageTemplateProps) {
  return (
    <div className={cn(dashboardUiTokens.pageStack, compact && 'space-y-4')}>
      <PageHeader title={title} description={description} badge={badge}>
        {actions}
      </PageHeader>
      {topMessage}
      {kpis.length > 0 ? <KpiStrip items={kpis} /> : null}
      <div className={cn(dashboardUiTokens.mainGrid, compact && 'gap-3', mainGridClassName)}>
        {mainContent}
        {sideContent}
      </div>
    </div>
  );
}
