'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, ListFilter, Network, PlusCircle, Search, X } from 'lucide-react';

import { KundenFilterPanel } from '@/components/kunden/kunden-filter-panel';
import { getKundenKpiItems } from '@/components/kunden/kunden-kpi-strip';
import { KundenListTable } from '@/components/kunden/kunden-list-table';
import { CrossModulePortfolioContent } from '@/components/dashboard/cross-module-portfolio-card';
import { SidebarKpiGrid } from '@/components/dashboard/kpi-strip';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleSideTabsCard } from '@/components/dashboard/module-side-tabs-card';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getKundenRecords } from '@/lib/kunden/mock-data';
import { applyKundenSavedView, filterKunden, getKundenKpis } from '@/lib/kunden/selectors';
import { getVerknuepfungPortfolioSnapshot } from '@/lib/auftragsabwicklung/cross-module-intelligence';
import type { KundenFilters, KundenSavedViewId } from '@/lib/kunden/types';

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
  const [records] = useState(() => getKundenRecords());
  const [filters, setFilters] = useState<KundenFilters>(defaultFilters);
  const [activeSavedView, setActiveSavedView] = useState<KundenSavedViewId | null>(null);
  const [activeContextTab, setActiveContextTab] = useState<'filter' | 'workflow' | 'datennetz'>('filter');
  const handoffFrom = searchParams.get('handoffFrom');
  const handoffQuery = [
    searchParams.get('handoffCustomer'),
    searchParams.get('handoffProject'),
    searchParams.get('handoffSite'),
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join(' ');

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

  const activeFilterChips = [
    filters.status !== 'ALL' ? `Status: ${filters.status}` : null,
    filters.owner !== 'ALL' ? `Verantwortlich: ${filters.owner}` : null,
    filters.region !== 'ALL' ? `Region: ${filters.region}` : null,
    filters.onlySlaRisk ? 'SLA Risiko' : null,
    filters.onlyConsentMissing ? 'Consent offen' : null,
  ].filter(Boolean) as string[];

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
    setActiveContextTab(viewId === 'ALLE_AKTIVEN' ? 'datennetz' : 'workflow');
  };

  useEffect(() => {
    if (!handoffFrom || handoffQuery.trim().length === 0) return;
    setActiveSavedView(null);
    setFilters((prev) => (prev.query === handoffQuery ? prev : { ...prev, query: handoffQuery }));
  }, [handoffFrom, handoffQuery]);

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
      kpis={[]}
      sideTopContent={<SidebarKpiGrid items={kpiItems} />}
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
            <span className="text-sm font-medium text-muted-foreground">{displayRecords.length} Treffer</span>
          }
          emptyState={{
            icon: <Building2 className="h-8 w-8" />,
            title: 'Keine Kunden gefunden',
            description: 'Passe die Filter an oder lege einen neuen Kunden an.',
          }}
        >
          {activeFilterChips.length > 0 ? (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {activeFilterChips.map((chip) => (
                <Badge key={chip} variant="secondary" className="text-xs font-medium">
                  {chip}
                </Badge>
              ))}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setActiveSavedView(null);
                  setFilters(defaultFilters);
                }}
              >
                <X className="h-3.5 w-3.5" />
                Alle Filter loeschen
              </Button>
            </div>
          ) : null}
          <KundenListTable records={displayRecords} highlightedId={handoffSuggestionId} />
        </ModuleTableCard>
      }
      sideContent={
        <ModuleSideTabsCard
          idPrefix="kunden-context"
          icon={ListFilter}
          label="Steuerung"
          title="Filter, Arbeitsweise und Datennetz"
          activeTab={activeContextTab}
          onTabChange={setActiveContextTab}
          ariaLabel="Kunden Kontextansicht"
          tabs={[
            {
              id: 'filter',
              label: 'Filter',
              icon: ListFilter,
              content: (
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
                />
              ),
            },
            {
              id: 'workflow',
              label: 'Arbeitsweise',
              icon: Search,
              badge: (
                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {contextualStats.withSlaRisk + contextualStats.withConsentGap}
                </span>
              ),
              content: (
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
                    <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
                      Empfehlung aus Facets: Fokus auf{' '}
                      <button
                        type="button"
                        className="font-semibold underline underline-offset-2"
                        onClick={() => applySavedView(recommendedViewId)}
                      >
                        {recommendedViewId.replaceAll('_', ' ')}
                      </button>
                      .
                    </div>
                  ) : null}
                </div>
              ),
            },
            {
              id: 'datennetz',
              label: 'Datennetz',
              icon: Network,
              badge: (
                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  {portfolioSnapshot.weakLinks}
                </span>
              ),
              content: <CrossModulePortfolioContent snapshot={portfolioSnapshot} />,
            },
          ]}
        />
      }
    />
  );
}
