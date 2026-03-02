"use client";

import { useEffect } from "react";
import { MailCheck, RefreshCcw } from "lucide-react";

import { LoadingButton } from "@/components/ui/loading-button";

export function VerifyEmailStep({
  pending,
  autoLoginPending,
  onRefresh,
  onContinue,
  onBroadcastVerified,
}: {
  pending: boolean;
  autoLoginPending: boolean;
  onRefresh: () => void;
  onContinue: () => void;
  onBroadcastVerified: () => void;
}) {
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("email-verification");
    channel.onmessage = (event: MessageEvent) => {
      if (event.data === "verified") {
        channel.postMessage("ack");
        onBroadcastVerified();
      }
    };
    return () => {
      channel.close();
    };
  }, [onBroadcastVerified]);

  return (
    <div className="space-y-5">
      <div className="billing-enterprise-panel-strong rounded-xl p-4 text-sm">
        <p className="inline-flex items-center gap-2 font-semibold">
          <MailCheck className="h-4 w-4 text-primary" />
          Öffne die Bestätigungs-E-Mail und klicke auf den Verifizierungs-Link.
        </p>
        <p className="text-muted-foreground mt-2 text-xs sm:text-sm">
          Danach hier den Status aktualisieren. Sobald die Verifizierung erkannt wird, melden wir dich
          automatisch an.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <LoadingButton
          type="button"
          pending={pending}
          icon={RefreshCcw}
          pendingText="Prüfe Status..."
          onClick={onRefresh}
          disabled={autoLoginPending}
          variant="outline"
        >
          Status aktualisieren
        </LoadingButton>
        <LoadingButton
          type="button"
          pending={autoLoginPending}
          pendingText="Melde dich an..."
          onClick={onContinue}
          disabled={pending}
        >
          Weiter
        </LoadingButton>
      </div>
    </div>
  );
}
