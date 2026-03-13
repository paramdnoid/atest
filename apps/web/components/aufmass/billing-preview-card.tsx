import { FileSpreadsheet } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Button } from '@/components/ui/button';
import { getPositionSummaries } from '@/lib/aufmass/selectors';
import type { AufmassRecord } from '@/lib/aufmass/types';

type BillingPreviewCardProps = {
  record: AufmassRecord;
  canBill: boolean;
  billingBlockers: string[];
  onBill: () => void;
  onJumpToBlocker?: (blocker: string) => void;
  embedded?: boolean;
};

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const spread = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 100 - ((value - min) / spread) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" className="h-8 w-24 text-foreground/75" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

function BillingPreviewContent({
  summaries,
  canBill,
  billingBlockers,
  onBill,
  onJumpToBlocker,
}: {
  summaries: ReturnType<typeof getPositionSummaries>;
  canBill: boolean;
  billingBlockers: string[];
  onBill: () => void;
  onJumpToBlocker?: (blocker: string) => void;
}) {
  const mustCriteria = [
    { label: 'Status ist freigegeben', ok: billingBlockers.every((entry) => !entry.includes('Nur freigegebene')) },
    { label: 'Mindestens ein Aufmaßwert vorhanden', ok: billingBlockers.every((entry) => !entry.includes('Ohne Aufmaßpositionen')) },
  ];

  return (
    <>
      <div className="mb-3 rounded-lg border border-border/70 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ready Check</p>
        <div className="mt-2 grid gap-1.5">
          {mustCriteria.map((criterion) => (
            <p key={criterion.label} className="text-xs">
              <span className={criterion.ok ? 'text-emerald-700' : 'text-amber-700'}>{criterion.ok ? '✓' : '•'}</span>{' '}
              <span className="text-muted-foreground">{criterion.label}</span>
            </p>
          ))}
        </div>
        {billingBlockers.length === 0 ? (
          <p className="mt-2 text-sm text-emerald-700/90 dark:text-emerald-300/90">
            Alle Voraussetzungen für die Abrechnung sind erfüllt.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {billingBlockers.map((blocker) => (
              <li key={blocker} className="flex items-start justify-between gap-2">
                <span>- {blocker}</span>
                {onJumpToBlocker ? (
                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-primary underline-offset-2 hover:underline"
                    onClick={() => onJumpToBlocker(blocker)}
                  >
                    Öffnen
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Button size="sm" onClick={onBill} disabled={!canBill}>
            Als abgerechnet markieren
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        {summaries.map((summary) => (
          <div key={summary.position.id} className="rounded-lg border border-border bg-sidebar/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-xs text-muted-foreground">{summary.position.code}</p>
              <p className="font-mono text-sm font-semibold">
                {summary.quantity.toFixed(2)} {summary.unit}
              </p>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{summary.position.title}</p>
              <MiniSparkline values={[summary.gross, summary.deducted, summary.quantity]} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Herleitung: {summary.formulas.length > 0 ? summary.formulas.join(' + ') : '—'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Brutto {summary.gross.toFixed(2)} · Abzug {summary.deducted.toFixed(2)} · Übermessen{' '}
              {summary.overmeasured.toFixed(2)}
            </p>
            {summary.reasons.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Regeln: {summary.reasons.join(' | ')}
              </p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

export function BillingPreviewCard({
  record,
  canBill,
  billingBlockers,
  onBill,
  onJumpToBlocker,
  embedded = false,
}: BillingPreviewCardProps) {
  const summaries = getPositionSummaries(record).filter((entry) => entry.quantity > 0);

  if (embedded) {
    return (
      <BillingPreviewContent
        summaries={summaries}
        canBill={canBill}
        billingBlockers={billingBlockers}
        onBill={onBill}
        onJumpToBlocker={onJumpToBlocker}
      />
    );
  }

  return (
    <ModuleTableCard
      icon={FileSpreadsheet}
      label="Abrechnungsvorschau"
      title="Prüfbare Aufstellung nach Positionen"
      hasData={summaries.length > 0}
      emptyState={{
        icon: <FileSpreadsheet className="h-8 w-8" />,
        title: 'Keine abrechenbaren Mengen',
        description: 'Sobald Mengen und Positionen vorliegen, wird die Aufstellung erstellt.',
      }}
    >
      <BillingPreviewContent
        summaries={summaries}
        canBill={canBill}
        billingBlockers={billingBlockers}
        onBill={onBill}
        onJumpToBlocker={onJumpToBlocker}
      />
    </ModuleTableCard>
  );
}
