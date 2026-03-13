'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ClipboardList, LayoutPanelTop } from 'lucide-react';

import { ApprovalDialog } from '@/components/aufmass/approval-dialog';
import { AufmassDetailContextRail } from '@/components/aufmass/aufmass-detail-context-rail';
import { AufmassDetailHeader } from '@/components/aufmass/aufmass-detail-header';
import { AufmassKpiStrip } from '@/components/aufmass/aufmass-kpi-strip';
import { AufmassWorkspaceTabs, type AufmassWorkspaceTab } from '@/components/aufmass/aufmass-workspace-tabs';
import { AuditTimeline } from '@/components/aufmass/audit-timeline';
import { BillingPreviewCard } from '@/components/aufmass/billing-preview-card';
import { MeasurementGrid } from '@/components/aufmass/measurement-grid';
import { PositionMappingTable } from '@/components/aufmass/position-mapping-table';
import { QuickCaptureDrawer } from '@/components/aufmass/quick-capture-drawer';
import { ReviewDiffPanel } from '@/components/aufmass/review-diff-panel';
import { RoomTreePanel } from '@/components/aufmass/room-tree-panel';
import { PageHeader } from '@/components/dashboard/page-header';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
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
  const [activeWorkspace, setActiveWorkspace] = useState<AufmassWorkspaceTab>('capture');
  const [historyExpanded, setHistoryExpanded] = useState(false);
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
            ? 'Alte Formel nur teilweise umstellbar'
            : 'Alte Formel nicht umstellbar',
        message: `Messwert "${measurement.label}": ${migration.reason ?? 'Formel prüfen und im Formeleditor neu erfassen.'}`,
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
      ? [`Reifegrad (${intelligenceSnapshot.readinessScore}) ist kleiner als 75.`]
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
            auditTrail: appendAudit(prev.auditTrail, `Status geändert zu ${to}`, detail),
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
        setPendingStatusAction({ to: 'APPROVED', detail: 'Freigabe aus Prüfablauf gesetzt.' });
        return prev;
      }
      setStatusError(null);
      setPendingStatusAction(null);
      return {
        ...prepared,
        status: 'APPROVED',
        updatedAt: new Date().toISOString(),
        auditTrail: appendAudit(prepared.auditTrail, 'Status geändert zu FREIGEGEBEN', 'Freigabe aus Prüfablauf gesetzt.'),
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
              'Schnellerfassung',
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
          'Alt-Formel-Umstellung',
          `${migratedCount} Formel(n) automatisch in die neue Form überführt.`,
        ),
      };
    });
  };
  return (
    <div className="space-y-4">
      <PageHeader
        title="Aufmaß-Arbeitsbereich"
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
            Prüfe die Blocker im Bereich "Prüfung" und versuche die Aktion erneut.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setActiveWorkspace('review')}>
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

      <AufmassWorkspaceTabs
        activeTab={activeWorkspace}
        onChange={setActiveWorkspace}
        reviewBadge={reviewIssues.filter((issue) => issue.severity === 'blocking').length}
      />

      <section className={detailSplitGridClassName}>
        <div className="space-y-4">
          {activeWorkspace === 'capture' ? (
            <>
              <ModuleTableCard icon={LayoutPanelTop} label="Erfassung" title="Räume und Messwerte" hasData>
                <div className="space-y-4">
                  <RoomTreePanel rooms={record.rooms} activeRoomId={activeRoomId} onSelectRoom={setActiveRoomId} />
                  <MeasurementGrid room={activeRoom} measurements={record.measurements} positions={record.positions} />
                </div>
              </ModuleTableCard>
              <ModuleTableCard icon={LayoutPanelTop} label="Schnellerfassung" title="Baustellenmodus" hasData>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Schnellerfassung mit reduzierter Eingabe und direkter Zuordnung auf Positionen.
                  </p>
                  <QuickCaptureDrawer
                    room={activeRoom}
                    positions={record.positions}
                    onAddMeasurement={onAddMeasurement}
                  />
                </div>
              </ModuleTableCard>
            </>
          ) : null}

          {activeWorkspace === 'review' ? (
            <>
              <ReviewDiffPanel issues={reviewIssues} />
              <ModuleTableCard icon={ClipboardList} label="Prüfhinweis" title="Freigaberegeln" hasData>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>- Freigabe nur ohne offene Blocker.</p>
                  <p>- Rückgabe an Entwurf erfordert Kommentar.</p>
                  <p>- Statuswechsel folgen einem festen Ablauf.</p>
                  <p>- Alte Formeln sollten vor Freigabe in den Formeleditor übernommen werden.</p>
                </div>
                {aufmassRolloutFlags.enableAssistedMigration && (
                  <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-sidebar/30 p-2">
                    <p className="text-xs text-muted-foreground">
                      Alte Formeln: {legacyCandidateCount}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onMigrateLegacyFormulas}
                      disabled={legacyCandidateCount === 0}
                    >
                      Jetzt umstellen
                    </Button>
                  </div>
                )}
              </ModuleTableCard>
              <PositionMappingTable
                mappings={record.mappings}
                positions={record.positions}
                rooms={record.rooms}
              />
            </>
          ) : null}

          {activeWorkspace === 'billing' ? <BillingPreviewCard record={record} /> : null}
        </div>

        <AufmassDetailContextRail
          record={record}
          snapshot={intelligenceSnapshot}
          verknuepfungSnapshot={verknuepfungSnapshot}
          onOpenHistory={() => setHistoryExpanded((prev) => !prev)}
        />
      </section>

      {historyExpanded ? (
        <ModuleTableCard
          icon={ClipboardList}
          label="Historie"
          title="Änderungsprotokoll"
          action={
            <Button size="sm" variant="outline" onClick={() => setHistoryExpanded(false)}>
              Schließen
            </Button>
          }
          hasData
        >
          <AuditTimeline events={record.auditTrail} />
        </ModuleTableCard>
      ) : null}
    </div>
  );
}
