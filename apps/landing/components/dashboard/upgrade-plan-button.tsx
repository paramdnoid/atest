"use client";

import { useState } from "react";
import { toast } from "sonner";

import { fetchApi } from "@/lib/api-client";
import { LoadingButton } from "@/components/ui/loading-button";

type UpgradePlanButtonProps = {
  planId: string;
  billingCycle?: "monthly" | "yearly";
  label: string;
  variant?: "default" | "outline" | "gradient";
};

export function UpgradePlanButton({
  planId,
  billingCycle = "monthly",
  label,
  variant = "default",
}: UpgradePlanButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleUpgrade() {
    setPending(true);
    try {
      const res = await fetchApi("/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });

      if (!res.ok) {
        let msg = "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // ignore parse error
        }
        toast.error(msg);
        return;
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Kein Checkout-Link erhalten.");
      }
    } catch {
      toast.error("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setPending(false);
    }
  }

  return (
    <LoadingButton
      pending={pending}
      pendingText="Weiterleitung…"
      variant={variant}
      size="sm"
      onClick={handleUpgrade}
    >
      {label}
    </LoadingButton>
  );
}
