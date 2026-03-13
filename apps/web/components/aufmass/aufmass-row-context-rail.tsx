import Link from 'next/link';
import { ArrowRight, Brain, Network, TriangleAlert } from 'lucide-react';

import { AufmassStatusBadge } from '@/components/aufmass/aufmass-status-badge';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Button } from '@/components/ui/button';
import { getIntelligenceSnapshot } from '@/lib/aufmass/intelligence';
import { getTransitionBlockers } from '@/lib/aufmass/state-machine';
import type { AufmassRecord } from '@/lib/aufmass/types';
import { formatDate } from '@/lib/format';

export function AufmassRowContextRail({ record }: { record?: AufmassRecord }) {
  if (!record) {
    return (
      <ModuleTableCard icon={Network} label="Kontext" title="Datensatz wählen" tone="muted">
        <p className="text-sm text-muted-foreground">
          Wähle links einen Datensatz aus, um nächste Aktionen, Risiken und Kontext zu sehen.
        </p>
      </ModuleTableCard>
    );
  }

  const blockers = getTransitionBlockers(record, 'APPROVED');
  const snapshot = getIntelligenceSnapshot(record, [record]);

  return (
    <div className="space-y-3">
      <ModuleTableCard icon={Network} label="Kontext" title={record.number} hasData>
        <div className="space-y-3">
          <div className="rounded-lg border border-border/70 bg-sidebar/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Projekt</p>
            <p className="mt-1 text-sm font-medium">{record.projectName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{record.customerName}</p>
            <div className="mt-2 flex items-center justify-between">
              <AufmassStatusBadge status={record.status} />
              <span className="text-xs text-muted-foreground">v{record.version}</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Nächste Aktion</p>
            <p className="text-sm text-muted-foreground">
              {blockers.length > 0
                ? 'Offene Prüfpunkte beheben, bevor freigegeben werden kann.'
                : 'Datensatz ist freigabereif. Prüfdialog öffnen und final entscheiden.'}
            </p>
            <Button asChild size="sm" className="w-full rounded-lg">
              <Link href={`/aufmass/${record.id}`}>
                Aufmaß öffnen
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-background/75 px-3 py-2">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Brain className="h-3.5 w-3.5" />
              Reifegrad
            </span>
            <span className="font-mono text-sm font-semibold">{snapshot.readinessScore}/100</span>
          </div>
          {blockers.length > 0 ? (
            <div className="rounded-lg border border-amber-400/35 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300">
              <p className="mb-1 flex items-center gap-1 font-medium">
                <TriangleAlert className="h-3.5 w-3.5" />
                {blockers.length} Blocker
              </p>
              <p>{blockers[0]}</p>
            </div>
          ) : null}
          <p className="text-[11px] text-muted-foreground">Aktualisiert {formatDate(record.updatedAt)}</p>
        </div>
      </ModuleTableCard>
    </div>
  );
}
