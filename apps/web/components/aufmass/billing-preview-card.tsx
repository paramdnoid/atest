import { FileSpreadsheet } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { getPositionSummaries } from '@/lib/aufmass/selectors';
import type { AufmassRecord } from '@/lib/aufmass/types';

export function BillingPreviewCard({ record }: { record: AufmassRecord }) {
  const summaries = getPositionSummaries(record).filter((entry) => entry.quantity > 0);

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
    </ModuleTableCard>
  );
}
