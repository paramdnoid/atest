'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Brain, ClipboardList, FileText, History, LayoutPanelTop, Wrench } from 'lucide-react';

import { AbnahmeDetailHeader } from '@/components/abnahmen/abnahme-detail-header';
import { AbnahmeProtocolCard } from '@/components/abnahmen/abnahme-protocol-card';
import { AuditTimeline } from '@/components/abnahmen/audit-timeline';
import { DefectBoard } from '@/components/abnahmen/defect-board';
import { DefectCaptureDrawer } from '@/components/abnahmen/defect-capture-drawer';
import { PrivacyBanner } from '@/components/abnahmen/privacy-banner';
import { ReworkTracker } from '@/components/abnahmen/rework-tracker';
import { getAbnahmenKpiItems } from '@/components/abnahmen/abnahmen-kpi-strip';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { EmptyState } from '@/components/dashboard/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTransitionComplianceBlockers } from '@/lib/abnahmen/compliance-rules';
import { getEvidenceBlockingMessages, getEvidencePolicyIssues } from '@/lib/abnahmen/evidence-policy';
import { getAbnahmeRecordById } from '@/lib/abnahmen/mock-data';
import { abnahmenRolloutFlags } from '@/lib/abnahmen/rollout-flags';
import { getOpenDefects } from '@/lib/abnahmen/selectors';
import { canTransition, getTransitionBlockers, transitionRecordStatus } from '@/lib/abnahmen/state-machine';
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

function getTabId(id: TabKey): string {
  return `abnahmen-tab-${id}`;
}

function getPanelId(id: TabKey): string {
  return `abnahmen-tabpanel-${id}`;
}

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
  const visibleTabs = tabs.filter((tab) => (tab.id === 'insights' ? abnahmenRolloutFlags.enableInsights : true));

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
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + direction + visibleTabs.length) % visibleTabs.length;
      setActiveTab(visibleTabs[nextIndex].id);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveTab(visibleTabs[0].id);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveTab(visibleTabs[visibleTabs.length - 1].id);
    }
  };

  return (
    <div className="space-y-6">
      <ModulePageTemplate
        title="Abnahme Workspace"
        description={`${record.number} · ${record.customerName}`}
        badge={
          <Badge variant="outline" className="font-mono text-xs">
            {record.tradeLabel}
          </Badge>
        }
        actions={<DefectCaptureDrawer onAddDefect={onAddDefect} />}
        kpis={getAbnahmenKpiItems([record])}
        mainContent={
          <div className="space-y-4">
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
              <ModuleTableCard icon={FileText} label="Datenschutz" title="Privacy Guards deaktiviert" hasData>
                <p className="text-sm text-muted-foreground">
                  `NEXT_PUBLIC_ABNAHMEN_ENABLE_PRIVACY_GUARDS` ist deaktiviert.
                </p>
              </ModuleTableCard>
            )}

            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Abnahmebereiche">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    size="sm"
                    variant={activeTab === tab.id ? 'default' : 'outline'}
                    onClick={() => setActiveTab(tab.id)}
                    role="tab"
                    id={getTabId(tab.id)}
                    aria-selected={activeTab === tab.id}
                    aria-controls={getPanelId(tab.id)}
                    tabIndex={activeTab === tab.id ? 0 : -1}
                    onKeyDown={(event) => onTabKeyDown(event, visibleTabs.findIndex((entry) => entry.id === tab.id))}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            {activeTab === 'overview' && (
              <section
                role="tabpanel"
                id={getPanelId('overview')}
                aria-labelledby={getTabId('overview')}
                tabIndex={0}
                className="grid gap-4 lg:grid-cols-2"
              >
                <DefectBoard defects={record.defects} />
                <AbnahmeProtocolCard protocol={record.protocol} />
              </section>
            )}
            {activeTab === 'defects' && (
              <section role="tabpanel" id={getPanelId('defects')} aria-labelledby={getTabId('defects')} tabIndex={0}>
                <DefectBoard defects={record.defects} />
              </section>
            )}
            {activeTab === 'rework' && (
              <section role="tabpanel" id={getPanelId('rework')} aria-labelledby={getTabId('rework')} tabIndex={0}>
                <ReworkTracker rework={record.rework} defects={record.defects} />
              </section>
            )}
            {activeTab === 'protocol' && (
              <section role="tabpanel" id={getPanelId('protocol')} aria-labelledby={getTabId('protocol')} tabIndex={0}>
                <AbnahmeProtocolCard protocol={record.protocol} />
              </section>
            )}
            {activeTab === 'history' && (
              <section role="tabpanel" id={getPanelId('history')} aria-labelledby={getTabId('history')} tabIndex={0}>
                <AuditTimeline events={record.auditTrail} />
              </section>
            )}
            {activeTab === 'documents' && (
              <section
                role="tabpanel"
                id={getPanelId('documents')}
                aria-labelledby={getTabId('documents')}
                tabIndex={0}
              >
                <ModuleTableCard icon={FileText} label="Dokumente" title="Protokolle und Belege" hasData>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Abnahmeprotokoll.pdf · vorbereitet</p>
                    <p>Mängelliste.xlsx · aktuell</p>
                    <p>Fotodokumentation.zip · {openDefects.length} offene Mängel</p>
                  </div>
                </ModuleTableCard>
              </section>
            )}
            {activeTab === 'insights' && (
              <section role="tabpanel" id={getPanelId('insights')} aria-labelledby={getTabId('insights')} tabIndex={0}>
                <ModuleTableCard icon={Brain} label="Insights" title="Qualitätskennzahlen" hasData>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Offene Mängel: {openDefects.length}</p>
                    <p>Nacharbeiten in Bearbeitung: {record.rework.filter((entry) => entry.status === 'IN_PROGRESS').length}</p>
                    <p>Reopen-Quote: {record.defects.length === 0 ? 0 : Math.round((record.defects.reduce((sum, item) => sum + item.reopenCount, 0) / record.defects.length) * 100)}%</p>
                  </div>
                </ModuleTableCard>
              </section>
            )}
          </div>
        }
      />
    </div>
  );
}
