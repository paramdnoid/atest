'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Network, PlusCircle, Ruler, Search, ShieldCheck, X } from 'lucide-react';

import { AufmassFilterPanel } from '@/components/aufmass/aufmass-filter-panel';
import { AufmassListTable } from '@/components/aufmass/aufmass-list-table';
import { AufmassStatusBadge } from '@/components/aufmass/aufmass-status-badge';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { CrossModulePortfolioContent } from '@/components/dashboard/cross-module-portfolio-card';
import { SidebarKpiGrid } from '@/components/dashboard/kpi-strip';
import { ModuleSideTabsCard } from '@/components/dashboard/module-side-tabs-card';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { listAufmassRecordsSync } from '@/lib/aufmass/data-adapter';
import { matchesAufmassQuery } from '@/lib/aufmass/selectors';
import { getVerknuepfungPortfolioSnapshot } from '@/lib/auftragsabwicklung/cross-module-intelligence';
import type { AufmassFilters, AufmassRecord } from '@/lib/aufmass/types';

export default function AufmassPage() {
  const searchParams = useSearchParams();
  const records = useMemo<AufmassRecord[]>(() => listAufmassRecordsSync(), []);
  const [filters, setFilters] = useState<AufmassFilters>({ query: '', status: 'ALL' });
  const [activeContextTab, setActiveContextTab] = useState<'filter' | 'workflow' | 'datennetz'>('filter');
  const handoffFrom = searchParams.get('handoffFrom');
  const handoffSuggestionId = searchParams.get('handoffSuggestionId') ?? undefined;
  const handoffQuery = [
    searchParams.get('handoffCustomer'),
    searchParams.get('handoffProject'),
    searchParams.get('handoffSite'),
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join(' ');

  useEffect(() => {
    if (!handoffFrom || handoffQuery.trim().length === 0) return;
    setFilters((prev) => (prev.query === handoffQuery ? prev : { ...prev, query: handoffQuery }));
  }, [handoffFrom, handoffQuery]);

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const statusMatches = filters.status === 'ALL' ? true : record.status === filters.status;
        return statusMatches && matchesAufmassQuery(record, filters.query);
      }),
    [filters.query, filters.status, records],
  );
  const displayRecords = useMemo(() => {
    if (!handoffSuggestionId) return filteredRecords;
    return [...filteredRecords].sort((left, right) => {
      if (left.id === handoffSuggestionId) return -1;
      if (right.id === handoffSuggestionId) return 1;
      return 0;
    });
  }, [filteredRecords, handoffSuggestionId]);
  const activeFilterChips = [
    filters.query ? `Suche: ${filters.query}` : null,
    filters.status !== 'ALL' ? `Status: ${filters.status}` : null,
  ].filter(Boolean) as string[];

  const reviewCount = records.filter((entry) => entry.status === 'IN_REVIEW').length;
  const openDrafts = records.filter((entry) => entry.status === 'DRAFT').length;
  const billedCount = records.filter((entry) => entry.status === 'BILLED').length;
  const portfolioSnapshot = useMemo(
    () => getVerknuepfungPortfolioSnapshot('AUFMASS', displayRecords.map((entry) => entry.id)),
    [displayRecords],
  );
  const kpiItems = useMemo(
    () => [
      {
        icon: Ruler,
        label: 'Offene Entwürfe',
        value: openDrafts,
        subtitle: 'Status DRAFT',
      },
      {
        icon: Search,
        label: 'In Prüfung',
        value: reviewCount,
        subtitle: 'Freigaben ausstehend',
        accent: true,
      },
      {
        icon: Ruler,
        label: 'Abgerechnet',
        value: billedCount,
        subtitle: 'Status BILLED',
      },
    ],
    [billedCount, openDrafts, reviewCount],
  );

  return (
    <ModulePageTemplate
      title="Aufmaß"
      description="Digitale Erfassung und prüfbare Dokumentation von Flächen und Leistungen."
      actions={
        <Button size="sm" disabled title="Wird im nächsten Ausbauschritt aktiviert.">
          <PlusCircle className="h-4 w-4" />
          Neues Aufmaß (folgt)
        </Button>
      }
      kpis={[]}
      sideTopContent={<SidebarKpiGrid items={kpiItems} />}
      topMessage={
        handoffFrom ? (
          <p className="text-sm text-muted-foreground">
            Kontext aus {handoffFrom} übernommen. Suchfilter wurde automatisch vorbelegt.
          </p>
        ) : undefined
      }
      mainContent={
        <ModuleTableCard
          icon={Ruler}
          label="Aufmaßakte"
          title="Liste mit Filter, Status und Version"
          hasData={displayRecords.length > 0}
          emptyState={{
            icon: <Ruler className="h-8 w-8" />,
            title: 'Keine Aufmaßdaten gefunden',
            description: 'Passe Filter an oder lege ein neues Aufmaß an.',
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
                onClick={() => setFilters({ query: '', status: 'ALL' })}
              >
                <X className="h-3.5 w-3.5" />
                Alle Filter löschen
              </Button>
            </div>
          ) : null}
          <AufmassListTable records={displayRecords} highlightedId={handoffSuggestionId} />
        </ModuleTableCard>
      }
      sideContent={
        <ModuleSideTabsCard
          idPrefix="aufmass-context"
          icon={Search}
          label="Steuerung"
          title="Filter, Workflow und Datennetz"
          activeTab={activeContextTab}
          onTabChange={setActiveContextTab}
          ariaLabel="Aufmaß Kontextansicht"
          tabs={[
            {
              id: 'filter',
              label: 'Filter',
              icon: Search,
              content: <AufmassFilterPanel filters={filters} onChange={setFilters} />,
            },
            {
              id: 'workflow',
              label: 'Workflow',
              icon: ShieldCheck,
              content: (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Entwurf</span>
                    <AufmassStatusBadge status="DRAFT" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">In Prüfung</span>
                    <AufmassStatusBadge status="IN_REVIEW" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Freigegeben</span>
                    <AufmassStatusBadge status="APPROVED" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Abgerechnet</span>
                    <AufmassStatusBadge status="BILLED" />
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
      }
    />
  );
}
