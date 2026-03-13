'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ClipboardList, CreditCard, LayoutPanelTop, RotateCcw, Send } from 'lucide-react';

import { AufmassDetailContextRail } from '@/components/aufmass/aufmass-detail-context-rail';
import { AufmassKpiStrip } from '@/components/aufmass/aufmass-kpi-strip';
import { AufmassStatusBadge } from '@/components/aufmass/aufmass-status-badge';
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
  const [activeReviewIssueId, setActiveReviewIssueId] = useState<string | null>(null);

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

  useEffect(() => {
    if (activeWorkspace !== 'review' || !activeReviewIssueId) return;
    const timeout = window.setTimeout(() => {
      const target = document.getElementById(`review-issue-${activeReviewIssueId}`);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.focus?.();
    }, 60);
    return () => window.clearTimeout(timeout);
  }, [activeWorkspace, activeReviewIssueId]);

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
  const quickCaptureHeaderTrigger = (
    <QuickCaptureDrawer
      room={activeRoom}
      positions={record.positions}
      onAddMeasurement={onAddMeasurement}
      iconOnly
      iconTone="primary"
      triggerClassName="h-8 w-8"
    />
  );

  return (
    <div className="space-y-3">
      <PageHeader
        title="Aufmaß-Arbeitsbereich"
        description={
          <div className="flex w-full min-w-0 items-center gap-2">
            <AufmassStatusBadge status={record.status} />
            <span className="min-w-0 flex-1 truncate" title={`${record.customerName} · ${record.projectName}`}>
              {record.customerName} · {record.projectName}
            </span>
          </div>
        }
        titleClassName="text-lg"
        descriptionClassName="-mt-0.5"
      >
        {record.status === 'DRAFT' ? (
          <Button
            size="sm"
            onClick={() => setStatus('IN_REVIEW', 'Zur Prüfung übergeben.')}
            disabled={!canSubmitReview}
            aria-label="In Prüfung senden"
            title="In Prüfung senden"
          >
            <Send className="h-4 w-4" />
            <span className="hidden lg:inline ml-2">In Prüfung senden</span>
          </Button>
        ) : null}
        {record.status === 'IN_REVIEW' ? (
          <>
            <Button
              size="sm"
              onClick={() => setStatus('APPROVED', 'Freigabe aus Prüfablauf gesetzt.')}
              disabled={!canApprove}
              aria-label="Als freigegeben markieren"
              title="Als freigegeben markieren"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">Als freigegeben markieren</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatus('DRAFT', 'Zurück in Entwurf gesetzt.')}
              aria-label="Zurück zu Entwurf"
              title="Zurück zu Entwurf"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </PageHeader>

      <div className="space-y-3">
        <AufmassKpiStrip record={record} />
      </div>

      {statusError ? (
        <ModuleTableCard icon={ClipboardList} label="Statuswechsel" title="Aktion nicht möglich" tone="emphasis" hasData>
          <p className="text-sm text-muted-foreground">{statusError}</p>
          <p className="mt-1 text-xs text-muted-foreground/90">
            Prüfe die Blocker im Bereich "Prüfung" und versuche die Aktion erneut.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setActiveWorkspace('review')}>
              <span className="sm:hidden">Prüfung</span>
              <span className="hidden sm:inline">Blocker anzeigen</span>
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (!pendingStatusAction) return;
                setStatus(pendingStatusAction.to, pendingStatusAction.detail);
              }}
              disabled={!pendingStatusAction}
            >
              <span className="sm:hidden">Retry</span>
              <span className="hidden sm:inline">Erneut versuchen</span>
            </Button>
          </div>
        </ModuleTableCard>
      ) : null}

      <section className="grid items-start gap-3 grid-cols-1 xl:grid-cols-[minmax(0,2.1fr)_minmax(260px,0.75fr)] 2xl:grid-cols-[minmax(0,2.35fr)_minmax(280px,0.65fr)]">
        <div
          id={`aufmass-workspace-panel-${activeWorkspace}`}
          role="tabpanel"
          aria-labelledby={`aufmass-workspace-tab-${activeWorkspace}`}
          className="space-y-3"
        >
          {activeWorkspace === 'capture' ? (
            <ModuleTableCard
              icon={LayoutPanelTop}
              iconNode={quickCaptureHeaderTrigger}
              label="Erfassung"
              title={activeRoom ? `Arbeitsbereich · ${activeRoom.name}` : 'Arbeitsbereich'}
              className="relative border-border/70 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_30px_-20px_rgba(15,23,42,0.22)] transition-shadow duration-200"
              headerClassName="bg-white"
              headerContentClassName="items-start"
              bodyClassName="space-y-3 bg-white"
              action={
                <AufmassWorkspaceTabs
                  activeTab={activeWorkspace}
                  onChange={setActiveWorkspace}
                  reviewBadge={reviewIssues.filter((issue) => issue.severity === 'blocking').length}
                  inline
                />
              }
              hasData
            >
              <div className="space-y-3">
                <div className="grid gap-3 grid-cols-1 lg:grid-cols-10">
                  <section className="space-y-2 lg:col-span-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Objektstruktur</p>
                    <RoomTreePanel rooms={record.rooms} activeRoomId={activeRoomId} onSelectRoom={setActiveRoomId} />
                  </section>
                  <section className="space-y-2 lg:col-span-7">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Messwerte</p>
                    <MeasurementGrid room={activeRoom} measurements={record.measurements} positions={record.positions} />
                  </section>
                </div>
              </div>
            </ModuleTableCard>
          ) : null}

          {activeWorkspace === 'review' ? (
            <ModuleTableCard
              icon={CreditCard}
              label="Prüfung"
              title="Abweichungen, Regeln und Mapping"
              tone="muted"
              className="relative border-border/70 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_30px_-20px_rgba(15,23,42,0.22)] transition-shadow duration-200"
              headerClassName="bg-white"
              headerContentClassName="items-start"
              bodyClassName="space-y-3 bg-white"
              action={
                <AufmassWorkspaceTabs
                  activeTab={activeWorkspace}
                  onChange={setActiveWorkspace}
                  reviewBadge={reviewIssues.filter((issue) => issue.severity === 'blocking').length}
                  inline
                />
              }
              hasData
            >
              <div className="space-y-3">
                <section className="space-y-2">
                  {effectiveReviewBlockers.length > 0 ? (
                    <div className="rounded-lg border border-amber-300/40 bg-amber-50/55 p-2 text-xs text-amber-800/85 dark:bg-amber-950/20 dark:text-amber-200/85">
                      <p className="flex items-center gap-1 font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Offene Voraussetzungen: {effectiveReviewBlockers.length}
                      </p>
                    </div>
                  ) : null}
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Abweichungen und Prüfpunkte
                  </p>
                  <ReviewDiffPanel
                    issues={reviewIssues}
                    activeIssueId={activeReviewIssueId}
                    embedded
                    onJumpToIssue={(issue) => {
                      if (issue.roomId) {
                        setActiveRoomId(issue.roomId);
                      }
                      setActiveReviewIssueId(issue.id);
                    }}
                  />
                </section>

                <details className="rounded-lg border border-border/60 bg-sidebar/20 p-2.5" open>
                  <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Freigaberegeln
                  </summary>
                  <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <p>- Freigabe nur ohne offene Blocker.</p>
                    <p>- Rückgabe an Entwurf erfordert Kommentar.</p>
                    <p>- Statuswechsel folgen einem festen Ablauf.</p>
                    <p>- Alte Formeln sollten vor Freigabe in den Formeleditor übernommen werden.</p>
                  </div>
                  {aufmassRolloutFlags.enableAssistedMigration && (
                    <div className="mt-3 flex items-center justify-between rounded-md border border-border bg-white p-2">
                      <p className="text-xs text-muted-foreground">Alte Formeln: {legacyCandidateCount}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onMigrateLegacyFormulas}
                        disabled={legacyCandidateCount === 0}
                      >
                        <span className="sm:hidden">Migration</span>
                        <span className="hidden sm:inline">Jetzt umstellen</span>
                      </Button>
                    </div>
                  )}
                </details>

                <details className="rounded-lg border border-border/60 bg-sidebar/20 p-2.5" open>
                  <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Positionsmapping
                  </summary>
                  <div className="mt-2">
                    <PositionMappingTable
                      mappings={record.mappings}
                      positions={record.positions}
                      rooms={record.rooms}
                      embedded
                    />
                  </div>
                </details>
              </div>
            </ModuleTableCard>
          ) : null}

          {activeWorkspace === 'billing' ? (
            <ModuleTableCard
              icon={ClipboardList}
              label="Abrechnung"
              title="Ready Check und Abrechnungsvorschau"
              tone="muted"
              className="relative border-border/70 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_30px_-20px_rgba(15,23,42,0.22)] transition-shadow duration-200"
              headerClassName="bg-white"
              headerContentClassName="items-start"
              bodyClassName="space-y-3 bg-white"
              action={
                <AufmassWorkspaceTabs
                  activeTab={activeWorkspace}
                  onChange={setActiveWorkspace}
                  reviewBadge={reviewIssues.filter((issue) => issue.severity === 'blocking').length}
                  inline
                />
              }
              hasData
            >
              <BillingPreviewCard
                record={record}
                canBill={canBill}
                billingBlockers={billingBlockers}
                onBill={() => setStatus('BILLED', 'Abrechnungsvorschau abgeschlossen.')}
                embedded
              />
            </ModuleTableCard>
          ) : null}
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
          tone="muted"
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
