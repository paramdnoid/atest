'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BadgeCheck, Building2, ClipboardList, History, Network, ShieldCheck, Sparkles } from 'lucide-react';

import { AnsprechpartnerDirectory } from '@/components/kunden/ansprechpartner-directory';
import { DuplicateReviewDrawer } from '@/components/kunden/duplicate-review-drawer';
import { KundenAuditTimeline } from '@/components/kunden/kunden-audit-timeline';
import { KundenDetailHeader } from '@/components/kunden/kunden-detail-header';
import { KundenIntelligencePanel } from '@/components/kunden/kunden-intelligence-panel';
import { ObjektPortfolioCard } from '@/components/kunden/objekt-portfolio-card';
import { OfflineSyncIndicator } from '@/components/kunden/offline-sync-indicator';
import { ReminderSlaPanel } from '@/components/kunden/reminder-sla-panel';
import {
  DashboardTabs,
  getDashboardTabId,
  getDashboardTabPanelId,
} from '@/components/dashboard/dashboard-tabs';
import { CrossModuleLinksContent } from '@/components/dashboard/cross-module-links-card';
import { ModuleSideTabsCard } from '@/components/dashboard/module-side-tabs-card';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState } from '@/components/dashboard/states';
import { Button } from '@/components/ui/button';
import { detectDuplicateCandidates, resolveDuplicateCandidate } from '@/lib/kunden/duplicate-detection';
import { getKundenRecords, getKundenRecordById } from '@/lib/kunden/mock-data';
import {
  createOfflineQueueModel,
  enqueueOfflineOperation,
  startSync,
  completeSync,
} from '@/lib/kunden/offline-queue';
import { getConsentBlockers, getRetentionDeadline } from '@/lib/kunden/privacy-policy';
import { kundenRolloutFlags } from '@/lib/kunden/rollout-flags';
import { transitionKundenStatus } from '@/lib/kunden/state-machine';
import { resolveViewerRole } from '@/lib/kunden/viewer-role';
import { getVerknuepfungSnapshot } from '@/lib/auftragsabwicklung/cross-module-intelligence';
import type { DuplicateCandidate, KundenRecord, KundenStatus } from '@/lib/kunden/types';

type TabKey = 'uebersicht' | 'objekte' | 'ansprechpartner' | 'timeline' | 'compliance' | 'duplikate';

const tabs: Array<{ id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'uebersicht', label: 'Uebersicht', icon: Building2 },
  { id: 'objekte', label: 'Objekte', icon: ClipboardList },
  { id: 'ansprechpartner', label: 'Ansprechpartner', icon: BadgeCheck },
  { id: 'timeline', label: 'Timeline', icon: History },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
  { id: 'duplikate', label: 'Duplikate', icon: Sparkles },
];

function appendAudit(record: KundenRecord, title: string, payload: string): KundenRecord {
  return {
    ...record,
    updatedAt: new Date().toISOString(),
    activities: [
      {
        id: crypto.randomUUID(),
        entityType: 'KUNDE',
        entityId: record.id,
        type: 'STATUS_CHANGE',
        title,
        payload,
        createdBy: 'UI Benutzer',
        createdAt: new Date().toISOString(),
        visibility: 'internal',
      },
      ...record.activities,
    ],
  };
}

export default function KundenDetailPage() {
  const params = useParams<{ id: string }>();
  const allRecords = useMemo(() => getKundenRecords(), []);
  const initial = useMemo(() => getKundenRecordById(params.id), [params.id]);

  const [record, setRecord] = useState<KundenRecord | undefined>(initial);
  const [activeTab, setActiveTab] = useState<TabKey>('uebersicht');
  const [overviewContextTab, setOverviewContextTab] = useState<'sla' | 'datennetz'>('sla');
  const [lastBlockers, setLastBlockers] = useState<string[]>([]);
  const [offlineQueue, setOfflineQueue] = useState(() => createOfflineQueueModel());
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>(() =>
    kundenRolloutFlags.kundenDuplicateDetectionEnabled ? detectDuplicateCandidates(allRecords) : [],
  );
  const detailSplitGridClassName = 'grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]';
  const verknuepfungSnapshot = useMemo(
    () => getVerknuepfungSnapshot('KUNDEN', record?.id ?? ''),
    [record?.id],
  );
  const viewerRole = useMemo(
    () => resolveViewerRole(process.env.NEXT_PUBLIC_KUNDEN_VIEWER_ROLE),
    [],
  );

  if (!record) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<Building2 className="h-8 w-8" />}
          title="Kunde nicht gefunden"
          description="Der Datensatz wurde nicht gefunden."
        />
        <Button asChild variant="outline">
          <Link href="/kunden">Zurueck zur Kundenliste</Link>
        </Button>
      </div>
    );
  }

  if (!kundenRolloutFlags.kundenModuleEnabled) {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="Kundenmodul deaktiviert"
        description="Dieses Modul wurde per Rollout-Flag deaktiviert."
      />
    );
  }

  const visibleTabs = tabs.filter((tab) => {
    if (tab.id === 'duplikate') return kundenRolloutFlags.kundenDuplicateDetectionEnabled;
    return true;
  });

  const setStatus = (to: KundenStatus) => {
    const result = transitionKundenStatus(record, to);
    if (!result.ok) {
      setLastBlockers(result.blockers);
      return;
    }
    setLastBlockers([]);
    setRecord((prev) => {
      if (!prev) return prev;
      return appendAudit(
        {
          ...prev,
          status: to,
        },
        'Statuswechsel',
        `${prev.status} -> ${to}`,
      );
    });

    if (kundenRolloutFlags.kundenOfflineQueueEnabled) {
      setOfflineQueue((prev) =>
        enqueueOfflineOperation(prev, {
          operation: 'UPDATE_KUNDE',
          targetId: record.id,
          payloadSummary: `Status auf ${to}`,
          isCritical: to === 'ARCHIVIERT',
        }),
      );
    }
  };

  const runManualSync = () => {
    setOfflineQueue((prev) => startSync(prev));
    setTimeout(() => {
      setOfflineQueue((prev) => completeSync(prev));
    }, 600);
  };

  const consentBlockers = getConsentBlockers(record);
  const retentionDeadline = getRetentionDeadline(record);
  return (
    <div className="space-y-4">
      <PageHeader
        title="Kunden-Workspace"
        description={`${record.number} · ${record.name}`}
        titleClassName="text-lg"
        descriptionClassName="-mt-0.5"
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/kunden">Zurueck zur Liste</Link>
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <OfflineSyncIndicator
          state={offlineQueue.state}
          queuedCount={offlineQueue.items.length}
          lastSyncedAt={offlineQueue.lastSyncedAt}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={runManualSync}
          disabled={offlineQueue.items.length === 0 || offlineQueue.state === 'syncing'}
        >
          Queue synchronisieren
        </Button>
      </div>

      <KundenDetailHeader record={record} blockers={lastBlockers} onSetStatus={setStatus} />

      <DashboardTabs
        idPrefix="kunden"
        tabs={visibleTabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Kundenbereiche"
      />

      {activeTab === 'uebersicht' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('kunden', 'uebersicht')}
          aria-labelledby={getDashboardTabId('kunden', 'uebersicht')}
          tabIndex={0}
          className={detailSplitGridClassName}
        >
          {kundenRolloutFlags.kundenEliteFeaturesEnabled ? (
            <KundenIntelligencePanel record={record} allRecords={allRecords} />
          ) : (
            <ModuleTableCard icon={Sparkles} label="Intelligence" title="Elite-Features deaktiviert" hasData>
              <p className="text-sm text-muted-foreground">
                `NEXT_PUBLIC_KUNDEN_ELITE_FEATURES_ENABLED` ist deaktiviert.
              </p>
            </ModuleTableCard>
          )}
          <ModuleSideTabsCard
            idPrefix="kunden-detail-overview-context"
            icon={ShieldCheck}
            label="Kontext"
            title="SLA und Datennetz"
            activeTab={overviewContextTab}
            onTabChange={setOverviewContextTab}
            ariaLabel="Kunden Detailkontext"
            tabs={[
              {
                id: 'sla',
                label: 'SLA',
                icon: ShieldCheck,
                content: kundenRolloutFlags.kundenSlaEngineEnabled ? (
                  <ReminderSlaPanel record={record} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    `NEXT_PUBLIC_KUNDEN_SLA_ENGINE_ENABLED` ist deaktiviert.
                  </p>
                ),
              },
              {
                id: 'datennetz',
                label: 'Datennetz',
                icon: Network,
                content: (
                  <CrossModuleLinksContent
                    snapshot={verknuepfungSnapshot}
                    context={{
                      module: 'KUNDEN',
                      id: record.id,
                      customerName: record.name,
                      projectName: record.objekte[0]?.name,
                      siteName: record.objekte[0]?.adresse,
                    }}
                  />
                ),
              },
            ]}
          />
        </section>
      )}

      {activeTab === 'objekte' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('kunden', 'objekte')}
          aria-labelledby={getDashboardTabId('kunden', 'objekte')}
          tabIndex={0}
        >
          <ObjektPortfolioCard objekte={record.objekte} />
        </section>
      )}

      {activeTab === 'ansprechpartner' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('kunden', 'ansprechpartner')}
          aria-labelledby={getDashboardTabId('kunden', 'ansprechpartner')}
          tabIndex={0}
        >
          <AnsprechpartnerDirectory contacts={record.ansprechpartner} viewerRole={viewerRole} />
        </section>
      )}

      {activeTab === 'timeline' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('kunden', 'timeline')}
          aria-labelledby={getDashboardTabId('kunden', 'timeline')}
          tabIndex={0}
        >
          <KundenAuditTimeline events={record.activities} />
        </section>
      )}

      {activeTab === 'compliance' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('kunden', 'compliance')}
          aria-labelledby={getDashboardTabId('kunden', 'compliance')}
          tabIndex={0}
        >
          <ModuleTableCard icon={ShieldCheck} label="Datenschutz" title="DSGVO und Retention" hasData>
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Consent Status:</span> {record.consentState}
              </p>
              <p>
                <span className="text-muted-foreground">Retention Class:</span> {record.retentionClass}
              </p>
              <p>
                <span className="text-muted-foreground">Retention Deadline:</span>{' '}
                {new Date(retentionDeadline).toLocaleDateString('de-DE')}
              </p>
              {consentBlockers.length > 0 ? (
                <div className="rounded-md border border-amber-300/40 bg-amber-50/55 p-3 text-amber-800">
                  {consentBlockers.map((blocker) => (
                    <p key={blocker}>- {blocker}</p>
                  ))}
                </div>
              ) : (
                <p className="text-emerald-700/90">Keine Consent-Blocker vorhanden.</p>
              )}
            </div>
          </ModuleTableCard>
        </section>
      )}

      {activeTab === 'duplikate' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('kunden', 'duplikate')}
          aria-labelledby={getDashboardTabId('kunden', 'duplikate')}
          tabIndex={0}
        >
          <DuplicateReviewDrawer
            duplicates={duplicates.filter(
              (candidate) =>
                (candidate.leftEntityId === record.id || candidate.rightEntityId === record.id) &&
                candidate.resolution === 'OPEN',
            )}
            onResolve={(id, resolution) => {
              setDuplicates((prev) => resolveDuplicateCandidate(prev, id, resolution));
              setRecord((prev) =>
                prev ? appendAudit(prev, 'Duplikatentscheidung', `${id} -> ${resolution}`) : prev,
              );
            }}
          />
        </section>
      )}
    </div>
  );
}
