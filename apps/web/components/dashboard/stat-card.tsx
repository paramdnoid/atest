import { cn } from '@/lib/utils';
import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';

function toNumericValue(value: string | number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const normalized = String(value).replace(',', '.').match(/-?\d+(\.\d+)?/);
  if (!normalized) return 0;
  const parsed = Number(normalized[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hashSeed(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildSparklinePoints(seedValue: number): string {
  const values = Array.from({ length: 6 }, (_, pointIdx) => {
    const wave = ((seedValue + pointIdx * 13) % 5) - 2;
    const base = 6 + ((seedValue + pointIdx * 7) % 7);
    return Math.max(2, base + wave);
  });
  const max = Math.max(...values, 1);
  return values
    .map((entry, pointIdx) => {
      const x = 2 + pointIdx * 10;
      const y = 26 - Math.round((entry / max) * 20);
      return `${x},${y}`;
    })
    .join(' ');
}

export function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  trialLabel,
  compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtitle?: string;
  trialLabel?: string;
  accent?: boolean;
  compact?: boolean;
  tone?: 'neutral' | 'primary' | 'amber' | 'rose' | 'emerald' | 'teal' | 'blue';
}) {
  const numericValue = toNumericValue(value);
  const normalizedProgress = Math.max(8, Math.min(100, Math.round(Math.abs(numericValue % 100))));
  const sparklineSeed = hashSeed(`${label}-${value}`);

  return (
    <div
      className={cn(
        'flex h-30.5 flex-col rounded-xl border border-border bg-white',
        compact ? 'px-2.5 pt-2.5 pb-3.5' : 'px-3 pt-3 pb-4',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <div className={cn('p-1.5', dashboardUiTokens.iconShell)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className={cn(compact ? 'mt-1.5' : 'mt-2')}>
        <p
          className={cn(
            'truncate font-mono text-xl font-semibold leading-tight tabular-nums',
            !compact && 'text-2xl',
            'text-foreground',
          )}
        >
          {value}
        </p>
        {subtitle && (
          <p className="mt-1 text-[11px] text-primary/90">{subtitle}</p>
        )}
        {trialLabel && (
          <p className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            {trialLabel}
          </p>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1 pb-0.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted/70">
            <div
              className="h-full rounded-full bg-primary/70"
              style={{ width: `${normalizedProgress}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Statusindikator</p>
        </div>
        <svg viewBox="0 0 56 28" className="h-6 w-12 shrink-0">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            points={buildSparklinePoints(sparklineSeed)}
            className="text-primary/75"
          />
        </svg>
      </div>
    </div>
  );
}
