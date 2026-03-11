import { CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { UpgradePlanButton } from "@/components/dashboard/upgrade-plan-button";

export type AvailablePlan = {
  planId: string;
  displayName: string;
  amountCents: number;
  billingCycle: string;
  maxDevices: number | null;
};

type PlanSwitcherSectionProps = {
  plans: AvailablePlan[];
  currentPlanCode: string | undefined;
};

export function PlanSwitcherSection({
  plans,
  currentPlanCode,
}: PlanSwitcherSectionProps) {
  if (plans.length === 0) return null;

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Verfügbare Pläne</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent =
            plan.planId.toLowerCase() === currentPlanCode?.toLowerCase() ||
            plan.displayName.toLowerCase() === currentPlanCode?.toLowerCase();

          const billingCycle =
            plan.billingCycle === "yearly" ? "year" : "month";

          const priceLabel =
            formatCurrency(plan.amountCents, billingCycle);

          return (
            <Card key={plan.planId} className="relative">
              {isCurrent && (
                <div className="absolute right-4 top-4">
                  <Badge variant="default">Aktuell</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-base">{plan.displayName}</CardTitle>
                <CardDescription>
                  {plan.maxDevices != null
                    ? `Bis zu ${plan.maxDevices} Geräte`
                    : "Unbegrenzte Geräte"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-2xl font-bold">{priceLabel}</p>

                {isCurrent ? (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Ihr aktueller Plan
                  </div>
                ) : (
                  <UpgradePlanButton
                    planId={plan.planId}
                    billingCycle={
                      plan.billingCycle === "yearly" ? "yearly" : "monthly"
                    }
                    label={`Wechseln zu ${plan.displayName}`}
                    variant="default"
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
