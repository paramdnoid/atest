'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, Columns3, FileText, Network, PlusCircle, SlidersHorizontal, Workflow, X } from 'lucide-react';

import { AngeboteFilterPanel } from '@/components/angebote/angebote-filter-panel';
import { AngeboteKpiStrip } from '@/components/angebote/angebote-kpi-strip';
import { AngeboteListTable } from '@/components/angebote/angebote-list-table';
import { FormCheckbox } from '@/components/angebote/form-controls';
import { CrossModulePortfolioContent } from '@/components/dashboard/cross-module-portfolio-card';
import {
  ModuleListHeaderControls,
  type ModuleListFilterToken,
} from '@/components/dashboard/module-list-header-controls';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Button } from '@/components/ui/button';
import { getQuoteRecords } from '@/lib/angebote/mock-data';
import { applyQuoteSavedView, filterQuotes, getQuoteKpis } from '@/lib/angebote/selectors';
import { getVerknuepfungPortfolioSnapshot } from '@/lib/auftragsabwicklung/cross-module-intelligence';
import type { QuoteFilters, QuoteRecord, QuoteSavedViewId } from '@/lib/angebote/types';
import { cn } from '@/lib/utils';

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
  const handoffFrom = searchParams.get('handoffFrom');
  const handoffQuery = [
    searchParams.get('handoffCustomer'),
    searchParams.get('handoffProject'),
    searchParams.get('handoffSite'),
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join(' ');
  const initialQuery = handoffFrom && handoffQuery.trim().length > 0 ? handoffQuery : '';
  const [records, setRecords] = useState(() => getQuoteRecords());
  const [filters, setFilters] = useState<QuoteFilters>({ ...defaultFilters, query: initialQuery });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeSavedView, setActiveSavedView] = useState<QuoteSavedViewId | null>(null);
  const [filtersAdvancedOpen, setFiltersAdvancedOpen] = useState(false);
  const [activeContextPanel, setActiveContextPanel] = useState<'steuerung' | 'workflow' | 'datennetz'>('steuerung');
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
  const owners = useMemo(
    () => Array.from(new Set(records.map((record) => record.owner))).sort((a, b) => a.localeCompare(b)),
    [records],
  );
  const kpis = useMemo(() => getQuoteKpis(records), [records]);
  const portfolioSnapshot = useMemo(
    () => getVerknuepfungPortfolioSnapshot('ANGEBOTE', displayRecords.map((entry) => entry.id)),
    [displayRecords],
  );

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

  const toggleAllVisible = (checked: boolean, visibleIds: string[]) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
  };

  const handleFiltersChange = (next: QuoteFilters) => {
    setActiveSavedView(null);
    setFilters(next);
  };

  const resetAllFilters = () => {
    setActiveSavedView(null);
    setFilters(defaultFilters);
  };

  const angeboteQuickMode =
    filters.risk === 'HIGH'
      ? 'MARGIN_RISK'
      : filters.status === 'IN_APPROVAL'
        ? 'IN_APPROVAL'
        : filters.status === 'READY_FOR_REVIEW'
          ? 'READY_FOR_REVIEW'
          : 'ALL';

  const setAngeboteQuickMode = (
    mode: 'ALL' | 'READY_FOR_REVIEW' | 'IN_APPROVAL' | 'MARGIN_RISK',
  ) => {
    if (mode === 'MARGIN_RISK') {
      setActiveSavedView(null);
      setFilters((prev) => ({ ...prev, risk: 'HIGH', status: 'ALL' }));
      return;
    }
    setActiveSavedView(null);
    setFilters((prev) => ({ ...prev, status: mode === 'ALL' ? 'ALL' : mode, risk: 'ALL' }));
  };

  const activeFilterTokens: ModuleListFilterToken[] = [
    filters.query.trim().length > 0
      ? {
          key: 'query',
          label: `Suche: ${filters.query}`,
          clear: () => setFilters((prev) => ({ ...prev, query: '' })),
        }
      : null,
    filters.status !== 'ALL'
      ? {
          key: 'status',
          label: `Status: ${filters.status}`,
          clear: () => setFilters((prev) => ({ ...prev, status: 'ALL' })),
        }
      : null,
    filters.owner !== 'ALL'
      ? {
          key: 'owner',
          label: `Verantwortlich: ${filters.owner}`,
          clear: () => setFilters((prev) => ({ ...prev, owner: 'ALL' })),
        }
      : null,
    filters.risk !== 'ALL'
      ? {
          key: 'risk',
          label: `Risiko: ${filters.risk}`,
          clear: () => setFilters((prev) => ({ ...prev, risk: 'ALL' })),
        }
      : null,
    filters.onlyExpiringSoon
      ? {
          key: 'onlyExpiringSoon',
          label: 'Nur bald faellig',
          clear: () => setFilters((prev) => ({ ...prev, onlyExpiringSoon: false })),
        }
      : null,
  ].filter((token): token is ModuleListFilterToken => token !== null);

  const dropdownContent = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Filter</p>
        <Button
          size="sm"
          variant="ghost"
          onClick={resetAllFilters}
          className="h-6 rounded-md px-1.5 text-[11px]"
        >
          <X className="h-3.5 w-3.5" />
          Zurücksetzen
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant={angeboteQuickMode === 'ALL' ? 'default' : 'outline'}
          className="h-7 rounded-md px-2.5 text-xs"
          onClick={() => setAngeboteQuickMode('ALL')}
        >
          Alle Angebote
        </Button>
        <Button
          size="sm"
          variant={angeboteQuickMode === 'READY_FOR_REVIEW' ? 'default' : 'outline'}
          className="h-7 rounded-md px-2.5 text-xs"
          onClick={() => setAngeboteQuickMode('READY_FOR_REVIEW')}
        >
          Zur Prüfung
        </Button>
        <Button
          size="sm"
          variant={angeboteQuickMode === 'IN_APPROVAL' ? 'default' : 'outline'}
          className="h-7 rounded-md px-2.5 text-xs"
          onClick={() => setAngeboteQuickMode('IN_APPROVAL')}
        >
          In Freigabe
        </Button>
        <Button
          size="sm"
          variant={angeboteQuickMode === 'MARGIN_RISK' ? 'default' : 'outline'}
          className="h-7 rounded-md px-2.5 text-xs"
          onClick={() => setAngeboteQuickMode('MARGIN_RISK')}
        >
          Marge kritisch
        </Button>
      </div>

      <Button
        size="sm"
        variant="ghost"
        className="h-7 rounded-md px-2 text-xs"
        onClick={() => setFiltersAdvancedOpen((prev) => !prev)}
        aria-expanded={filtersAdvancedOpen}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Weitere Filter
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', filtersAdvancedOpen && 'rotate-180')} />
      </Button>

      {filtersAdvancedOpen ? (
        <div className="space-y-3 rounded-lg border border-border bg-background p-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Erweiterte Filter
          </p>
          <AngeboteFilterPanel
            filters={filters}
            owners={owners}
            onChange={handleFiltersChange}
            activeSavedView={activeSavedView}
            onApplySavedView={(viewId) => {
              setActiveSavedView(viewId);
              setFilters((prev) => applyQuoteSavedView(viewId, prev));
            }}
            hideSearch
            compact
          />
        </div>
      ) : null}

      <div className="space-y-2 rounded-lg border border-border bg-background p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={activeContextPanel === 'steuerung' ? 'default' : 'outline'}
            className="h-7 rounded-md px-2.5 text-xs"
            onClick={() => setActiveContextPanel('steuerung')}
          >
            <Columns3 className="h-3.5 w-3.5" />
            Steuerung
          </Button>
          <Button
            size="sm"
            variant={activeContextPanel === 'workflow' ? 'default' : 'outline'}
            className="h-7 rounded-md px-2.5 text-xs"
            onClick={() => setActiveContextPanel('workflow')}
          >
            <Workflow className="h-3.5 w-3.5" />
            Workflow
          </Button>
          <Button
            size="sm"
            variant={activeContextPanel === 'datennetz' ? 'default' : 'outline'}
            className="h-7 rounded-md px-2.5 text-xs"
            onClick={() => setActiveContextPanel('datennetz')}
          >
            <Network className="h-3.5 w-3.5" />
            Datennetz
          </Button>
        </div>

        {activeContextPanel === 'steuerung' ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {visibleColumns.length} von {allColumns.length} Spalten aktiv
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => setVisibleColumns(allColumns.map((column) => column.id))}
              >
                Alle
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() =>
                  setVisibleColumns(['customer', 'project', 'priority', 'margin', 'totalNet'])
                }
              >
                Standard
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
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
        ) : null}

        {activeContextPanel === 'workflow' ? (
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
        ) : null}

        {activeContextPanel === 'datennetz' ? (
          <CrossModulePortfolioContent snapshot={portfolioSnapshot} />
        ) : null}
      </div>
    </div>
  );

  return (
    <ModulePageTemplate
      title="Angebote & Auftraege"
      description="Angebote, Auftraege und Positionen fuer Maler- und Tapezierarbeiten verwalten."
      actions={
        <Button size="sm">
          <PlusCircle className="h-4 w-4" />
          Neues Angebot
        </Button>
      }
      kpis={[]}
      mainTopContent={
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
        <ModuleTableCard
          icon={FileText}
          label="Angebotspipeline"
          title="Angebotsliste mit Aktionen"
          hasData={displayRecords.length > 0}
          action={
            <div className="hidden md:block">
              <ModuleListHeaderControls
                query={filters.query}
                onQueryChange={(next) => {
                  setActiveSavedView(null);
                  setFilters((prev) => ({ ...prev, query: next }));
                }}
                queryPlaceholder="Suche nach Nummer, Kunde, Projekt ..."
                queryAriaLabel="Angebotssuche"
                searchContainerClassName="relative w-full md:w-64 lg:w-72 xl:w-80 md:max-w-[40vw] xl:max-w-[46vw]"
                showTokens={false}
                dropdownAriaLabel="Angebotsfilter öffnen"
                dropdownContent={dropdownContent}
              />
            </div>
          }
          headerBottomContent={
            <div className="space-y-2">
              <div className="md:hidden">
                <ModuleListHeaderControls
                  query={filters.query}
                  onQueryChange={(next) => {
                    setActiveSavedView(null);
                    setFilters((prev) => ({ ...prev, query: next }));
                  }}
                  queryPlaceholder="Suche nach Nummer, Kunde, Projekt ..."
                  queryAriaLabel="Angebotssuche"
                  showTokens={false}
                  dropdownAriaLabel="Angebotsfilter öffnen"
                  dropdownContent={dropdownContent}
                />
              </div>
              <ModuleListHeaderControls
                query={filters.query}
                onQueryChange={(next) => {
                  setActiveSavedView(null);
                  setFilters((prev) => ({ ...prev, query: next }));
                }}
                queryPlaceholder="Suche nach Nummer, Kunde, Projekt ..."
                queryAriaLabel="Angebotssuche"
                showSearch={false}
                tokens={activeFilterTokens}
                onResetAll={resetAllFilters}
              />
            </div>
          }
          emptyState={{
            icon: <FileText className="h-8 w-8" />,
            title: 'Keine Angebote gefunden',
            description: 'Passe die Filter an oder lege ein neues Angebot an.',
          }}
        >
          <AngeboteListTable
            records={displayRecords}
            totalEntries={records.length}
            isSearchActive={filters.query.trim().length > 0}
            selectedIds={selectedIds}
            onToggleSelected={toggleSelected}
            onToggleAllVisible={toggleAllVisible}
            onRunBatchReadyForReview={setBatchStatusReadyForReview}
            visibleColumns={visibleColumns}
            highlightedId={handoffSuggestionId}
          />
        </ModuleTableCard>
      }
    />
  );
}
