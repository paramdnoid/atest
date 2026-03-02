import type { OnboardingStatus, OnboardingStepId } from "@/lib/onboarding/types";

export const ONBOARDING_STEPS: { id: OnboardingStepId; label: string; description: string }[] = [
  { id: "plan", label: "Lizenz", description: "Passenden Plan festlegen" },
  { id: "account", label: "Konto", description: "Zugang und Workspace erstellen" },
  { id: "verify", label: "Verifizieren", description: "E-Mail-Adresse bestätigen" },
  { id: "signin", label: "Anmelden", description: "Mit dem neuen Konto einloggen" },
  { id: "billing", label: "Billing", description: "Checkout oder Portal abschließen" },
  { id: "complete", label: "Fertig", description: "Direkt ins Produkt starten" },
];

export function isKnownStep(step: string): step is OnboardingStepId {
  return ONBOARDING_STEPS.some((item) => item.id === step);
}

export function deriveStepFromStatus(status: OnboardingStatus): OnboardingStepId {
  return status.nextStep;
}

export function getStepIndex(step: OnboardingStepId): number {
  const index = ONBOARDING_STEPS.findIndex((item) => item.id === step);
  return index === -1 ? 0 : index;
}
