import Link from 'next/link';
import { Network } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import type { VerknuepfungsPortfolioSnapshot } from '@/lib/auftragsabwicklung/cross-module-intelligence';

function scoreClass(value: number): string {
  if (value >= 70) return 'text-emerald-700';
  if (value >= 45) return 'text-amber-700';
  return 'text-destructive';
}

export function CrossModulePortfolioContent({
  snapshot,
}: {
  snapshot: VerknuepfungsPortfolioSnapshot;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Ø Coverage</p>
          <p className={`text-sm font-semibold ${scoreClass(snapshot.averageCoverage)}`}>{snapshot.averageCoverage}%</p>
        </div>
        <div className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Ø Confidence</p>
          <p className={`text-sm font-semibold ${scoreClass(snapshot.averageConfidence)}`}>{snapshot.averageConfidence}%</p>
        </div>
        <div className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Schwachstellen</p>
          <p className={`text-sm font-semibold ${snapshot.weakLinks > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {snapshot.weakLinks}
          </p>
        </div>
      </div>

      {snapshot.entries.length > 0 ? (
        <div className="space-y-2">
          {snapshot.entries.slice(0, 3).map((entry) => (
            <Link
              key={entry.id}
              href={entry.href}
              className="block rounded-md border border-border/70 bg-background/60 px-3 py-2 transition-colors hover:bg-background"
            >
              <p className="text-sm font-medium text-foreground">{entry.label}</p>
              <p className="text-xs text-muted-foreground">
                Coverage {entry.processCoverage}% · Confidence {entry.confidenceAverage}%
              </p>
              {entry.suggestions[0] ? (
                <p className="mt-1 text-xs text-amber-700">{entry.suggestions[0]}</p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Keine Datensaetze in der aktuellen Auswahl.</p>
      )}
    </div>
  );
}

export function CrossModulePortfolioCard({
  snapshot,
  title = 'Portfolio-Verknuepfung',
}: {
  snapshot: VerknuepfungsPortfolioSnapshot;
  title?: string;
}) {
  return (
    <ModuleTableCard icon={Network} label="Datennetz" title={title} hasData tone="muted">
      <CrossModulePortfolioContent snapshot={snapshot} />
    </ModuleTableCard>
  );
}
