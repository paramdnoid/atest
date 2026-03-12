import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function DashboardCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <Card className={cn('premium-panel gap-0 border-border py-0', className)}>{children}</Card>;
}

export function DashboardCardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <CardContent className={className}>{children}</CardContent>;
}

export function StatCard({
  icon,
  label,
  value,
  meta,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <DashboardCard>
      <DashboardCardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
        </div>
        <p className="mt-3 text-xl font-semibold">{value}</p>
        {meta && <div className="mt-1 text-sm text-muted-foreground">{meta}</div>}
      </DashboardCardContent>
    </DashboardCard>
  );
}
