export type OnboardingStepId = "plan" | "account" | "verify" | "signin" | "billing" | "complete";

export type BillingState = "none" | "active" | "issue" | "canceled";

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

export type OnboardingAddress = {
  formatted: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  countryCode: "DE" | "AT" | "CH" | "";
  latitude: number | null;
  longitude: number | null;
  provider: string;
  providerPlaceId: string;
};

export type AddressSuggestion = {
  placeId: string;
  label: string;
  line1: string;
  postalCode: string;
  city: string;
  countryCode: "DE" | "AT" | "CH";
  latitude: number;
  longitude: number;
  provider: string;
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
