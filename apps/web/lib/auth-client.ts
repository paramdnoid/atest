import { apiJson } from '@/lib/http-client';
import { expectRecord, optionalArray, optionalString } from '@/lib/validation';

export type LoginAuthenticatedResponse = {
  state: 'AUTHENTICATED';
  userId: string;
  tenantId: string;
  roles: string[];
  accessToken: string;
  expiresAt: string;
};

export type LoginMfaRequiredResponse = {
  state: 'MFA_REQUIRED';
  userId: string;
  tenantId: string;
  roles: string[];
  mfaToken: string;
};

export type LoginResponse = LoginAuthenticatedResponse | LoginMfaRequiredResponse;

function parseLoginResponse(payload: unknown): LoginResponse {
  const record = expectRecord(payload, 'Login');
  const state = optionalString(record.state);
  if (state === 'AUTHENTICATED') {
    const userId = optionalString(record.userId);
    const tenantId = optionalString(record.tenantId);
    const accessToken = optionalString(record.accessToken);
    const expiresAt = optionalString(record.expiresAt);
    if (!userId || !tenantId || !accessToken || !expiresAt) {
      throw new Error('Ungueltige Antwort fuer Login (AUTHENTICATED).');
    }
    return {
      state: 'AUTHENTICATED',
      userId,
      tenantId,
      roles: optionalArray(record.roles, (entry) => (typeof entry === 'string' ? entry : null)),
      accessToken,
      expiresAt,
    };
  }
  if (state === 'MFA_REQUIRED') {
    const userId = optionalString(record.userId);
    const tenantId = optionalString(record.tenantId);
    const mfaToken = optionalString(record.mfaToken);
    if (!userId || !tenantId || !mfaToken) {
      throw new Error('Ungueltige Antwort fuer Login (MFA_REQUIRED).');
    }
    return {
      state: 'MFA_REQUIRED',
      userId,
      tenantId,
      roles: optionalArray(record.roles, (entry) => (typeof entry === 'string' ? entry : null)),
      mfaToken,
    };
  }
  throw new Error('Ungueltiger Login-Status.');
}

function parsePasskeyBeginResponse(payload: unknown): PasskeyBeginResponse {
  const record = expectRecord(payload, 'Passkey Begin');
  const challenge = optionalString(record.challenge);
  const challengeId = optionalString(record.challengeId);
  const mode = optionalString(record.mode);
  const options = optionalString(record.options);
  if (!challenge || !challengeId || !options || (mode !== 'register' && mode !== 'authenticate')) {
    throw new Error('Ungueltige Antwort fuer Passkey Begin.');
  }
  return { challenge, challengeId, mode, options };
}

function parseMfaVerifyResponse(payload: unknown): { verified: boolean; accessToken: string; expiresAt: string } {
  const record = expectRecord(payload, 'MFA Verify');
  const verified = record.verified === true;
  const accessToken = optionalString(record.accessToken);
  const expiresAt = optionalString(record.expiresAt);
  if (!accessToken || !expiresAt) {
    throw new Error('Ungueltige Antwort fuer MFA Verify.');
  }
  return { verified, accessToken, expiresAt };
}

function parseRefreshResponse(payload: unknown): { accessToken: string; expiresAt: string } {
  const record = expectRecord(payload, 'Session Refresh');
  const accessToken = optionalString(record.accessToken);
  const expiresAt = optionalString(record.expiresAt);
  if (!accessToken || !expiresAt) {
    throw new Error('Ungueltige Antwort fuer Session Refresh.');
  }
  return { accessToken, expiresAt };
}

function parseLogoutResponse(payload: unknown): { revoked: boolean } {
  const record = expectRecord(payload, 'Logout');
  return { revoked: record.revoked === true };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const payload = await apiJson<unknown>('/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseLoginResponse(payload);
}

export type PasskeyBeginResponse = {
  challenge: string;
  challengeId: string;
  mode: 'register' | 'authenticate';
  options: string;
};

export async function beginPasskey(email: string, mode: 'register' | 'authenticate'): Promise<PasskeyBeginResponse> {
  const payload = await apiJson<unknown>('/v1/auth/passkey/begin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, mode }),
  });
  return parsePasskeyBeginResponse(payload);
}

export async function verifyPasskey(
  email: string,
  challengeId: string,
  credentialJson: string,
  mode: 'register' | 'authenticate'
): Promise<LoginResponse> {
  const payload = await apiJson<unknown>('/v1/auth/passkey/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, challengeId, credentialJson, mode }),
  });
  return parseLoginResponse(payload);
}

export async function verifyMfa(userId: string, mfaToken: string, code?: string, backupCode?: string) {
  const payload = await apiJson<unknown>('/v1/auth/mfa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      mfaToken,
      code: code ?? '',
      backupCode: backupCode ?? '',
    }),
  });
  return parseMfaVerifyResponse(payload);
}

export async function refreshSession() {
  const payload = await apiJson<unknown>('/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return parseRefreshResponse(payload);
}

export async function logoutSession() {
  const payload = await apiJson<unknown>('/v1/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  return parseLogoutResponse(payload);
}
