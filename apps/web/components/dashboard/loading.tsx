import { Skeleton } from '@/components/ui/skeleton';

export function PageLoading({
  titleWidth = 'w-44',
  rows = 3,
}: {
  titleWidth?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-4">
      <Skeleton className={`h-8 ${titleWidth}`} />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, idx) => (
          <Skeleton key={idx} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
