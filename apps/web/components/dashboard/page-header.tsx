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
    <div className="flex w-full min-w-0 items-center gap-4 overflow-hidden">
      <div className="flex w-0 min-w-0 flex-1 items-center gap-3">
        <SidebarTrigger className="shrink-0 text-foreground/70 hover:text-foreground focus-visible:ring-primary/30" />
        <div className="h-6 w-px bg-border shrink-0" />
        <div className="w-0 min-w-0 flex-1 overflow-hidden">
          <h1
            className={cn(
              dashboardUiTokens.heading,
              'block max-w-full overflow-hidden text-ellipsis whitespace-nowrap',
              titleClassName,
            )}
          >
            {title}
          </h1>
          {description && (
            <p
              className={cn(
                'mt-1 block max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-foreground/75',
                descriptionClassName,
              )}
            >
              {description}
            </p>
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
