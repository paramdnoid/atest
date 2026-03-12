import { SidebarTrigger } from '@/components/ui/sidebar';

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
        <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-lg font-bold tracking-tight leading-none">{title}</h1>
          {description && (
            <p className="mt-0 text-sm text-muted-foreground">{description}</p>
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
