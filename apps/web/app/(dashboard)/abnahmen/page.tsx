'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, ClipboardCheck, Network, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';

import { getAbnahmenKpiItems } from '@/components/abnahmen/abnahmen-kpi-strip';
import { AbnahmenListTable } from '@/components/abnahmen/abnahmen-list-table';
import { AbnahmenStatusBadge } from '@/components/abnahmen/abnahmen-status-badge';
import { CrossModulePortfolioContent } from '@/components/dashboard/cross-module-portfolio-card';
import {
  ModuleListHeaderControls,
  type ModuleListFilterToken,
} from '@/components/dashboard/module-list-header-controls';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Button } from '@/components/ui/button';
import { filterAbnahmen } from '@/lib/abnahmen/selectors';
import { getAbnahmenRecords } from '@/lib/abnahmen/mock-data';
import { getVerknuepfungPortfolioSnapshot } from '@/lib/auftragsabwicklung/cross-module-intelligence';
import type { AbnahmenFilters } from '@/lib/abnahmen/types';
import { cn } from '@/lib/utils';

export default function AbnahmenPage() {
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
  const records = useMemo(() => getAbnahmenRecords(), []);
  const [filters, setFilters] = useState<AbnahmenFilters>({
    query: initialQuery,
    status: 'ALL',
    onlyCritical: false,
    onlyOverdue: false,
  });
  const [filtersAdvancedOpen, setFiltersAdvancedOpen] = useState(false);
  const [activeContextPanel, setActiveContextPanel] = useState<'workflow' | 'datennetz'>('workflow');

  const filteredRecords = useMemo(() => filterAbnahmen(records, filters), [records, filters]);
  const handoffSuggestionId = searchParams.get('handoffSuggestionId') ?? undefined;
  const displayRecords = useMemo(() => {
    if (!handoffSuggestionId) return filteredRecords;
    return [...filteredRecords].sort((left, right) => {
      if (left.id === handoffSuggestionId) return -1;
      if (right.id === handoffSuggestionId) return 1;
      return 0;
    });
  }, [filteredRecords, handoffSuggestionId]);
  const portfolioSnapshot = useMemo(
    () => getVerknuepfungPortfolioSnapshot('ABNAHMEN', displayRecords.map((entry) => entry.id)),
    [displayRecords],
  );
  const kpiItems = useMemo(() => getAbnahmenKpiItems(records), [records]);
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
    filters.onlyCritical
      ? {
          key: 'onlyCritical',
          label: 'Nur kritisch',
          clear: () => setFilters((prev) => ({ ...prev, onlyCritical: false })),
        }
      : null,
    filters.onlyOverdue
      ? {
          key: 'onlyOverdue',
          label: 'Nur überfällig',
          clear: () => setFilters((prev) => ({ ...prev, onlyOverdue: false })),
        }
      : null,
  ].filter((token): token is ModuleListFilterToken => token !== null);

  const abnahmenQuickMode =
    filters.onlyCritical
      ? 'CRITICAL'
      : filters.status === 'DEFECTS_OPEN'
        ? 'DEFECTS_OPEN'
        : filters.status === 'ACCEPTED'
          ? 'ACCEPTED'
          : 'ALL';

  const setAbnahmenQuickMode = (mode: 'ALL' | 'DEFECTS_OPEN' | 'ACCEPTED' | 'CRITICAL') => {
    if (mode === 'CRITICAL') {
      setFilters((prev) => ({ ...prev, status: 'ALL', onlyCritical: true }));
      return;
    }
    setFilters((prev) => ({ ...prev, status: mode === 'ALL' ? 'ALL' : mode, onlyCritical: false }));
  };
  const filterDropdownContent = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Filter</p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            setFilters({
              query: '',
              status: 'ALL',
              onlyCritical: false,
              onlyOverdue: false,
            })
          }
          className="h-6 rounded-md px-1.5 text-[11px]"
        >
          <X className="h-3.5 w-3.5" />
          Zurücksetzen
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size="sm"
          variant={abnahmenQuickMode === 'ALL' ? 'default' : 'outline'}
          className="h-7 rounded-md px-2.5 text-xs"
          onClick={() => setAbnahmenQuickMode('ALL')}
        >
          Alle Abnahmen
        </Button>
        <Button
          size="sm"
          variant={abnahmenQuickMode === 'DEFECTS_OPEN' ? 'default' : 'outline'}
          className="h-7 rounded-md px-2.5 text-xs"
          onClick={() => setAbnahmenQuickMode('DEFECTS_OPEN')}
        >
          Mängel offen
        </Button>
        <Button
          size="sm"
          variant={abnahmenQuickMode === 'ACCEPTED' ? 'default' : 'outline'}
          className="h-7 rounded-md px-2.5 text-xs"
          onClick={() => setAbnahmenQuickMode('ACCEPTED')}
        >
          Abgenommen
        </Button>
        <Button
          size="sm"
          variant={abnahmenQuickMode === 'CRITICAL' ? 'default' : 'outline'}
          className="h-7 rounded-md px-2.5 text-xs"
          onClick={() => setAbnahmenQuickMode('CRITICAL')}
        >
          Nur kritisch
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
        <div className="space-y-2 rounded-lg border border-border bg-background p-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Erweiterte Filter
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={filters.status === 'REWORK_IN_PROGRESS' ? 'default' : 'outline'}
              onClick={() => setFilters((prev) => ({ ...prev, status: 'REWORK_IN_PROGRESS' }))}
            >
              Nacharbeit
            </Button>
            <Button
              size="sm"
              variant={filters.onlyOverdue ? 'default' : 'outline'}
              onClick={() => setFilters((prev) => ({ ...prev, onlyOverdue: !prev.onlyOverdue }))}
            >
              Nur überfällig
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2 rounded-lg border border-border bg-background p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={activeContextPanel === 'workflow' ? 'default' : 'outline'}
            className="h-7 rounded-md px-2.5 text-xs"
            onClick={() => setActiveContextPanel('workflow')}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
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

        {activeContextPanel === 'workflow' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Vorbereitung</span>
              <AbnahmenStatusBadge status="PREPARATION" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Mängel offen</span>
              <AbnahmenStatusBadge status="DEFECTS_OPEN" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Nacharbeit läuft</span>
              <AbnahmenStatusBadge status="REWORK_IN_PROGRESS" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Abnahme vorbehalten</span>
              <AbnahmenStatusBadge status="ACCEPTED_WITH_RESERVATION" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Abgenommen</span>
              <AbnahmenStatusBadge status="ACCEPTED" />
            </div>
          </div>
        ) : (
          <CrossModulePortfolioContent snapshot={portfolioSnapshot} />
        )}
      </div>
    </div>
  );

  return (
    <ModulePageTemplate
      title="Abnahmen & Mängel"
      description="Abnahmen dokumentieren, Mängel erfassen und Nacharbeit transparent verfolgen."
      actions={
        <Button size="sm">
          <ClipboardCheck className="h-4 w-4" />
          Neue Abnahme
        </Button>
      }
      kpis={kpiItems}
      topMessage={
        handoffFrom ? (
          <p className="text-sm text-muted-foreground">
            Kontext aus {handoffFrom} übernommen. Suchfilter wurde automatisch vorbelegt.
          </p>
        ) : undefined
      }
      mainContent={
        <ModuleTableCard
          icon={ClipboardCheck}
          label="Abnahmen"
          title="Vorgänge, Fristen und Mängelstände"
          titleClassName="max-w-[14rem] md:max-w-[16rem] lg:max-w-[18rem] truncate"
          hasData={displayRecords.length > 0}
          action={
            <div className="hidden md:block">
              <ModuleListHeaderControls
                query={filters.query}
                onQueryChange={(next) => setFilters((prev) => ({ ...prev, query: next }))}
                queryPlaceholder="Suche nach Nummer, Projekt, Kunde ..."
                queryAriaLabel="Abnahmesuche"
                searchContainerClassName="relative w-full md:w-64 lg:w-72 xl:w-80 md:max-w-[40vw] xl:max-w-[46vw]"
                showTokens={false}
                dropdownAriaLabel="Abnahmefilter öffnen"
                dropdownContent={filterDropdownContent}
              />
            </div>
          }
          headerBottomContent={
            <div className="space-y-2">
              <div className="md:hidden">
                <ModuleListHeaderControls
                  query={filters.query}
                  onQueryChange={(next) => setFilters((prev) => ({ ...prev, query: next }))}
                  queryPlaceholder="Suche nach Nummer, Projekt, Kunde ..."
                  queryAriaLabel="Abnahmesuche"
                  showTokens={false}
                  dropdownAriaLabel="Abnahmefilter öffnen"
                  dropdownContent={filterDropdownContent}
                />
              </div>
              <ModuleListHeaderControls
                query={filters.query}
                onQueryChange={(next) => setFilters((prev) => ({ ...prev, query: next }))}
                queryPlaceholder="Suche nach Nummer, Projekt, Kunde ..."
                queryAriaLabel="Abnahmesuche"
                showSearch={false}
                tokens={activeFilterTokens}
                onResetAll={() =>
                  setFilters({
                    query: '',
                    status: 'ALL',
                    onlyCritical: false,
                    onlyOverdue: false,
                  })
                }
              />
            </div>
          }
          emptyState={{
            icon: <ClipboardCheck className="h-8 w-8" />,
            title: 'Keine Abnahmen gefunden',
            description: 'Passe deine Filter an oder erstelle eine neue Abnahme.',
          }}
        >
          <AbnahmenListTable
            records={displayRecords}
            totalEntries={records.length}
            isSearchActive={filters.query.trim().length > 0}
            highlightedId={handoffSuggestionId}
          />
        </ModuleTableCard>
      }
    />
  );
}
