import { useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AufmassFilters } from '@/lib/aufmass/types';
import { cn } from '@/lib/utils';

export type AufmassListFilterState = {
  query: string;
  status: AufmassFilters['status'];
  blockedOnly: boolean;
  dueOnly: boolean;
  versionAtLeast2: boolean;
};

type AufmassListCommandBarProps = {
  filters: AufmassListFilterState;
  onChange: (next: AufmassListFilterState) => void;
  advancedOpen: boolean;
  onAdvancedOpenChange: (next: boolean) => void;
  onReset: () => void;
  handoffFrom?: string | null;
  compact?: boolean;
  hideSearch?: boolean;
  asDropdown?: boolean;
  chromeless?: boolean;
  iconOnlyTrigger?: boolean;
};

function QuickChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      size="sm"
      variant={active ? 'default' : 'outline'}
      className="h-7 rounded-md px-2.5 text-xs"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

const statusAdvancedOptions: Array<{ value: AufmassFilters['status']; label: string }> = [
  { value: 'ALL', label: 'Alle Aufmaße' },
  { value: 'DRAFT', label: 'Nur Entwürfe' },
  { value: 'IN_REVIEW', label: 'Nur zur Prüfung' },
  { value: 'APPROVED', label: 'Nur freigegeben' },
  { value: 'BILLED', label: 'Nur abgerechnet' },
];

export function AufmassListCommandBar({
  filters,
  onChange,
  advancedOpen,
  onAdvancedOpenChange,
  onReset,
  handoffFrom,
  compact = false,
  hideSearch = false,
  asDropdown = false,
  chromeless = false,
  iconOnlyTrigger = false,
}: AufmassListCommandBarProps) {
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const quickMode = filters.blockedOnly
    ? 'BLOCKED'
    : filters.status === 'IN_REVIEW'
      ? 'IN_REVIEW'
      : filters.status === 'BILLED'
        ? 'BILLED'
        : 'ALL';

  const setQuickMode = (mode: 'ALL' | 'IN_REVIEW' | 'BLOCKED' | 'BILLED') => {
    if (mode === 'BLOCKED') {
      onChange({ ...filters, status: 'IN_REVIEW', blockedOnly: true });
      return;
    }
    if (mode === 'ALL') {
      onChange({ ...filters, status: 'ALL', blockedOnly: false });
      return;
    }
    onChange({ ...filters, status: mode, blockedOnly: false });
  };

  return (
    <div
      className={cn(
        'space-y-2 rounded-lg border border-border/70 bg-sidebar/35 p-2.5',
        compact && 'rounded-lg p-2',
        chromeless && 'space-y-0 border-0 bg-transparent p-0',
      )}
    >
      {!asDropdown ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {!hideSearch ? (
              <div className="relative min-w-56 flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filters.query}
                  onChange={(event) => onChange({ ...filters, query: event.target.value })}
                  className="h-8 rounded-md border-border/70 bg-background pl-8 text-sm"
                  placeholder="Suche nach Nummer, Kunde, Projekt oder Ort ..."
                  aria-label="Aufmaßsuche"
                />
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-1.5">
              <QuickChip label="Alle Aufmaße" active={quickMode === 'ALL'} onClick={() => setQuickMode('ALL')} />
              <QuickChip
                label="Zur Prüfung"
                active={quickMode === 'IN_REVIEW'}
                onClick={() => setQuickMode('IN_REVIEW')}
              />
              <QuickChip
                label="Mit Problemen"
                active={quickMode === 'BLOCKED'}
                onClick={() => setQuickMode('BLOCKED')}
              />
              <QuickChip
                label="Abgerechnet"
                active={quickMode === 'BILLED'}
                onClick={() => setQuickMode('BILLED')}
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 rounded-md px-2 text-xs text-muted-foreground"
              onClick={() => onAdvancedOpenChange(!advancedOpen)}
              aria-expanded={advancedOpen}
              aria-controls="aufmass-advanced-filter-panel"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Weitere Filter
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', advancedOpen && 'rotate-180')} />
            </Button>
            <Button size="sm" variant="outline" onClick={onReset} className="h-7 rounded-md px-2 text-xs">
              <X className="h-3.5 w-3.5" />
              Zurücksetzen
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Popover open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant={iconOnlyTrigger ? 'ghost' : 'outline'}
                  className={iconOnlyTrigger ? 'h-8 w-8 rounded-md p-0' : 'h-7 rounded-md px-2 text-xs'}
                  aria-expanded={isFilterMenuOpen}
                  aria-label="Filter öffnen"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {!iconOnlyTrigger ? (
                    <>
                      Filter
                      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isFilterMenuOpen && 'rotate-180')} />
                    </>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                id="aufmass-filter-dropdown-panel"
                align="end"
                side="bottom"
                className="space-y-2"
              >
              {iconOnlyTrigger ? (
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Filter</p>
                  <Button size="sm" variant="ghost" onClick={onReset} className="h-6 rounded-md px-1.5 text-[11px]">
                    <X className="h-3.5 w-3.5" />
                    Zurücksetzen
                  </Button>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-1.5">
                <QuickChip label="Alle Aufmaße" active={quickMode === 'ALL'} onClick={() => setQuickMode('ALL')} />
                <QuickChip
                  label="Zur Prüfung"
                  active={quickMode === 'IN_REVIEW'}
                  onClick={() => setQuickMode('IN_REVIEW')}
                />
                <QuickChip
                  label="Mit Problemen"
                  active={quickMode === 'BLOCKED'}
                  onClick={() => setQuickMode('BLOCKED')}
                />
                <QuickChip
                  label="Abgerechnet"
                  active={quickMode === 'BILLED'}
                  onClick={() => setQuickMode('BILLED')}
                />
              </div>

              <Button
                size="sm"
                variant="ghost"
                className="h-7 rounded-md px-2 text-xs"
                onClick={() => onAdvancedOpenChange(!advancedOpen)}
                aria-expanded={advancedOpen}
                aria-controls="aufmass-advanced-filter-panel"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Weitere Filter
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', advancedOpen && 'rotate-180')} />
              </Button>

              {advancedOpen ? (
                <div
                  id="aufmass-advanced-filter-panel"
                  className="space-y-2 rounded-lg border border-border bg-background p-2"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Erweiterte Filter
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {statusAdvancedOptions.map((option) => (
                      <Button
                        key={option.value}
                        size="sm"
                        variant={filters.status === option.value && !filters.blockedOnly ? 'default' : 'outline'}
                        className="h-7 rounded-md px-2 text-xs"
                        onClick={() => onChange({ ...filters, status: option.value, blockedOnly: false })}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      variant={filters.dueOnly ? 'default' : 'outline'}
                      className="h-7 rounded-md px-2 text-xs"
                      onClick={() => onChange({ ...filters, dueOnly: !filters.dueOnly })}
                    >
                      Nur mit Termin
                    </Button>
                    <Button
                      size="sm"
                      variant={filters.versionAtLeast2 ? 'default' : 'outline'}
                      className="h-7 rounded-md px-2 text-xs"
                      onClick={() => onChange({ ...filters, versionAtLeast2: !filters.versionAtLeast2 })}
                    >
                      Nur Version ab 2
                    </Button>
                  </div>
                </div>
              ) : null}
              </PopoverContent>
            </Popover>
            {!iconOnlyTrigger ? (
              <Button size="sm" variant="ghost" onClick={onReset} className="h-7 rounded-md px-2 text-xs">
                <X className="h-3.5 w-3.5" />
                Zurücksetzen
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {!asDropdown ? (
        <div className={cn('flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground', compact && 'hidden')}>
            <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[11px]">
              Schnellfilter
          </Badge>
          {handoffFrom ? (
            <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[11px]">
              Kontext aus {handoffFrom}
            </Badge>
          ) : null}
        </div>
      ) : null}

      {!asDropdown && advancedOpen ? (
        <div id="aufmass-advanced-filter-panel" className="space-y-2 rounded-lg border border-border bg-background p-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Erweiterte Filter
          </p>
          <div className="flex flex-wrap gap-1.5">
            {statusAdvancedOptions.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={filters.status === option.value && !filters.blockedOnly ? 'default' : 'outline'}
                className="h-7 rounded-md px-2 text-xs"
                onClick={() => onChange({ ...filters, status: option.value, blockedOnly: false })}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={filters.dueOnly ? 'default' : 'outline'}
              className="h-7 rounded-md px-2 text-xs"
              onClick={() => onChange({ ...filters, dueOnly: !filters.dueOnly })}
            >
              Nur mit Termin
            </Button>
            <Button
              size="sm"
              variant={filters.versionAtLeast2 ? 'default' : 'outline'}
              className="h-7 rounded-md px-2 text-xs"
              onClick={() => onChange({ ...filters, versionAtLeast2: !filters.versionAtLeast2 })}
            >
              Nur Version ab 2
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
