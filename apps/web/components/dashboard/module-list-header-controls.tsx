import { useState } from 'react';
import { ListFilter, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type ModuleListFilterToken = {
  key: string;
  label: string;
  clear: () => void;
};

type ModuleListHeaderControlsProps = {
  query: string;
  onQueryChange: (next: string) => void;
  queryPlaceholder: string;
  queryAriaLabel: string;
  searchContainerClassName?: string;
  inlineControl?: React.ReactNode;
  dropdownContent?: React.ReactNode;
  dropdownAriaLabel?: string;
  dropdownTriggerClassName?: string;
  tokens?: ModuleListFilterToken[];
  onResetAll?: () => void;
  showSearch?: boolean;
  showTokens?: boolean;
};

export function ModuleListHeaderControls({
  query,
  onQueryChange,
  queryPlaceholder,
  queryAriaLabel,
  searchContainerClassName = 'relative w-80 max-w-[46vw]',
  inlineControl,
  dropdownContent,
  dropdownAriaLabel = 'Filter öffnen',
  dropdownTriggerClassName = 'absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-md p-0',
  tokens = [],
  onResetAll,
  showSearch = true,
  showTokens = true,
}: ModuleListHeaderControlsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="space-y-2">
      {showSearch ? (
        <div className={searchContainerClassName}>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/80" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-8 rounded-md border-border/70 bg-background pl-8 pr-9 text-sm placeholder:text-xs"
            placeholder={queryPlaceholder}
            aria-label={queryAriaLabel}
          />
          {dropdownContent ? (
            <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    dropdownTriggerClassName,
                    'text-primary/85 hover:text-primary',
                    dropdownOpen && 'bg-primary/10 text-primary hover:bg-primary/15',
                  )}
                  aria-haspopup="dialog"
                  aria-expanded={dropdownOpen}
                  aria-label={dropdownAriaLabel}
                >
                  <ListFilter className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="bottom"
                className="w-[min(28rem,75vw)] space-y-2 p-3"
              >
                {dropdownContent}
              </PopoverContent>
            </Popover>
          ) : null}
          {inlineControl ? (
            <div className="absolute right-1 top-1/2 -translate-y-1/2">{inlineControl}</div>
          ) : null}
        </div>
      ) : null}
      {showTokens && tokens.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border/70 bg-background/70 px-2 py-1.5">
          {tokens.map((token) => (
            <Badge key={token.key} variant="secondary" className="h-6 rounded-md px-1.5 text-[11px]">
              {token.label}
              <button
                type="button"
                onClick={token.clear}
                className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-background"
                aria-label={`Filter entfernen: ${token.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {onResetAll ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 rounded-md px-1.5 text-[11px]"
              onClick={onResetAll}
            >
              Alle löschen
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
