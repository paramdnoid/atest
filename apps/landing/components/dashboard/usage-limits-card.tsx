import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type UsageItem = {
  label: string;
  current: number;
  limit: number | null;
};

function usageColor(pct: number): string {
  if (pct >= 90) return "bg-destructive";
  if (pct >= 75) return "bg-yellow-500";
  return "";
}

export function UsageLimitsCard({ items }: { items: UsageItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nutzung &amp; Limits</CardTitle>
        <CardDescription>Verbrauch der enthaltenen Ressourcen</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Limits konfiguriert.</p>
        ) : (
          items.map((item) => {
            const pct = item.limit != null ? Math.min((item.current / item.limit) * 100, 100) : 0;
            const color = usageColor(pct);
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className={cn("tabular-nums", pct >= 90 ? "text-destructive font-semibold" : "text-muted-foreground")}>
                    {item.current}
                    {item.limit != null && (
                      <span className="text-muted-foreground font-normal"> / {item.limit}</span>
                    )}
                  </span>
                </div>
                {item.limit != null && (
                  <Progress
                    value={pct}
                    className={cn("h-2", color ? `[&>div]:${color}` : "")}
                  />
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
