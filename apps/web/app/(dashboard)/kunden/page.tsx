'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, ChevronDown, Network, PlusCircle, SlidersHorizontal, X } from 'lucide-react';

import { KundenFilterPanel } from '@/components/kunden/kunden-filter-panel';
import { getKundenKpiItems } from '@/components/kunden/kunden-kpi-strip';
import { KundenListTable } from '@/components/kunden/kunden-list-table';
import { CrossModulePortfolioContent } from '@/components/dashboard/cross-module-portfolio-card';
import {
  ModuleListHeaderControls,
  type ModuleListFilterToken,
} from '@/components/dashboard/module-list-header-controls';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Button } from '@/components/ui/button';
import { getKundenRecords } from '@/lib/kunden/mock-data';
import { applyKundenSavedView, filterKunden, getKundenKpis } from '@/lib/kunden/selectors';
import { getVerknuepfungPortfolioSnapshot } from '@/lib/auftragsabwicklung/cross-module-intelligence';
import type { KundenFilters, KundenSavedViewId } from '@/lib/kunden/types';
import { cn } from '@/lib/utils';

const defaultFilters: KundenFilters = {
  query: '',
  status: 'ALL',
  branche: 'ALL',
  region: 'ALL',
  owner: 'ALL',
  onlySlaRisk: false,
  onlyConsentMissing: false,
  sortBy: 'updatedAt',
  sortDirection: 'desc',
};

export default function KundenPage() {
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
  const [records] = useState(() => getKundenRecords());
  const [filters, setFilters] = useState<KundenFilters>({ ...defaultFilters, query: initialQuery });
  const [activeSavedView, setActiveSavedView] = useState<KundenSavedViewId | null>(null);
  const [filtersAdvancedOpen, setFiltersAdvancedOpen] = useState(false);
  const [activeContextPanel, setActiveContextPanel] = useState<'workflow' | 'datennetz'>('workflow');

  const filteredRecords = useMemo(() => filterKunden(records, filters), [records, filters]);
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
    () => getVerknuepfungPortfolioSnapshot('KUNDEN', displayRecords.map((entry) => entry.id)),
    [displayRecords],
  );
  const kpis = useMemo(() => getKundenKpis(records), [records]);
  const kpiItems = useMemo(() => getKundenKpiItems(kpis), [kpis]);
  const owners = useMemo(
    () => Array.from(new Set(records.map((record) => record.owner))).sort((a, b) => a.localeCompare(b)),
    [records],
  );
  const regions = useMemo(
    () => Array.from(new Set(records.map((record) => record.region))).sort((a, b) => a.localeCompare(b)),
    [records],
  );

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
    filters.region !== 'ALL'
      ? {
          key: 'region',
          label: `Region: ${filters.region}`,
          clear: () => setFilters((prev) => ({ ...prev, region: 'ALL' })),
        }
      : null,
    filters.onlySlaRisk
      ? {
          key: 'onlySlaRisk',
          label: 'SLA Risiko',
          clear: () => setFilters((prev) => ({ ...prev, onlySlaRisk: false })),
        }
      : null,
    filters.onlyConsentMissing
      ? {
          key: 'onlyConsentMissing',
          label: 'Consent offen',
          clear: () => setFilters((prev) => ({ ...prev, onlyConsentMissing: false })),
        }
      : null,
  ].filter((token): token is ModuleListFilterToken => token !== null);

  const contextualStats = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const withSlaRisk = filteredRecords.filter((record) =>
      record.reminders.some((reminder) => reminder.breachState !== 'ON_TRACK'),
    ).length;
    const withConsentGap = filteredRecords.filter((record) => record.consentState !== 'ERTEILT').length;
    const withDuplicateHint = filteredRecords.filter((record) =>
      record.duplicateCandidates.some((candidate) => candidate.resolution === 'OPEN'),
    ).length;
    const followUpThisWeek = filteredRecords.filter((record) => {
      if (!record.nextFollowUpAt) return false;
      const followUpAt = new Date(record.nextFollowUpAt);
      return followUpAt >= now && followUpAt <= sevenDaysFromNow;
    }).length;
    const activeCustomers = filteredRecords.filter((record) => record.status === 'AKTIV').length;

    return {
      withSlaRisk,
      withConsentGap,
      withDuplicateHint,
      followUpThisWeek,
      activeCustomers,
    };
  }, [filteredRecords]);

  const savedViewCounts = useMemo(() => {
    const viewIds: KundenSavedViewId[] = [
      'ALLE_AKTIVEN',
      'SLA_RISIKO',
      'CONSENT_OFFEN',
      'FOLLOWUP_DIESE_WOCHE',
    ];
    return viewIds.reduce<Record<KundenSavedViewId, number>>((acc, viewId) => {
      acc[viewId] = filterKunden(records, applyKundenSavedView(viewId, filters)).length;
      return acc;
    }, {
      ALLE_AKTIVEN: 0,
      SLA_RISIKO: 0,
      CONSENT_OFFEN: 0,
      FOLLOWUP_DIESE_WOCHE: 0,
    });
  }, [filters, records]);

  const recommendedViewId = useMemo<KundenSavedViewId | null>(() => {
    const candidates: Array<{ id: KundenSavedViewId; score: number }> = [
      { id: 'SLA_RISIKO', score: contextualStats.withSlaRisk * 3 + contextualStats.followUpThisWeek },
      { id: 'CONSENT_OFFEN', score: contextualStats.withConsentGap * 2 + contextualStats.withDuplicateHint },
      { id: 'FOLLOWUP_DIESE_WOCHE', score: contextualStats.followUpThisWeek * 2 },
      { id: 'ALLE_AKTIVEN', score: contextualStats.activeCustomers },
    ];
    const best = [...candidates].sort((left, right) => right.score - left.score)[0];
    if (!best || best.score <= 0) return null;
    return best.id;
  }, [contextualStats]);

  const workflowTasks = [
    {
      id: 'sla',
      text: `SLA-Risiko priorisieren und ueberfaellige Follow-ups zuerst abarbeiten (${contextualStats.withSlaRisk}).`,
      viewId: 'SLA_RISIKO' as const,
      disabled: contextualStats.withSlaRisk === 0,
    },
    {
      id: 'dup',
      text: `Duplikatverdacht pruefen und Stammdaten vereinheitlichen (${contextualStats.withDuplicateHint}).`,
      viewId: 'CONSENT_OFFEN' as const,
      disabled: contextualStats.withDuplicateHint === 0,
    },
    {
      id: 'consent',
      text: `Pro Kunde primaeren Ansprechpartner mit Consent sicherstellen (${contextualStats.withConsentGap}).`,
      viewId: 'CONSENT_OFFEN' as const,
      disabled: contextualStats.withConsentGap === 0,
    },
  ];

  const applySavedView = (viewId: KundenSavedViewId) => {
    setActiveSavedView(viewId);
    setFilters((prev) => applyKundenSavedView(viewId, prev));
    setActiveContextPanel(viewId === 'ALLE_AKTIVEN' ? 'datennetz' : 'workflow');
  };

  const kundenQuickMode =
    filters.onlySlaRisk ? 'SLA_RISIKO' : filters.onlyConsentMissing ? 'CONSENT_OFFEN' : filters.status === 'AKTIV' ? 'AKTIV' : 'ALL';

  const setKundenQuickMode = (mode: 'ALL' | 'AKTIV' | 'SLA_RISIKO' | 'CONSENT_OFFEN') => {
    setActiveSavedView(null);
    if (mode === 'SLA_RISIKO') {
      setFilters((prev) => ({ ...prev, status: 'ALL', onlySlaRisk: true, onlyConsentMissing: false }));
      return;
    }
    if (mode === 'CONSENT_OFFEN') {
      setFilters((prev) => ({ ...prev, status: 'ALL', onlySlaRisk: false, onlyConsentMissing: true }));
      return;
    }
    setFilters((prev) => ({
      ...prev,
      status: mode === 'AKTIV' ? 'AKTIV' : 'ALL',
      onlySlaRisk: false,
      onlyConsentMissing: false,
    }));
  };

  const resetAllFilters = () => {
    setActiveSavedView(null);
    setFilters(defaultFilters);
  };

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
          variant={kundenQuickMode === 'ALL' ? 'default' : 'outline'}
          className="h-7 rounded-md px-2.5 text-xs"
          onClick={() => setKundenQuickMode('ALL')}
        >
          Alle Kunden
        </Button>
        <Button
          size="sm"
          variant={kundenQuickMode === 'AKTIV' ? 'default' : 'outline'}
          className="h-7 rounded-md px-2.5 text-xs"
          onClick={() => setKundenQuickMode('AKTIV')}
        >
          Aktiv
        </Button>
        <Button
          size="sm"
          variant={kundenQuickMode === 'SLA_RISIKO' ? 'default' : 'outline'}
          className="h-7 rounded-md px-2.5 text-xs"
          onClick={() => setKundenQuickMode('SLA_RISIKO')}
        >
          SLA Risiko
        </Button>
        <Button
          size="sm"
          variant={kundenQuickMode === 'CONSENT_OFFEN' ? 'default' : 'outline'}
          className="h-7 rounded-md px-2.5 text-xs"
          onClick={() => setKundenQuickMode('CONSENT_OFFEN')}
        >
          Consent offen
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
          <KundenFilterPanel
            filters={filters}
            owners={owners}
            regions={regions}
            activeSavedView={activeSavedView}
            savedViewCounts={savedViewCounts}
            recommendedViewId={recommendedViewId}
            onApplySavedView={applySavedView}
            onChange={(next) => {
              setActiveSavedView(null);
              setFilters(next);
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
            variant={activeContextPanel === 'workflow' ? 'default' : 'outline'}
            className="h-7 rounded-md px-2.5 text-xs"
            onClick={() => setActiveContextPanel('workflow')}
          >
            Arbeitsweise
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
          <div className="space-y-2 text-sm">
            {workflowTasks.map((task, index) => (
              <div
                key={task.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-background/60 px-3 py-2"
              >
                <p className="text-sm">
                  {index + 1}) {task.text}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  disabled={task.disabled}
                  onClick={() => applySavedView(task.viewId)}
                >
                  Jetzt filtern
                </Button>
              </div>
            ))}
            {recommendedViewId ? (
              <div className="rounded-md border border-border/70 bg-muted/35 px-3 py-2 text-xs text-foreground/85">
                Empfehlung aus Facets: Fokus auf{' '}
                <button
                  type="button"
                  className="font-semibold underline underline-offset-2 text-foreground"
                  onClick={() => applySavedView(recommendedViewId)}
                >
                  {recommendedViewId.replaceAll('_', ' ')}
                </button>
                .
              </div>
            ) : null}
          </div>
        ) : (
          <CrossModulePortfolioContent snapshot={portfolioSnapshot} />
        )}
      </div>
    </div>
  );

  return (
    <ModulePageTemplate
      title="Kunden & Objekte"
      description="Kundenstammdaten, Objekte und Ansprechpartner fuer Folgeauftraege organisieren."
      compact
      actions={
        <Button size="sm">
          <PlusCircle className="h-4 w-4" />
          Neuer Kunde
        </Button>
      }
      kpis={kpiItems}
      topMessage={
        handoffFrom ? (
          <p className="text-sm text-muted-foreground">
            Kontext aus {handoffFrom} übernommen. Suche wurde automatisch vorbelegt.
          </p>
        ) : null
      }
      mainContent={
        <ModuleTableCard
          icon={Building2}
          label="Kundenportfolio"
          title="Kundenliste mit Folgeauftragsfokus"
          hasData={displayRecords.length > 0}
          action={
            <div className="hidden md:block">
              <ModuleListHeaderControls
                query={filters.query}
                onQueryChange={(next) => {
                  setActiveSavedView(null);
                  setFilters((prev) => ({ ...prev, query: next }));
                }}
                queryPlaceholder="Suche nach Kunde, Objekt, Kontakt ..."
                queryAriaLabel="Kundensuche"
                searchContainerClassName="relative w-full md:w-64 lg:w-72 xl:w-80 md:max-w-[40vw] xl:max-w-[46vw]"
                showTokens={false}
                dropdownAriaLabel="Kundenfilter öffnen"
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
                  queryPlaceholder="Suche nach Kunde, Objekt, Kontakt ..."
                  queryAriaLabel="Kundensuche"
                  showTokens={false}
                  dropdownAriaLabel="Kundenfilter öffnen"
                  dropdownContent={dropdownContent}
                />
              </div>
              <ModuleListHeaderControls
                query={filters.query}
                onQueryChange={(next) => {
                  setActiveSavedView(null);
                  setFilters((prev) => ({ ...prev, query: next }));
                }}
                queryPlaceholder="Suche nach Kunde, Objekt, Kontakt ..."
                queryAriaLabel="Kundensuche"
                showSearch={false}
                tokens={activeFilterTokens}
                onResetAll={resetAllFilters}
              />
            </div>
          }
          emptyState={{
            icon: <Building2 className="h-8 w-8" />,
            title: 'Keine Kunden gefunden',
            description: 'Passe die Filter an oder lege einen neuen Kunden an.',
          }}
        >
          <KundenListTable
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
