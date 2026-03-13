'use client';

import { refreshSession } from '@/lib/auth-client';

export const ACCESS_TOKEN_STORAGE_KEY = 'zg_access_token';
let cachedAccessToken: string | null = null;
let cachedAccessTokenExpiresAt: number | null = null;
let refreshInFlight: Promise<string | null> | null = null;
const REFRESH_SKEW_MS = 5_000;

function isCachedTokenValid(): boolean {
  if (!cachedAccessToken || !cachedAccessTokenExpiresAt) return false;
  return Date.now() + REFRESH_SKEW_MS < cachedAccessTokenExpiresAt;
}

export async function getAccessToken(forceRefresh = false): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  if (!forceRefresh && isCachedTokenValid()) return cachedAccessToken;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const session = await refreshSession();
        cachedAccessToken = session.accessToken ?? null;
        cachedAccessTokenExpiresAt = session.expiresAt
          ? Date.parse(session.expiresAt)
          : Date.now() + 60_000;
        if (Number.isNaN(cachedAccessTokenExpiresAt)) {
          cachedAccessTokenExpiresAt = Date.now() + 60_000;
        }
        return cachedAccessToken;
      } catch {
        cachedAccessToken = null;
        cachedAccessTokenExpiresAt = null;
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

export function clearAccessToken() {
  if (typeof window === 'undefined') return;
  cachedAccessToken = null;
  cachedAccessTokenExpiresAt = null;
  refreshInFlight = null;
}
