const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

type ApiResponse<T> = Promise<T>;

async function postJson<T>(path: string, body: unknown): ApiResponse<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? `Request failed: ${path}`);
  }

  return data as T;
}

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
  return postJson<LoginResponse>('/auth/login', { email, password });
}

export type PasskeyBeginResponse = {
  challenge: string;
  challengeId: string;
  mode: 'register' | 'authenticate';
  options: string;
};

export async function beginPasskey(email: string, mode: 'register' | 'authenticate'): Promise<PasskeyBeginResponse> {
  return postJson<PasskeyBeginResponse>('/auth/passkey/begin', { email, mode });
}

export async function verifyPasskey(
  email: string,
  challengeId: string,
  credentialJson: string,
  mode: 'register' | 'authenticate'
): Promise<LoginResponse> {
  return postJson<LoginResponse>('/auth/passkey/verify', { email, challengeId, credentialJson, mode });
}

export async function verifyMfa(userId: string, mfaToken: string, code?: string, backupCode?: string) {
  return postJson<{ verified: boolean; accessToken: string; expiresAt: string }>('/auth/mfa/verify', {
    userId,
    mfaToken,
    code: code ?? '',
    backupCode: backupCode ?? ''
  });
}

export async function refreshSession() {
  return postJson<{ accessToken: string; expiresAt: string }>('/auth/refresh', {});
}
