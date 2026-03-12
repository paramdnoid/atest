'use client';

import { refreshSession } from '@/lib/auth-client';

export const ACCESS_TOKEN_STORAGE_KEY = 'zg_access_token';

export async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const existing = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (existing) return existing;

  try {
    const session = await refreshSession();
    if (session.accessToken) {
      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.accessToken);
      return session.accessToken;
    }
  } catch {
    return null;
  }

  return null;
}

export function clearAccessToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}
