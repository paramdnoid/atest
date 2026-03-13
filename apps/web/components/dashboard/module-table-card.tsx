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
  footerContent?: ReactNode;
  className?: string;
  headerClassName?: string;
  headerContentClassName?: string;
  bodyClassName?: string;
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
  footerContent,
  className,
  headerClassName,
  headerContentClassName,
  bodyClassName,
  tone = 'default',
  isLoading = false,
  errorMessage,
  emptyState,
  hasData = false,
  children,
}: ModuleTableCardProps) {
  const toneCardClassName =
    tone === 'emphasis'
      ? 'border-border/80 bg-white shadow-[0_1px_3px_color-mix(in_hsl,hsl(var(--primary))_10%,transparent)]'
      : tone === 'muted'
        ? 'border-border/60 bg-white'
        : '';
  const toneBodyClassName =
    tone === 'emphasis'
      ? 'bg-white'
      : tone === 'muted'
        ? 'bg-white'
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
        className={headerClassName}
        contentClassName={headerContentClassName}
      />
      <div className={cn(dashboardUiTokens.cardBody, toneBodyClassName, bodyClassName)}>
        {errorMessage && <ErrorBanner message={errorMessage} />}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-11 animate-pulse rounded-lg bg-muted/55" />
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
      {footerContent ? (
        <div className="bg-white px-4 py-2.5">
          {footerContent}
        </div>
      ) : null}
    </DashboardCard>
  );
}
