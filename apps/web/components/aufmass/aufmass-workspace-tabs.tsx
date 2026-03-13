import { CreditCard, DraftingCompass, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentType, KeyboardEvent, ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AufmassWorkspaceTab = 'capture' | 'review' | 'billing';

type AufmassWorkspaceTabsProps = {
  activeTab: AufmassWorkspaceTab;
  onChange: (next: AufmassWorkspaceTab) => void;
  reviewBadge?: number;
  inline?: boolean;
  quickCaptureSlot?: ReactNode;
  onQuickCapture?: () => void;
};

const tabs: Array<{
  id: AufmassWorkspaceTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: 'capture', label: 'Erfassung', icon: DraftingCompass },
  { id: 'review', label: 'Prüfung', icon: ShieldCheck },
  { id: 'billing', label: 'Abrechnung', icon: CreditCard },
];

export function AufmassWorkspaceTabs({
  activeTab,
  onChange,
  reviewBadge = 0,
  inline = false,
  quickCaptureSlot,
  onQuickCapture,
}: AufmassWorkspaceTabsProps) {
  const tabRefs = useRef<Record<AufmassWorkspaceTab, HTMLButtonElement | null>>({
    capture: null,
    review: null,
    billing: null,
  });
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState({ x: 0, width: 0, ready: false });

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
      onChange(tabs[nextIndex].id);
      tabRefs.current[tabs[nextIndex].id]?.focus();
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      onChange(tabs[0].id);
      tabRefs.current[tabs[0].id]?.focus();
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      onChange(tabs[tabs.length - 1].id);
      tabRefs.current[tabs[tabs.length - 1].id]?.focus();
    }
  };

  const syncIndicator = useCallback(() => {
    const activeNode = tabRefs.current[activeTab];
    const tabListNode = tabListRef.current;
    if (!activeNode || !tabListNode) return;

    setIndicator({
      x: activeNode.offsetLeft,
      width: activeNode.offsetWidth,
      ready: true,
    });
  }, [activeTab]);

  useLayoutEffect(() => {
    syncIndicator();
  }, [syncIndicator, reviewBadge]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(syncIndicator);
    const tabListNode = tabListRef.current;
    if (tabListNode) observer.observe(tabListNode);
    for (const tab of tabs) {
      const node = tabRefs.current[tab.id];
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, [syncIndicator, reviewBadge]);

  return (
    <div className={cn('flex min-w-0 items-center gap-2', inline ? '' : 'rounded-xl border border-border/60 bg-background/70 p-1.5')}>
      <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          ref={tabListRef}
          className="relative flex min-w-max items-center gap-1 rounded-lg border border-border/70 bg-muted/40 p-1"
          role="tablist"
          aria-label="Aufmaß Arbeitsbereiche"
        >
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute top-1 left-0 h-8 rounded-md border border-border/80 bg-white shadow-sm motion-reduce:transition-none',
              indicator.ready ? 'opacity-100 transition-[transform,width,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]' : 'opacity-0',
            )}
            style={{
              width: `${indicator.width}px`,
              transform: `translateX(${indicator.x}px)`,
            }}
          />

          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            const tabId = `aufmass-workspace-tab-${tab.id}`;
            const panelId = `aufmass-workspace-panel-${tab.id}`;
            const badgeLabel = tab.id === 'review' && reviewBadge > 0 ? `${reviewBadge} offene Prüfblocker` : undefined;

            return (
              <Button
                key={tab.id}
                id={tabId}
                size="sm"
                variant="ghost"
                role="tab"
                aria-selected={isActive}
                aria-controls={panelId}
                aria-label={tab.id === 'review' && reviewBadge > 0 ? `${tab.label}, ${reviewBadge} offene Prüfblocker` : tab.label}
                className={cn(
                  'relative z-10 h-8 border border-transparent px-2 lg:px-3 text-[11px] font-medium transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => onChange(tab.id)}
                tabIndex={isActive ? 0 : -1}
                onKeyDown={(event) => onKeyDown(event, index)}
                ref={(node) => {
                  tabRefs.current[tab.id] = node;
                }}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-foreground' : 'text-muted-foreground')} />
                <span className="hidden lg:inline ml-2">{tab.label}</span>
                {tab.id === 'review' && reviewBadge > 0 ? (
                  <span
                    className="ml-1 rounded-full border border-border/70 bg-background px-1.5 py-0 font-mono text-[10px] leading-none text-muted-foreground transition duration-150 ease-out hidden lg:inline"
                    aria-label={badgeLabel}
                  >
                    {reviewBadge}
                  </span>
                ) : null}
              </Button>
            );
          })}

          {quickCaptureSlot ? <div className="relative z-10 ml-1 shrink-0">{quickCaptureSlot}</div> : null}
        </div>
      </div>

      {!quickCaptureSlot && onQuickCapture ? (
        <Button
          size="sm"
          className="h-8 shrink-0 px-2 lg:px-3 transition-[transform,background-color,box-shadow] duration-150 ease-out hover:-translate-y-px hover:bg-primary/90 active:translate-y-0"
          onClick={onQuickCapture}
          title="Schnell erfassen"
        >
          <span className="hidden lg:inline">Schnell erfassen</span>
          <span className="lg:hidden">+</span>
        </Button>
      ) : null}
    </div>
  );
}
