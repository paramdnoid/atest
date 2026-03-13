'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, Columns3, FileText, ListFilter, Network, PlusCircle, Workflow, X } from 'lucide-react';

import { AngeboteFilterPanel } from '@/components/angebote/angebote-filter-panel';
import { AngeboteKpiStrip } from '@/components/angebote/angebote-kpi-strip';
import {
  AngeboteListTable,
  AngeboteTableSortActions,
} from '@/components/angebote/angebote-list-table';
import { FormCheckbox } from '@/components/angebote/form-controls';
import { CrossModulePortfolioContent } from '@/components/dashboard/cross-module-portfolio-card';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleSideTabsCard } from '@/components/dashboard/module-side-tabs-card';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Button } from '@/components/ui/button';
import { getQuoteRecords } from '@/lib/angebote/mock-data';
import { applyQuoteSavedView, filterQuotes, getQuoteKpis } from '@/lib/angebote/selectors';
import { getVerknuepfungPortfolioSnapshot } from '@/lib/auftragsabwicklung/cross-module-intelligence';
import type { QuoteFilters, QuoteRecord, QuoteSavedViewId } from '@/lib/angebote/types';

const defaultFilters: QuoteFilters = {
  query: '',
  status: 'ALL',
  risk: 'ALL',
  owner: 'ALL',
  onlyExpiringSoon: false,
  sortBy: 'updatedAt',
  sortDirection: 'desc',
};

type TableColumn = 'customer' | 'project' | 'priority' | 'owner' | 'validUntil' | 'margin' | 'totalNet';

const allColumns: Array<{ id: TableColumn; label: string }> = [
  { id: 'customer', label: 'Kunde' },
  { id: 'project', label: 'Projekt' },
  { id: 'priority', label: 'Prioritaet' },
  { id: 'owner', label: 'Verantwortlich' },
  { id: 'validUntil', label: 'Gueltig bis' },
  { id: 'margin', label: 'Marge' },
  { id: 'totalNet', label: 'Netto' },
];

function appendAudit(record: QuoteRecord, detail: string): QuoteRecord {
  return {
    ...record,
    updatedAt: new Date().toISOString(),
    auditTrail: [
      {
        id: crypto.randomUUID(),
        actor: 'UI Benutzer',
        action: 'Listenaktion',
        detail,
        createdAt: new Date().toISOString(),
      },
      ...record.auditTrail,
    ],
  };
}

export default function AngebotePage() {
  const searchParams = useSearchParams();
  const [records, setRecords] = useState(() => getQuoteRecords());
  const [filters, setFilters] = useState<QuoteFilters>(defaultFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeSavedView, setActiveSavedView] = useState<QuoteSavedViewId | null>(null);
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [activeContextTab, setActiveContextTab] = useState<'steuerung' | 'workflow' | 'datennetz'>('steuerung');
  const [visibleColumns, setVisibleColumns] = useState<TableColumn[]>([
    'customer',
    'project',
    'priority',
    'owner',
    'validUntil',
    'margin',
    'totalNet',
  ]);

  const filteredRecords = useMemo(() => filterQuotes(records, filters), [filters, records]);
  const handoffSuggestionId = searchParams.get('handoffSuggestionId') ?? undefined;
  const displayRecords = useMemo(() => {
    if (!handoffSuggestionId) return filteredRecords;
    return [...filteredRecords].sort((left, right) => {
      if (left.id === handoffSuggestionId) return -1;
      if (right.id === handoffSuggestionId) return 1;
      return 0;
    });
  }, [filteredRecords, handoffSuggestionId]);
  const handoffFrom = searchParams.get('handoffFrom');
  const handoffQuery = [
    searchParams.get('handoffCustomer'),
    searchParams.get('handoffProject'),
    searchParams.get('handoffSite'),
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join(' ');
  const owners = useMemo(
    () => Array.from(new Set(records.map((record) => record.owner))).sort((a, b) => a.localeCompare(b)),
    [records],
  );
  const kpis = useMemo(() => getQuoteKpis(records), [records]);
  const portfolioSnapshot = useMemo(
    () => getVerknuepfungPortfolioSnapshot('ANGEBOTE', displayRecords.map((entry) => entry.id)),
    [displayRecords],
  );
  const columnPickerRef = useRef<HTMLDivElement | null>(null);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));
  };

  const setBatchStatusReadyForReview = () => {
    if (selectedIds.length === 0) return;
    setRecords((prev) =>
      prev.map((record) =>
        selectedIds.includes(record.id) ? appendAudit({ ...record, status: 'READY_FOR_REVIEW' }, 'Batch auf READY_FOR_REVIEW gesetzt') : record,
      ),
    );
    setSelectedIds([]);
  };

  const toggleColumn = (column: TableColumn) => {
    setVisibleColumns((prev) =>
      prev.includes(column) ? prev.filter((entry) => entry !== column) : [...prev, column],
    );
  };

  const toggleAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...displayRecords.map((record) => record.id)])));
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !displayRecords.some((record) => record.id === id)));
  };

  const handleFiltersChange = (next: QuoteFilters) => {
    setActiveSavedView(null);
    setFilters(next);
  };

  const activeFilterChips = [
    filters.status !== 'ALL' ? `Status: ${filters.status}` : null,
    filters.owner !== 'ALL' ? `Verantwortlich: ${filters.owner}` : null,
    filters.risk !== 'ALL' ? `Risiko: ${filters.risk}` : null,
    filters.onlyExpiringSoon ? 'Nur bald faellig' : null,
  ].filter(Boolean) as string[];

  const resetAllFilters = () => {
    setActiveSavedView(null);
    setFilters(defaultFilters);
  };

  useEffect(() => {
    if (!columnPickerOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!columnPickerRef.current) return;
      if (!columnPickerRef.current.contains(event.target as Node)) {
        setColumnPickerOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setColumnPickerOpen(false);
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onEscape);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onEscape);
    };
  }, [columnPickerOpen]);

  useEffect(() => {
    if (!handoffFrom || handoffQuery.trim().length === 0) return;
    setActiveSavedView(null);
    setFilters((prev) => (prev.query === handoffQuery ? prev : { ...prev, query: handoffQuery }));
  }, [handoffFrom, handoffQuery]);

  return (
    <ModulePageTemplate
      title="Angebote & Auftraege"
      description="Angebote, Auftraege und Positionen fuer Maler- und Tapezierarbeiten verwalten."
      mainGridClassName="lg:grid-cols-3"
      actions={
        <Button size="sm">
          <PlusCircle className="h-4 w-4" />
          Neues Angebot
        </Button>
      }
      kpis={[]}
      topMessage={
        <div className="space-y-2">
          <AngeboteKpiStrip kpis={kpis} />
          {handoffFrom ? (
            <p className="text-sm text-muted-foreground">
              Kontext aus {handoffFrom} übernommen. Suche wurde automatisch vorbelegt.
            </p>
          ) : null}
        </div>
      }
      mainContent={
        <div className="lg:col-span-2">
          <ModuleTableCard
            icon={FileText}
            label="Angebotspipeline"
            title="Angebotsliste mit Aktionen"
            hasData={displayRecords.length > 0}
            action={
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {displayRecords.length} Treffer · {selectedIds.length} markiert
                </span>
                {selectedIds.length > 0 ? (
                  <Button size="sm" className="min-w-43" onClick={setBatchStatusReadyForReview}>
                    <Workflow className="h-4 w-4" />
                    {selectedIds.length} zur Pruefung
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="min-w-43" disabled>
                    <Workflow className="h-4 w-4" />
                    Batch zur Pruefung
                  </Button>
                )}
              </div>
            }
            emptyState={{
              icon: <FileText className="h-8 w-8" />,
              title: 'Keine Angebote gefunden',
              description: 'Passe die Filter an oder lege ein neues Angebot an.',
            }}
          >
            {activeFilterChips.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {activeFilterChips.map((chip) => (
                  <Badge key={chip} variant="secondary" className="text-xs font-medium">
                    {chip}
                  </Badge>
                ))}
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={resetAllFilters}>
                  <X className="h-3.5 w-3.5" />
                  Alle Filter loeschen
                </Button>
              </div>
            )}
            <div className="mb-3 flex flex-wrap gap-2">
              <AngeboteTableSortActions
                onSortDirectionChange={(direction) => setFilters((prev) => ({ ...prev, sortDirection: direction }))}
              />
            </div>
            <AngeboteListTable
              records={displayRecords}
              allRecords={records}
              selectedIds={selectedIds}
              onToggleSelected={toggleSelected}
              onToggleAllVisible={toggleAllVisible}
              visibleColumns={visibleColumns}
              highlightedId={handoffSuggestionId}
            />
          </ModuleTableCard>
        </div>
      }
      sideContent={
        <div className="space-y-4 lg:col-span-1">
          <ModuleTableCard icon={ListFilter} label="Filter" title="Gespeicherte Ansichten" hasData tone="emphasis">
            <AngeboteFilterPanel
              filters={filters}
              owners={owners}
              onChange={handleFiltersChange}
              activeSavedView={activeSavedView}
              onApplySavedView={(viewId) => {
                setActiveSavedView(viewId);
                setFilters((prev) => applyQuoteSavedView(viewId, prev));
              }}
            />
          </ModuleTableCard>
          <ModuleSideTabsCard
            idPrefix="angebote-context"
            icon={Workflow}
            label="Kontext"
            title="Steuerung, Workflow und Datennetz"
            activeTab={activeContextTab}
            onTabChange={setActiveContextTab}
            ariaLabel="Angebote Kontextansicht"
            tabs={[
              {
                id: 'steuerung',
                label: 'Steuerung',
                icon: Columns3,
                content: (
                  <div ref={columnPickerRef} className="relative space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        {visibleColumns.length} von {allColumns.length} Spalten aktiv
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        aria-haspopup="dialog"
                        aria-expanded={columnPickerOpen}
                        onClick={() => setColumnPickerOpen((prev) => !prev)}
                      >
                        Spalten waehlen
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={selectedIds.length === 0}
                        onClick={setBatchStatusReadyForReview}
                      >
                        <Workflow className="h-4 w-4" />
                        Batch starten
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={resetAllFilters}>
                        <X className="h-3.5 w-3.5" />
                        Filter reset
                      </Button>
                    </div>
                    {columnPickerOpen && (
                      <div className="absolute right-0 z-50 mt-1 w-64 rounded-lg border border-border bg-card p-3 shadow-xl">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                            Sichtbare Spalten
                          </p>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => setVisibleColumns(allColumns.map((column) => column.id))}
                            >
                              Alle
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() =>
                                setVisibleColumns(['customer', 'project', 'priority', 'margin', 'totalNet'])
                              }
                            >
                              Standard
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {allColumns.map((column) => (
                            <label key={column.id} className="flex items-center gap-2 text-sm">
                              <FormCheckbox
                                checked={visibleColumns.includes(column.id)}
                                onChange={() => toggleColumn(column.id)}
                                ariaLabel={`Spalte ${column.label} anzeigen`}
                              />
                              {column.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ),
              },
              {
                id: 'workflow',
                label: 'Workflow',
                icon: Workflow,
                content: (
                  <div className="space-y-3 text-sm">
                    <div className="rounded-md border border-border/70 bg-background/60 px-3 py-2">
                      <p className="font-medium">1) Filtern & priorisieren</p>
                      <p className="text-xs text-muted-foreground">
                        Saved View waehlen und kritische Angebote nach Risiko/Marge fokussieren.
                      </p>
                    </div>
                    <div className="rounded-md border border-border/70 bg-background/60 px-3 py-2">
                      <p className="font-medium">2) Optionen sauber setzen</p>
                      <p className="text-xs text-muted-foreground">
                        Good/Better/Best pruefen und passende Variante pro Kunde aktivieren.
                      </p>
                    </div>
                    <div className="rounded-md border border-border/70 bg-background/60 px-3 py-2">
                      <p className="font-medium">3) In Freigabe ueberfuehren</p>
                      <p className="text-xs text-muted-foreground">
                        Markierte Angebote gesammelt zur Pruefung geben und Blocker abarbeiten.
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                id: 'datennetz',
                label: 'Datennetz',
                icon: Network,
                content: <CrossModulePortfolioContent snapshot={portfolioSnapshot} />,
              },
            ]}
          />
        </div>
      }
    />
  );
}
