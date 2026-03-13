import { SidebarTrigger } from '@/components/ui/sidebar';
import { dashboardUiTokens } from '@/components/dashboard/ui-tokens';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  badge,
  children,
  titleClassName,
  descriptionClassName,
}: {
  title: string;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <SidebarTrigger className="shrink-0 text-foreground/70 hover:text-foreground focus-visible:ring-primary/30" />
        <div className="h-6 w-px bg-border shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className={cn(dashboardUiTokens.heading, titleClassName)}>{title}</h1>
          {description && (
            <div className={cn('mt-1 text-sm text-foreground/75 min-w-0', descriptionClassName)}>
              {description}
            </div>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {badge}
        {children}
      </div>
    </div>
  );
}
