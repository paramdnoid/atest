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
  embedded?: boolean;
};

function BillingPreviewContent({
  summaries,
  canBill,
  billingBlockers,
  onBill,
}: {
  summaries: ReturnType<typeof getPositionSummaries>;
  canBill: boolean;
  billingBlockers: string[];
  onBill: () => void;
}) {
  return (
    <>
      <div className="mb-3 rounded-lg border border-border/70 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ready Check</p>
        {billingBlockers.length === 0 ? (
          <p className="mt-2 text-sm text-emerald-700/90 dark:text-emerald-300/90">
            Alle Voraussetzungen für die Abrechnung sind erfüllt.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {billingBlockers.map((blocker) => (
              <li key={blocker}>- {blocker}</li>
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
            <p className="text-sm font-medium">{summary.position.title}</p>
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
  embedded = false,
}: BillingPreviewCardProps) {
  const summaries = getPositionSummaries(record).filter((entry) => entry.quantity > 0);

  if (embedded) {
    return <BillingPreviewContent summaries={summaries} canBill={canBill} billingBlockers={billingBlockers} onBill={onBill} />;
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
      <BillingPreviewContent summaries={summaries} canBill={canBill} billingBlockers={billingBlockers} onBill={onBill} />
    </ModuleTableCard>
  );
}
