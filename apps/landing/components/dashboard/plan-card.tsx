import { CalendarDays, CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatSubscriptionStatus } from "@/lib/format";

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
    case "trialing":
    case "ACTIVE":
      return "default";
    case "past_due":
    case "unpaid":
      return "destructive";
    case "canceled":
    case "incomplete_expired":
    case "CANCELED":
      return "secondary";
    default:
      return "outline";
  }
}

export function PlanCard({
  planName,
  planCode,
  priceCents,
  billingInterval,
  status,
  currentPeriodEnd,
}: {
  planName: string;
  planCode: string;
  priceCents: number;
  billingInterval?: string;
  status: string;
  currentPeriodEnd?: Date | string | null;
}) {
  const isActive = status === "active" || status === "trialing" || status === "ACTIVE";
  const priceLabel =
    planCode === "free" ? "Kostenlos" : formatCurrency(priceCents, billingInterval);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Aktueller Plan</CardTitle>
            <CardDescription>Ihr aktives Abonnement</CardDescription>
          </div>
          <Badge variant={statusVariant(status)}>
            {status === "none" ? "Kein Abo" : formatSubscriptionStatus(status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{planName}</p>
            <p className="text-sm text-muted-foreground">{priceLabel}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {isActive ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {currentPeriodEnd && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                Nächste Abrechnung:{" "}
                <span className="font-medium text-foreground">
                  {new Date(currentPeriodEnd).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
