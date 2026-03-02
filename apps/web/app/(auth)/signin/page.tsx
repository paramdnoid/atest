'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  beginPasskey,
  login,
  refreshSession,
  verifyMfa,
  verifyPasskey,
  type LoginResponse
} from '@/lib/auth-client';
import { createAssertion, createRegistration } from '@/lib/webauthn';

type Stage = 'CREDENTIALS' | 'MFA' | 'DONE';

export default function SignInPage() {
  const [stage, setStage] = useState<Stage>('CREDENTIALS');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const canUsePasskey = useMemo(() => typeof window !== 'undefined' && !!window.PublicKeyCredential, []);

  const applyLoginResponse = (response: LoginResponse) => {
    setUserId(response.userId);
    setTenantId(response.tenantId);

    if (response.state === 'MFA_REQUIRED') {
      setStage('MFA');
      setMfaToken(response.mfaToken);
      setStatus('MFA erforderlich. Bitte Code eingeben.');
      return;
    }

    setStage('DONE');
    setAccessToken(response.accessToken);
    setExpiresAt(response.expiresAt);
    localStorage.setItem('zg_access_token', response.accessToken);
    setStatus('Erfolgreich angemeldet.');
  };

  const handleCredentialLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setLoading(true);
    try {
      const response = await login(email, password);
      applyLoginResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskey = async (mode: 'authenticate' | 'register') => {
    setError('');
    setStatus('');
    setLoading(true);

    try {
      if (!canUsePasskey) {
        throw new Error('Passkey wird in diesem Browser nicht unterstuetzt');
      }

      const begin = await beginPasskey(email, mode);
      const credentialJson = mode === 'register'
        ? await createRegistration(begin.options)
        : await createAssertion(begin.options);

      const response = await verifyPasskey(email, begin.challengeId, credentialJson, mode);
      applyLoginResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passkey-Flow fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setLoading(true);

    try {
      const response = await verifyMfa(userId, mfaToken, mfaCode, backupCode);
      setStage('DONE');
      setAccessToken(response.accessToken);
      setExpiresAt(response.expiresAt);
      localStorage.setItem('zg_access_token', response.accessToken);
      setStatus('MFA bestaetigt.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA-Verifikation fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await refreshSession();
      setAccessToken(response.accessToken);
      setExpiresAt(response.expiresAt);
      localStorage.setItem('zg_access_token', response.accessToken);
      setStatus('Session aktualisiert.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Anmeldung</h1>
        <p className="mt-1 text-sm text-muted-foreground">Password oder Passkey, mit MFA Step-up fuer Admin-Rollen.</p>

        {stage === 'CREDENTIALS' && (
          <form className="mt-6 space-y-4" onSubmit={handleCredentialLogin}>
            <div>
              <label className="mb-1 block text-sm font-medium">E-Mail</label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@betrieb.ch"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Passwort</label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              Mit Passwort anmelden
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={() => handlePasskey('authenticate')} disabled={loading || !email}>
              Mit Passkey anmelden
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={() => handlePasskey('register')} disabled={loading || !email}>
              Passkey registrieren
            </Button>
          </form>
        )}

        {stage === 'MFA' && (
          <form className="mt-6 space-y-4" onSubmit={handleMfaVerify}>
            <div>
              <label className="mb-1 block text-sm font-medium">TOTP Code</label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Backup Code (optional)</label>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                placeholder="backup-code"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              MFA bestaetigen
            </Button>
          </form>
        )}

        {stage === 'DONE' && (
          <div className="mt-6 space-y-3 text-sm">
            <p><span className="font-medium">User:</span> {userId}</p>
            <p><span className="font-medium">Tenant:</span> {tenantId}</p>
            <p className="break-all"><span className="font-medium">Access Token:</span> {accessToken}</p>
            <p><span className="font-medium">Expires:</span> {expiresAt}</p>
            <Button type="button" variant="outline" className="w-full" onClick={handleRefresh} disabled={loading}>
              Token refresh
            </Button>
          </div>
        )}

        {status && <p className="mt-4 text-sm text-emerald-700">{status}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>
    </main>
  );
}
