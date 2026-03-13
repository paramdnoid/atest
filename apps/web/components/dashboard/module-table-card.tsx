import type { ReactNode } from 'react';

import { DashboardCard, DashboardCardHeader } from '@/components/dashboard/dashboard-card';
import { EmptyState, ErrorBanner } from '@/components/dashboard/states';
import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';
import { cn } from '@/lib/utils';

type ModuleTableCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  titleClassName?: string;
  action?: ReactNode;
  headerBottomContent?: ReactNode;
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
  titleClassName,
  action,
  headerBottomContent,
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
      ? 'border-border/80 bg-sidebar/45 shadow-[0_1px_3px_color-mix(in_hsl,hsl(var(--primary))_10%,transparent)]'
      : tone === 'muted'
        ? 'border-border/60 bg-sidebar/20'
        : '';
  const toneBodyClassName =
    tone === 'emphasis'
      ? 'bg-background/35'
      : tone === 'muted'
        ? 'bg-background/20'
        : '';

  return (
    <DashboardCard className={cn(toneCardClassName, className)}>
      <DashboardCardHeader
        icon={icon}
        label={label}
        title={title}
        titleClassName={titleClassName}
        action={action}
        bottomContent={headerBottomContent}
      />
      <div className={cn(dashboardUiTokens.cardBody, toneBodyClassName)}>
        {errorMessage && <ErrorBanner message={errorMessage} />}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-11 animate-pulse rounded-lg bg-primary/10" />
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
