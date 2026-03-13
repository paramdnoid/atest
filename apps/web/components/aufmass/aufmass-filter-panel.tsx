import { Filter, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AufmassFilters } from '@/lib/aufmass/types';

type AufmassFilterPanelProps = {
  filters: AufmassFilters;
  onChange: (next: AufmassFilters) => void;
};

export function AufmassFilterPanel({ filters, onChange }: AufmassFilterPanelProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Suche
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.query}
              onChange={(event) => onChange({ ...filters, query: event.target.value })}
              className="h-9 pl-8 text-sm"
              placeholder="Suche nach Nummer, Projekt, Kunde..."
              aria-label="Aufmaßsuche"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onChange({ query: '', status: 'ALL' })}
            aria-label="Filter zurücksetzen"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t border-border/60 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Status
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            ['ALL', 'Alle'],
            ['DRAFT', 'Entwurf'],
            ['IN_REVIEW', 'In Prüfung'],
            ['APPROVED', 'Freigegeben'],
            ['BILLED', 'Abgerechnet'],
          ].map(([status, label]) => (
            <Button
              key={status}
              size="sm"
              variant={filters.status === status ? 'default' : 'outline'}
              onClick={() =>
                onChange({
                  ...filters,
                  status: status as AufmassFilters['status'],
                })
              }
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
