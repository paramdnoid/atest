import { Brain, History, Network } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';
import { CrossModuleLinksContent } from '@/components/dashboard/cross-module-links-card';
import { Button } from '@/components/ui/button';
import { getIntelligenceSnapshot } from '@/lib/aufmass/intelligence';
import type { AufmassAuditEvent, AufmassRecord } from '@/lib/aufmass/types';
import type { getVerknuepfungSnapshot } from '@/lib/auftragsabwicklung/cross-module-intelligence';
import { formatDate } from '@/lib/format';

type AufmassDetailContextRailProps = {
  record: AufmassRecord;
  snapshot: ReturnType<typeof getIntelligenceSnapshot>;
  verknuepfungSnapshot: ReturnType<typeof getVerknuepfungSnapshot>;
  onOpenHistory: () => void;
};

function AuditPreview({ events }: { events: AufmassAuditEvent[] }) {
  return (
    <div className="space-y-2">
      {events.slice(0, 3).map((event) => (
        <div key={event.id} className="rounded-lg border border-border/60 bg-white p-2">
          <p className="text-xs font-medium">{event.action}</p>
          <p className="text-[11px] text-muted-foreground">{event.detail}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(event.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

export function AufmassDetailContextRail({
  record,
  snapshot,
  verknuepfungSnapshot,
  onOpenHistory,
}: AufmassDetailContextRailProps) {
  return (
    <div className={dashboardUiTokens.contextRailStack}>
      <ModuleTableCard icon={Brain} label="Kontext" title="Analyse, Datennetz und Historie" tone="muted" hasData>
        <div className="space-y-2.5">
          <section className="rounded-lg border border-border/60 bg-white p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Analyse</p>
            <p className="mt-1 font-mono text-xl font-semibold">{snapshot.readinessScore}/100</p>
            <div className="mt-2 space-y-1">
              {snapshot.nextBestActions.slice(0, 2).map((entry) => (
                <p key={entry} className="text-xs text-muted-foreground">
                  - {entry}
                </p>
              ))}
            </div>
          </section>

          <details className="rounded-lg border border-border/60 bg-sidebar/20 p-2.5" open>
            <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Datennetz
            </summary>
            <div className="mt-2">
              <CrossModuleLinksContent
                snapshot={verknuepfungSnapshot}
                context={{
                  module: 'AUFMASS',
                  id: record.id,
                  customerName: record.customerName,
                  projectName: record.projectName,
                  siteName: record.siteName,
                }}
              />
            </div>
          </details>

          <details className="rounded-lg border border-border/60 bg-sidebar/20 p-2.5">
            <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Historie
            </summary>
            <div className="mt-2 space-y-2">
              <AuditPreview events={record.auditTrail} />
              <Button size="sm" variant="outline" onClick={onOpenHistory} className="w-full rounded-lg">
                Vollständig öffnen
              </Button>
            </div>
          </details>
        </div>
      </ModuleTableCard>
    </div>
  );
}
