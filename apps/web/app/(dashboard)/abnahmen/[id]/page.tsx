'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Brain, ClipboardList, FileText, History, LayoutPanelTop, Network, Wrench } from 'lucide-react';

import { AbnahmeDetailHeader } from '@/components/abnahmen/abnahme-detail-header';
import { AbnahmeProtocolCard } from '@/components/abnahmen/abnahme-protocol-card';
import { AuditTimeline } from '@/components/abnahmen/audit-timeline';
import { DefectBoard } from '@/components/abnahmen/defect-board';
import { DefectCaptureDrawer } from '@/components/abnahmen/defect-capture-drawer';
import { PrivacyBanner } from '@/components/abnahmen/privacy-banner';
import { ReworkTracker } from '@/components/abnahmen/rework-tracker';
import { getAbnahmenKpiItems } from '@/components/abnahmen/abnahmen-kpi-strip';
import {
  DashboardTabs,
  getDashboardTabId,
  getDashboardTabPanelId,
} from '@/components/dashboard/dashboard-tabs';
import { CrossModuleLinksContent } from '@/components/dashboard/cross-module-links-card';
import { KpiStrip } from '@/components/dashboard/kpi-strip';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleSideTabsCard } from '@/components/dashboard/module-side-tabs-card';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { EmptyState } from '@/components/dashboard/states';
import { Button } from '@/components/ui/button';
import { getTransitionComplianceBlockers } from '@/lib/abnahmen/compliance-rules';
import { getEvidenceBlockingMessages, getEvidencePolicyIssues } from '@/lib/abnahmen/evidence-policy';
import { getAbnahmeRecordById } from '@/lib/abnahmen/mock-data';
import { abnahmenRolloutFlags } from '@/lib/abnahmen/rollout-flags';
import { getOpenDefects } from '@/lib/abnahmen/selectors';
import { canTransition, getTransitionBlockers, transitionRecordStatus } from '@/lib/abnahmen/state-machine';
import { getVerknuepfungSnapshot } from '@/lib/auftragsabwicklung/cross-module-intelligence';
import type { AbnahmeAuditEvent, AbnahmeRecord, AbnahmeStatus, DefectEntry } from '@/lib/abnahmen/types';

type TabKey = 'overview' | 'defects' | 'rework' | 'protocol' | 'documents' | 'history' | 'insights';

const tabs: Array<{ id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Überblick', icon: LayoutPanelTop },
  { id: 'defects', label: 'Mängel', icon: ClipboardList },
  { id: 'rework', label: 'Nacharbeit', icon: Wrench },
  { id: 'protocol', label: 'Protokoll', icon: FileText },
  { id: 'documents', label: 'Dokumente', icon: FileText },
  { id: 'history', label: 'Historie', icon: History },
  { id: 'insights', label: 'Insights', icon: Brain },
];

function appendAudit(
  events: AbnahmeAuditEvent[],
  action: string,
  detail: string,
  actor = 'UI Benutzer',
): AbnahmeAuditEvent[] {
  return [
    {
      id: crypto.randomUUID(),
      actor,
      action,
      detail,
      createdAt: new Date().toISOString(),
    },
    ...events,
  ];
}

function getPrimaryTransitionTarget(status: AbnahmeStatus): AbnahmeStatus | null {
  switch (status) {
    case 'PREPARATION':
      return 'INSPECTION_SCHEDULED';
    case 'INSPECTION_SCHEDULED':
      return 'INSPECTION_DONE';
    case 'INSPECTION_DONE':
      return 'DEFECTS_OPEN';
    case 'DEFECTS_OPEN':
      return 'REWORK_IN_PROGRESS';
    case 'REWORK_IN_PROGRESS':
      return 'REWORK_READY_FOR_REVIEW';
    case 'REWORK_READY_FOR_REVIEW':
      return 'ACCEPTED';
    case 'ACCEPTED_WITH_RESERVATION':
      return 'ACCEPTED';
    case 'ACCEPTED':
      return 'CLOSED';
    case 'CLOSED':
      return null;
    default:
      return null;
  }
}

export default function AbnahmeDetailPage() {
  const params = useParams<{ id: string }>();
  const initial = useMemo(() => getAbnahmeRecordById(params.id), [params.id]);
  const [record, setRecord] = useState<AbnahmeRecord | null>(initial);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [activeSideContextTab, setActiveSideContextTab] = useState<'status' | 'protocol' | 'compliance' | 'datennetz'>(
    'status',
  );
  const baseVisibleTabs = tabs.filter((tab) => (tab.id === 'insights' ? abnahmenRolloutFlags.enableInsights : true));
  const verknuepfungSnapshot = useMemo(
    () => getVerknuepfungSnapshot('ABNAHMEN', record?.id ?? ''),
    [record?.id],
  );

  if (!record) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="Abnahme nicht gefunden"
          description="Der Datensatz wurde nicht gefunden."
        />
        <Button asChild variant="outline">
          <Link href="/abnahmen">Zurück zur Abnahmeliste</Link>
        </Button>
      </div>
    );
  }

  const transitionTarget = getPrimaryTransitionTarget(record.status);
  const stateMachineBlockers = transitionTarget ? getTransitionBlockers(record, transitionTarget) : [];
  const complianceBlockers = transitionTarget ? getTransitionComplianceBlockers(record, transitionTarget) : [];
  const evidenceBlockers = abnahmenRolloutFlags.enablePrivacyGuards
    ? getEvidenceBlockingMessages(record.defects)
    : [];
  const blockers = [...stateMachineBlockers, ...complianceBlockers, ...evidenceBlockers];
  const evidenceIssues = getEvidencePolicyIssues(record.defects);
  const privacyBlockingCount = evidenceIssues.filter((entry) => entry.level === 'blocking').length;
  const privacyWarningCount = evidenceIssues.filter((entry) => entry.level === 'warning').length;
  const inspectionDoneBlockers = getTransitionBlockers(record, 'INSPECTION_DONE');
  const inspectionDoneComplianceBlockers = getTransitionComplianceBlockers(record, 'INSPECTION_DONE');
  const reworkStartBlockers = getTransitionBlockers(record, 'REWORK_IN_PROGRESS');
  const readyForReviewBlockers = getTransitionBlockers(record, 'REWORK_READY_FOR_REVIEW');
  const acceptWithReservationBlockers = getTransitionBlockers(record, 'ACCEPTED_WITH_RESERVATION');
  const acceptWithReservationComplianceBlockers = getTransitionComplianceBlockers(record, 'ACCEPTED_WITH_RESERVATION');
  const acceptBlockers = getTransitionBlockers(record, 'ACCEPTED');
  const acceptComplianceBlockers = getTransitionComplianceBlockers(record, 'ACCEPTED');
  const closeBlockers = getTransitionBlockers(record, 'CLOSED');
  const closeComplianceBlockers = getTransitionComplianceBlockers(record, 'CLOSED');

  const canRunInspection =
    canTransition(record.status, 'INSPECTION_DONE') &&
    inspectionDoneBlockers.length === 0 &&
    inspectionDoneComplianceBlockers.length === 0;
  const canStartRework =
    canTransition(record.status, 'REWORK_IN_PROGRESS') &&
    reworkStartBlockers.length === 0;
  const canMarkReadyForReview =
    canTransition(record.status, 'REWORK_READY_FOR_REVIEW') &&
    readyForReviewBlockers.length === 0;
  const canAcceptWithReservation =
    canTransition(record.status, 'ACCEPTED_WITH_RESERVATION') &&
    acceptWithReservationBlockers.length === 0 &&
    acceptWithReservationComplianceBlockers.length === 0 &&
    (!abnahmenRolloutFlags.enablePrivacyGuards || evidenceBlockers.length === 0);
  const canAccept =
    canTransition(record.status, 'ACCEPTED') &&
    acceptBlockers.length === 0 &&
    acceptComplianceBlockers.length === 0 &&
    (!abnahmenRolloutFlags.enablePrivacyGuards || evidenceBlockers.length === 0);
  const canClose =
    canTransition(record.status, 'CLOSED') &&
    closeBlockers.length === 0 &&
    closeComplianceBlockers.length === 0;

  const getActionBlockers = (current: AbnahmeRecord, to: AbnahmeStatus): string[] => {
    const transitionResult = transitionRecordStatus(current, to);
    const compliance = getTransitionComplianceBlockers(current, to);
    const evidence =
      to === 'ACCEPTED' || to === 'ACCEPTED_WITH_RESERVATION'
        ? getEvidenceBlockingMessages(current.defects)
        : [];

    return transitionResult.ok ? [...compliance, ...evidence] : [...transitionResult.blockers, ...compliance, ...evidence];
  };

  const setStatus = (
    to: AbnahmeStatus,
    detail: string,
    mutate?: (next: AbnahmeRecord) => AbnahmeRecord,
    prepareForValidation?: (current: AbnahmeRecord) => AbnahmeRecord,
  ): boolean => {
    const blockersForAction = getActionBlockers(prepareForValidation ? prepareForValidation(record) : record, to);
    if (blockersForAction.length > 0) {
      return false;
    }

    setRecord((prev) =>
      prev
        ? (mutate
            ? mutate({
                ...prev,
                status: to,
                updatedAt: new Date().toISOString(),
                auditTrail: appendAudit(prev.auditTrail, `Status -> ${to}`, detail),
              })
            : {
                ...prev,
                status: to,
                updatedAt: new Date().toISOString(),
                auditTrail: appendAudit(prev.auditTrail, `Status -> ${to}`, detail),
              })
        : prev,
    );
    return true;
  };

  const onAddDefect = (defect: DefectEntry) => {
    setRecord((prev) =>
      prev
        ? {
            ...prev,
            defects: [defect, ...prev.defects],
            status: prev.status === 'ACCEPTED' || prev.status === 'CLOSED' ? 'DEFECTS_OPEN' : prev.status,
            updatedAt: new Date().toISOString(),
            auditTrail: appendAudit(prev.auditTrail, 'Mangel erfasst', `${defect.ref} ${defect.title}`),
          }
        : prev,
    );
  };

  const openDefects = getOpenDefects(record);
  const inProgressReworkCount = record.rework.filter((entry) => entry.status === 'IN_PROGRESS').length;
  const resolvedReworkCount = record.rework.filter((entry) => entry.status === 'DONE').length;
  const tabPanelSplitClassName = 'grid gap-4 2xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]';
  const visibleTabs = baseVisibleTabs.map((tab) => {
    if (tab.id === 'defects') {
      return {
        ...tab,
        badge: (
          <span className="rounded-full border border-border/70 bg-background px-1.5 py-0 text-[10px] leading-none text-muted-foreground">
            {openDefects.length}
          </span>
        ),
      };
    }
    if (tab.id === 'rework') {
      const inProgress = record.rework.filter((entry) => entry.status === 'IN_PROGRESS').length;
      return {
        ...tab,
        badge: (
          <span className="rounded-full border border-border/70 bg-background px-1.5 py-0 text-[10px] leading-none text-muted-foreground">
            {inProgress}
          </span>
        ),
      };
    }
    if (tab.id === 'history') {
      return {
        ...tab,
        badge: (
          <span className="rounded-full border border-border/70 bg-background px-1.5 py-0 text-[10px] leading-none text-muted-foreground">
            {record.auditTrail.length}
          </span>
        ),
      };
    }
    return tab;
  });
  return (
    <div className="space-y-4">
      <ModulePageTemplate
        title="Abnahmeakte"
        description={`${record.number} · ${record.customerName} · ${record.projectName}`}
        mainGridClassName="grid-cols-1 2xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]"
        actions={<DefectCaptureDrawer onAddDefect={onAddDefect} />}
        kpis={[]}
        sideTopContent={<KpiStrip items={getAbnahmenKpiItems([record])} />}
        sideContent={
          <div className="2xl:sticky 2xl:top-4 2xl:self-start">
            <ModuleSideTabsCard
              idPrefix="abnahmen-detail-side-context"
              icon={LayoutPanelTop}
              label="Steuerung"
              title="Status, Protokoll, Compliance und Datennetz"
              activeTab={activeSideContextTab}
              onTabChange={setActiveSideContextTab}
              ariaLabel="Abnahmen Detailkontext"
              tabs={[
                {
                  id: 'status',
                  label: 'Status',
                  icon: LayoutPanelTop,
                  content: (
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="rounded-md border border-border/60 bg-background/50 px-2.5 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Nächste Prüfung</p>
                        <p className="mt-1 text-sm font-medium text-foreground">
                          {record.nextInspectionDate ? new Date(record.nextInspectionDate).toLocaleDateString('de-DE') : 'nicht geplant'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-md border border-border/60 bg-background/50 px-2.5 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Offen</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{openDefects.length}</p>
                        </div>
                        <div
                          className={`rounded-md border px-2.5 py-2 ${
                            blockers.length > 0
                              ? 'border-destructive/30 bg-destructive/6'
                              : 'border-emerald-500/25 bg-emerald-500/6'
                          }`}
                        >
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Blocker</p>
                          <p className={`mt-1 text-sm font-semibold ${blockers.length > 0 ? 'text-destructive' : 'text-emerald-700'}`}>
                            {blockers.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'protocol',
                  label: 'Protokoll',
                  icon: FileText,
                  content: (
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between rounded-md border border-border/60 bg-background/50 px-2.5 py-1.5">
                        <span>Signatur</span>
                        <span
                          className={`font-medium ${
                            record.protocol.signoffStatus === 'signed' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {record.protocol.signoffStatus === 'signed' ? 'signiert' : 'ausstehend'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-border/60 bg-background/50 px-2.5 py-1.5">
                        <span>Termin</span>
                        <span className="font-medium text-foreground">{record.protocol.appointmentDate ?? '-'}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-border/60 bg-background/50 px-2.5 py-1.5">
                        <span>Anwesend</span>
                        <span className="font-medium text-foreground">{record.protocol.participants.length}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-border/60 bg-background/50 px-2.5 py-1.5">
                        <span>Vorbehalt</span>
                        <span className="font-medium text-foreground">
                          {record.protocol.reservationText ? 'hinterlegt' : 'kein Vorbehalt'}
                        </span>
                      </div>
                    </div>
                  ),
                },
                {
                  id: 'compliance',
                  label: 'Compliance',
                  icon: ClipboardList,
                  content: (
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div
                        className={`rounded-md border px-2.5 py-2 ${
                          privacyBlockingCount > 0
                            ? 'border-destructive/30 bg-destructive/6'
                            : 'border-emerald-500/25 bg-emerald-500/6'
                        }`}
                      >
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">DSGVO Blocker</p>
                        <p
                          className={`mt-1 text-sm font-semibold ${
                            privacyBlockingCount > 0 ? 'text-destructive' : 'text-emerald-700'
                          }`}
                        >
                          {privacyBlockingCount}
                        </p>
                      </div>
                      <div
                        className={`rounded-md border px-2.5 py-2 ${
                          privacyWarningCount > 0
                            ? 'border-amber-500/30 bg-amber-500/6'
                            : 'border-border/60 bg-background/50'
                        }`}
                      >
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Hinweise</p>
                        <p
                          className={`mt-1 text-sm font-semibold ${
                            privacyWarningCount > 0 ? 'text-amber-700' : 'text-foreground'
                          }`}
                        >
                          {privacyWarningCount}
                        </p>
                      </div>
                      <div
                        className={`rounded-md border px-2.5 py-2 ${
                          inProgressReworkCount > 0
                            ? 'border-amber-500/30 bg-amber-500/6'
                            : 'border-border/60 bg-background/50'
                        }`}
                      >
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Nacharbeit aktiv</p>
                        <p
                          className={`mt-1 text-sm font-semibold ${
                            inProgressReworkCount > 0 ? 'text-amber-700' : 'text-foreground'
                          }`}
                        >
                          {inProgressReworkCount}
                        </p>
                      </div>
                      <div
                        className={`rounded-md border px-2.5 py-2 ${
                          resolvedReworkCount > 0
                            ? 'border-emerald-500/25 bg-emerald-500/6'
                            : 'border-border/60 bg-background/50'
                        }`}
                      >
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Abgeschlossen</p>
                        <p
                          className={`mt-1 text-sm font-semibold ${
                            resolvedReworkCount > 0 ? 'text-emerald-700' : 'text-foreground'
                          }`}
                        >
                          {resolvedReworkCount}
                        </p>
                      </div>
                    </div>
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
                        module: 'ABNAHMEN',
                        id: record.id,
                        customerName: record.customerName,
                        projectName: record.projectName,
                        siteName: record.siteName,
                      }}
                    />
                  ),
                },
              ]}
            />
          </div>
        }
        mainContent={
          <div className="space-y-5">
            <AbnahmeDetailHeader
              record={record}
              blockers={blockers}
              canRunInspection={canRunInspection}
              canStartRework={canStartRework}
              canMarkReadyForReview={canMarkReadyForReview}
              canAcceptWithReservation={canAcceptWithReservation}
              canAccept={canAccept}
              canClose={canClose}
              onRunInspection={() => setStatus('INSPECTION_DONE', 'Begehung als abgeschlossen markiert.')}
              onStartRework={() => setStatus('REWORK_IN_PROGRESS', 'Nacharbeit für offene Mängel gestartet.')}
              onMarkReadyForReview={() =>
                setStatus('REWORK_READY_FOR_REVIEW', 'Nacharbeit zur Schlussprüfung freigegeben.')
              }
              onAcceptWithReservation={() =>
                setStatus(
                  'ACCEPTED_WITH_RESERVATION',
                  'Vorbehalt im Protokoll dokumentiert.',
                  (next) => ({
                    ...next,
                    protocol: {
                      ...next.protocol,
                      reservationText:
                        next.protocol.reservationText ??
                        'Vorbehalt auf Restarbeiten bis zum bestätigten Nacharbeitstermin.',
                    },
                  }),
                  (current) => ({
                    ...current,
                    protocol: {
                      ...current.protocol,
                      reservationText:
                        current.protocol.reservationText ??
                        'Vorbehalt auf Restarbeiten bis zum bestätigten Nacharbeitstermin.',
                    },
                  }),
                )
              }
              onAccept={() => setStatus('ACCEPTED', 'Abnahme als vollständig akzeptiert.')}
              onClose={() =>
                setStatus(
                  'CLOSED',
                  'Abnahme revisionssicher abgeschlossen.',
                  (next) => ({
                    ...next,
                    protocol: {
                      ...next.protocol,
                      signoffStatus: 'signed',
                      signedAt: abnahmenRolloutFlags.enableProtocolSignoff
                        ? next.protocol.signedAt ?? new Date().toISOString()
                        : next.protocol.signedAt,
                    },
                  }),
                  (current) => ({
                    ...current,
                    protocol: {
                      ...current.protocol,
                      signoffStatus: 'signed',
                      signedAt: abnahmenRolloutFlags.enableProtocolSignoff
                        ? current.protocol.signedAt ?? new Date().toISOString()
                        : current.protocol.signedAt,
                    },
                  }),
                )
              }
            />
            {abnahmenRolloutFlags.enablePrivacyGuards ? (
              <PrivacyBanner
                blockingCount={privacyBlockingCount}
                warningCount={privacyWarningCount}
              />
            ) : (
              <ModuleTableCard icon={FileText} label="Datenschutz" title="Datenschutzprüfung derzeit deaktiviert" hasData>
                <p className="text-sm text-muted-foreground">
                  `NEXT_PUBLIC_ABNAHMEN_ENABLE_PRIVACY_GUARDS` ist deaktiviert.
                </p>
              </ModuleTableCard>
            )}
            <div className="space-y-3 rounded-lg border border-border/55 bg-white p-2 sm:p-2.5">
              <DashboardTabs
                idPrefix="abnahmen"
                tabs={visibleTabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                ariaLabel="Abnahmebereiche"
              />

              {activeTab === 'overview' && (
                <section
                  role="tabpanel"
                  id={getDashboardTabPanelId('abnahmen', 'overview')}
                  aria-labelledby={getDashboardTabId('abnahmen', 'overview')}
                  tabIndex={0}
                  className="grid gap-4 pt-1 2xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]"
                >
                  <div className="xl:min-h-136">
                    <DefectBoard defects={record.defects} />
                  </div>
                  <div className="space-y-4 xl:min-h-136">
                    <AbnahmeProtocolCard protocol={record.protocol} />
                    <ModuleTableCard
                      icon={FileText}
                      label="Dokumentenstatus"
                      title="Freigabeunterlagen"
                      hasData
                      className="bg-muted/35"
                    >
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Abnahmeprotokoll: {record.protocol.signoffStatus === 'signed' ? 'signiert' : 'ausstehend'}</p>
                        <p>Mängelliste: {openDefects.length} offene Positionen</p>
                        <p>Fotodokumentation: Datenschutzprüfung vor Freigabe erforderlich</p>
                      </div>
                    </ModuleTableCard>
                  </div>
                </section>
              )}
              {activeTab === 'defects' && (
                <section
                  role="tabpanel"
                  id={getDashboardTabPanelId('abnahmen', 'defects')}
                  aria-labelledby={getDashboardTabId('abnahmen', 'defects')}
                  tabIndex={0}
                  className={`${tabPanelSplitClassName} pt-1`}
                >
                  <DefectBoard defects={record.defects} />
                  <ModuleTableCard
                    icon={ClipboardList}
                    label="Mangelkontext"
                    title="Priorisierung"
                    hasData
                    className="bg-muted/35"
                  >
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Offene Mängel: {openDefects.length}</p>
                      <p>Kritisch: {record.defects.filter((entry) => entry.severity === 'critical').length}</p>
                      <p>Mit Sperrwirkung: {record.defects.filter((entry) => entry.status === 'OPEN' && entry.severity === 'critical').length}</p>
                      <p>Top-Fokus: Kritische Mängel zuerst in Nacharbeit überführen.</p>
                    </div>
                  </ModuleTableCard>
                </section>
              )}
              {activeTab === 'rework' && (
                <section
                  role="tabpanel"
                  id={getDashboardTabPanelId('abnahmen', 'rework')}
                  aria-labelledby={getDashboardTabId('abnahmen', 'rework')}
                  tabIndex={0}
                  className={`${tabPanelSplitClassName} pt-1`}
                >
                  <ReworkTracker rework={record.rework} defects={record.defects} />
                  <ModuleTableCard
                    icon={Wrench}
                    label="Nacharbeitslage"
                    title="Abarbeitung"
                    hasData
                    className="bg-muted/35"
                  >
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>In Bearbeitung: {inProgressReworkCount}</p>
                      <p>Abgeschlossen: {resolvedReworkCount}</p>
                      <p>Bereit zur Schlussprüfung: {canMarkReadyForReview ? 'ja' : 'nein'}</p>
                    </div>
                  </ModuleTableCard>
                </section>
              )}
              {activeTab === 'protocol' && (
                <section
                  role="tabpanel"
                  id={getDashboardTabPanelId('abnahmen', 'protocol')}
                  aria-labelledby={getDashboardTabId('abnahmen', 'protocol')}
                  tabIndex={0}
                  className={`${tabPanelSplitClassName} pt-1`}
                >
                  <AbnahmeProtocolCard protocol={record.protocol} />
                  <ModuleTableCard
                    icon={FileText}
                    label="Protokollhilfe"
                    title="Freigabestatus"
                    hasData
                    className="bg-muted/35"
                  >
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Signaturstatus: {record.protocol.signoffStatus}</p>
                      <p>Signiert am: {record.protocol.signedAt ? new Date(record.protocol.signedAt).toLocaleDateString('de-DE') : '-'}</p>
                      <p>Ort: {record.protocol.place ?? '-'}</p>
                    </div>
                  </ModuleTableCard>
                </section>
              )}
              {activeTab === 'history' && (
                <section
                  role="tabpanel"
                  id={getDashboardTabPanelId('abnahmen', 'history')}
                  aria-labelledby={getDashboardTabId('abnahmen', 'history')}
                  tabIndex={0}
                  className={`${tabPanelSplitClassName} pt-1`}
                >
                  <AuditTimeline events={record.auditTrail} />
                  <ModuleTableCard
                    icon={History}
                    label="Historie"
                    title="Kurzüberblick"
                    hasData
                    className="bg-muted/35"
                  >
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Einträge gesamt: {record.auditTrail.length}</p>
                      <p>Letzte Änderung: {new Date(record.updatedAt).toLocaleString('de-DE')}</p>
                      <p>Erstellt: {new Date(record.createdAt).toLocaleDateString('de-DE')}</p>
                    </div>
                  </ModuleTableCard>
                </section>
              )}
              {activeTab === 'documents' && (
                <section
                  role="tabpanel"
                  id={getDashboardTabPanelId('abnahmen', 'documents')}
                  aria-labelledby={getDashboardTabId('abnahmen', 'documents')}
                  tabIndex={0}
                  className={`${tabPanelSplitClassName} pt-1`}
                >
                  <ModuleTableCard
                    icon={FileText}
                    label="Dokumente"
                    title="Protokolle und Belege"
                    hasData
                    className="bg-muted/35"
                  >
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Abnahmeprotokoll.pdf · vorbereitet</p>
                      <p>Mängelliste.xlsx · aktuell</p>
                      <p>Fotodokumentation.zip · {openDefects.length} offene Mängel</p>
                    </div>
                  </ModuleTableCard>
                  <ModuleTableCard
                    icon={FileText}
                    label="Freigabehinweise"
                    title="Compliance-Status"
                    hasData
                    className="bg-muted/35"
                  >
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Blocker für Abschluss: {closeBlockers.length + closeComplianceBlockers.length}</p>
                      <p>Blocker für Abnahme: {acceptBlockers.length + acceptComplianceBlockers.length}</p>
                      <p>Datenschutz-Blocker: {privacyBlockingCount}</p>
                    </div>
                  </ModuleTableCard>
                </section>
              )}
              {activeTab === 'insights' && (
                <section
                  role="tabpanel"
                  id={getDashboardTabPanelId('abnahmen', 'insights')}
                  aria-labelledby={getDashboardTabId('abnahmen', 'insights')}
                  tabIndex={0}
                  className="pt-1"
                >
                  <ModuleTableCard
                    icon={Brain}
                    label="Insights"
                    title="Qualitätskennzahlen"
                    hasData
                    className="bg-muted/35"
                  >
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Offene Mängel: {openDefects.length}</p>
                      <p>Nacharbeiten in Bearbeitung: {record.rework.filter((entry) => entry.status === 'IN_PROGRESS').length}</p>
                      <p>Reopen-Quote: {record.defects.length === 0 ? 0 : Math.round((record.defects.reduce((sum, item) => sum + item.reopenCount, 0) / record.defects.length) * 100)}%</p>
                    </div>
                  </ModuleTableCard>
                </section>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
}
