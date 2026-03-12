import { cn } from '@/lib/utils';

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trialLabel,
  accent = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  trialLabel?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-sidebar/40 p-4 transition-all duration-200',
        'hover:-translate-y-px',
        accent ? 'border-primary/30' : 'border-border',
      )}
    >
      {accent && (
        <div className="absolute inset-x-0 top-0 h-[2px] bg-linear-to-r from-primary to-amber-400" />
      )}
      {accent && (
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/8 via-transparent to-transparent" />
      )}

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-105',
            'bg-primary text-primary-foreground shadow-[0_2px_8px_color-mix(in_oklch,var(--color-primary)_40%,transparent)]',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="relative mt-3">
        <p
          className={cn(
            'font-mono text-2xl font-bold tabular-nums leading-none tracking-tight',
            accent ? 'text-primary' : 'text-foreground',
          )}
        >
          {value}
        </p>
        {subtitle && (
          <p className="mt-1.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trialLabel && (
          <p className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            {trialLabel}
          </p>
        )}
      </div>
    </div>
  );
}
