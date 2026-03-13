'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Brain, ClipboardList, FileSpreadsheet, History, LayoutPanelTop, Network } from 'lucide-react';

import { ApprovalDialog } from '@/components/aufmass/approval-dialog';
import { AufmassDetailHeader } from '@/components/aufmass/aufmass-detail-header';
import { AufmassKpiStrip } from '@/components/aufmass/aufmass-kpi-strip';
import { AuditTimeline } from '@/components/aufmass/audit-timeline';
import { BillingPreviewCard } from '@/components/aufmass/billing-preview-card';
import { AufmassIntelligencePanel } from '@/components/aufmass/aufmass-intelligence-panel';
import { MeasurementGrid } from '@/components/aufmass/measurement-grid';
import { PositionMappingTable } from '@/components/aufmass/position-mapping-table';
import { QuickCaptureDrawer } from '@/components/aufmass/quick-capture-drawer';
import { ReviewDiffPanel } from '@/components/aufmass/review-diff-panel';
import { RoomTreePanel } from '@/components/aufmass/room-tree-panel';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  DashboardTabs,
  getDashboardTabId,
  getDashboardTabPanelId,
} from '@/components/dashboard/dashboard-tabs';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { CrossModuleLinksContent } from '@/components/dashboard/cross-module-links-card';
import { ModuleSideTabsCard } from '@/components/dashboard/module-side-tabs-card';
import { EmptyState } from '@/components/dashboard/states';
import { Button } from '@/components/ui/button';
import { getAufmassRecordSync, listAufmassRecordsSync } from '@/lib/aufmass/data-adapter';
import { aufmassRolloutFlags } from '@/lib/aufmass/rollout-flags';
import { getTransitionBlockers, transitionRecordStatus } from '@/lib/aufmass/state-machine';
import { getRecordOvermeasureIssues } from '@/lib/aufmass/selectors';
import { migrateLegacyFormula } from '@/lib/aufmass/formula-builder';
import { getIntelligenceSnapshot } from '@/lib/aufmass/intelligence';
import { getVerknuepfungSnapshot } from '@/lib/auftragsabwicklung/cross-module-intelligence';
import type {
  AufmassAuditEvent,
  AufmassMeasurement,
  AufmassRecord,
  AufmassReviewIssue,
  AufmassStatus,
} from '@/lib/aufmass/types';

type TabKey = 'overview' | 'rooms' | 'positions' | 'review' | 'billing' | 'history' | 'insights';

const tabs: Array<{ id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Überblick', icon: LayoutPanelTop },
  { id: 'rooms', label: 'Räume', icon: LayoutPanelTop },
  { id: 'positions', label: 'Positionen', icon: ClipboardList },
  { id: 'review', label: 'Prüfung', icon: ClipboardList },
  { id: 'billing', label: 'Abrechnung', icon: FileSpreadsheet },
  { id: 'insights', label: 'Insights', icon: Brain },
  { id: 'history', label: 'Historie', icon: History },
];

function appendAudit(
  events: AufmassAuditEvent[],
  action: string,
  detail: string,
  actor = 'UI Benutzer',
): AufmassAuditEvent[] {
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

export default function AufmassDetailPage() {
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [overviewContextTab, setOverviewContextTab] = useState<'capture' | 'insights' | 'datennetz'>('capture');
  const allRecords = useMemo<AufmassRecord[]>(() => listAufmassRecordsSync(), []);
  const initial = useMemo(() => getAufmassRecordSync(params.id), [params.id]);
  const [record, setRecord] = useState<AufmassRecord | null>(initial);
  const [activeRoomId, setActiveRoomId] = useState<string | undefined>(initial?.rooms[0]?.id);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingStatusAction, setPendingStatusAction] = useState<{
    to: AufmassStatus;
    detail: string;
  } | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const detailSplitGridClassName = 'grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]';

  if (!record) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title="Aufmaß nicht gefunden"
          description="Der Datensatz wurde nicht gefunden."
        />
        <Button asChild variant="outline">
          <Link href="/aufmass">Zurück zur Aufmaßliste</Link>
        </Button>
      </div>
    );
  }

  const activeRoom = record.rooms.find((room) => room.id === activeRoomId);
  const legacyMigrationIssues = useMemo<AufmassReviewIssue[]>(() => {
    if (!aufmassRolloutFlags.enableAssistedMigration) return [];
    const issues: AufmassReviewIssue[] = [];
    for (const measurement of record.measurements) {
      if (measurement.formulaAst || measurement.formula.trim().length === 0) continue;
      const migration = migrateLegacyFormula(measurement.formula);
      if (migration.status === 'migrated_confident') continue;
      issues.push({
        id: `legacy-formula-${measurement.id}`,
        type: migration.status === 'migrated_partial' ? 'legacy_formula_partial' : 'legacy_formula_unparsed',
        title:
          migration.status === 'migrated_partial'
            ? 'Legacy-Formel nur teilweise migrierbar'
            : 'Legacy-Formel nicht migrierbar',
        message: `Messwert "${measurement.label}": ${migration.reason ?? 'Formel prüfen und im Builder neu erfassen.'}`,
        severity: migration.status === 'migrated_partial' ? 'warning' : 'blocking',
        positionId: measurement.positionId,
        roomId: measurement.roomId,
        createdAt: measurement.createdAt,
      });
    }
    return issues;
  }, [record]);
  const generatedReviewIssues = useMemo(() => getRecordOvermeasureIssues(record), [record]);
  const reviewIssues = useMemo(
    () => [...generatedReviewIssues, ...legacyMigrationIssues],
    [generatedReviewIssues, legacyMigrationIssues],
  );
  const reviewBlockers = useMemo(() => getTransitionBlockers(record, 'APPROVED'), [record]);
  const intelligenceSnapshot = useMemo(
    () => getIntelligenceSnapshot(record, allRecords),
    [record, allRecords],
  );
  const verknuepfungSnapshot = useMemo(
    () => getVerknuepfungSnapshot('AUFMASS', record.id),
    [record.id],
  );
  const scoreGateBlockers =
    aufmassRolloutFlags.enforceBuilderScoreGate && intelligenceSnapshot.readinessScore < 75
      ? [`Readiness-Score (${intelligenceSnapshot.readinessScore}) unterschreitet Gate 75.`]
      : [];
  const legacyReviewBlockers = legacyMigrationIssues
    .filter((issue) => issue.severity === 'blocking')
    .map((issue) => issue.title);
  const legacyCandidateCount = record.measurements.filter(
    (measurement) => !measurement.formulaAst && measurement.formula.trim().length > 0,
  ).length;
  const effectiveReviewBlockers = [...reviewBlockers, ...legacyReviewBlockers, ...scoreGateBlockers];
  const submitReviewBlockers = useMemo(() => getTransitionBlockers(record, 'IN_REVIEW'), [record]);
  const canSubmitReview = record.status === 'DRAFT' && submitReviewBlockers.length === 0;
  const canApprove = record.status === 'IN_REVIEW' && effectiveReviewBlockers.length === 0;
  const billingBlockers = useMemo(() => getTransitionBlockers(record, 'BILLED'), [record]);
  const canBill = record.status === 'APPROVED' && billingBlockers.length === 0;

  const setStatus = (to: AufmassStatus, detail: string) => {
    const result = transitionRecordStatus(record, to);
    if (!result.ok) {
      setStatusError(`${result.blockers[0] ?? 'Statuswechsel nicht möglich.'} (Ziel: ${to})`);
      setPendingStatusAction({ to, detail });
      return;
    }
    setStatusError(null);
    setPendingStatusAction(null);
    setRecord((prev) =>
      prev
        ? {
            ...prev,
            status: to,
            updatedAt: new Date().toISOString(),
            auditTrail: appendAudit(prev.auditTrail, `Status -> ${to}`, detail),
          }
        : prev,
    );
  };

  const onApprove = (comment: string) => {
    setRecord((prev) => {
      if (!prev) return prev;
      const prepared = {
        ...prev,
        reviewIssues: prev.reviewIssues.filter((issue) => issue.severity !== 'blocking'),
        auditTrail: appendAudit(
          prev.auditTrail,
          'Freigabe',
          comment,
        ),
      };
      const result = transitionRecordStatus(prepared, 'APPROVED');
      if (!result.ok) {
        setStatusError(`${result.blockers[0] ?? 'Freigabe nicht möglich.'} (Ziel: APPROVED)`);
        setPendingStatusAction({ to: 'APPROVED', detail: 'Freigabe aus Prüfworkflow gesetzt.' });
        return prev;
      }
      setStatusError(null);
      setPendingStatusAction(null);
      return {
        ...prepared,
        status: 'APPROVED',
        updatedAt: new Date().toISOString(),
        auditTrail: appendAudit(prepared.auditTrail, 'Status -> APPROVED', 'Freigabe aus Prüfworkflow gesetzt.'),
      };
    });
  };

  const onReturnToDraft = (comment: string) => {
    setStatus('DRAFT', comment || 'Zurückgabe ohne Kommentar');
  };

  const onAddMeasurement = (measurement: AufmassMeasurement) => {
    setRecord((prev) =>
      prev
        ? {
            ...prev,
            measurements: [measurement, ...prev.measurements],
            updatedAt: new Date().toISOString(),
            auditTrail: appendAudit(
              prev.auditTrail,
              'Quick-Capture',
              `Messwert "${measurement.label}" ergänzt`,
            ),
          }
        : prev,
    );
  };

  const onMigrateLegacyFormulas = () => {
    setRecord((prev) => {
      if (!prev) return prev;
      let migratedCount = 0;
      const measurements = prev.measurements.map((measurement) => {
        if (measurement.formulaAst || !measurement.formula?.trim()) {
          return measurement;
        }
        const migration = migrateLegacyFormula(measurement.formula);
        if (migration.status === 'migrated_confident' && migration.ast) {
          migratedCount += 1;
          return {
            ...measurement,
            formulaAst: migration.ast,
            formula: migration.normalizedFormula ?? measurement.formula,
            formulaSource: 'migrated' as const,
            formulaMigrationStatus: 'migrated_confident' as const,
          };
        }
        return {
          ...measurement,
          formulaSource: 'legacy' as const,
          formulaMigrationStatus: migration.status,
        };
      });

      if (migratedCount === 0) return prev;
      return {
        ...prev,
        measurements,
        updatedAt: new Date().toISOString(),
        auditTrail: appendAudit(
          prev.auditTrail,
          'Legacy-Migration',
          `${migratedCount} Formel(n) automatisch in AST migriert.`,
        ),
      };
    });
  };
  return (
    <div className="space-y-4">
      <PageHeader
        title="Aufmaß Workspace"
        description={`${record.number} · ${record.customerName}`}
      >
        <ApprovalDialog
          currentStatus={record.status}
          onApprove={onApprove}
          onReturnToDraft={onReturnToDraft}
          open={isApprovalDialogOpen}
          onOpenChange={setIsApprovalDialogOpen}
        />
      </PageHeader>

      {statusError ? (
        <ModuleTableCard icon={ClipboardList} label="Statuswechsel" title="Aktion nicht möglich" tone="emphasis">
          <p className="text-sm text-muted-foreground">{statusError}</p>
          <p className="mt-1 text-xs text-muted-foreground/90">
            Prüfe die Blocker im Reiter "Prüfung" und versuche die Aktion erneut.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setActiveTab('review')}>
              Blocker anzeigen
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!pendingStatusAction) return;
                setStatus(pendingStatusAction.to, pendingStatusAction.detail);
              }}
              disabled={!pendingStatusAction}
            >
              Erneut versuchen
            </Button>
          </div>
        </ModuleTableCard>
      ) : null}

      <div className="space-y-3">
        <AufmassDetailHeader
          record={record}
          blockers={record.status === 'IN_REVIEW' ? effectiveReviewBlockers : submitReviewBlockers}
          canSubmitReview={canSubmitReview}
          canApprove={canApprove}
          canBill={canBill}
          onSubmitForReview={() => setStatus('IN_REVIEW', 'Zur Prüfung übergeben.')}
          onOpenApprovalDialog={() => setIsApprovalDialogOpen(true)}
          onBill={() => setStatus('BILLED', 'Abrechnungsvorschau abgeschlossen.')}
        />
        <AufmassKpiStrip record={record} />
      </div>

      <DashboardTabs
        idPrefix="aufmass"
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Aufmassbereiche"
      />

      {activeTab === 'overview' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('aufmass', 'overview')}
          aria-labelledby={getDashboardTabId('aufmass', 'overview')}
          tabIndex={0}
          className={detailSplitGridClassName}
        >
          <div className="space-y-4">
            <RoomTreePanel rooms={record.rooms} activeRoomId={activeRoomId} onSelectRoom={setActiveRoomId} />
            <MeasurementGrid room={activeRoom} measurements={record.measurements} positions={record.positions} />
          </div>
          <ModuleSideTabsCard
            idPrefix="aufmass-detail-overview-context"
            icon={LayoutPanelTop}
            label="Kontext"
            title="Erfassung, Insights und Datennetz"
            activeTab={overviewContextTab}
            onTabChange={setOverviewContextTab}
            ariaLabel="Aufmaß Detailkontext"
            tabs={[
              {
                id: 'capture',
                label: 'Erfassung',
                icon: LayoutPanelTop,
                content: (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Schnellerfassung für Baustelle mit reduzierter Eingabe und optionalen Fotos.
                    </p>
                    <QuickCaptureDrawer
                      room={activeRoom}
                      positions={record.positions}
                      onAddMeasurement={onAddMeasurement}
                    />
                  </div>
                ),
              },
              {
                id: 'insights',
                label: 'Insights',
                icon: Brain,
                content: (
                  <AufmassIntelligencePanel
                    record={record}
                    allRecords={allRecords}
                    snapshot={intelligenceSnapshot}
                  />
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
                      module: 'AUFMASS',
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
        </section>
      )}

      {activeTab === 'rooms' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('aufmass', 'rooms')}
          aria-labelledby={getDashboardTabId('aufmass', 'rooms')}
          tabIndex={0}
          className={detailSplitGridClassName}
        >
          <RoomTreePanel rooms={record.rooms} activeRoomId={activeRoomId} onSelectRoom={setActiveRoomId} />
          <MeasurementGrid room={activeRoom} measurements={record.measurements} positions={record.positions} />
        </section>
      )}

      {activeTab === 'positions' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('aufmass', 'positions')}
          aria-labelledby={getDashboardTabId('aufmass', 'positions')}
          tabIndex={0}
        >
          <PositionMappingTable
            mappings={record.mappings}
            positions={record.positions}
            rooms={record.rooms}
          />
        </section>
      )}

      {activeTab === 'review' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('aufmass', 'review')}
          aria-labelledby={getDashboardTabId('aufmass', 'review')}
          tabIndex={0}
          className={detailSplitGridClassName}
        >
          <ReviewDiffPanel issues={reviewIssues} />
          <ModuleTableCard icon={ClipboardList} label="Prüfhinweis" title="Action Guards">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>- Freigabe nur ohne offene Blocker.</p>
              <p>- Rückgabe an Entwurf erfordert Kommentar.</p>
              <p>- Statuswechsel sind über State-Machine begrenzt.</p>
              <p>- Legacy-Formeln sollten vor Freigabe in Builder-Form überführt werden.</p>
            </div>
            {aufmassRolloutFlags.enableAssistedMigration && (
              <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-sidebar/30 p-2">
                <p className="text-xs text-muted-foreground">
                  Legacy-Kandidaten:{' '}
                  {legacyCandidateCount}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onMigrateLegacyFormulas}
                  disabled={legacyCandidateCount === 0}
                >
                  Jetzt konvertieren
                </Button>
              </div>
            )}
          </ModuleTableCard>
        </section>
      )}

      {activeTab === 'billing' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('aufmass', 'billing')}
          aria-labelledby={getDashboardTabId('aufmass', 'billing')}
          tabIndex={0}
        >
          <BillingPreviewCard record={record} />
        </section>
      )}

      {activeTab === 'insights' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('aufmass', 'insights')}
          aria-labelledby={getDashboardTabId('aufmass', 'insights')}
          tabIndex={0}
          className={detailSplitGridClassName}
        >
          <AufmassIntelligencePanel record={record} allRecords={allRecords} snapshot={intelligenceSnapshot} />
          <ReviewDiffPanel issues={reviewIssues} />
        </section>
      )}

      {activeTab === 'history' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('aufmass', 'history')}
          aria-labelledby={getDashboardTabId('aufmass', 'history')}
          tabIndex={0}
        >
          <AuditTimeline events={record.auditTrail} />
        </section>
      )}
    </div>
  );
}
