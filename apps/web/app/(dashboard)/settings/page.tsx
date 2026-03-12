'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, KeyRound, Shield } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/session-token';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { beginPasskey, verifyPasskey } from '@/lib/auth-client';
import { createRegistration } from '@/lib/webauthn';
import { PageHeader } from '@/components/dashboard/page-header';
import { DashboardCard, DashboardCardContent } from '@/components/dashboard/cards';
import { ErrorBanner } from '@/components/dashboard/states';

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
    const token = await getAccessToken();
    if (!token) {
      router.push('/signin');
      setLoading(false);
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
    async function initialize() {
      const token = await getAccessToken();
      if (token) {
        apiRequest<{ email?: string }>({ path: '/v1/workspace/me', token })
          .then((ws) => setEmail(ws.email ?? ''))
          .catch(() => {});
      }
      fetchStatus();
    }

    initialize();
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
      <div className="space-y-4">
        <div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Einstellungen" description="Workspace-Konfiguration anpassen." />

      {error && <ErrorBanner message={error} />}
      {status && (
        <div className="billing-editorial-main mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {status}
        </div>
      )}

      <div className="premium-divider" />

      <DashboardCard>
        <DashboardCardContent className="p-6">
          <div className="flex items-center gap-2.5">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold">Zwei-Faktor-Authentifizierung (MFA)</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">MFA schützt dein Konto mit einem zeitbasierten Einmalpasswort (TOTP).</p>
          <div className="mt-4 flex items-center gap-3">
            <Badge variant={mfa?.mfaEnabled ? 'default' : 'secondary'}>
              {mfa?.mfaEnabled ? 'Aktiviert' : 'Deaktiviert'}
            </Badge>
            {!mfa?.mfaEnabled && (
              <p className="text-xs text-muted-foreground">MFA-Enrollment über die Anmeldungsseite verfügbar.</p>
            )}
          </div>
        </DashboardCardContent>
      </DashboardCard>

      <DashboardCard>
        <DashboardCardContent className="p-6">
          <div className="flex items-center gap-2.5">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold">Passkey</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Registriere einen hardwaregebundenen Passkey (WebAuthn) für passwortlose Anmeldung.
          </p>

          {!canUsePasskey ? (
            <p className="mt-4 text-sm text-amber-600">Passkeys werden in diesem Browser nicht unterstützt.</p>
          ) : (
            <form className="mt-4" onSubmit={handlePasskeyRegister}>
              <Button type="submit" variant="outline" disabled={passkeyLoading || !email} className="gap-2">
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
        </DashboardCardContent>
      </DashboardCard>
    </div>
  );
}
