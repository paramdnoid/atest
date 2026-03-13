'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, ListFilter, Network, PlusCircle, Search, X } from 'lucide-react';

import { KundenFilterPanel } from '@/components/kunden/kunden-filter-panel';
import { KundenKpiStrip } from '@/components/kunden/kunden-kpi-strip';
import { KundenListTable } from '@/components/kunden/kunden-list-table';
import { CrossModulePortfolioContent } from '@/components/dashboard/cross-module-portfolio-card';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleSideTabsCard } from '@/components/dashboard/module-side-tabs-card';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
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
  const [activeContextTab, setActiveContextTab] = useState<'workflow' | 'datennetz'>('workflow');
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

  useEffect(() => {
    if (!handoffFrom || handoffQuery.trim().length === 0) return;
    setActiveSavedView(null);
    setFilters((prev) => (prev.query === handoffQuery ? prev : { ...prev, query: handoffQuery }));
  }, [handoffFrom, handoffQuery]);

  return (
    <ModulePageTemplate
      title="Kunden & Objekte"
      description="Kundenstammdaten, Objekte und Ansprechpartner fuer Folgeauftraege organisieren."
      mainGridClassName="lg:grid-cols-1 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)]"
      compact
      actions={
        <Button size="sm">
          <PlusCircle className="h-4 w-4" />
          Neuer Kunde
        </Button>
      }
      kpis={[]}
      topMessage={
        <div className="space-y-2">
          <KundenKpiStrip kpis={kpis} />
          {handoffFrom ? (
            <p className="text-sm text-muted-foreground">
              Kontext aus {handoffFrom} übernommen. Suche wurde automatisch vorbelegt.
            </p>
          ) : null}
        </div>
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
        <div className="space-y-3">
          <ModuleTableCard icon={ListFilter} label="Filter" title="Saved Views und Facets" hasData tone="emphasis">
            <KundenFilterPanel
              filters={filters}
              owners={owners}
              regions={regions}
              activeSavedView={activeSavedView}
              onApplySavedView={(viewId) => {
                setActiveSavedView(viewId);
                setFilters((prev) => applyKundenSavedView(viewId, prev));
              }}
              onChange={(next) => {
                setActiveSavedView(null);
                setFilters(next);
              }}
            />
          </ModuleTableCard>
          <ModuleSideTabsCard
            idPrefix="kunden-context"
            icon={Search}
            label="Kontext"
            title="Arbeitsweise und Datennetz"
            activeTab={activeContextTab}
            onTabChange={setActiveContextTab}
            ariaLabel="Kunden Kontextansicht"
            tabs={[
              {
                id: 'workflow',
                label: 'Arbeitsweise',
                icon: Search,
                content: (
                  <div className="space-y-2 text-sm">
                    <p className="rounded-md border border-border/70 bg-background/60 px-3 py-2">
                      1) SLA-Risiko priorisieren und ueberfaellige Follow-ups zuerst abarbeiten.
                    </p>
                    <p className="rounded-md border border-border/70 bg-background/60 px-3 py-2">
                      2) Duplikatverdacht pruefen und Stammdaten vereinheitlichen.
                    </p>
                    <p className="rounded-md border border-border/70 bg-background/60 px-3 py-2">
                      3) Pro Kunde primaeren Ansprechpartner mit Consent sicherstellen.
                    </p>
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
