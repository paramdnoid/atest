import type { ReactNode } from 'react';

import { DashboardCard, DashboardCardHeader } from '@/components/dashboard/dashboard-card';
import { EmptyState, ErrorBanner } from '@/components/dashboard/states';
import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';

type ModuleTableCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  action?: ReactNode;
  className?: string;
  isLoading?: boolean;
  errorMessage?: string;
  emptyState?: { icon: ReactNode; title: string; description: string };
  hasData?: boolean;
  children?: ReactNode;
};

export function ModuleTableCard({
  icon,
  label,
  title,
  action,
  className,
  isLoading = false,
  errorMessage,
  emptyState,
  hasData = false,
  children,
}: ModuleTableCardProps) {
  return (
    <DashboardCard className={className}>
      <DashboardCardHeader icon={icon} label={label} title={title} action={action} />
      <div className={dashboardUiTokens.cardBody}>
        {errorMessage && <ErrorBanner message={errorMessage} />}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-11 animate-pulse rounded-lg bg-muted/60" />
            ))}
          </div>
        ) : hasData ? (
          children
        ) : emptyState ? (
          <EmptyState
            icon={emptyState.icon}
            title={emptyState.title}
            description={emptyState.description}
            className="border-0 bg-transparent px-0 py-8"
          />
        ) : (
          children
        )}
      </div>
    </DashboardCard>
  );
}
