"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { fetchApi } from "@/lib/api-client";
import { deriveStepFromStatus, getStepIndex, ONBOARDING_STEPS } from "@/lib/onboarding/steps";
import type {
  BillingInterval,
  OnboardingPlan,
  OnboardingStatus,
  OnboardingStepId,
} from "@/lib/onboarding/types";
import type { AccountFormValues } from "@/components/onboarding/steps/account-step";
import { buildDefaultAccountValues } from "@/components/onboarding/steps/account-step";

export type PendingAction =
  | "signup"
  | "signin"
  | "status"
  | "verify-auto-login"
  | null;

function buildDefaultStatus(): OnboardingStatus {
  return {
    authenticated: false,
    userId: null,
    email: null,
    isEmailVerified: false,
    workspaceId: null,
    role: null,
    canManageBilling: false,
    subscription: null,
    billingProfile: null,
    billingState: "none",
    nextStep: "plan",
  };
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function humanizeError(payload: Record<string, unknown>, fallback: string): string {
  const message = payload.error;
  return typeof message === "string" && message.length > 0 ? message : fallback;
}

export function useOnboardingFlow(
  plans: OnboardingPlan[],
  initialPlanCode: string | null,
  initialStep: OnboardingStepId | null,
  initialVerificationState: { verified: boolean; reason: string | null },
) {
  const [currentStep, setCurrentStep] = useState<OnboardingStepId>(initialStep ?? "plan");
  const [selectedPlanCode, setSelectedPlanCode] = useState<string | null>(
    initialPlanCode ?? plans[0]?.code ?? null,
  );
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("month");
  const [accountValues, setAccountValues] = useState<AccountFormValues>(buildDefaultAccountValues);
  const [signinValues, setSigninValues] = useState({ email: "", password: "" });
  const [status, setStatus] = useState<OnboardingStatus>(buildDefaultStatus);
  const [statusLoading, setStatusLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => p.code === selectedPlanCode) ?? plans[0] ?? null;
  const currentStepIndex = getStepIndex(currentStep);
  const stepMeta = ONBOARDING_STEPS[currentStepIndex];

  // ─── Status refresh ────────────────────────────────────────────────────────

  const refreshStatus = useCallback(
    async (opts?: { silent?: boolean }): Promise<OnboardingStatus> => {
      if (!opts?.silent) setPendingAction("status");
      try {
        const response = await fetchApi("/v1/onboarding/status", { method: "GET" });
        const payload = await parseJson(response);
        if (!response.ok) {
          setStatus(buildDefaultStatus());
          return buildDefaultStatus();
        }
        const next = payload as unknown as OnboardingStatus;
        setStatus(next);
        return next;
      } catch {
        setStatus(buildDefaultStatus());
        return buildDefaultStatus();
      } finally {
        if (!opts?.silent) setPendingAction(null);
      }
    },
    [],
  );

  // Initial status load
  useEffect(() => {
    setStatusLoading(true);
    refreshStatus({ silent: true }).finally(() => setStatusLoading(false));
  }, [refreshStatus]);

  // ─── Auto-login after email verification ───────────────────────────────────

  const tryAutoSigninAfterVerification = useCallback(
    async (
      nextStatus?: OnboardingStatus,
      opts?: { trustVerifiedRedirect?: boolean },
    ): Promise<boolean> => {
      const statusToUse = nextStatus ?? (await refreshStatus({ silent: true }));
      if (!opts?.trustVerifiedRedirect && !statusToUse.isEmailVerified) {
        setSuccessMessage(null);
        setErrorMessage("Die Verifizierung wurde noch nicht erkannt. Bitte den Link aus der E-Mail klicken.");
        return false;
      }

      if (!signinValues.email || !signinValues.password) {
        setSuccessMessage("E-Mail verifiziert. Bitte einmal anmelden, damit wir fortfahren können.");
        setCurrentStep("signin");
        return false;
      }

      setPendingAction("verify-auto-login");
      try {
        const result = await fetchApi("/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: signinValues.email, password: signinValues.password }),
        });
        if (!result.ok) {
          setSuccessMessage("E-Mail verifiziert. Auto-Login fehlgeschlagen, bitte manuell anmelden.");
          setCurrentStep("signin");
          return false;
        }
        const refreshed = await refreshStatus({ silent: true });
        setSuccessMessage("E-Mail verifiziert und automatisch angemeldet.");
        setCurrentStep(deriveStepFromStatus(refreshed));
        return true;
      } catch {
        setErrorMessage("Netzwerkfehler. Bitte versuche es erneut.");
        return false;
      } finally {
        setPendingAction(null);
      }
    },
    [refreshStatus, signinValues.email, signinValues.password],
  );

  const handleContinueAfterVerify = useCallback(async () => {
    setErrorMessage(null);
    const next = await refreshStatus();
    if (!next.isEmailVerified) {
      setErrorMessage("Noch nicht verifiziert. Bitte den Link in deiner E-Mail klicken und erneut prüfen.");
      return;
    }
    await tryAutoSigninAfterVerification(next);
  }, [refreshStatus, tryAutoSigninAfterVerification]);

  // Trigger auto-login when landing on the page with ?verified=1
  const autoLoginTriggeredRef = useRef(false);
  useEffect(() => {
    if (!initialVerificationState.verified) return;
    if (statusLoading || autoLoginTriggeredRef.current) return;
    autoLoginTriggeredRef.current = true;
    void tryAutoSigninAfterVerification(undefined, { trustVerifiedRedirect: true });
  }, [initialVerificationState.verified, statusLoading, tryAutoSigninAfterVerification]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  async function handleSignup() {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedPlanCode) {
      setErrorMessage("Bitte zuerst einen Plan auswählen.");
      return;
    }
    if (
      !accountValues.email ||
      !accountValues.password ||
      !accountValues.fullName ||
      !accountValues.workspaceName ||
      !accountValues.tradeSlug
    ) {
      setErrorMessage("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }
    if (!accountValues.address.line1 || !accountValues.address.postalCode || !accountValues.address.city) {
      setErrorMessage("Bitte eine vollständige Betriebsadresse angeben.");
      return;
    }
    if (accountValues.password.length < 12) {
      setErrorMessage("Das Passwort muss mindestens 12 Zeichen haben.");
      return;
    }

    setPendingAction("signup");
    try {
      const response = await fetchApi("/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: accountValues.email,
          password: accountValues.password,
          fullName: accountValues.fullName,
          workspaceName: accountValues.workspaceName,
          tradeSlug: accountValues.tradeSlug,
          address: accountValues.address,
          planCode: selectedPlanCode,
        }),
      });
      const payload = await parseJson(response);

      if (!response.ok) {
        setErrorMessage(humanizeError(payload, "Signup fehlgeschlagen."));
        return;
      }

      setSigninValues({ email: accountValues.email, password: accountValues.password });
      setSuccessMessage("Konto erfolgreich erstellt. Bitte den Link in der E-Mail klicken.");
      setCurrentStep("verify");
    } catch {
      setErrorMessage("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSignin() {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signinValues.email || !signinValues.password) {
      setErrorMessage("Bitte E-Mail und Passwort angeben.");
      return;
    }

    setPendingAction("signin");
    try {
      const result = await fetchApi("/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signinValues.email, password: signinValues.password }),
      });

      if (!result.ok) {
        setErrorMessage("Anmeldung fehlgeschlagen. Bitte Daten prüfen.");
        return;
      }

      const next = await refreshStatus();
      setSuccessMessage("Anmeldung erfolgreich.");
      setCurrentStep(deriveStepFromStatus(next));
    } catch {
      setErrorMessage("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setPendingAction(null);
    }
  }

  function handleContinueFromPlan() {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedPlan) {
      setErrorMessage("Bitte einen Plan wählen.");
      return;
    }
    if (!status.authenticated) {
      setCurrentStep("account");
      return;
    }
    if (!status.isEmailVerified) {
      setCurrentStep("verify");
      return;
    }
    setCurrentStep("complete");
  }

  return {
    // state
    currentStep,
    currentStepIndex,
    stepMeta,
    selectedPlanCode,
    selectedPlan,
    billingInterval,
    accountValues,
    signinValues,
    status,
    statusLoading,
    pendingAction,
    errorMessage,
    successMessage,
    // setters
    setCurrentStep,
    setSelectedPlanCode,
    setBillingInterval,
    setAccountValues,
    setSigninValues,
    setErrorMessage,
    setSuccessMessage,
    // actions
    handleContinueFromPlan,
    handleSignup,
    handleSignin,
    refreshStatus,
    handleContinueAfterVerify,
    tryAutoSigninAfterVerification,
  };
}
