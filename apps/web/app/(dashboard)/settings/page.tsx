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
import { ModulePageTemplate } from '@/components/dashboard/module-page-template';
import { ModuleTableCard } from '@/components/dashboard/module-table-card';

type MfaStatus = {
  mfaEnabled: boolean;
  totpSetup?: boolean;
};

function parseMfaStatus(payload: unknown): MfaStatus {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Ungueltige Antwort fuer MFA-Status.');
  }
  const record = payload as Record<string, unknown>;
  return {
    mfaEnabled: Boolean(record.mfaEnabled),
    totpSetup: typeof record.totpSetup === 'boolean' ? record.totpSetup : undefined,
  };
}

function parseWorkspaceEmail(payload: unknown): { email?: string } {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Ungueltige Antwort fuer Workspace-Profil.');
  }
  const record = payload as Record<string, unknown>;
  return {
    email: typeof record.email === 'string' ? record.email : undefined,
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [mfa, setMfa] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      const data = await apiRequest<MfaStatus>({
        path: '/v1/auth/mfa/status',
        token,
        validate: parseMfaStatus,
      });
      setMfa(data);
    } catch {
      // MFA status endpoint may not exist yet — show placeholder
      setMfa({ mfaEnabled: false });
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    async function initialize() {
      const token = await getAccessToken();
      if (token) {
        apiRequest<{ email?: string }>({
          path: '/v1/workspace/me',
          token,
          validate: parseWorkspaceEmail,
        })
          .then((ws) => {
            if (cancelled || controller.signal.aborted) return;
            setEmail(ws.email ?? '');
          })
          .catch(() => {
            if (cancelled || controller.signal.aborted) return;
            setError('Workspace-Profil konnte nicht geladen werden.');
          });
      }
      fetchStatus();
    }

    initialize();
    return () => {
      cancelled = true;
      controller.abort();
    };
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
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <ModulePageTemplate
      title="Einstellungen"
      description="Workspace-Konfiguration anpassen."
      kpis={[]}
      mainTopContent={error ? <p className="text-sm text-destructive">{error}</p> : undefined}
      mainContent={
        <ModuleTableCard icon={Shield} label="Sicherheit" title="Zwei-Faktor-Authentifizierung (MFA)" hasData>
          <p className="text-sm text-muted-foreground">
            MFA schützt dein Konto mit einem zeitbasierten Einmalpasswort (TOTP).
          </p>
          <div className="mt-4 flex items-center gap-3">
            <Badge variant={mfa?.mfaEnabled ? 'default' : 'secondary'}>
              {mfa?.mfaEnabled ? 'Aktiviert' : 'Deaktiviert'}
            </Badge>
            {!mfa?.mfaEnabled && (
              <p className="text-xs text-muted-foreground">MFA-Enrollment über die Anmeldungsseite verfügbar.</p>
            )}
          </div>
        </ModuleTableCard>
      }
      sideContent={
        <ModuleTableCard icon={KeyRound} label="Passkey" title="WebAuthn Registrierung" hasData>
          <p className="text-sm text-muted-foreground">
            Registriere einen hardwaregebundenen Passkey für passwortlose Anmeldung.
          </p>
          {!canUsePasskey ? (
            <p className="mt-4 text-sm text-amber-600">Passkeys werden in diesem Browser nicht unterstützt.</p>
          ) : (
            <form className="mt-4 space-y-3" onSubmit={handlePasskeyRegister}>
              <Button type="submit" variant="outline" disabled={passkeyLoading || !email} className="gap-2">
                <KeyRound className="h-4 w-4" />
                {passkeyLoading ? 'Registrierung läuft…' : 'Neuen Passkey registrieren'}
              </Button>
              {passkeySuccess && (
                <p className="flex items-center gap-1.5 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {passkeySuccess}
                </p>
              )}
              {passkeyError && (
                <p className="flex items-center gap-1.5 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {passkeyError}
                </p>
              )}
            </form>
          )}
        </ModuleTableCard>
      }
    />
  );
}
