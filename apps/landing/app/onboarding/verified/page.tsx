"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";

/**
 * Landing page for the email verification link.
 *
 * When the user clicks the verification link in their email a new browser tab
 * opens here. This page:
 *   1. Broadcasts a "verified" message on the shared BroadcastChannel so that
 *      the existing onboarding tab (if still open) receives it and triggers the
 *      auto-login flow there.
 *   2. If an existing tab picks up the message it replies with "ack", and this
 *      tab closes itself after a short delay.
 *   3. If no existing tab replies within 1.5 s (e.g. the user opened the link
 *      without a pre-existing onboarding tab), this page falls back to the
 *      normal redirect so the flow continues here.
 */
export default function OnboardingVerifiedPage() {
  const router = useRouter();
  const closedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      router.replace("/onboarding?step=verify&verified=1");
      return;
    }

    const channel = new BroadcastChannel("email-verification");

    // Listen for an acknowledgement from the existing tab.
    channel.onmessage = (event: MessageEvent) => {
      if (event.data === "ack" && !closedRef.current) {
        closedRef.current = true;
        channel.close();
        window.close();
      }
    };

    // Broadcast the verification event.
    channel.postMessage("verified");

    // Fallback: if no existing tab acknowledged within 1.5 s, redirect here.
    const fallbackTimer = setTimeout(() => {
      if (!closedRef.current) {
        channel.close();
        router.replace("/onboarding?step=verify&verified=1");
      }
    }, 1500);

    return () => {
      clearTimeout(fallbackTimer);
      channel.close();
    };
  }, [router]);

  return (
    <div className="flex min-h-svh items-center justify-center p-6 text-center">
      <div className="space-y-3">
        <MailCheck className="mx-auto h-10 w-10 text-primary" />
        <p className="text-lg font-semibold">E-Mail bestätigt</p>
        <p className="text-sm text-muted-foreground">
          Du kannst diesen Tab schließen und zum Onboarding zurückkehren.
        </p>
      </div>
    </div>
  );
}
