"use client";

import { Mail } from "lucide-react";
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

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError("Bitte gib deine E-Mail-Adresse ein.");
      return;
    }

    setPending(true);
    try {
      const res = await fetchApi("/v1/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        setError("Anfrage fehlgeschlagen. Bitte versuche es erneut.");
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
      kickerLabel="Wiederherstellung"
      error={error}
      footerLink={{ href: "/login", label: "Zurück zur Anmeldung", prefix: "Passwort doch bekannt?" }}
    >
      {success ? (
        <div className="space-y-4">
          <SuccessAlert title="E-Mail gesendet">
            Falls ein Konto mit dieser Adresse existiert, haben wir dir einen Code zum
            Zurücksetzen gesendet. Prüfe auch deinen Spam-Ordner.
          </SuccessAlert>

          <Button asChild variant="gradient" className="h-10 w-full">
            <Link href="/reset-password">
              <Mail className="h-4 w-4" />
              Code eingeben
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="forgot-email" className="billing-enterprise-label text-foreground">
              E-Mail
            </Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10"
              required
            />
          </div>

          <LoadingButton
            type="submit"
            variant="gradient"
            pending={pending}
            icon={Mail}
            pendingText="Sende..."
            className="h-10 w-full"
          >
            Link senden
          </LoadingButton>
        </>
      )}
    </AuthFormCard>
  );
}
