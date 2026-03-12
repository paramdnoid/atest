'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { AuthFormCard } from '@/components/auth/auth-form-card';
import { GENERIC_ERROR_MESSAGE } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchApi } from '@/lib/fetch-api';

type Step = 'credentials' | 'mfa';
type MfaMode = 'totp' | 'backup' | 'email';

type MfaContext = {
  userId: string;
  mfaToken: string;
};

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<Step>('credentials');
  const [mfaContext, setMfaContext] = useState<MfaContext | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMode, setMfaMode] = useState<MfaMode>('totp');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  function redirectToDashboard() {
    router.push('/dashboard');
    router.refresh();
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }

    setPending(true);
    try {
      const res = await fetchApi('/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      if (!res.ok) {
        setError(
          typeof data?.error === 'string'
            ? data.error
            : 'Anmeldung fehlgeschlagen. Bitte Daten prüfen.',
        );
        return;
      }

      if (data?.state === 'MFA_REQUIRED') {
        setMfaContext({
          userId: String(data.userId),
          mfaToken: String(data.mfaToken),
        });
        setStep('mfa');
        return;
      }

      redirectToDashboard();
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  async function handleSendEmailCode() {
    if (!mfaContext) return;

    setError(null);
    setEmailSending(true);
    setEmailSent(false);

    try {
      const res = await fetchApi('/v1/auth/mfa/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: mfaContext.userId,
          mfaToken: mfaContext.mfaToken,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        setError(
          typeof data?.error === 'string' ? data.error : 'Code konnte nicht gesendet werden.',
        );
        return;
      }

      setMfaMode('email');
      setMfaCode('');
      setEmailSent(true);
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setEmailSending(false);
    }
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!mfaContext) return;

    if (!mfaCode) {
      const labels: Record<MfaMode, string> = {
        totp: 'Bitte Authenticator-Code eingeben.',
        backup: 'Bitte Backup-Code eingeben.',
        email: 'Bitte E-Mail-Code eingeben.',
      };
      setError(labels[mfaMode]);
      return;
    }

    setPending(true);
    try {
      const res = await fetchApi('/v1/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: mfaContext.userId,
          mfaToken: mfaContext.mfaToken,
          code: mfaMode === 'totp' ? mfaCode : null,
          backupCode: mfaMode === 'backup' ? mfaCode : null,
          emailCode: mfaMode === 'email' ? mfaCode : null,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        setError(
          typeof data?.error === 'string' ? data.error : 'Code ungültig. Bitte erneut versuchen.',
        );
        return;
      }

      redirectToDashboard();
    } catch {
      setError(GENERIC_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  function switchMfaMode(mode: MfaMode) {
    setMfaMode(mode);
    setMfaCode('');
    setError(null);
    setEmailSent(false);
  }

  if (step === 'mfa') {
    const labels: Record<MfaMode, string> = {
      totp: 'Authenticator-Code',
      backup: 'Backup-Code',
      email: 'E-Mail-Code',
    };

    const helperTexts: Record<MfaMode, string | null> = {
      totp: '6-stelliger Code aus deiner Authenticator-App',
      backup: null,
      email: '6-stelliger Code aus deiner E-Mail',
    };

    return (
      <AuthFormCard
        onSubmit={handleMfa}
        kickerLabel="Zwei-Faktor"
        error={error}
        footerLink={{ href: '/signin', label: 'Anmeldung abbrechen' }}
        extraFooter={
          <div className="space-y-1 text-center text-sm text-muted-foreground">
            {mfaMode !== 'totp' && (
              <p>
                <button
                  type="button"
                  onClick={() => switchMfaMode('totp')}
                  className="text-primary hover:underline"
                >
                  Authenticator-Code verwenden
                </button>
              </p>
            )}
            {mfaMode !== 'backup' && (
              <p>
                <button
                  type="button"
                  onClick={() => switchMfaMode('backup')}
                  className="text-primary hover:underline"
                >
                  Backup-Code verwenden
                </button>
              </p>
            )}
            {mfaMode !== 'email' && (
              <p>
                <button
                  type="button"
                  onClick={handleSendEmailCode}
                  disabled={emailSending}
                  className="text-primary hover:underline disabled:opacity-50"
                >
                  {emailSending ? 'Sende...' : 'Code per E-Mail senden'}
                </button>
              </p>
            )}
          </div>
        }
      >
        <div className="space-y-2">
          <label htmlFor="mfa-code" className="billing-enterprise-label block text-foreground">
            {labels[mfaMode]}
          </label>
          <Input
            id="mfa-code"
            type="text"
            inputMode={mfaMode === 'backup' ? undefined : 'numeric'}
            autoComplete={mfaMode === 'backup' ? 'off' : 'one-time-code'}
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value)}
            placeholder={mfaMode === 'backup' ? 'XXXXXXXX' : '000000'}
            maxLength={mfaMode === 'backup' ? 20 : 6}
            className={`h-10 font-mono${mfaMode === 'backup' ? '' : ' tracking-widest text-center'}`}
            required
            autoFocus
          />
          {helperTexts[mfaMode] && (
            <p className="text-xs text-muted-foreground">{helperTexts[mfaMode]}</p>
          )}
          {emailSent && mfaMode === 'email' && <p className="text-xs text-green-600">Code gesendet</p>}
        </div>

        <Button type="submit" variant="gradient" disabled={pending} className="h-10 w-full gap-2">
          <ShieldCheck className="h-4 w-4" />
          {pending ? 'Prüfe...' : 'Bestätigen'}
        </Button>
      </AuthFormCard>
    );
  }

  return (
    <AuthFormCard
      onSubmit={handleCredentials}
      kickerLabel="Zugang"
      error={error}
      footerLink={{ href: '/', label: 'Zur Startseite' }}
      extraFooter={
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            Hilfe beim Login?
          </Link>
        </p>
      }
    >
      <div className="space-y-2">
        <label htmlFor="login-email" className="billing-enterprise-label block text-foreground">
          E-Mail
        </label>
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
        <label htmlFor="login-password" className="billing-enterprise-label block text-foreground">
          Passwort
        </label>
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

      <Button type="submit" variant="gradient" disabled={pending} className="h-10 w-full gap-2">
        <LogIn className="h-4 w-4" />
        {pending ? 'Anmeldung...' : 'Anmelden'}
      </Button>
    </AuthFormCard>
  );
}
