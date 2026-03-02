"use client";

import { Check } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps";
import type { OnboardingStepId } from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";

export function OnboardingStepper({
  currentStep,
}: {
  currentStep: OnboardingStepId;
}) {
  const currentIndex = Math.max(
    0,
    ONBOARDING_STEPS.findIndex((step) => step.id === currentStep),
  );
  const percent = ((currentIndex + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between text-[10px] tracking-[0.09em] uppercase text-muted-foreground sm:text-xs">
        <span>Onboarding</span>
        <span className="billing-enterprise-chip px-2 py-0.5 text-[10px]">
          {currentIndex + 1} / {ONBOARDING_STEPS.length}
        </span>
      </div>
      <Progress value={percent} className="h-1.5 bg-muted/70" />

      <ol className="flex items-center justify-between gap-1.5 md:hidden">
        {ONBOARDING_STEPS.map((step, index) => {
          const complete = index < currentIndex;
          const active = index === currentIndex;
          const pending = !complete && !active;

          return (
            <li
              key={step.id}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold transition-all",
                complete &&
                  "border-emerald-500/40 bg-emerald-500/15 text-emerald-700",
                active && "border-primary/45 bg-primary/12 text-foreground shadow-[0_0_0_3px_rgba(249,115,22,0.14)]",
                pending && "border-border/70 bg-background/70 text-muted-foreground",
              )}
            >
              {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </li>
          );
        })}
      </ol>

      <ol className="hidden space-y-1 md:block">
        {ONBOARDING_STEPS.map((step, index) => {
          const complete = index < currentIndex;
          const active = index === currentIndex;
          const pending = !complete && !active;

          return (
            <li
              key={step.id}
              aria-current={active ? "step" : undefined}
              className="onboarding-step-connector relative pl-10"
            >
              <span
                className={cn(
                  "absolute top-0 left-0 inline-flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold transition-all",
                  complete &&
                    "border-emerald-500/40 bg-emerald-500/15 text-emerald-700",
                  active &&
                    "border-primary/45 bg-primary/12 text-foreground shadow-[0_0_0_3px_rgba(249,115,22,0.14)]",
                  pending && "border-border/70 bg-background/70 text-muted-foreground",
                )}
              >
                {complete ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <div
                className={cn(
                  "rounded-lg border px-3 py-2 transition-colors",
                  active && "border-primary/35 bg-primary/[0.07]",
                  complete && !active && "border-emerald-500/30 bg-emerald-500/[0.07]",
                  pending && "border-border/70 bg-background/60",
                )}
              >
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-[0.08em]",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
                {active ? (
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">
                    {step.description}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
