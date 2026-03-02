import { cn } from "@/lib/utils";

function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const normalized = Math.max(0, Math.min(100, value));

  return (
    <div
      aria-label="Fortschritt"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalized}
      role="progressbar"
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-300"
        style={{ width: `${normalized}%` }}
      />
    </div>
  );
}

export { Progress };
