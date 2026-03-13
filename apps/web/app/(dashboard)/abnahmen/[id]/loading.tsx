export default function AbnahmeDetailLoading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
      <div className="h-28 animate-pulse rounded-lg bg-muted/60" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-lg bg-muted/60" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-lg bg-muted/60" />
    </div>
  );
}
