import { AlertTriangle, CheckCheck, ClipboardClock, DraftingCompass } from 'lucide-react';
import type { ComponentType } from 'react';

import { cn } from '@/lib/utils';

type AufmassOperationalSnapshotProps = {
  counts: {
    draft: number;
    inReview: number;
    blocked: number;
    billed: number;
  };
};

const cards: Array<{
  key: keyof AufmassOperationalSnapshotProps['counts'];
  label: string;
  icon: ComponentType<{ className?: string }>;
  accentClass: string;
  toneClass: string;
}> = [
  {
    key: 'draft',
    label: 'Entwürfe',
    icon: DraftingCompass,
    accentClass: 'text-slate-500',
    toneClass: 'from-slate-200/65 to-slate-100/30',
  },
  {
    key: 'inReview',
    label: 'In Prüfung',
    icon: ClipboardClock,
    accentClass: 'text-amber-500',
    toneClass: 'from-amber-200/55 to-amber-100/25',
  },
  {
    key: 'blocked',
    label: 'Blockiert',
    icon: AlertTriangle,
    accentClass: 'text-rose-500',
    toneClass: 'from-rose-200/55 to-rose-100/25',
  },
  {
    key: 'billed',
    label: 'Abgerechnet',
    icon: CheckCheck,
    accentClass: 'text-emerald-500',
    toneClass: 'from-emerald-200/55 to-emerald-100/25',
  },
];

function buildSparklinePoints(value: number, idx: number): string {
  const values = Array.from({ length: 6 }, (_, pointIdx) => {
    const seed = (pointIdx + 1) * (idx + 2);
    return Math.max(1, value + ((seed % 3) - 1) + (pointIdx >= 4 ? 1 : 0));
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

export function AufmassOperationalSnapshot({ counts }: AufmassOperationalSnapshotProps) {
  const total = Math.max(1, Object.values(counts).reduce((sum, value) => sum + value, 0));
  const segments = cards.map((card) => ({
    ...card,
    value: counts[card.key],
    ratio: counts[card.key] / total,
  }));

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {segments.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className={cn(
              'rounded-lg border border-border/70 bg-background p-2.5',
              card.key === 'blocked' && card.value > 0 && 'border-rose-300/70',
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{card.label}</p>
                <p className="font-mono text-xl font-semibold leading-tight tabular-nums">{card.value}</p>
              </div>
              <span className={cn('rounded-md border bg-linear-to-br p-1.5', card.toneClass)}>
                <Icon className={`h-3.5 w-3.5 ${card.accentClass}`} />
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted/70">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      card.key === 'draft' && 'bg-slate-400',
                      card.key === 'inReview' && 'bg-amber-400',
                      card.key === 'blocked' && 'bg-rose-400',
                      card.key === 'billed' && 'bg-emerald-400',
                    )}
                    style={{ width: `${Math.max(card.ratio * 100, 6)}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Anteil {Math.round(card.ratio * 100)}%
                </p>
              </div>

              <svg viewBox="0 0 56 28" className="h-6 w-12 shrink-0">
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  points={buildSparklinePoints(card.value, idx)}
                  className={cn(
                    card.key === 'draft' && 'text-slate-400',
                    card.key === 'inReview' && 'text-amber-400',
                    card.key === 'blocked' && 'text-rose-400',
                    card.key === 'billed' && 'text-emerald-400',
                  )}
                />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}
