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
}: ModulePageTemplateProps) {
  return (
    <div className={dashboardUiTokens.pageStack}>
      <PageHeader title={title} description={description} badge={badge}>
        {actions}
      </PageHeader>
      {topMessage}
      <KpiStrip items={kpis} />
      <div className={cn(dashboardUiTokens.mainGrid, mainGridClassName)}>
        {mainContent}
        {sideContent}
      </div>
    </div>
  );
}
