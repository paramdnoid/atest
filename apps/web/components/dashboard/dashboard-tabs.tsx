import { useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type DashboardTabItem<T extends string> = {
  id: T;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: ReactNode;
};

type DashboardTabsProps<T extends string> = {
  idPrefix: string;
  tabs: Array<DashboardTabItem<T>>;
  activeTab: T;
  onChange: (next: T) => void;
  ariaLabel: string;
};

export function getDashboardTabId(prefix: string, id: string): string {
  return `${prefix}-tab-${id}`;
}

export function getDashboardTabPanelId(prefix: string, id: string): string {
  return `${prefix}-tabpanel-${id}`;
}

export function DashboardTabs<T extends string>({
  idPrefix,
  tabs,
  activeTab,
  onChange,
  ariaLabel,
}: DashboardTabsProps<T>) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
      onChange(tabs[nextIndex].id);
      tabRefs.current[nextIndex]?.focus();
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      onChange(tabs[0].id);
      tabRefs.current[0]?.focus();
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      onChange(tabs[tabs.length - 1].id);
      tabRefs.current[tabs.length - 1]?.focus();
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border/70 bg-muted/35 p-1">
      <div className="flex min-w-max gap-1" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              size="sm"
              variant="ghost"
              className={cn(
                'h-8 border border-transparent px-3 text-xs',
                activeTab === tab.id
                  ? 'border-border/70 bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
              )}
              onClick={() => onChange(tab.id)}
              ref={(node) => {
                tabRefs.current[tabs.findIndex((entry) => entry.id === tab.id)] = node;
              }}
              role="tab"
              id={getDashboardTabId(idPrefix, tab.id)}
              aria-selected={activeTab === tab.id}
              aria-controls={getDashboardTabPanelId(idPrefix, tab.id)}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onKeyDown={(event) => onKeyDown(event, tabs.findIndex((entry) => entry.id === tab.id))}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.badge}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
