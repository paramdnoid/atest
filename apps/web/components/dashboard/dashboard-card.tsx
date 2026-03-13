import type { ReactNode } from 'react';

import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';
import { cn } from '@/lib/utils';

export function DashboardCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-border bg-white',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DashboardCardHeader({
  icon: Icon,
  label,
  title,
  action,
  titleClassName,
  bottomContent,
  className,
  contentClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  action?: ReactNode;
  titleClassName?: string;
  bottomContent?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={cn('px-4 py-2.5', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className={cn('flex items-center gap-3', contentClassName)}>
          <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center', dashboardUiTokens.iconShell)}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className={dashboardUiTokens.kickerAccent}>
              {label}
            </p>
            <p className={cn('text-sm font-medium leading-tight', titleClassName)}>{title}</p>
          </div>
        </div>
        {action}
      </div>
      {bottomContent ? <div className="mt-2">{bottomContent}</div> : null}
    </div>
  );
}
