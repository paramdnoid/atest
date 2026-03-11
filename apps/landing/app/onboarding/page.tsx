import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { isKnownStep } from "@/lib/onboarding/steps";
import type { OnboardingPlan, OnboardingStepId } from "@/lib/onboarding/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const ALLOWED_PLAN_CODES = new Set(["starter", "professional"]);

// Shape returned by GET /v1/plans
type ApiPlan = {
  planId: string;
  displayName: string;
  description?: string | null;
  amountCents?: number | null;
  amountCentsYearly?: number | null;
  trialDays?: number | null;
  purchasableMonthly?: boolean | null;
  purchasableYearly?: boolean | null;
  stripePriceIdMonthly?: string | null;
  stripePriceIdYearly?: string | null;
  featureHighlights?: string[] | null;
};

async function fetchOnboardingPlans(): Promise<OnboardingPlan[] | null> {
  try {
    const res = await fetch(`${API_URL}/v1/plans`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data: ApiPlan[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const supportedPlans = data.filter((api) => ALLOWED_PLAN_CODES.has(api.planId.toLowerCase()));
    if (supportedPlans.length === 0) return null;

    return supportedPlans.map((api): OnboardingPlan => ({
      code: api.planId,
      name: api.displayName,
      description: api.description ?? null,
      trialDays: api.trialDays ?? 30,
      priceMonthlyCents: api.amountCents ?? 0,
      priceYearlyCents: api.amountCentsYearly ?? null,
      stripePriceIdMonthly: api.stripePriceIdMonthly ?? null,
      stripePriceIdYearly: api.stripePriceIdYearly ?? null,
      purchasableMonthly: api.purchasableMonthly ?? (api.amountCents != null && api.amountCents > 0),
      purchasableYearly: api.purchasableYearly ?? (api.amountCentsYearly != null && api.amountCentsYearly > 0),
      featureHighlights: api.featureHighlights ?? [],
    }));
  } catch {
    return null;
  }
}

type OnboardingPageProps = {
  searchParams: Promise<{
    plan?: string;
    step?: string;
    verified?: string;
    reason?: string;
  }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const [params, plans] = await Promise.all([
    searchParams,
    fetchOnboardingPlans(),
  ]);

  const initialPlanCode =
    params.plan && ALLOWED_PLAN_CODES.has(params.plan.toLowerCase()) ? params.plan : null;
  const initialStep: OnboardingStepId | null =
    params.step && isKnownStep(params.step) ? params.step : null;
  const initialVerificationState = {
    verified: params.verified === "1",
    reason: params.reason ?? null,
  };

  return (
    <OnboardingShell>
      <OnboardingWizard
        plans={plans ?? undefined}
        initialPlanCode={initialPlanCode}
        initialStep={initialStep}
        initialVerificationState={initialVerificationState}
      />
    </OnboardingShell>
  );
}
