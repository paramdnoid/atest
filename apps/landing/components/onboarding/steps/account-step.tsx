"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { cn } from "@/lib/utils";

export type AccountFormValues = {
  fullName: string;
  workspaceName: string;
  email: string;
  password: string;
  tradeSlug: string;
  addressLine1: string;
  addressPostalCode: string;
  addressCity: string;
  addressCountryCode: string;
};

export function buildDefaultAccountValues(): AccountFormValues {
  return {
    fullName: "",
    workspaceName: "",
    email: "",
    password: "",
    tradeSlug: "",
    addressLine1: "",
    addressPostalCode: "",
    addressCity: "",
    addressCountryCode: "DE",
  };
}

export function AccountStep({
  values,
  pending,
  tradeOptions,
  onChange,
  onSubmit,
  onBack,
}: {
  values: AccountFormValues;
  pending: boolean;
  tradeOptions: Array<{ slug: string; name: string }>;
  onChange: (next: AccountFormValues) => void;
  onSubmit: () => void;
  onBack?: () => void;
}) {
  const [subStep, setSubStep] = useState<"access" | "business">("access");

  return (
    <div className="space-y-3">
      <div className="onboarding-segmented-control billing-enterprise-panel rounded-xl border border-border/70 p-1.5">
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold uppercase tracking-[0.09em]">
          {(["access", "business"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubStep(tab)}
              className={cn(
                "relative rounded-lg px-3 py-2.5 text-left transition-colors",
                subStep === tab
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {subStep === tab && (
                <motion.span
                  layoutId="account-sub-step-pill"
                  className="bg-primary absolute inset-0 rounded-md shadow-[0_10px_24px_-14px_rgba(249,115,22,0.85)]"
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                />
              )}
              <span className="relative z-10">{tab === "access" ? "Zugang" : "Betrieb"}</span>
            </button>
          ))}
        </div>
      </div>

      {subStep === "access" && (
        <section className="billing-enterprise-panel rounded-xl border border-border/70 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <p className="billing-editorial-meta inline-flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5" />
                Zugang
              </p>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="full-name">Vollständiger Name</Label>
              <Input
                id="full-name"
                className="h-10"
                value={values.fullName}
                onChange={(e) => onChange({ ...values, fullName: e.target.value })}
                placeholder="Max Muster"
                autoComplete="name"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="account-email">E-Mail</Label>
              <Input
                id="account-email"
                type="email"
                className="h-10"
                value={values.email}
                onChange={(e) => onChange({ ...values, email: e.target.value })}
                placeholder="name@betrieb.de"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="trade-slug">Gewerk</Label>
              <select
                id="trade-slug"
                value={values.tradeSlug}
                onChange={(e) => onChange({ ...values, tradeSlug: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:outline-none"
              >
                <option value="">Gewerk auswählen</option>
                {tradeOptions.map((option) => (
                  <option key={option.slug} value={option.slug}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="account-password">Passwort (mindestens 12 Zeichen)</Label>
              <Input
                id="account-password"
                type="password"
                className="h-10"
                value={values.password}
                onChange={(e) => onChange({ ...values, password: e.target.value })}
                placeholder="Sicheres Passwort"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={() => setSubStep("business")}>
              Weiter zu Betrieb
            </Button>
          </div>
        </section>
      )}

      {subStep === "business" && (
        <section className="billing-enterprise-panel rounded-xl border border-border/70 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <p className="billing-editorial-meta inline-flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Betrieb
              </p>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="workspace-name">Name des Betriebs</Label>
              <Input
                id="workspace-name"
                className="h-10"
                value={values.workspaceName}
                onChange={(e) => onChange({ ...values, workspaceName: e.target.value })}
                placeholder="Musterbetrieb GmbH"
                autoComplete="organization"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="address-line1">Straße & Hausnummer</Label>
              <Input
                id="address-line1"
                className="h-10"
                value={values.addressLine1}
                onChange={(e) => onChange({ ...values, addressLine1: e.target.value })}
                placeholder="Musterstraße 1"
                autoComplete="street-address"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address-postal">PLZ</Label>
              <Input
                id="address-postal"
                className="h-10"
                value={values.addressPostalCode}
                onChange={(e) => onChange({ ...values, addressPostalCode: e.target.value })}
                placeholder="12345"
                autoComplete="postal-code"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address-city">Ort</Label>
              <Input
                id="address-city"
                className="h-10"
                value={values.addressCity}
                onChange={(e) => onChange({ ...values, addressCity: e.target.value })}
                placeholder="Berlin"
                autoComplete="address-level2"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="address-country">Land</Label>
              <select
                id="address-country"
                value={values.addressCountryCode}
                onChange={(e) => onChange({ ...values, addressCountryCode: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] focus-visible:outline-none"
              >
                <option value="DE">Deutschland</option>
                <option value="AT">Österreich</option>
                <option value="CH">Schweiz</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setSubStep("access")}>
              Zurück
            </Button>
            <LoadingButton
              type="button"
              pending={pending}
              pendingText="Konto erstellen..."
              onClick={onSubmit}
            >
              Konto erstellen
            </LoadingButton>
          </div>
        </section>
      )}

      {onBack && (
        <div className="flex justify-start">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            Zurück zu Plan
          </Button>
        </div>
      )}
    </div>
  );
}
