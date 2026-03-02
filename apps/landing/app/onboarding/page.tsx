import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { isKnownStep } from "@/lib/onboarding/steps";
import type { OnboardingStepId } from "@/lib/onboarding/types";

type OnboardingPageProps = {
  searchParams: Promise<{
    plan?: string;
    step?: string;
    verified?: string;
    reason?: string;
  }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;

  const initialPlanCode = params.plan ?? null;
  const initialStep: OnboardingStepId | null =
    params.step && isKnownStep(params.step) ? params.step : null;
  const initialVerificationState = {
    verified: params.verified === "1",
    reason: params.reason ?? null,
  };

  return (
    <OnboardingShell>
      <OnboardingWizard
        initialPlanCode={initialPlanCode}
        initialStep={initialStep}
        initialVerificationState={initialVerificationState}
      />
    </OnboardingShell>
  );
}
