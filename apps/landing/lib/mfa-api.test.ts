import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { extractUserIdFromJwt, acquireAccessToken, fetchMfaStatus, enableMfa, disableMfa } from "./mfa-api";

// ---- Helper: build a minimal JWT with a given payload ----
function buildJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  const signature = "fake-signature";
  return `${header}.${body}.${signature}`;
}

// ---- extractUserIdFromJwt ----

describe("extractUserIdFromJwt", () => {
  it("extracts the sub claim from a valid JWT", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const jwt = buildJwt({ sub: userId, exp: 9999999999 });

    expect(extractUserIdFromJwt(jwt)).toBe(userId);
  });

  it("returns null when JWT has no sub claim", () => {
    const jwt = buildJwt({ exp: 9999999999, iss: "zunftgewerk" });
    expect(extractUserIdFromJwt(jwt)).toBeNull();
  });

  it("returns null for a token with fewer than 3 parts", () => {
    expect(extractUserIdFromJwt("only.two")).toBeNull();
    expect(extractUserIdFromJwt("single")).toBeNull();
  });

  it("returns null for a token with more than 3 parts", () => {
    expect(extractUserIdFromJwt("a.b.c.d")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(extractUserIdFromJwt("")).toBeNull();
  });

  it("returns null when payload is not valid JSON", () => {
    const jwt = "header.!!!invalidbase64.signature";
    expect(extractUserIdFromJwt(jwt)).toBeNull();
  });

  it("handles base64url-encoded payloads with + and / substitutions", () => {
    // Build a payload that uses base64url characters (- and _)
    const userId = "user-with-special_chars";
    const payload = JSON.stringify({ sub: userId });
    // Encode to base64url (replace + with -, / with _, strip =)
    const base64 = btoa(payload);
    const base64url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const jwt = `header.${base64url}.signature`;

    expect(extractUserIdFromJwt(jwt)).toBe(userId);
  });
});

// ---- acquireAccessToken ----

describe("acquireAccessToken", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns the access token on successful refresh", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ accessToken: "jwt-abc-123" }), { status: 200 })
    );

    const token = await acquireAccessToken();
    expect(token).toBe("jwt-abc-123");
  });

  it("returns null when response has no accessToken", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );

    const token = await acquireAccessToken();
    expect(token).toBeNull();
  });

  it("returns null when fetch throws a network error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );

    const token = await acquireAccessToken();
    expect(token).toBeNull();
  });

  it("calls POST /v1/auth/refresh with credentials include", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ accessToken: "tok" }), { status: 200 })
    );

    await acquireAccessToken();

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://localhost:8080/v1/auth/refresh",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
  });
});

// ---- fetchMfaStatus ----

describe("fetchMfaStatus", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns mfaEnabled true when API responds with mfaEnabled true", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ mfaEnabled: true }), { status: 200 })
    );

    const result = await fetchMfaStatus();
    expect(result).toEqual({ mfaEnabled: true });
  });

  it("returns mfaEnabled false when API responds with mfaEnabled false", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ mfaEnabled: false }), { status: 200 })
    );

    const result = await fetchMfaStatus();
    expect(result).toEqual({ mfaEnabled: false });
  });

  it("returns mfaEnabled false when mfaEnabled is not a boolean", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ mfaEnabled: "yes" }), { status: 200 })
    );

    const result = await fetchMfaStatus();
    expect(result).toEqual({ mfaEnabled: false });
  });

  it("returns null on fetch error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Connection refused")
    );

    const result = await fetchMfaStatus();
    expect(result).toBeNull();
  });
});

// ---- enableMfa ----

describe("enableMfa", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns enrollment data on success", async () => {
    const enrollment = {
      secret: "JBSWY3DPEHPK3PXP",
      provisioningUri: "otpauth://totp/Zunftgewerk:user@example.com?secret=JBSWY3DPEHPK3PXP",
      backupCodes: ["code1", "code2", "code3"],
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify(enrollment), { status: 200, headers: { "Content-Type": "application/json" } })
    );

    const result = await enableMfa("access-token-123", "user-id-456");
    expect(result).toEqual(enrollment);
  });

  it("returns error object when API responds with error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "MFA already enabled" }), { status: 400 })
    );

    const result = await enableMfa("token", "user-id");
    expect(result).toEqual({ error: "MFA already enabled" });
  });

  it("returns default German error message when API error has no error field", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 500 })
    );

    const result = await enableMfa("token", "user-id");
    expect(result).toEqual({ error: "MFA-Aktivierung fehlgeschlagen" });
  });

  it("returns error with exception message on network failure", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Connection reset")
    );

    const result = await enableMfa("token", "user-id");
    expect(result).toEqual({ error: "Connection reset" });
  });

  it("sends correct headers including Bearer auth", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ secret: "s", provisioningUri: "u", backupCodes: [] }), { status: 200 })
    );

    await enableMfa("my-access-token", "my-user-id");

    const calledInit = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(calledInit.headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/json",
        Authorization: "Bearer my-access-token",
      })
    );
    expect(JSON.parse(calledInit.body)).toEqual({ userId: "my-user-id" });
  });
});

// ---- disableMfa ----

describe("disableMfa", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns disabled true on success", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ disabled: true }), { status: 200 })
    );

    const result = await disableMfa("token", "123456", null);
    expect(result).toEqual({ disabled: true });
  });

  it("sends TOTP code when provided", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );

    await disableMfa("token", "123456", null);

    const calledInit = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(JSON.parse(calledInit.body)).toEqual({ code: "123456", backupCode: null });
  });

  it("sends backup code when provided", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 })
    );

    await disableMfa("token", null, "backup-abc");

    const calledInit = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(JSON.parse(calledInit.body)).toEqual({ code: null, backupCode: "backup-abc" });
  });

  it("returns error when API responds with failure", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid code" }), { status: 400 })
    );

    const result = await disableMfa("token", "wrong", null);
    expect(result).toEqual({ error: "Invalid code" });
  });

  it("returns default German error message on API failure without error field", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(JSON.stringify({}), { status: 500 })
    );

    const result = await disableMfa("token", "code", null);
    expect(result).toEqual({ error: "MFA-Deaktivierung fehlgeschlagen" });
  });

  it("returns error with exception message on network failure", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Timeout")
    );

    const result = await disableMfa("token", "code", null);
    expect(result).toEqual({ error: "Timeout" });
  });
});
