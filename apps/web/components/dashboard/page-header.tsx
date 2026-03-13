import { SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardDensityToggle } from '@/components/dashboard/dashboard-density-toggle';
import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';

export function PageHeader({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="shrink-0 text-primary/85 hover:text-primary focus-visible:ring-primary/30" />
        <div className="h-6 w-px bg-primary/25" />
        <div>
          <h1 className={dashboardUiTokens.heading}>{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-foreground/75">{description}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <DashboardDensityToggle />
        {badge}
        {children}
      </div>
    </div>
  );
}
