"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import type { BillingInterval, OnboardingPlan } from "@/lib/onboarding/types";

const GENERIC_ERROR_MESSAGE =
  "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";

function formatPrice(cents: number, interval: BillingInterval): string {
  if (cents === 0) return "Kostenlos";
  const amount = Math.round(cents / 100);
  return `EUR ${amount} / ${interval === "year" ? "Jahr" : "Monat"}`;
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!selectedPlan) {
    return (
      <div className="billing-enterprise-panel rounded-xl p-5 text-center text-sm text-muted-foreground">
        Kein Plan ausgewählt. Bitte gehe zurück zum Lizenz-Schritt.
      </div>
    );
  }

  const isFree = selectedPlan.priceMonthlyCents === 0;
  const effectiveCents =
    billingInterval === "year" && selectedPlan.priceYearlyCents != null
      ? selectedPlan.priceYearlyCents
      : selectedPlan.priceMonthlyCents;

  async function handleCheckout() {
    setError(null);
    setPending(true);
    try {
      const res = await fetchApi("/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan!.code,
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
        setError(msg);
        return;
      }

      const data = (await res.json()) as { url?: string };
      if (!data.url) {
        setError(GENERIC_ERROR_MESSAGE);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
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
            {selectedPlan.trialDays} Tage kostenlos testen — keine Kreditkarte erforderlich.
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isFree ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Der Free-Plan ist kostenlos. Kein Checkout nötig.
          </p>
          <div className="flex justify-end">
            <Button type="button" onClick={onSkipToComplete}>
              Weiter
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Du wirst zu Stripe weitergeleitet, um die Zahlung abzuschließen.
            Danach kehrt du automatisch zurück.
          </p>
          <div className="flex justify-end">
            <LoadingButton
              type="button"
              pending={pending}
              icon={ExternalLink}
              iconSize="h-4 w-4"
              onClick={() => {
                void handleCheckout();
              }}
            >
              Zur Zahlung
            </LoadingButton>
          </div>
        </div>
      )}
    </div>
  );
}
