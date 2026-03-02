"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { fetchApi } from "@/lib/api-client";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { GENERIC_ERROR_MESSAGE } from "@/components/auth/form-error";
import { SuccessAlert } from "@/components/auth/success-alert";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token || !password) {
      setError("Bitte alle Felder ausfüllen.");
      return;
    }

    if (password.length < 12) {
      setError("Das Passwort muss mindestens 12 Zeichen lang sein.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setPending(true);
    try {
      const res = await fetchApi("/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json().catch(() => null);
        setError(
          (data as { error?: string } | null)?.error ??
            "Zurücksetzen fehlgeschlagen. Der Code ist möglicherweise abgelaufen."
        );
      }
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthFormCard
      onSubmit={handleSubmit}
      kickerLabel="Neues Passwort"
      error={error}
      footerLink={{ href: "/forgot-password", label: "Erneut anfordern", prefix: "Keinen Code erhalten?" }}
    >
      {success ? (
        <div className="space-y-4">
          <SuccessAlert title="Passwort geändert">
            Dein Passwort wurde erfolgreich zurückgesetzt. Du kannst dich jetzt anmelden.
          </SuccessAlert>

          <Button asChild variant="gradient" className="h-10 w-full">
            <Link href="/login">
              <ShieldCheck className="h-4 w-4" />
              Zur Anmeldung
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="reset-token" className="billing-enterprise-label text-foreground">
              Code aus der E-Mail
            </Label>
            <Input
              id="reset-token"
              type="text"
              autoComplete="one-time-code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Code einfügen..."
              className="h-10 font-mono"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-password" className="billing-enterprise-label text-foreground">
              Neues Passwort
            </Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10"
              required
            />
            <p className="text-muted-foreground text-xs">Mindestens 12 Zeichen</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-confirm" className="billing-enterprise-label text-foreground">
              Passwort bestätigen
            </Label>
            <Input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10"
              required
            />
          </div>

          <LoadingButton
            type="submit"
            variant="gradient"
            pending={pending}
            icon={ShieldCheck}
            pendingText="Speichere..."
            className="h-10 w-full"
          >
            Passwort ändern
          </LoadingButton>
        </>
      )}
    </AuthFormCard>
  );
}
