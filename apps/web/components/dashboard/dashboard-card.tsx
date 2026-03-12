import type { ReactNode } from 'react';

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
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_2px_8px_color-mix(in_oklch,var(--color-primary)_40%,transparent)]">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <p className="text-sm font-semibold leading-tight">{title}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
