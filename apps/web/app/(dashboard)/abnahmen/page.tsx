'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ClipboardCheck, Filter, Network, ShieldCheck, X } from 'lucide-react';

import { getAbnahmenKpiItems } from '@/components/abnahmen/abnahmen-kpi-strip';
import { AbnahmenListTable } from '@/components/abnahmen/abnahmen-list-table';
import { AbnahmenStatusBadge } from '@/components/abnahmen/abnahmen-status-badge';
import { CrossModulePortfolioContent } from '@/components/dashboard/cross-module-portfolio-card';
import { SidebarKpiGrid } from '@/components/dashboard/kpi-strip';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleSideTabsCard } from '@/components/dashboard/module-side-tabs-card';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { filterAbnahmen } from '@/lib/abnahmen/selectors';
import { getAbnahmenRecords } from '@/lib/abnahmen/mock-data';
import { getVerknuepfungPortfolioSnapshot } from '@/lib/auftragsabwicklung/cross-module-intelligence';
import type { AbnahmenFilters } from '@/lib/abnahmen/types';

export default function AbnahmenPage() {
  const searchParams = useSearchParams();
  const records = useMemo(() => getAbnahmenRecords(), []);
  const [filters, setFilters] = useState<AbnahmenFilters>({
    query: '',
    status: 'ALL',
    onlyCritical: false,
    onlyOverdue: false,
  });
  const [activeContextTab, setActiveContextTab] = useState<'filter' | 'workflow' | 'datennetz'>('filter');

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
  const handoffFrom = searchParams.get('handoffFrom');
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
  const portfolioSnapshot = useMemo(
    () => getVerknuepfungPortfolioSnapshot('ABNAHMEN', displayRecords.map((entry) => entry.id)),
    [displayRecords],
  );
  const kpiItems = useMemo(() => getAbnahmenKpiItems(records), [records]);
  const activeFilterChips = [
    filters.query ? `Suche: ${filters.query}` : null,
    filters.status !== 'ALL' ? `Status: ${filters.status}` : null,
    filters.onlyCritical ? 'Nur kritisch' : null,
    filters.onlyOverdue ? 'Nur überfällig' : null,
  ].filter(Boolean) as string[];

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
          icon={ClipboardCheck}
          label="Abnahmen"
          title="Vorgänge, Fristen und Mängelstände"
          hasData={displayRecords.length > 0}
          emptyState={{
            icon: <ClipboardCheck className="h-8 w-8" />,
            title: 'Keine Abnahmen gefunden',
            description: 'Passe deine Filter an oder erstelle eine neue Abnahme.',
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
                onClick={() =>
                  setFilters({
                    query: '',
                    status: 'ALL',
                    onlyCritical: false,
                    onlyOverdue: false,
                  })
                }
              >
                <X className="h-3.5 w-3.5" />
                Alle Filter löschen
              </Button>
            </div>
          ) : null}
          <AbnahmenListTable records={displayRecords} highlightedId={handoffSuggestionId} />
        </ModuleTableCard>
      }
      sideContent={
        <ModuleSideTabsCard
          idPrefix="abnahmen-context"
          icon={Filter}
          label="Steuerung"
          title="Filter, Workflow und Datennetz"
          activeTab={activeContextTab}
          onTabChange={setActiveContextTab}
          ariaLabel="Abnahmen Kontextansicht"
          tabs={[
            {
              id: 'filter',
              label: 'Filter',
              icon: Filter,
              content: (
                <div className="space-y-3">
                  <Input
                    value={filters.query}
                    onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                    placeholder="Suche nach Nummer, Projekt, Kunde..."
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={filters.status === 'ALL' ? 'default' : 'outline'}
                      onClick={() => setFilters((prev) => ({ ...prev, status: 'ALL' }))}
                    >
                      Alle
                    </Button>
                    <Button
                      size="sm"
                      variant={filters.status === 'DEFECTS_OPEN' ? 'default' : 'outline'}
                      onClick={() => setFilters((prev) => ({ ...prev, status: 'DEFECTS_OPEN' }))}
                    >
                      Mängel offen
                    </Button>
                    <Button
                      size="sm"
                      variant={filters.status === 'REWORK_IN_PROGRESS' ? 'default' : 'outline'}
                      onClick={() => setFilters((prev) => ({ ...prev, status: 'REWORK_IN_PROGRESS' }))}
                    >
                      Nacharbeit
                    </Button>
                    <Button
                      size="sm"
                      variant={filters.status === 'ACCEPTED' ? 'default' : 'outline'}
                      onClick={() => setFilters((prev) => ({ ...prev, status: 'ACCEPTED' }))}
                    >
                      Abgenommen
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={filters.onlyCritical ? 'default' : 'outline'}
                      onClick={() => setFilters((prev) => ({ ...prev, onlyCritical: !prev.onlyCritical }))}
                    >
                      Nur kritisch
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
              ),
            },
            {
              id: 'workflow',
              label: 'Workflow',
              icon: ShieldCheck,
              content: (
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
