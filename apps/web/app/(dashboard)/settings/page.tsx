'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, KeyRound, Shield } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { beginPasskey, verifyPasskey } from '@/lib/auth-client';
import { createRegistration } from '@/lib/webauthn';

type MfaStatus = {
  mfaEnabled: boolean;
  totpSetup?: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const [mfa, setMfa] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  // Passkey registration state
  const [email, setEmail] = useState('');
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');
  const [passkeySuccess, setPasskeySuccess] = useState('');

  const canUsePasskey = useMemo(
    () => typeof window !== 'undefined' && !!window.PublicKeyCredential,
    [],
  );

  const fetchStatus = useCallback(async () => {
    const token = localStorage.getItem('zg_access_token');
    if (!token) {
      router.push('/signin');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest<MfaStatus>({ path: '/v1/auth/mfa/status', token });
      setMfa(data);
    } catch {
      // MFA status endpoint may not exist yet — show placeholder
      setMfa({ mfaEnabled: false });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Load email for passkey registration from workspace
    const token = localStorage.getItem('zg_access_token');
    if (token) {
      apiRequest<{ email?: string }>({ path: '/v1/workspace/me', token })
        .then((ws) => setEmail(ws.email ?? ''))
        .catch(() => {});
    }
    fetchStatus();
  }, [fetchStatus]);

  const handlePasskeyRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!canUsePasskey || !email) return;
    setPasskeyLoading(true);
    setPasskeyError('');
    setPasskeySuccess('');
    try {
      const begin = await beginPasskey(email, 'register');
      const credentialJson = await createRegistration(begin.options);
      await verifyPasskey(email, begin.challengeId, credentialJson, 'register');
      setPasskeySuccess('Passkey erfolgreich registriert.');
    } catch (err) {
      setPasskeyError(err instanceof Error ? err.message : 'Passkey-Registrierung fehlgeschlagen.');
    } finally {
      setPasskeyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-12">
        <div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
        <div className="mt-8 space-y-4">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-12">
      <h1 className="text-3xl font-semibold">Einstellungen</h1>
      <p className="mt-1 text-sm text-muted-foreground">Sicherheit & Authentifizierung</p>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {status && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {status}
        </div>
      )}

      {/* MFA Status */}
      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2.5">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Zwei-Faktor-Authentifizierung (MFA)</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          MFA schützt dein Konto mit einem zeitbasierten Einmalpasswort (TOTP).
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              mfa?.mfaEnabled
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {mfa?.mfaEnabled ? 'Aktiviert' : 'Deaktiviert'}
          </span>
          {!mfa?.mfaEnabled && (
            <p className="text-xs text-muted-foreground">
              MFA-Enrollment über die Anmeldungsseite verfügbar.
            </p>
          )}
        </div>
      </section>

      {/* Passkey Registration */}
      <section className="mt-4 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2.5">
          <KeyRound className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Passkey</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Registriere einen hardwaregebundenen Passkey (WebAuthn) für passwortlose Anmeldung.
        </p>

        {!canUsePasskey ? (
          <p className="mt-4 text-sm text-amber-600">
            Passkeys werden in diesem Browser nicht unterstützt.
          </p>
        ) : (
          <form className="mt-4" onSubmit={handlePasskeyRegister}>
            <Button
              type="submit"
              variant="outline"
              disabled={passkeyLoading || !email}
              className="gap-2"
            >
              <KeyRound className="h-4 w-4" />
              {passkeyLoading ? 'Registrierung läuft…' : 'Neuen Passkey registrieren'}
            </Button>
            {passkeySuccess && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {passkeySuccess}
              </p>
            )}
            {passkeyError && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                {passkeyError}
              </p>
            )}
          </form>
        )}
      </section>
    </div>
  );
}
