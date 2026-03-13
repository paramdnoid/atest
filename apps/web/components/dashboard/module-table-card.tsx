import type { ReactNode } from 'react';

import { DashboardCard, DashboardCardHeader } from '@/components/dashboard/dashboard-card';
import { EmptyState, ErrorBanner } from '@/components/dashboard/states';
import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';
import { cn } from '@/lib/utils';

type ModuleTableCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  action?: ReactNode;
  className?: string;
  tone?: 'default' | 'emphasis' | 'muted';
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
  tone = 'default',
  isLoading = false,
  errorMessage,
  emptyState,
  hasData = false,
  children,
}: ModuleTableCardProps) {
  const toneCardClassName =
    tone === 'emphasis'
      ? 'border-border/90 bg-sidebar/55 shadow-sm shadow-black/5'
      : tone === 'muted'
        ? 'border-border/70 bg-sidebar/25'
        : '';
  const toneBodyClassName =
    tone === 'emphasis'
      ? 'bg-background/35'
      : tone === 'muted'
        ? 'bg-background/20'
        : '';

  return (
    <DashboardCard className={cn(toneCardClassName, className)}>
      <DashboardCardHeader icon={icon} label={label} title={title} action={action} />
      <div className={cn(dashboardUiTokens.cardBody, toneBodyClassName)}>
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
