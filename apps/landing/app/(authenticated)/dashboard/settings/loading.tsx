import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-52" />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="p-6 space-y-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-9 w-44" />
          </div>
        </div>
      </div>
    </div>
  );
}
