import { apiJson } from '@/lib/http-client';

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

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiJson<LoginResponse>('/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export type PasskeyBeginResponse = {
  challenge: string;
  challengeId: string;
  mode: 'register' | 'authenticate';
  options: string;
};

export async function beginPasskey(email: string, mode: 'register' | 'authenticate'): Promise<PasskeyBeginResponse> {
  return apiJson<PasskeyBeginResponse>('/v1/auth/passkey/begin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, mode }),
  });
}

export async function verifyPasskey(
  email: string,
  challengeId: string,
  credentialJson: string,
  mode: 'register' | 'authenticate'
): Promise<LoginResponse> {
  return apiJson<LoginResponse>('/v1/auth/passkey/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, challengeId, credentialJson, mode }),
  });
}

export async function verifyMfa(userId: string, mfaToken: string, code?: string, backupCode?: string) {
  return apiJson<{ verified: boolean; accessToken: string; expiresAt: string }>('/v1/auth/mfa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      mfaToken,
      code: code ?? '',
      backupCode: backupCode ?? '',
    }),
  });
}

export async function refreshSession() {
  return apiJson<{ accessToken: string; expiresAt: string }>('/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

export async function logoutSession() {
  return apiJson<{ revoked: boolean }>('/v1/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}
