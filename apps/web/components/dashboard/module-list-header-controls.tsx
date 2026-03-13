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
  searchContainerClassName = 'relative w-full sm:w-80 sm:max-w-[46vw]',
  inlineControl,
  dropdownContent,
  dropdownAriaLabel = 'Filter öffnen',
  dropdownTriggerClassName = 'absolute right-1 top-1/2 h-8 w-8 sm:h-8 sm:w-8 -translate-y-1/2 rounded-md p-0 [@media(max-width:639px)]:h-9 [@media(max-width:639px)]:w-9',
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
          <Search className="pointer-events-none absolute left-2.5 sm:left-2.5 top-1/2 h-4 w-4 sm:h-3.5 sm:w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-10 sm:h-8 rounded-md border-border/70 bg-background pl-9 sm:pl-8 pr-10 sm:pr-9 text-sm placeholder:text-sm sm:placeholder:text-xs"
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
                    'text-muted-foreground hover:text-foreground',
                    dropdownOpen && 'bg-muted text-foreground hover:bg-muted/90',
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
                className="w-[min(28rem,90vw)] space-y-2 p-3 max-h-[80vh] overflow-y-auto"
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
            <Badge key={token.key} variant="secondary" className="h-7 sm:h-6 rounded-md px-2 sm:px-1.5 text-xs sm:text-[11px]">
              {token.label}
              <button
                type="button"
                onClick={token.clear}
                className="ml-1.5 sm:ml-1 inline-flex h-5 w-5 sm:h-4 sm:w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-background"
                aria-label={`Filter entfernen: ${token.label}`}
              >
                <X className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              </button>
            </Badge>
          ))}
          {onResetAll ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 sm:h-6 rounded-md px-2 sm:px-1.5 text-xs sm:text-[11px]"
              onClick={onResetAll}
            >
              <span className="hidden sm:inline">Alle löschen</span>
              <span className="sm:hidden">Löschen</span>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
