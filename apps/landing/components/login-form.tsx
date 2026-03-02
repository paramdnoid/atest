"use client";

import { LogIn, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { fetchApi } from "@/lib/api-client";
import { AuthFormCard } from "@/components/auth/auth-form-card";
import { GENERIC_ERROR_MESSAGE } from "@/components/auth/form-error";
import { LoadingButton } from "@/components/ui/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

type Step = "credentials" | "mfa";

type MfaContext = {
  userId: string;
  mfaToken: string;
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<Step>("credentials");
  const [mfaContext, setMfaContext] = useState<MfaContext | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function redirectToDashboard() {
    window.location.href = `${APP_URL}/dashboard`;
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Bitte E-Mail und Passwort eingeben.");
      return;
    }

    setPending(true);
    try {
      const res = await fetchApi("/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;

      if (!res.ok) {
        setError(
          typeof data?.error === "string"
            ? data.error
            : "Anmeldung fehlgeschlagen. Bitte Daten prüfen.",
        );
        return;
      }

      if (data?.state === "MFA_REQUIRED") {
        setMfaContext({
          userId: String(data.userId),
          mfaToken: String(data.mfaToken),
        });
        setStep("mfa");
        return;
      }

      // state === "AUTHENTICATED" — refresh cookie already set by server
      redirectToDashboard();
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!mfaContext) return;

    if (!mfaCode) {
      setError(useBackupCode ? "Bitte Backup-Code eingeben." : "Bitte Authenticator-Code eingeben.");
      return;
    }

    setPending(true);
    try {
      const res = await fetchApi("/v1/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: mfaContext.userId,
          mfaToken: mfaContext.mfaToken,
          code: useBackupCode ? null : mfaCode,
          backupCode: useBackupCode ? mfaCode : null,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        setError(
          typeof data?.error === "string" ? data.error : "Code ungültig. Bitte erneut versuchen.",
        );
        return;
      }

      // Refresh cookie already set by server
      redirectToDashboard();
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  if (step === "mfa") {
    return (
      <AuthFormCard
        onSubmit={handleMfa}
        kickerLabel="Zwei-Faktor"
        error={error}
        footerLink={{ href: "/login", label: "Anmeldung abbrechen", prefix: "" }}
        extraFooter={
          <p className="text-center text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setUseBackupCode((v) => !v);
                setMfaCode("");
                setError(null);
              }}
              className="text-primary hover:underline"
            >
              {useBackupCode ? "Authenticator-Code verwenden" : "Backup-Code verwenden"}
            </button>
          </p>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="mfa-code" className="billing-enterprise-label text-foreground">
            {useBackupCode ? "Backup-Code" : "Authenticator-Code"}
          </Label>
          <Input
            id="mfa-code"
            type="text"
            inputMode={useBackupCode ? undefined : "numeric"}
            autoComplete={useBackupCode ? "off" : "one-time-code"}
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            placeholder={useBackupCode ? "XXXXXXXX" : "000000"}
            maxLength={useBackupCode ? 20 : 6}
            className={`h-10 font-mono${useBackupCode ? "" : " tracking-widest text-center"}`}
            required
            autoFocus
          />
          {!useBackupCode && (
            <p className="text-xs text-muted-foreground">
              6-stelliger Code aus deiner Authenticator-App
            </p>
          )}
        </div>

        <LoadingButton
          type="submit"
          variant="gradient"
          pending={pending}
          icon={ShieldCheck}
          pendingText="Prüfe..."
          className="h-10 w-full"
        >
          Bestätigen
        </LoadingButton>
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard
      onSubmit={handleCredentials}
      kickerLabel="Zugang"
      error={error}
      footerLink={{ href: "/onboarding", label: "Jetzt registrieren", prefix: "Noch kein Konto?" }}
      extraFooter={
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Passwort vergessen?
          </Link>
        </p>
      }
    >
      <div className="space-y-2">
        <Label htmlFor="login-email" className="billing-enterprise-label text-foreground">
          E-Mail
        </Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password" className="billing-enterprise-label text-foreground">
          Passwort
        </Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10"
          required
        />
      </div>

      <LoadingButton
        type="submit"
        variant="gradient"
        pending={pending}
        icon={LogIn}
        pendingText="Anmeldung..."
        className="h-10 w-full"
      >
        Anmelden
      </LoadingButton>
    </AuthFormCard>
  );
}
