import type { LucideIcon } from 'lucide-react';
import { ClipboardList, Clock3, ListChecks } from 'lucide-react';

import { PageHeader } from '@/components/dashboard/page-header';
import { DashboardCard, DashboardCardContent, StatCard } from '@/components/dashboard/cards';
import { EmptyState } from '@/components/dashboard/states';
import { Badge } from '@/components/ui/badge';

type TradeModuleSkeletonProps = {
  title: string;
  description: string;
  badge?: string;
  kpiLabel: string;
  nextLabel: string;
  complianceLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  icon: LucideIcon;
};

export function TradeModuleSkeleton({
  title,
  description,
  badge,
  kpiLabel,
  nextLabel,
  complianceLabel,
  emptyTitle,
  emptyDescription,
  icon: ModuleIcon,
}: TradeModuleSkeletonProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        badge={
          badge ? (
            <Badge
              variant="outline"
              className="border-(--enterprise-accent)/40 bg-(--enterprise-accent-soft) text-(--enterprise-accent) font-mono text-xs"
            >
              {badge}
            </Badge>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={<ModuleIcon className="h-4 w-4" />} label={kpiLabel} value="–" meta="Wird mit API-Daten befüllt" />
        <StatCard icon={<Clock3 className="h-4 w-4" />} label={nextLabel} value="–" meta="Noch keine Einträge vorhanden" />
        <StatCard
          icon={<ClipboardList className="h-4 w-4" />}
          label={complianceLabel}
          value="Vorbereitung"
          meta="Grundstruktur aktiv"
        />
      </div>

      <DashboardCard>
        <DashboardCardContent className="p-0">
          <EmptyState
            icon={<ListChecks className="h-8 w-8" />}
            title={emptyTitle}
            description={emptyDescription}
            className="rounded-none border-0 bg-transparent"
          />
        </DashboardCardContent>
      </DashboardCard>
    </div>
  );
}
