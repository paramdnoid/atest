'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Brain, ClipboardList, History, LayoutPanelTop, Sparkles } from 'lucide-react';

import { AngeboteApprovalDialog } from '@/components/angebote/angebote-approval-dialog';
import { AngeboteAuditTimeline } from '@/components/angebote/angebote-audit-timeline';
import { AngeboteDetailHeader } from '@/components/angebote/angebote-detail-header';
import { AngeboteIntelligencePanel } from '@/components/angebote/angebote-intelligence-panel';
import { AngeboteOptionBuilder } from '@/components/angebote/angebote-option-builder';
import { AngebotePositionTable } from '@/components/angebote/angebote-position-table';
import {
  DashboardTabs,
  getDashboardTabId,
  getDashboardTabPanelId,
} from '@/components/dashboard/dashboard-tabs';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { PageHeader } from '@/components/dashboard/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getQuoteRecordById, getQuoteRecords } from '@/lib/angebote/mock-data';
import { getQuoteTotals } from '@/lib/angebote/pricing';
import { angeboteRolloutFlags } from '@/lib/angebote/rollout-flags';
import { getTransitionBlockers, transitionQuoteStatus } from '@/lib/angebote/state-machine';
import type { QuoteAuditEvent, QuoteRecord, QuoteStatus } from '@/lib/angebote/types';

type TabKey = 'overview' | 'positions' | 'options' | 'approval' | 'insights' | 'history';

const tabs: Array<{ id: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Ueberblick', icon: LayoutPanelTop },
  { id: 'positions', label: 'Positionen', icon: ClipboardList },
  { id: 'options', label: 'Optionen', icon: Sparkles },
  { id: 'approval', label: 'Freigabe', icon: ClipboardList },
  { id: 'insights', label: 'Insights', icon: Brain },
  { id: 'history', label: 'Historie', icon: History },
];

function appendAudit(events: QuoteAuditEvent[], action: string, detail: string): QuoteAuditEvent[] {
  return [
    {
      id: crypto.randomUUID(),
      actor: 'UI Benutzer',
      action,
      detail,
      createdAt: new Date().toISOString(),
    },
    ...events,
  ];
}

function toReadableStatus(status: QuoteStatus): string {
  const labels: Record<QuoteStatus, string> = {
    DRAFT: 'Entwurf',
    READY_FOR_REVIEW: 'Pruefbereit',
    IN_APPROVAL: 'In Freigabe',
    APPROVED: 'Freigegeben',
    SENT: 'Versendet',
    CONVERTED_TO_ORDER: 'Zu Auftrag',
    ARCHIVED: 'Archiviert',
  };
  return labels[status];
}

export default function AngebotDetailPage() {
  const params = useParams<{ id: string }>();
  const allRecords = useMemo(() => getQuoteRecords(), []);
  const initial = useMemo(() => getQuoteRecordById(params.id), [params.id]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [record, setRecord] = useState<QuoteRecord | undefined>(initial);
  const [lastBlockers, setLastBlockers] = useState<string[]>([]);
  const detailSplitGridClassName = 'grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,1fr)]';

  if (!record) {
    notFound();
  }

  const totals = getQuoteTotals(record);

  const setStatus = (
    to: QuoteStatus,
    options?: {
      action?: string;
      detail?: string;
      mutate?: (next: QuoteRecord) => QuoteRecord;
    },
  ): boolean => {
    const result = transitionQuoteStatus(record, to);
    if (!result.ok) {
      setLastBlockers(result.blockers);
      return false;
    }
    setLastBlockers([]);
    setRecord((prev) =>
      prev
        ? (options?.mutate
            ? options.mutate({
                ...prev,
                status: to,
                updatedAt: new Date().toISOString(),
                auditTrail: appendAudit(
                  prev.auditTrail,
                  options.action ?? 'Statuswechsel',
                  options.detail ?? `${toReadableStatus(prev.status)} -> ${toReadableStatus(to)}`,
                ),
              })
            : {
                ...prev,
                status: to,
                updatedAt: new Date().toISOString(),
                auditTrail: appendAudit(
                  prev.auditTrail,
                  options?.action ?? 'Statuswechsel',
                  options?.detail ?? `${toReadableStatus(prev.status)} -> ${toReadableStatus(to)}`,
                ),
              })
        : prev,
    );
    return true;
  };

  const quickConvert = () => {
    setStatus('CONVERTED_TO_ORDER', {
      action: 'Quick Convert',
      detail: 'Angebot wurde in einen Auftrag konvertiert.',
      mutate: (next) => ({
        ...next,
        convertedOrderNumber:
          next.convertedOrderNumber ??
          `AUT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
      }),
    });
  };

  const onSelectOption = (optionId: string) => {
    setRecord((prev) =>
      prev
        ? {
            ...prev,
            selectedOptionId: optionId,
            updatedAt: new Date().toISOString(),
            auditTrail: appendAudit(prev.auditTrail, 'Option gesetzt', `Option ${optionId} wurde aktiviert.`),
          }
        : prev,
    );
  };

  const onApprove = (comment: string) => {
    setStatus('APPROVED', {
      action: 'Freigabeentscheidung',
      detail: comment || 'Freigabe ohne Kommentar',
      mutate: (next) => ({
        ...next,
        approvalSteps: next.approvalSteps.map((step, index) =>
          index === 0 ? { ...step, approvedAt: new Date().toISOString(), comment } : step,
        ),
      }),
    });
  };

  const onReturnToDraft = (comment: string) => {
    setStatus('DRAFT', {
      action: 'Rueckgabe an Entwurf',
      detail: comment || 'Ohne Kommentar',
      mutate: (next) => ({
        ...next,
        approvalSteps: next.approvalSteps.map((step, index) =>
          index === 0 ? { ...step, approvedAt: undefined, comment: undefined } : step,
        ),
      }),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Angebots-Workspace"
        description={`${record.number} · ${record.customerName}`}
        badge={
          <Badge variant="outline" className="font-mono text-xs">
            {record.tradeLabel}
          </Badge>
        }
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/angebote">Zurueck zur Liste</Link>
        </Button>
      </PageHeader>

      <AngeboteDetailHeader
        record={record}
        blockers={lastBlockers}
        onSetStatus={setStatus}
        onQuickConvert={quickConvert}
        quickConvertEnabled={angeboteRolloutFlags.enableQuickConvert}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <ModuleTableCard icon={LayoutPanelTop} label="Angebot" title="Netto" hasData>
          <p className="text-2xl font-semibold">{totals.totalNet.toFixed(2)} EUR</p>
        </ModuleTableCard>
        <ModuleTableCard icon={LayoutPanelTop} label="Marge" title="Profitabilitaet" hasData>
          <p className={totals.marginPercent < 18 ? 'text-2xl font-semibold text-amber-700' : 'text-2xl font-semibold text-emerald-700'}>
            {totals.marginPercent.toFixed(1)}%
          </p>
        </ModuleTableCard>
        <ModuleTableCard icon={LayoutPanelTop} label="Konvertierung" title="Auftrag" hasData>
          <p className="text-sm text-muted-foreground">
            {record.convertedOrderNumber ? `Konvertiert: ${record.convertedOrderNumber}` : 'Noch nicht konvertiert'}
          </p>
        </ModuleTableCard>
      </div>

      <DashboardTabs
        idPrefix="angebote"
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Angebotsbereiche"
      />

      {activeTab === 'overview' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('angebote', 'overview')}
          aria-labelledby={getDashboardTabId('angebote', 'overview')}
          tabIndex={0}
          className={detailSplitGridClassName}
        >
          <ModuleTableCard icon={ClipboardList} label="Kontext" title="Projektzusammenfassung" hasData>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Projekt:</span> {record.projectName}
              </p>
              <p>
                <span className="text-muted-foreground">Kunde:</span> {record.customerName}
              </p>
              <p>
                <span className="text-muted-foreground">Gueltig bis:</span>{' '}
                {new Date(record.validUntil).toLocaleDateString('de-DE')}
              </p>
              <p>
                <span className="text-muted-foreground">Notiz:</span> {record.note ?? 'Keine'}
              </p>
            </div>
          </ModuleTableCard>
          {angeboteRolloutFlags.enableIntelligence ? (
            <AngeboteIntelligencePanel record={record} allRecords={allRecords} />
          ) : (
            <ModuleTableCard icon={Brain} label="Intelligence" title="Feature deaktiviert" hasData>
              <p className="text-sm text-muted-foreground">
                `NEXT_PUBLIC_ANGEBOTE_INTELLIGENCE` ist deaktiviert.
              </p>
            </ModuleTableCard>
          )}
        </section>
      )}

      {activeTab === 'positions' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('angebote', 'positions')}
          aria-labelledby={getDashboardTabId('angebote', 'positions')}
          tabIndex={0}
        >
          <ModuleTableCard icon={ClipboardList} label="Leistung" title="Positionsverwaltung" hasData>
            <AngebotePositionTable
              positions={record.positions}
              onUpdatePositions={(positions) =>
                setRecord((prev) =>
                  prev
                    ? {
                        ...prev,
                        positions,
                        updatedAt: new Date().toISOString(),
                        auditTrail: appendAudit(prev.auditTrail, 'Positionen aktualisiert', 'Menge/Preis wurde angepasst.'),
                      }
                    : prev,
                )
              }
            />
          </ModuleTableCard>
        </section>
      )}

      {activeTab === 'options' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('angebote', 'options')}
          aria-labelledby={getDashboardTabId('angebote', 'options')}
          tabIndex={0}
        >
          <ModuleTableCard icon={Sparkles} label="Good Better Best" title="Option Builder" hasData={record.options.length > 0}>
            {angeboteRolloutFlags.enableOptionBuilder ? (
              <AngeboteOptionBuilder
                record={record}
                onSelectOption={(option) => onSelectOption(option.id)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                `NEXT_PUBLIC_ANGEBOTE_OPTION_BUILDER` ist deaktiviert.
              </p>
            )}
          </ModuleTableCard>
        </section>
      )}

      {activeTab === 'approval' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('angebote', 'approval')}
          aria-labelledby={getDashboardTabId('angebote', 'approval')}
          tabIndex={0}
          className={detailSplitGridClassName}
        >
          <AngeboteApprovalDialog onApprove={onApprove} onReturnToDraft={onReturnToDraft} />
          <ModuleTableCard icon={ClipboardList} label="Status-Guards" title="Freigaberegeln" hasData>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>- Mindestmarge fuer Freigabe: 18%</p>
              <p>- Option Good/Better/Best muss gesetzt sein</p>
              <p>- Gueltigkeit muss vorhanden sein</p>
              <p>- Konvertierung nur aus Status SENT</p>
              {getTransitionBlockers(record, 'APPROVED').map((blocker) => (
                <p key={blocker} className="text-amber-700">
                  - {blocker}
                </p>
              ))}
            </div>
          </ModuleTableCard>
        </section>
      )}

      {activeTab === 'insights' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('angebote', 'insights')}
          aria-labelledby={getDashboardTabId('angebote', 'insights')}
          tabIndex={0}
          className={detailSplitGridClassName}
        >
          {angeboteRolloutFlags.enableIntelligence ? (
            <AngeboteIntelligencePanel record={record} allRecords={allRecords} />
          ) : (
            <ModuleTableCard icon={Brain} label="Intelligence" title="Feature deaktiviert" hasData>
              <p className="text-sm text-muted-foreground">
                `NEXT_PUBLIC_ANGEBOTE_INTELLIGENCE` ist deaktiviert.
              </p>
            </ModuleTableCard>
          )}
          <ModuleTableCard icon={Brain} label="Benchmark" title="Empfohlene Aktionen" hasData>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>- Preise mit historischen Angeboten abgleichen</p>
              <p>- Fehlende Kernpositionen automatisch aus Vorlagen ergaenzen</p>
              <p>- Option mit bester Marge als Standard aktivieren</p>
            </div>
          </ModuleTableCard>
        </section>
      )}

      {activeTab === 'history' && (
        <section
          role="tabpanel"
          id={getDashboardTabPanelId('angebote', 'history')}
          aria-labelledby={getDashboardTabId('angebote', 'history')}
          tabIndex={0}
        >
          <ModuleTableCard icon={History} label="Audit" title="Nachvollziehbarkeit" hasData={record.auditTrail.length > 0}>
            <AngeboteAuditTimeline events={record.auditTrail} />
          </ModuleTableCard>
        </section>
      )}
    </div>
  );
}
