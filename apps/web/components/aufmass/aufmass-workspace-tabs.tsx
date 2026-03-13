import { CreditCard, DraftingCompass, ShieldCheck } from 'lucide-react';
import type { ComponentType } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type AufmassWorkspaceTab = 'capture' | 'review' | 'billing';

type AufmassWorkspaceTabsProps = {
  activeTab: AufmassWorkspaceTab;
  onChange: (next: AufmassWorkspaceTab) => void;
  reviewBadge?: number;
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

export function AufmassWorkspaceTabs({ activeTab, onChange, reviewBadge = 0 }: AufmassWorkspaceTabsProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-background/70 p-1">
      <div className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <Button
              key={tab.id}
              size="sm"
              variant="ghost"
              className={cn(
                'h-8 rounded-lg border border-transparent px-3 text-xs',
                isActive
                  ? 'border-border bg-background text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]'
                  : 'text-muted-foreground hover:border-border/80 hover:bg-background/75',
              )}
              onClick={() => onChange(tab.id)}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-foreground' : 'text-muted-foreground')} />
              {tab.label}
              {tab.id === 'review' && reviewBadge > 0 ? (
                <span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] text-amber-600 dark:text-amber-300">
                  {reviewBadge}
                </span>
              ) : null}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
