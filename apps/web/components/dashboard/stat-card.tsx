import { cn } from '@/lib/utils';
import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trialLabel,
  accent = false,
  compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  trialLabel?: string;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-sidebar/40 transition-all duration-200',
        compact ? 'p-3.5' : 'p-4',
        'hover:-translate-y-px',
        accent ? 'border-primary/30' : 'border-border',
      )}
    >
      {accent && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-primary to-amber-400" />
      )}
      {accent && (
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-transparent" />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <p className={dashboardUiTokens.kicker}>
          {label}
        </p>
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-105',
            compact ? 'h-6 w-6' : 'h-7 w-7',
            'bg-primary text-primary-foreground shadow-[0_2px_8px_color-mix(in_oklch,var(--color-primary)_40%,transparent)]',
          )}
        >
          <Icon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </div>
      </div>

      <div className={cn('relative', compact ? 'mt-2' : 'mt-3')}>
        <p
          className={cn(
            dashboardUiTokens.kpiValue,
            compact && 'text-xl',
            accent ? 'text-primary' : 'text-foreground',
          )}
        >
          {value}
        </p>
        {subtitle && (
          <p className={cn('text-xs text-muted-foreground', compact ? 'mt-1' : 'mt-1.5')}>{subtitle}</p>
        )}
        {trialLabel && (
          <p className={cn('text-xs font-medium text-amber-600 dark:text-amber-400', compact ? 'mt-1' : 'mt-1.5')}>
            {trialLabel}
          </p>
        )}
      </div>
    </div>
  );
}
