"use client";

import { useEffect, useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import { fetchApi } from "@/lib/api-client";
import { stripePromise } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import type { BillingInterval, OnboardingPlan } from "@/lib/onboarding/types";

const GENERIC_ERROR_MESSAGE =
  "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";

function formatPrice(cents: number, interval: BillingInterval): string {
  if (cents <= 0) return "EUR 0";
  const amount = Math.round(cents / 100);
  return `EUR ${amount} / ${interval === "year" ? "Jahr" : "Monat"}`;
}

function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError(null);
    setPending(true);

    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (stripeError) {
        setError(stripeError.message ?? GENERIC_ERROR_MESSAGE);
      } else {
        onSuccess();
      }
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="flex justify-end">
        <LoadingButton type="submit" pending={pending} disabled={!stripe}>
          Zahlungsmethode speichern
        </LoadingButton>
      </div>
    </form>
  );
}

export function BillingStep({
  selectedPlan,
  billingInterval,
  onSkipToComplete,
}: {
  selectedPlan: OnboardingPlan | null;
  billingInterval: BillingInterval;
  onSkipToComplete: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveCents =
    selectedPlan && billingInterval === "year" && selectedPlan.priceYearlyCents != null
      ? selectedPlan.priceYearlyCents
      : selectedPlan?.priceMonthlyCents ?? 0;

  useEffect(() => {
    if (!selectedPlan) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetchApi("/v1/billing/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: selectedPlan.code,
            billingCycle: billingInterval === "year" ? "yearly" : "monthly",
          }),
        });

        if (!res.ok) {
          let msg = GENERIC_ERROR_MESSAGE;
          try {
            const payload = (await res.json()) as Record<string, unknown>;
            if (typeof payload.error === "string" && payload.error.length > 0) {
              msg = payload.error;
            }
          } catch {
            // ignore parse errors
          }
          if (!cancelled) setError(msg);
          return;
        }

        const data = (await res.json()) as { clientSecret?: string };
        if (!data.clientSecret) {
          if (!cancelled) setError(GENERIC_ERROR_MESSAGE);
          return;
        }

        if (!cancelled) setClientSecret(data.clientSecret);
      } catch {
        if (!cancelled) setError(GENERIC_ERROR_MESSAGE);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedPlan, billingInterval]);

  if (!selectedPlan) {
    return (
      <div className="billing-enterprise-panel rounded-xl p-5 text-center text-sm text-muted-foreground">
        Kein Plan ausgewählt. Bitte gehe zurück zum Lizenz-Schritt.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="billing-enterprise-panel-strong rounded-xl p-4 sm:p-5">
        <p className="billing-editorial-meta">Ausgewählter Plan</p>
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <h3 className="billing-editorial-title">{selectedPlan.name}</h3>
          <span className="font-display text-lg font-semibold text-primary">
            {formatPrice(effectiveCents, billingInterval)}
          </span>
        </div>
        {selectedPlan.description && (
          <p className="billing-enterprise-muted mt-1 text-xs">
            {selectedPlan.description}
          </p>
        )}
        {selectedPlan.trialDays > 0 && (
          <p className="mt-2 text-xs text-primary">
            {selectedPlan.trialDays} Tage Testphase aktiv. Die erste Abbuchung erfolgt automatisch nach Trial-Ende.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-3 text-sm text-muted-foreground">
            Zahlungsformular wird geladen…
          </span>
        </div>
      ) : clientSecret ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            locale: "de",
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#6d28d9",
                borderRadius: "8px",
              },
            },
          }}
        >
          <CheckoutForm onSuccess={onSkipToComplete} />
        </Elements>
      ) : null}

      {!loading && !clientSecret && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onSkipToComplete}>
            Später im Dashboard
          </Button>
        </div>
      )}
    </div>
  );
}
