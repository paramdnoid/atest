import type { LucideIcon } from 'lucide-react';
import { ClipboardList, Clock3, ListChecks, Sparkles } from 'lucide-react';

import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';
import { EmptyState } from '@/components/dashboard/states';
import { Badge } from '@/components/ui/badge';
import { DashboardCard, DashboardCardHeader } from '@/components/dashboard/dashboard-card';

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
    <ModulePageTemplate
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
      kpis={[
        {
          icon: ModuleIcon,
          label: kpiLabel,
          value: '–',
          subtitle: 'Wird mit API-Daten befüllt',
        },
        {
          icon: Clock3,
          label: nextLabel,
          value: '–',
          subtitle: 'Noch keine Einträge vorhanden',
        },
        {
          icon: ClipboardList,
          label: complianceLabel,
          value: 'Vorbereitung',
          subtitle: 'Grundstruktur aktiv',
          accent: true,
        },
      ]}
      mainContent={
        <ModuleTableCard
          icon={ModuleIcon}
          label="Modulstatus"
          title={`${title} Einträge`}
          emptyState={{
            icon: <ListChecks className="h-8 w-8" />,
            title: emptyTitle,
            description: emptyDescription,
          }}
        />
      }
      sideContent={
        <DashboardCard>
          <DashboardCardHeader icon={Sparkles} label="Nächste Schritte" title="Empfohlene Aktionen" />
          <div className="p-4">
            <EmptyState
              icon={<ClipboardList className="h-8 w-8" />}
              title="Modul in Vorbereitung"
              description="In der nächsten Ausbaustufe folgen fachspezifische Tabellen, Filter und Aktionen."
              className="border-0 bg-transparent px-0 py-8"
            />
          </div>
        </DashboardCard>
      }
    />
  );
}
