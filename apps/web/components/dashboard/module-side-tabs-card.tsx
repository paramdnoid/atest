import type { ReactNode } from 'react';

import { DashboardTabs, getDashboardTabId, getDashboardTabPanelId, type DashboardTabItem } from '@/components/dashboard/dashboard-tabs';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';

type ModuleSideTabItem<T extends string> = DashboardTabItem<T> & {
  content: ReactNode;
};

type ModuleSideTabsCardProps<T extends string> = {
  idPrefix: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  title: string;
  activeTab: T;
  onTabChange: (next: T) => void;
  tabs: Array<ModuleSideTabItem<T>>;
  ariaLabel: string;
};

export function ModuleSideTabsCard<T extends string>({
  idPrefix,
  icon,
  label,
  title,
  activeTab,
  onTabChange,
  tabs,
  ariaLabel,
}: ModuleSideTabsCardProps<T>) {
  const tabItems: Array<DashboardTabItem<T>> = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    badge: tab.badge,
  }));
  const activeItem = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <ModuleTableCard icon={icon} label={label} title={title} hasData tone="muted">
      <div className="space-y-3">
        <DashboardTabs
          idPrefix={idPrefix}
          tabs={tabItems}
          activeTab={activeItem.id}
          onChange={onTabChange}
          ariaLabel={ariaLabel}
        />
        <div
          role="tabpanel"
          id={getDashboardTabPanelId(idPrefix, activeItem.id)}
          aria-labelledby={getDashboardTabId(idPrefix, activeItem.id)}
          className="min-h-24"
        >
          {activeItem.content}
        </div>
      </div>
    </ModuleTableCard>
  );
}
