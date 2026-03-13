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
import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';
import { Button } from '@/components/ui/button';
import { getAufmassRecord, listAufmassRecords } from '@/lib/aufmass/data-adapter';
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

type StatusPrimaryAction = {
  label: string;
  shortLabel: string;
  icon: typeof Send;
  to?: AufmassStatus;
  detail?: string;
  disabled?: boolean;
  disabledReason?: string;
};

type BlockerEntry = {
  id: string;
  title: string;
  workspace: AufmassWorkspaceTab;
  issueId?: string;
  roomId?: string;
};

type LocalTelemetry = {
  tabSwitches: number;
  blockerJumps: number;
  statusAttempts: number;
  statusSuccess: number;
  quickCaptures: number;
};

export default function AufmassDetailPage() {
  const params = useParams<{ id: string }>();
  const [activeWorkspace, setActiveWorkspace] = useState<AufmassWorkspaceTab>('capture');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [allRecords, setAllRecords] = useState<AufmassRecord[]>([]);
  const [record, setRecord] = useState<AufmassRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRoomId, setActiveRoomId] = useState<string | undefined>(undefined);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingStatusAction, setPendingStatusAction] = useState<{
    to: AufmassStatus;
    detail: string;
  } | null>(null);
  const [activeReviewIssueId, setActiveReviewIssueId] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<LocalTelemetry>({
    tabSwitches: 0,
    blockerJumps: 0,
    statusAttempts: 0,
    statusSuccess: 0,
    quickCaptures: 0,
  });

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

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setIsLoading(true);
      const [list, detail] = await Promise.all([
        listAufmassRecords(),
        getAufmassRecord(params.id),
      ]);
      if (cancelled) return;
      setAllRecords(list);
      setRecord(detail);
      setActiveRoomId(detail?.rooms[0]?.id);
      setIsLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (isLoading) {
    return (
      <EmptyState
        icon={<ClipboardList className="h-8 w-8" />}
        title="Aufmaßdaten werden geladen"
        description="Der Arbeitsbereich wird mit Live-Daten aufgebaut."
      />
    );
  }

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

  const resolvedActiveRoomId = record.rooms.some((room) => room.id === activeRoomId)
    ? activeRoomId
    : record.rooms[0]?.id;
  const activeRoom = record.rooms.find((room) => room.id === resolvedActiveRoomId);
  const legacyMigrationIssues = (() => {
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
  })();
  const generatedReviewIssues = getRecordOvermeasureIssues(record);
  const reviewIssues = [...generatedReviewIssues, ...legacyMigrationIssues];
  const reviewBlockers = getTransitionBlockers(record, 'APPROVED');
  const intelligenceSnapshot = getIntelligenceSnapshot(record, allRecords);
  const verknuepfungSnapshot = getVerknuepfungSnapshot('AUFMASS', record.id);
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
  const submitReviewBlockers = getTransitionBlockers(record, 'IN_REVIEW');
  const canSubmitReview = record.status === 'DRAFT' && submitReviewBlockers.length === 0;
  const canApprove = record.status === 'IN_REVIEW' && effectiveReviewBlockers.length === 0;
  const billingBlockers = getTransitionBlockers(record, 'BILLED');
  const canBill = record.status === 'APPROVED' && billingBlockers.length === 0;
  const helperTextByStatus: Record<AufmassStatus, string> = {
    DRAFT: 'Erfassen und zur Prüfung übergeben.',
    IN_REVIEW: 'Blocker lösen und Freigabe abschließen.',
    APPROVED: 'Abrechnungsvorschau prüfen und abrechnen.',
    BILLED: 'Abgeschlossen und revisionssicher dokumentiert.',
  };

  const primaryActionByStatus: Record<AufmassStatus, StatusPrimaryAction> = {
    DRAFT: {
      label: 'In Prüfung senden',
      shortLabel: 'Prüfung',
      icon: Send,
      to: 'IN_REVIEW',
      detail: 'Zur Prüfung übergeben.',
      disabled: !canSubmitReview,
      disabledReason: submitReviewBlockers[0],
    },
    IN_REVIEW: {
      label: 'Als freigegeben markieren',
      shortLabel: 'Freigeben',
      icon: CheckCircle2,
      to: 'APPROVED',
      detail: 'Freigabe aus Prüfablauf gesetzt.',
      disabled: !canApprove,
      disabledReason: effectiveReviewBlockers[0],
    },
    APPROVED: {
      label: 'Als abgerechnet markieren',
      shortLabel: 'Abrechnen',
      icon: CreditCard,
      to: 'BILLED',
      detail: 'Abrechnungsvorschau abgeschlossen.',
      disabled: !canBill,
      disabledReason: billingBlockers[0],
    },
    BILLED: {
      label: 'Abrechnung abgeschlossen',
      shortLabel: 'Abgeschlossen',
      icon: CheckCircle2,
      disabled: true,
      disabledReason: 'Aufmaß ist bereits abgerechnet.',
    },
  };

  const primaryAction = primaryActionByStatus[record.status];
  const blockingReviewIssues = reviewIssues.filter((issue) => issue.severity === 'blocking');
  const genericReviewBlockers = effectiveReviewBlockers.filter(
    (entry) => !blockingReviewIssues.some((issue) => issue.title === entry),
  );

  const blockersByStatus: Record<AufmassStatus, BlockerEntry[]> = {
    DRAFT: submitReviewBlockers.map((blocker, index) => ({
      id: `draft-blocker-${index}`,
      title: blocker,
      workspace: 'capture',
    })),
    IN_REVIEW: [
      ...blockingReviewIssues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        workspace: 'review' as const,
        issueId: issue.id,
        roomId: issue.roomId,
      })),
      ...genericReviewBlockers.map((blocker, index) => ({
        id: `review-blocker-${index}`,
        title: blocker,
        workspace: 'review' as const,
      })),
    ],
    APPROVED: billingBlockers.map((blocker, index) => ({
      id: `billing-blocker-${index}`,
      title: blocker,
      workspace: 'billing',
    })),
    BILLED: [],
  };
  const activeBlockers = blockersByStatus[record.status];
  const topBlockers = activeBlockers.slice(0, 3);
  const PrimaryActionIcon = primaryAction.icon;

  const setStatus = (to: AufmassStatus, detail: string) => {
    setTelemetry((prev) => ({ ...prev, statusAttempts: prev.statusAttempts + 1 }));
    const result = transitionRecordStatus(record, to);
    if (!result.ok) {
      setStatusError(`${result.blockers[0] ?? 'Statuswechsel nicht möglich.'} (Ziel: ${to})`);
      setPendingStatusAction({ to, detail });
      return;
    }
    setStatusError(null);
    setPendingStatusAction(null);
    setTelemetry((prev) => ({ ...prev, statusSuccess: prev.statusSuccess + 1 }));
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

  const jumpToWorkspaceBlocker = (blocker: BlockerEntry) => {
    setTelemetry((prev) => ({ ...prev, blockerJumps: prev.blockerJumps + 1 }));
    if (blocker.roomId) {
      setActiveRoomId(blocker.roomId);
    }
    setActiveWorkspace(blocker.workspace);
    if (blocker.issueId) {
      setActiveReviewIssueId(blocker.issueId);
      return;
    }
    window.setTimeout(() => {
      const target = document.getElementById(`aufmass-workspace-panel-${blocker.workspace}`);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.focus?.();
    }, 80);
  };

  const onAddMeasurement = (measurement: AufmassMeasurement) => {
    setTelemetry((prev) => ({ ...prev, quickCaptures: prev.quickCaptures + 1 }));
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
  const reviewBlockingCount = reviewIssues.filter((issue) => issue.severity === 'blocking').length;
  const handleWorkspaceChange = (next: AufmassWorkspaceTab) => {
    if (next !== activeWorkspace) {
      setTelemetry((prev) => ({ ...prev, tabSwitches: prev.tabSwitches + 1 }));
    }
    setActiveWorkspace(next);
  };
  const workspaceTabs = (
    <AufmassWorkspaceTabs
      activeTab={activeWorkspace}
      onChange={handleWorkspaceChange}
      reviewBadge={reviewBlockingCount}
      inline
    />
  );

  return (
    <div className={dashboardUiTokens.aufmassDensity.panelGap}>
      <PageHeader
        title="Aufmaß-Arbeitsbereich"
        description={
          <div className="flex w-full min-w-0 items-center gap-2">
            <AufmassStatusBadge status={record.status} />
            <span
              className="min-w-0 flex-1 truncate"
              title={`${record.customerName} · ${record.projectName} · ${helperTextByStatus[record.status]}`}
            >
              {record.customerName} · {record.projectName} · {helperTextByStatus[record.status]}
            </span>
          </div>
        }
        titleClassName="text-lg"
        descriptionClassName="-mt-0.5"
      >
        <Button
          size="sm"
          onClick={() => {
            if (!primaryAction.to || !primaryAction.detail) return;
            setStatus(primaryAction.to, primaryAction.detail);
          }}
          disabled={primaryAction.disabled}
          aria-label={primaryAction.label}
          title={primaryAction.disabledReason ?? primaryAction.label}
        >
          <PrimaryActionIcon className="h-4 w-4" />
          <span className="hidden lg:inline ml-2">{primaryAction.label}</span>
          <span className="lg:hidden ml-2">{primaryAction.shortLabel}</span>
        </Button>
        {record.status === 'IN_REVIEW' ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setStatus('DRAFT', 'Zurück in Entwurf gesetzt.')}
            aria-label="Zurück zu Entwurf"
            title="Zurück zu Entwurf"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        ) : null}
      </PageHeader>

      <div className="space-y-3">
        <AufmassKpiStrip record={record} />
      </div>

      <div>{workspaceTabs}</div>

      {activeBlockers.length > 0 ? (
        <section
          className="sticky top-2 z-20 rounded-lg border border-amber-300/50 bg-amber-50/85 p-2.5 backdrop-blur"
          aria-label="Offene Blocker"
          data-testid="aufmass-blocker-banner"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1 text-xs font-semibold text-amber-900/90">
              <AlertTriangle className="h-3.5 w-3.5" />
              Offene Blocker: {activeBlockers.length}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!topBlockers[0]) return;
                jumpToWorkspaceBlocker(topBlockers[0]);
              }}
            >
              Zur Prüfung
            </Button>
          </div>
          <div className="mt-2 space-y-1.5">
            {topBlockers.map((blocker) => (
              <button
                key={blocker.id}
                type="button"
                className="flex w-full items-center justify-between rounded-md border border-amber-300/40 bg-white/85 px-2 py-1.5 text-left text-xs text-amber-900 transition hover:bg-amber-50"
                onClick={() => jumpToWorkspaceBlocker(blocker)}
              >
                <span className="truncate">{blocker.title}</span>
                <span className="ml-2 shrink-0 text-[10px] uppercase tracking-[0.08em] text-amber-800/80">
                  {blocker.workspace === 'capture' ? 'Erfassen' : blocker.workspace === 'review' ? 'Prüfen' : 'Abrechnen'}
                </span>
              </button>
            ))}
            {activeBlockers.length > topBlockers.length ? (
              <p className="text-[11px] text-amber-800/80">
                +{activeBlockers.length - topBlockers.length} weitere Blocker vorhanden.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {statusError ? (
        <ModuleTableCard icon={ClipboardList} label="Statuswechsel" title="Aktion nicht möglich" tone="emphasis" hasData>
          <p className="text-sm text-muted-foreground">{statusError}</p>
          <p className="mt-1 text-xs text-muted-foreground/90">
            Prüfe die Blocker im Bereich &quot;Prüfung&quot; und versuche die Aktion erneut.
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

      <section className={dashboardUiTokens.mainGrid}>
        <div
          id={`aufmass-workspace-panel-${activeWorkspace}`}
          role="tabpanel"
          aria-labelledby={`aufmass-workspace-tab-${activeWorkspace}`}
          tabIndex={-1}
          className="space-y-3"
        >
          {activeWorkspace === 'capture' ? (
            <ModuleTableCard
              icon={LayoutPanelTop}
              label="Erfassung"
              title={activeRoom ? `Arbeitsbereich · ${activeRoom.name}` : 'Arbeitsbereich'}
              className="relative border-border/70 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_30px_-20px_rgba(15,23,42,0.22)] transition-shadow duration-200 motion-reduce:transition-none"
              headerClassName="bg-white"
              headerContentClassName="items-start"
              bodyClassName="space-y-3 bg-white"
              action={quickCaptureHeaderTrigger}
              hasData
            >
              <div className="space-y-3">
                <div className="grid gap-3 grid-cols-1 lg:grid-cols-10">
                  <section className="space-y-2 lg:col-span-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Objektstruktur</p>
                    <RoomTreePanel rooms={record.rooms} activeRoomId={resolvedActiveRoomId} onSelectRoom={setActiveRoomId} />
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
              className="relative border-border/70 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_30px_-20px_rgba(15,23,42,0.22)] transition-shadow duration-200 motion-reduce:transition-none"
              headerClassName="bg-white"
              headerContentClassName="items-start"
              bodyClassName="space-y-3 bg-white"
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
              className="relative border-border/70 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_12px_30px_-20px_rgba(15,23,42,0.22)] transition-shadow duration-200 motion-reduce:transition-none"
              headerClassName="bg-white"
              headerContentClassName="items-start"
              bodyClassName="space-y-3 bg-white"
              hasData
            >
              <BillingPreviewCard
                record={record}
                canBill={canBill}
                billingBlockers={billingBlockers}
                onBill={() => setStatus('BILLED', 'Abrechnungsvorschau abgeschlossen.')}
                onJumpToBlocker={(blocker) => {
                  if (blocker.includes('freigegebene')) {
                    setActiveWorkspace('review');
                    return;
                  }
                  setActiveWorkspace('capture');
                }}
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

      <details className="rounded-lg border border-border/60 bg-sidebar/20 p-2.5">
        <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Telemetrie-Abschluss (lokal)
        </summary>
        <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
          <p>Tab-Wechsel: {telemetry.tabSwitches}</p>
          <p>Blocker-Sprünge: {telemetry.blockerJumps}</p>
          <p>Statusversuche: {telemetry.statusAttempts}</p>
          <p>Statuserfolge: {telemetry.statusSuccess}</p>
          <p>Schnellerfassungen: {telemetry.quickCaptures}</p>
          <p className="pt-1 text-foreground/80">
            Empfehlung:{' '}
            {telemetry.statusAttempts > 0 && telemetry.statusSuccess === telemetry.statusAttempts
              ? 'Rollout voll'
              : telemetry.statusSuccess > 0
                ? 'Rollout teilweise'
                : 'Nacharbeiten'}
          </p>
        </div>
      </details>
    </div>
  );
}
