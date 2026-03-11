"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck, CircleX, Loader2, RefreshCcw } from "lucide-react";

import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { AccountStep } from "@/components/onboarding/steps/account-step";
import { BillingStep } from "@/components/onboarding/steps/billing-step";
import { CompleteStep } from "@/components/onboarding/steps/complete-step";
import { PlanStep } from "@/components/onboarding/steps/plan-step";
import { SigninStep } from "@/components/onboarding/steps/signin-step";
import { VerifyEmailStep } from "@/components/onboarding/steps/verify-email-step";
import { useOnboardingFlow } from "@/components/onboarding/use-onboarding-flow";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { deriveStepFromStatus, ONBOARDING_STEPS } from "@/lib/onboarding/steps";
import type { OnboardingPlan, OnboardingStepId } from "@/lib/onboarding/types";
import { tradeOptions } from "@/content/trade-options";

// Default plans used when the API is unreachable
const DEFAULT_PLANS: OnboardingPlan[] = [
  {
    code: "starter",
    name: "Starter",
    description: "Für kleine Teams",
    trialDays: 30,
    priceMonthlyCents: 19900,
    priceYearlyCents: 214920,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    purchasableMonthly: true,
    purchasableYearly: true,
    featureHighlights: ["5 Nutzer", "10 GB Speicher", "5 Lizenzen", "30 Tage Testphase"],
  },
  {
    code: "professional",
    name: "Professional",
    description: "Für wachsende Betriebe",
    trialDays: 30,
    priceMonthlyCents: 39900,
    priceYearlyCents: 430920,
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    purchasableMonthly: true,
    purchasableYearly: true,
    featureHighlights: ["10 Nutzer", "50 GB Speicher", "DATEV Export", "GAEB Export", "30 Tage Testphase"],
  },
];

export function OnboardingWizard({
  plans,
  initialPlanCode,
  initialStep,
  initialVerificationState,
}: {
  plans?: OnboardingPlan[];
  initialPlanCode: string | null;
  initialStep: OnboardingStepId | null;
  initialVerificationState: { verified: boolean; reason: string | null };
}) {
  const apiPlans = plans?.filter((plan) => plan.code === "starter" || plan.code === "professional") ?? [];
  const resolvedPlans = apiPlans.length > 0 ? apiPlans : DEFAULT_PLANS;
  const flow = useOnboardingFlow(
    resolvedPlans,
    initialPlanCode,
    initialStep,
    initialVerificationState,
  );

  return (
    <div className="billing-enterprise-shell mx-auto grid max-w-6xl gap-4 lg:grid-cols-[0.9fr_1.3fr]">
      <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
        <div className="billing-enterprise-panel animate-panel-enter rounded-2xl p-3 sm:p-4">
          <OnboardingStepper currentStep={flow.currentStep} />
        </div>

        <div className="billing-enterprise-panel animate-panel-enter hidden rounded-2xl p-3 text-sm md:block sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="billing-editorial-meta">Live-Status</p>
              <p className="font-display mt-1 text-base leading-none">
                {flow.stepMeta?.label ?? "Onboarding"}
              </p>
              <p className="billing-enterprise-muted mt-2">{flow.stepMeta?.description}</p>
            </div>
            <LoadingButton
              size="sm"
              variant="ghost"
              pending={flow.pendingAction === "status"}
              icon={RefreshCcw}
              iconOnly
              iconSize="h-3.5 w-3.5"
              onClick={async () => {
                const next = await flow.refreshStatus();
                flow.setCurrentStep(deriveStepFromStatus(next));
              }}
              disabled={flow.pendingAction !== null && flow.pendingAction !== "status"}
              className="mt-0.5 h-8 w-8 rounded-full border border-border/70 p-0"
              aria-label="Status aktualisieren"
            />
          </div>
          <div className="premium-divider mt-3" />
          <p className="mt-3 text-xs text-muted-foreground">
            {flow.status.authenticated
              ? "Anmeldestatus erkannt. Wir synchronisieren den nächsten Schritt automatisch."
              : "Ohne Anmeldung kannst du den Flow vorbereiten und später fortsetzen."}
          </p>
        </div>
      </aside>

      <section className="billing-editorial-main premium-noise animate-panel-enter overflow-hidden rounded-2xl">
        <div className="relative z-2 space-y-3 p-4 sm:p-5">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <span className="billing-editorial-kicker">
                <span className="billing-enterprise-kicker-dot" />
                Onboarding
              </span>
              <div>
                <p className="billing-editorial-meta">Aktueller Schritt</p>
                <h2 className="billing-editorial-title">
                  {flow.stepMeta?.label ?? "Onboarding"}
                </h2>
                {flow.stepMeta?.description ? (
                  <p className="billing-enterprise-muted mt-1">{flow.stepMeta.description}</p>
                ) : null}
              </div>
            </div>
            <span className="billing-enterprise-chip">
              Schritt {flow.currentStepIndex + 1}/{ONBOARDING_STEPS.length}
            </span>
          </header>

          <div className="premium-divider" />

          {flow.statusLoading ? (
            <div className="flex min-h-44 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Onboarding wird vorbereitet...
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={flow.currentStep}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                {flow.errorMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <CircleX className="h-4 w-4 shrink-0" />
                    {flow.errorMessage}
                  </div>
                )}
                {flow.successMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">
                    <CircleCheck className="h-4 w-4 shrink-0" />
                    {flow.successMessage}
                  </div>
                )}

                {flow.currentStep === "plan" && (
                  <>
                    <PlanStep
                      plans={resolvedPlans}
                      selectedPlanCode={flow.selectedPlanCode}
                      billingInterval={flow.billingInterval}
                      onSelectPlan={flow.setSelectedPlanCode}
                      onSelectBillingInterval={flow.setBillingInterval}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={flow.handleContinueFromPlan}
                        type="button"
                        disabled={!flow.selectedPlanCode}
                      >
                        Weiter
                      </Button>
                    </div>
                  </>
                )}

                {flow.currentStep === "account" && (
                  <AccountStep
                    values={flow.accountValues}
                    pending={flow.pendingAction === "signup"}
                    tradeOptions={tradeOptions}
                    onChange={flow.setAccountValues}
                    onSubmit={() => {
                      void flow.handleSignup();
                    }}
                    onBack={() => flow.setCurrentStep("plan")}
                  />
                )}

                {flow.currentStep === "verify" && (
                  <>
                    <VerifyEmailStep
                      pending={flow.pendingAction === "status"}
                      autoLoginPending={flow.pendingAction === "verify-auto-login"}
                      onRefresh={() => {
                        void flow.refreshStatus();
                      }}
                      onContinue={() => {
                        void flow.handleContinueAfterVerify();
                      }}
                      onBroadcastVerified={() => {
                        void flow.tryAutoSigninAfterVerification(undefined, {
                          trustVerifiedRedirect: true,
                        });
                      }}
                    />
                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => flow.setCurrentStep("account")}
                      >
                        Zurück
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => flow.setCurrentStep("signin")}
                      >
                        Manuell anmelden
                      </Button>
                    </div>
                  </>
                )}

                {flow.currentStep === "signin" && (
                  <SigninStep
                    values={flow.signinValues}
                    pending={flow.pendingAction === "signin"}
                    onChangeValues={flow.setSigninValues}
                    onSignin={() => {
                      void flow.handleSignin();
                    }}
                    onSkip={() => flow.setCurrentStep("complete")}
                  />
                )}

                {flow.currentStep === "billing" && (
                  <BillingStep
                    selectedPlan={flow.selectedPlan}
                    billingInterval={flow.billingInterval}
                    onSkipToComplete={() => flow.setCurrentStep("complete")}
                  />
                )}

                {flow.currentStep === "complete" && (
                  <CompleteStep />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>
    </div>
  );
}
