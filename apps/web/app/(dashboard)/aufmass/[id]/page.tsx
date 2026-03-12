'use client';

import { useMemo, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Brain, ClipboardList, FileSpreadsheet, History, LayoutPanelTop } from 'lucide-react';

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
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { EmptyState } from '@/components/dashboard/states';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAufmassRecordById, getAufmassRecords } from '@/lib/aufmass/mock-data';
import { aufmassRolloutFlags } from '@/lib/aufmass/rollout-flags';
import { getTransitionBlockers, transitionRecordStatus } from '@/lib/aufmass/state-machine';
import { getRecordOvermeasureIssues } from '@/lib/aufmass/selectors';
import { migrateLegacyFormula } from '@/lib/aufmass/formula-builder';
import { getIntelligenceSnapshot } from '@/lib/aufmass/intelligence';
import type { AufmassAuditEvent, AufmassMeasurement, AufmassReviewIssue, AufmassStatus } from '@/lib/aufmass/types';

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

function getTabId(id: TabKey): string {
  return `aufmass-tab-${id}`;
}

function getPanelId(id: TabKey): string {
  return `aufmass-tabpanel-${id}`;
}

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
  const allRecords = useMemo(() => getAufmassRecords(), []);
  const initial = useMemo(() => getAufmassRecordById(params.id), [params.id]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const [record, setRecord] = useState(initial);
  const [activeRoomId, setActiveRoomId] = useState(initial?.rooms[0]?.id);

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
  const legacyMigrationIssues: AufmassReviewIssue[] = [];
  if (aufmassRolloutFlags.enableAssistedMigration) {
    for (const measurement of record.measurements) {
      if (measurement.formulaAst || measurement.formula.trim().length === 0) continue;
      const migration = migrateLegacyFormula(measurement.formula);
      if (migration.status === 'migrated_confident') continue;
      legacyMigrationIssues.push({
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
        createdAt: new Date().toISOString(),
      });
    }
  }
  const reviewIssues = [...getRecordOvermeasureIssues(record), ...legacyMigrationIssues];
  const reviewBlockers = getTransitionBlockers(record, 'APPROVED');
  const intelligenceSnapshot = useMemo(
    () => getIntelligenceSnapshot(record, allRecords),
    [record, allRecords],
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
  const submitReviewBlockers = getTransitionBlockers(record, 'IN_REVIEW');
  const canSubmitReview = record.status === 'DRAFT' && submitReviewBlockers.length === 0;
  const canApprove = record.status === 'IN_REVIEW' && effectiveReviewBlockers.length === 0;
  const canBill = record.status === 'APPROVED' && getTransitionBlockers(record, 'BILLED').length === 0;

  const setStatus = (to: AufmassStatus, detail: string) => {
    const result = transitionRecordStatus(record, to);
    if (!result.ok) return;
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
    setRecord((prev) =>
      prev
        ? {
            ...prev,
            reviewIssues: prev.reviewIssues.filter((issue) => issue.severity !== 'blocking'),
            auditTrail: appendAudit(
              prev.auditTrail,
              'Freigabe',
              comment || 'Freigabe ohne Zusatzkommentar',
            ),
          }
        : prev,
    );
    setStatus('APPROVED', 'Freigabe aus Prüfworkflow gesetzt.');
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
  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
      setActiveTab(tabs[nextIndex].id);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setActiveTab(tabs[0].id);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      setActiveTab(tabs[tabs.length - 1].id);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aufmaß Workspace"
        description={`${record.number} · ${record.customerName}`}
        badge={
          <Badge variant="outline" className="font-mono text-xs">
            v{record.version}
          </Badge>
        }
      >
        <ApprovalDialog
          currentStatus={record.status}
          onApprove={onApprove}
          onReturnToDraft={onReturnToDraft}
        />
      </PageHeader>

      <AufmassDetailHeader
        record={record}
        blockers={record.status === 'IN_REVIEW' ? effectiveReviewBlockers : submitReviewBlockers}
        canSubmitReview={canSubmitReview}
        canApprove={canApprove}
        canBill={canBill}
        onSubmitForReview={() => setStatus('IN_REVIEW', 'Zur Prüfung übergeben.')}
        onApprove={() => onApprove('Freigabe über Header-Aktion')}
        onBill={() => setStatus('BILLED', 'Abrechnungsvorschau abgeschlossen.')}
      />

      <AufmassKpiStrip record={record} />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Aufmassbereiche">
        {tabs.map((tab) => {
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
              onKeyDown={(event) => onTabKeyDown(event, tabs.findIndex((entry) => entry.id === tab.id))}
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
          <RoomTreePanel rooms={record.rooms} activeRoomId={activeRoomId} onSelectRoom={setActiveRoomId} />
          <ModuleTableCard icon={LayoutPanelTop} label="Baustelle" title="Quick-Capture">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Schnellerfassung für Baustelle mit reduzierter Eingabe und optionalen Fotos.
              </p>
              <QuickCaptureDrawer room={activeRoom} positions={record.positions} onAddMeasurement={onAddMeasurement} />
            </div>
          </ModuleTableCard>
          <MeasurementGrid room={activeRoom} measurements={record.measurements} positions={record.positions} />
          <AufmassIntelligencePanel record={record} allRecords={allRecords} />
        </section>
      )}

      {activeTab === 'rooms' && (
        <section
          role="tabpanel"
          id={getPanelId('rooms')}
          aria-labelledby={getTabId('rooms')}
          tabIndex={0}
          className="grid gap-4 lg:grid-cols-2"
        >
          <RoomTreePanel rooms={record.rooms} activeRoomId={activeRoomId} onSelectRoom={setActiveRoomId} />
          <MeasurementGrid room={activeRoom} measurements={record.measurements} positions={record.positions} />
        </section>
      )}

      {activeTab === 'positions' && (
        <section role="tabpanel" id={getPanelId('positions')} aria-labelledby={getTabId('positions')} tabIndex={0}>
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
          id={getPanelId('review')}
          aria-labelledby={getTabId('review')}
          tabIndex={0}
          className="grid gap-4 lg:grid-cols-2"
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
        <section role="tabpanel" id={getPanelId('billing')} aria-labelledby={getTabId('billing')} tabIndex={0}>
          <BillingPreviewCard record={record} />
        </section>
      )}

      {activeTab === 'insights' && (
        <section
          role="tabpanel"
          id={getPanelId('insights')}
          aria-labelledby={getTabId('insights')}
          tabIndex={0}
          className="grid gap-4 lg:grid-cols-2"
        >
          <AufmassIntelligencePanel record={record} allRecords={allRecords} />
          <ReviewDiffPanel issues={reviewIssues} />
        </section>
      )}

      {activeTab === 'history' && (
        <section role="tabpanel" id={getPanelId('history')} aria-labelledby={getTabId('history')} tabIndex={0}>
          <AuditTimeline events={record.auditTrail} />
        </section>
      )}
    </div>
  );
}
