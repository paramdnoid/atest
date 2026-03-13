'use client';

import { useMemo, useState } from 'react';
import { PlusCircle, Ruler, Search, X } from 'lucide-react';

import { AufmassFilterPanel } from '@/components/aufmass/aufmass-filter-panel';
import { AufmassListTable } from '@/components/aufmass/aufmass-list-table';
import { AufmassStatusBadge } from '@/components/aufmass/aufmass-status-badge';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { listAufmassRecordsSync } from '@/lib/aufmass/data-adapter';
import { matchesAufmassQuery } from '@/lib/aufmass/selectors';
import type { AufmassFilters, AufmassRecord } from '@/lib/aufmass/types';

export default function AufmassPage() {
  const records = useMemo<AufmassRecord[]>(() => listAufmassRecordsSync(), []);
  const [filters, setFilters] = useState<AufmassFilters>({ query: '', status: 'ALL' });

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const statusMatches = filters.status === 'ALL' ? true : record.status === filters.status;
        return statusMatches && matchesAufmassQuery(record, filters.query);
      }),
    [filters.query, filters.status, records],
  );
  const activeFilterChips = [
    filters.query ? `Suche: ${filters.query}` : null,
    filters.status !== 'ALL' ? `Status: ${filters.status}` : null,
  ].filter(Boolean) as string[];

  const reviewCount = records.filter((entry) => entry.status === 'IN_REVIEW').length;
  const openDrafts = records.filter((entry) => entry.status === 'DRAFT').length;
  const billedCount = records.filter((entry) => entry.status === 'BILLED').length;

  return (
    <ModulePageTemplate
      title="Aufmaß"
      description="Digitale Erfassung und prüfbare Dokumentation von Flächen und Leistungen."
      badge={
        <Badge variant="outline" className="dashboard-module-badge">
          MALER · VOB Prüffähigkeit
        </Badge>
      }
      actions={
        <Button size="sm" disabled title="Wird im nächsten Ausbauschritt aktiviert.">
          <PlusCircle className="h-4 w-4" />
          Neues Aufmaß (folgt)
        </Button>
      }
      kpis={[
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
      ]}
      mainContent={
        <ModuleTableCard
          icon={Ruler}
          label="Aufmaßakte"
          title="Liste mit Filter, Status und Version"
          hasData={filteredRecords.length > 0}
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
          <AufmassListTable records={filteredRecords} />
        </ModuleTableCard>
      }
      sideContent={
        <div className="space-y-4">
          <ModuleTableCard
            icon={Search}
            label="Filter"
            title="Schnellzugriff"
            hasData
            tone="emphasis"
          >
            <AufmassFilterPanel filters={filters} onChange={setFilters} />
          </ModuleTableCard>

          <ModuleTableCard icon={Ruler} label="Statuslegende" title="Workflow" tone="muted">
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
          </ModuleTableCard>
        </div>
      }
    />
  );
}
