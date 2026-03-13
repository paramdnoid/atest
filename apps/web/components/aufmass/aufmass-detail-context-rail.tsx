import { useState } from 'react';
import { Brain, History, Network, Menu, X } from 'lucide-react';

import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';
import { CrossModuleLinksContent } from '@/components/dashboard/cross-module-links-card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { getIntelligenceSnapshot } from '@/lib/aufmass/intelligence';
import type { AufmassAuditEvent, AufmassRecord } from '@/lib/aufmass/types';
import type { getVerknuepfungSnapshot } from '@/lib/auftragsabwicklung/cross-module-intelligence';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

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

// Context content that can be used in both desktop rail and mobile sheet
function ContextContent({
  record,
  snapshot,
  verknuepfungSnapshot,
  onOpenHistory,
  isMobile = false,
}: {
  record: AufmassRecord;
  snapshot: ReturnType<typeof getIntelligenceSnapshot>;
  verknuepfungSnapshot: ReturnType<typeof getVerknuepfungSnapshot>;
  onOpenHistory: () => void;
  isMobile?: boolean;
}) {
  return (
    <div className="space-y-2.5">
      <section className="rounded-lg border border-border/60 bg-white p-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Analyse</p>
        <p className="mt-1 font-mono text-xl font-semibold">{snapshot.readinessScore}/100</p>
        <div className="mt-2 space-y-1">
          {snapshot.nextBestActions.slice(0, isMobile ? 3 : 2).map((entry) => (
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
            <History className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Vollständig öffnen</span>
            <span className="sm:hidden">Öffnen</span>
          </Button>
        </div>
      </details>
    </div>
  );
}

export function AufmassDetailContextRail({
  record,
  snapshot,
  verknuepfungSnapshot,
  onOpenHistory,
}: AufmassDetailContextRailProps) {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  return (
    <>
      {/* Desktop Context Rail */}
      <div className={cn(dashboardUiTokens.contextRailStack, "hidden xl:block")}>
        <ModuleTableCard icon={Brain} label="Kontext" title="Analyse, Datennetz und Historie" tone="muted" hasData>
          <ContextContent
            record={record}
            snapshot={snapshot}
            verknuepfungSnapshot={verknuepfungSnapshot}
            onOpenHistory={onOpenHistory}
            isMobile={false}
          />
        </ModuleTableCard>
      </div>

      {/* Mobile Floating Button + Sheet */}
      <div className="block xl:hidden">
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetTrigger asChild>
            <Button
              size="icon"
              className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
            >
              <Brain className="h-5 w-5" />
              <span className="sr-only">Kontext öffnen</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[75vh] overflow-y-auto">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Aufmaß-Kontext
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <ContextContent
                record={record}
                snapshot={snapshot}
                verknuepfungSnapshot={verknuepfungSnapshot}
                onOpenHistory={() => {
                  onOpenHistory();
                  setMobileSheetOpen(false);
                }}
                isMobile={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
