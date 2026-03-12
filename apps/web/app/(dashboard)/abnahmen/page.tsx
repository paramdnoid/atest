'use client';

import { useMemo, useState } from 'react';
import { ClipboardCheck, Filter, ShieldCheck } from 'lucide-react';

import { getAbnahmenKpiItems } from '@/components/abnahmen/abnahmen-kpi-strip';
import { AbnahmenListTable } from '@/components/abnahmen/abnahmen-list-table';
import { AbnahmenStatusBadge } from '@/components/abnahmen/abnahmen-status-badge';
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { filterAbnahmen } from '@/lib/abnahmen/selectors';
import { getAbnahmenRecords } from '@/lib/abnahmen/mock-data';
import type { AbnahmenFilters } from '@/lib/abnahmen/types';

export default function AbnahmenPage() {
  const records = useMemo(() => getAbnahmenRecords(), []);
  const [filters, setFilters] = useState<AbnahmenFilters>({
    query: '',
    status: 'ALL',
    onlyCritical: false,
    onlyOverdue: false,
  });

  const filteredRecords = useMemo(() => filterAbnahmen(records, filters), [records, filters]);

  return (
    <ModulePageTemplate
      title="Abnahmen & Mängel"
      description="Abnahmen dokumentieren, Mängel erfassen und Nacharbeit transparent verfolgen."
      badge={
        <Badge
          variant="outline"
          className="border-(--enterprise-accent)/40 bg-(--enterprise-accent-soft) text-(--enterprise-accent) font-mono text-xs"
        >
          MALER · VOB/B + DSGVO
        </Badge>
      }
      actions={
        <Button size="sm">
          <ClipboardCheck className="h-4 w-4" />
          Neue Abnahme
        </Button>
      }
      kpis={getAbnahmenKpiItems(records)}
      mainContent={
        <ModuleTableCard
          icon={ClipboardCheck}
          label="Abnahmen"
          title="Vorgänge, Fristen und Mängelstände"
          hasData={filteredRecords.length > 0}
          emptyState={{
            icon: <ClipboardCheck className="h-8 w-8" />,
            title: 'Keine Abnahmen gefunden',
            description: 'Passe deine Filter an oder erstelle eine neue Abnahme.',
          }}
        >
          <AbnahmenListTable records={filteredRecords} />
        </ModuleTableCard>
      }
      sideContent={
        <div className="space-y-4">
          <ModuleTableCard icon={Filter} label="Filter" title="Schnellzugriff" hasData>
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
          </ModuleTableCard>

          <ModuleTableCard icon={ShieldCheck} label="Statuslegende" title="Workflow" hasData>
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
          </ModuleTableCard>
        </div>
      }
    />
  );
}
