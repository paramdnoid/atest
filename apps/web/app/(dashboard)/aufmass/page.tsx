'use client';

import { useMemo, useState } from 'react';
import { PlusCircle, Ruler, Search } from 'lucide-react';

import { AufmassListTable } from '@/components/aufmass/aufmass-list-table';
import { AufmassStatusBadge } from '@/components/aufmass/aufmass-status-badge';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAufmassRecords } from '@/lib/aufmass/mock-data';
import { matchesAufmassQuery } from '@/lib/aufmass/selectors';
import type { AufmassFilters } from '@/lib/aufmass/types';

export default function AufmassPage() {
  const records = useMemo(() => getAufmassRecords(), []);
  const [filters, setFilters] = useState<AufmassFilters>({ query: '', status: 'ALL' });

  const filteredRecords = useMemo(
    () =>
      records.filter((record) => {
        const statusMatches = filters.status === 'ALL' ? true : record.status === filters.status;
        return statusMatches && matchesAufmassQuery(record, filters.query);
      }),
    [filters.query, filters.status, records],
  );

  const reviewCount = records.filter((entry) => entry.status === 'IN_REVIEW').length;
  const openDrafts = records.filter((entry) => entry.status === 'DRAFT').length;
  const billedCount = records.filter((entry) => entry.status === 'BILLED').length;

  return (
    <ModulePageTemplate
      title="Aufmaß"
      description="Digitale Erfassung und prüfbare Dokumentation von Flächen und Leistungen."
      badge={
        <Badge
          variant="outline"
          className="border-(--enterprise-accent)/40 bg-(--enterprise-accent-soft) text-(--enterprise-accent) font-mono text-xs"
        >
          MALER · VOB Prüffähigkeit
        </Badge>
      }
      actions={
        <Button size="sm">
          <PlusCircle className="h-4 w-4" />
          Neues Aufmaß
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
          >
            <div className="space-y-3">
              <Input
                value={filters.query}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, query: event.target.value }))
                }
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
                  variant={filters.status === 'DRAFT' ? 'default' : 'outline'}
                  onClick={() => setFilters((prev) => ({ ...prev, status: 'DRAFT' }))}
                >
                  Entwurf
                </Button>
                <Button
                  size="sm"
                  variant={filters.status === 'IN_REVIEW' ? 'default' : 'outline'}
                  onClick={() => setFilters((prev) => ({ ...prev, status: 'IN_REVIEW' }))}
                >
                  In Prüfung
                </Button>
                <Button
                  size="sm"
                  variant={filters.status === 'APPROVED' ? 'default' : 'outline'}
                  onClick={() => setFilters((prev) => ({ ...prev, status: 'APPROVED' }))}
                >
                  Freigegeben
                </Button>
                <Button
                  size="sm"
                  variant={filters.status === 'BILLED' ? 'default' : 'outline'}
                  onClick={() => setFilters((prev) => ({ ...prev, status: 'BILLED' }))}
                >
                  Abgerechnet
                </Button>
              </div>
            </div>
          </ModuleTableCard>

          <ModuleTableCard icon={Ruler} label="Statuslegende" title="Workflow">
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
