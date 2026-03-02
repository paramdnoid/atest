export type OnboardingStepId = "plan" | "account" | "verify" | "signin" | "billing" | "complete";

export type BillingState = "none" | "free" | "active" | "issue" | "canceled";

export type BillingInterval = "month" | "year";

export type OnboardingPlan = {
  code: string;
  name: string;
  description: string | null;
  trialDays: number;
  priceMonthlyCents: number;
  priceYearlyCents: number | null;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
  purchasableMonthly: boolean;
  purchasableYearly: boolean;
  featureHighlights: string[];
};

export type OnboardingStatus = {
  authenticated: boolean;
  userId: string | null;
  email: string | null;
  isEmailVerified: boolean;
  workspaceId: string | null;
  role: string | null;
  canManageBilling: boolean;
  subscription: {
    planCode: string;
    status: string;
    billingInterval: BillingInterval;
    hasStripeCustomer: boolean;
    hasStripeSubscription: boolean;
  } | null;
  billingProfile: null;
  billingState: BillingState;
  nextStep: OnboardingStepId;
};
