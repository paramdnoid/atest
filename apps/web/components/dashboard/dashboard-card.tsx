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
        'flex flex-col overflow-hidden rounded-xl border border-border bg-sidebar/40',
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center', dashboardUiTokens.iconShell)}>
          <Icon className="h-3.5 w-3.5 text-primary/90" />
        </div>
        <div>
          <p className={dashboardUiTokens.kickerAccent}>
            {label}
          </p>
          <p className="text-sm font-medium leading-tight">{title}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
