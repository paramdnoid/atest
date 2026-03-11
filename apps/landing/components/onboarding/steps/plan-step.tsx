"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";

import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BillingInterval, OnboardingPlan } from "@/lib/onboarding/types";

function formatCurrency(cents: number) {
  if (cents === 0) return "EUR 0";
  return `EUR ${Math.round(cents / 100)}`;
}

function getMonthlyCents(plan: OnboardingPlan, billingInterval: BillingInterval): number {
  if (billingInterval === "year" && plan.priceYearlyCents != null && plan.priceYearlyCents > 0) {
    return Math.round(plan.priceYearlyCents / 12);
  }
  return plan.priceMonthlyCents;
}

function AnimatedEur({
  cents,
  suffix,
  className,
  suffixClassName,
}: {
  cents: number;
  suffix?: string;
  className?: string;
  suffixClassName?: string;
}) {
  const amount = Math.max(0, Math.round(cents / 100));
  const shown = useAnimatedNumber(amount, { stiffness: 110, damping: 28, restDelta: 0.5 });

  if (cents <= 0) return <span className={className}>EUR 0</span>;

  return (
    <span className={className}>
      {`EUR ${shown}`}
      {suffix ? <span className={cn("ml-1", suffixClassName)}>{suffix}</span> : null}
    </span>
  );
}

export function PlanStep({
  plans,
  selectedPlanCode,
  billingInterval,
  onSelectPlan,
  onSelectBillingInterval,
}: {
  plans: OnboardingPlan[];
  selectedPlanCode: string | null;
  billingInterval: BillingInterval;
  onSelectPlan: (planCode: string) => void;
  onSelectBillingInterval: (interval: BillingInterval) => void;
}) {
  const selectedPlan = plans.find((p) => p.code === selectedPlanCode) ?? null;

  const monthlyDisplayCents = selectedPlan ? getMonthlyCents(selectedPlan, billingInterval) : 0;

  return (
    <div className="space-y-4">
      <div className="billing-enterprise-panel rounded-xl p-2.5">
        <div
          role="tablist"
          aria-label="Pläne"
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }}
        >
          {plans.map((plan) => {
            const selected = selectedPlan?.code === plan.code;
            const tabCents = getMonthlyCents(plan, billingInterval);
            return (
              <button
                key={plan.code}
                role="tab"
                aria-selected={selected}
                type="button"
                onClick={() => onSelectPlan(plan.code)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left transition",
                  selected
                    ? "billing-enterprise-panel-strong border-primary/55 shadow-[0_14px_28px_-20px_rgba(249,115,22,0.9)]"
                    : "border-border/70 bg-background/55 hover:border-primary/30 hover:bg-background/70",
                )}
              >
                <p className="billing-editorial-meta">{plan.name}</p>
                <p className="mt-1.5 text-base font-semibold tracking-tight">
                  {formatCurrency(tabCents)}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-2.5">
          <div className="flex items-center justify-between gap-3">
            <p className="billing-editorial-meta">Abrechnungsintervall</p>
            <div className="relative inline-flex rounded-lg border border-border/80 bg-background p-1">
              {(["month", "year"] as const).map((interval) => (
                <Button
                  key={interval}
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectBillingInterval(interval)}
                  type="button"
                  className={cn(
                    "relative z-10 transition-colors",
                    billingInterval === interval ? "text-primary-foreground hover:text-primary-foreground" : "",
                  )}
                >
                  {billingInterval === interval && (
                    <motion.span
                      layoutId="onboarding-billing-interval-pill"
                      className="bg-primary absolute inset-0 rounded-md shadow-sm shadow-primary/30"
                      transition={{ type: "spring", stiffness: 320, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{interval === "month" ? "Monatlich" : "Jährlich"}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="billing-enterprise-panel-strong mt-3 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="billing-editorial-title">
                {selectedPlan ? selectedPlan.name : "Plan auswählen"}
              </p>
              <p className="billing-enterprise-muted mt-1 text-xs">
                {selectedPlan
                  ? selectedPlan.description
                  : "Wähle Starter oder Professional, um mit der Registrierung fortzufahren."}
              </p>
            </div>
            {selectedPlan ? (
              <div className="text-right">
                <AnimatedEur
                  cents={monthlyDisplayCents}
                  suffix="/ Monat"
                  className="font-display inline-flex items-baseline gap-1.5 text-xl sm:text-2xl"
                  suffixClassName="billing-enterprise-muted text-[11px]"
                />
              </div>
            ) : null}
          </div>

          {selectedPlan ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selectedPlan.featureHighlights.slice(0, 5).map((item) => (
                <span
                  key={`${selectedPlan.code}-${item}`}
                  className="billing-enterprise-chip inline-flex items-center gap-1 px-2.5 py-1 text-[10px]"
                >
                  <Check className="h-3 w-3" />
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          {selectedPlan?.trialDays ? (
            <p className="billing-enterprise-muted mt-2.5 text-[11px]">
              {selectedPlan.trialDays} Tage Testphase aktiv. Zahlung startet automatisch nach Trial-Ende.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
