"use client";

import { CircleCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CompleteStep() {
  return (
    <div className="space-y-4">
      <div className="billing-enterprise-panel-strong rounded-xl p-5 sm:p-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/12 shadow-[0_0_0_8px_rgba(16,185,129,0.08)]">
          <CircleCheck className="h-7 w-7 text-emerald-600" />
        </div>
        <h3 className="hero-text-gloss font-display mt-4 text-center text-2xl leading-none">
          Onboarding abgeschlossen
        </h3>
        <p className="billing-enterprise-muted mx-auto mt-3 max-w-xl text-center text-sm">
          Dein Zugang ist eingerichtet. Du kannst direkt starten.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild className="bg-linear-to-r from-primary to-amber-500 text-primary-foreground">
          <Link href="/dashboard">Zum Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
