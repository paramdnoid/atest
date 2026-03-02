import { fetchApi } from "./api-client";

export interface MfaEnrollment {
  secret: string;
  provisioningUri: string;
  backupCodes: string[];
}

/**
 * Calls POST /v1/auth/refresh with cookie auto-sent.
 * Returns the access token on success, or null if refresh fails.
 */
export async function acquireAccessToken(): Promise<string | null> {
  try {
    const response = await fetchApi("/v1/auth/refresh", { method: "POST" });
    const data = await response.json();
    return data.accessToken || null;
  } catch (err) {
    console.error("Failed to acquire access token:", err);
    return null;
  }
}

/**
 * Decodes JWT and extracts the 'sub' claim.
 * Returns the user ID or null if decode fails.
 */
export function extractUserIdFromJwt(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1]);
    const payload = JSON.parse(decoded);
    return payload.sub || null;
  } catch (err) {
    console.error("Failed to extract user ID from JWT:", err);
    return null;
  }
}

/**
 * Calls GET /v1/auth/mfa/status with cookie auth.
 * Returns { mfaEnabled: boolean } or null on failure.
 */
export async function fetchMfaStatus(): Promise<{ mfaEnabled: boolean } | null> {
  try {
    const response = await fetchApi("/v1/auth/mfa/status", { method: "GET" });
    const data = await response.json();
    return { mfaEnabled: data.mfaEnabled === true };
  } catch (err) {
    console.error("Failed to fetch MFA status:", err);
    return null;
  }
}

/**
 * Calls POST /v1/auth/mfa/enable with Bearer JWT.
 * Returns the enrollment data or null on failure.
 */
export async function enableMfa(accessToken: string, userId: string): Promise<MfaEnrollment | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/v1/auth/mfa/enable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ userId }),
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to enable MFA");
    }

    return await response.json();
  } catch (err) {
    console.error("Failed to enable MFA:", err);
    return null;
  }
}

/**
 * Calls POST /v1/auth/mfa/disable with Bearer JWT.
 * Returns { disabled: true } on success or { error: string } on failure.
 */
export async function disableMfa(
  accessToken: string,
  code: string | null,
  backupCode: string | null
): Promise<{ disabled: boolean } | { error: string }> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/v1/auth/mfa/disable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        code: code || null,
        backupCode: backupCode || null
      }),
      credentials: "include",
    });

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || "Failed to disable MFA" };
    }

    return { disabled: true };
  } catch (err) {
    console.error("Failed to disable MFA:", err);
    return { error: (err as Error).message || "An error occurred" };
  }
}
