import { Brain, History, Network } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
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
      {events.slice(0, 4).map((event) => (
        <div key={event.id} className="rounded-lg border border-border/70 bg-sidebar/30 p-2">
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
    <div className="space-y-3">
      <ModuleTableCard icon={Brain} label="Analyse" title="Reifegrad und Aktionen" hasData>
        <div className="space-y-3">
          <div className="rounded-lg border border-border/70 bg-sidebar/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Reifegrad</p>
            <p className="mt-1 font-mono text-2xl font-semibold">{snapshot.readinessScore}/100</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Nächste Schritte</p>
            {snapshot.nextBestActions.slice(0, 3).map((entry) => (
              <p key={entry} className="text-sm text-muted-foreground">
                - {entry}
              </p>
            ))}
          </div>
        </div>
      </ModuleTableCard>

      <ModuleTableCard icon={Network} label="Datennetz" title="Modulübergreifende Verknüpfung" hasData>
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
      </ModuleTableCard>

      <ModuleTableCard
        icon={History}
        label="Historie"
        title="Letzte Änderungen"
        action={
          <Button size="sm" variant="outline" onClick={onOpenHistory} className="rounded-lg">
            Vollständig
          </Button>
        }
        hasData
      >
        <AuditPreview events={record.auditTrail} />
      </ModuleTableCard>
    </div>
  );
}
