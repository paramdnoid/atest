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
  mainTopContent?: ReactNode;
  sideTopContent?: ReactNode;
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
  mainTopContent,
  sideTopContent,
  mainContent,
  sideContent,
  topMessage,
  mainGridClassName,
  compact = false,
}: ModulePageTemplateProps) {
  const resolvedMainTopContent =
    mainTopContent ??
    (topMessage || kpis.length > 0 ? (
      <>
        {topMessage}
        {kpis.length > 0 ? <KpiStrip items={kpis} /> : null}
      </>
    ) : null);

  return (
    <div className={cn(dashboardUiTokens.pageStack, compact && 'space-y-4')}>
      <PageHeader title={title} description={description} badge={badge}>
        {actions}
      </PageHeader>
      <div
        className={cn(
          dashboardUiTokens.mainGrid,
          compact && 'gap-3',
          !sideContent && 'xl:grid-cols-1',
          mainGridClassName,
        )}
      >
        <div className={dashboardUiTokens.sectionStack}>
          {resolvedMainTopContent}
          {mainContent}
        </div>
        {sideContent ? (
          <div className={dashboardUiTokens.sectionStack}>
            {sideTopContent}
            {sideContent}
          </div>
        ) : null}
      </div>
    </div>
  );
}
