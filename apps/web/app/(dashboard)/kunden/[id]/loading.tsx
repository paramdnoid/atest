import { Skeleton } from '@/components/ui/skeleton';

export default function KundenDetailLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
