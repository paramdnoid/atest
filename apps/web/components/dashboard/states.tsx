import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-300/45 bg-red-50/60 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn('premium-panel rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center', className)}>
      <div className="mx-auto h-8 w-8 text-muted-foreground/50">{icon}</div>
      <p className="mt-3 font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
