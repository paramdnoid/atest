import { apiPost } from './api';
import { clearTokens } from './storage';

type LoginApiMfaRequired = {
  state: 'MFA_REQUIRED';
  userId: string;
  mfaToken: string;
};

type LoginApiAuthenticated = {
  state: 'AUTHENTICATED';
  userId: string;
  accessToken: string;
};

type LoginApiResponse = LoginApiMfaRequired | LoginApiAuthenticated;

export type LoginResult =
  | { needsMfa: true; mfaToken: string; userId: string }
  | { needsMfa: false; accessToken: string; userId: string };

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await apiPost<LoginApiResponse>('/v1/auth/login', { email, password });

  if (response.state === 'MFA_REQUIRED') {
    return {
      needsMfa: true,
      mfaToken: response.mfaToken,
      userId: response.userId
    };
  }

  return {
    needsMfa: false,
    accessToken: response.accessToken,
    userId: response.userId
  };
}

export async function verifyMfa(userId: string, mfaToken: string, code: string): Promise<{ accessToken: string }> {
  const response = await apiPost<{ verified: boolean; accessToken: string }>('/v1/auth/mfa/verify', {
    userId,
    mfaToken,
    code,
    backupCode: null
  });

  if (!response.verified) {
    throw new Error('MFA verification failed');
  }

  return { accessToken: response.accessToken };
}

export async function refreshSession(): Promise<string> {
  const response = await apiPost<{ accessToken: string }>('/v1/auth/refresh', {});
  return response.accessToken;
}

export async function logout(accessToken: string): Promise<void> {
  try {
    await apiPost<{ revoked: boolean }>('/v1/auth/logout', {}, accessToken);
  } finally {
    await clearTokens();
  }
}
