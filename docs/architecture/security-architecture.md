# Security Architecture

## Authentication Overview

Zunftgewerk supports three authentication methods with optional MFA enforcement:

```
┌──────────────────────────────────────────────────────────────┐
│                    Authentication Methods                     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Email +    │  │   Passkey    │  │   Token Refresh  │  │
│  │   Password   │  │  (WebAuthn)  │  │   (Rotation)     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                  │                   │            │
│         └──────────────────┼───────────────────┘            │
│                            ▼                                │
│                    ┌──────────────┐                         │
│                    │  MFA Check   │ (admin/owner only)      │
│                    │  (TOTP)      │                         │
│                    └──────┬───────┘                         │
│                           ▼                                 │
│                    ┌──────────────┐                         │
│                    │  JWT Issue   │                         │
│                    │  (RS256)     │                         │
│                    └──────────────┘                         │
└──────────────────────────────────────────────────────────────┘
```

## JWT Token Architecture

### Token Types

| Token | TTL | Transport | Purpose |
|---|---|---|---|
| Access Token | 15 min | Response body | API authorization |
| Refresh Token | 30 days | HTTP-only cookie OR body | Session continuity |
| MFA Token | 5 min | Response body | Intermediate MFA state |

### Access Token Claims (RS256)

```json
{
  "sub": "user-uuid",
  "tid": "tenant-uuid",
  "roles": ["owner", "admin"],
  "mfa": true,
  "amr": ["password", "mfa"],
  "iss": "zunftgewerk",
  "aud": "zunftgewerk",
  "kid": "zunftgewerk-v1",
  "exp": 1700000000,
  "iat": 1700000000
}
```

**`amr` values:** `password`, `passkey`, `mfa`, `refresh`

### Key Management

- **Algorithm:** RSA-2048 with RS256 signing
- **Key rotation:** Manual via `JWT_PRIVATE_KEY_PEM` / `JWT_PUBLIC_KEY_PEM` env vars
- **Public key discovery:** `/.well-known/jwks.json` (JwksController)
- **Fallback:** Auto-generated key pair if PEM env vars are not set

## Authentication Flows

### Email/Password Login

```
Client                              Server
  │                                    │
  │  POST /v1/auth/login               │
  │  { email, password }               │
  │ ──────────────────────────────────→ │
  │                                    ├─ Rate limit check (5/60s)
  │                                    ├─ Find user by email
  │                                    ├─ Argon2id verify password
  │                                    │
  │                          ┌─────────┤ MFA required?
  │                          │ YES     │ NO
  │                          ▼         ▼
  │                   Issue MFA    Issue tokens
  │                   token (5m)   (access + refresh)
  │                          │         │
  │  { state: MFA_REQUIRED,  │         │  { state: AUTHENTICATED,
  │    mfaToken, userId }    │         │    accessToken, expiresAt }
  │ ←────────────────────────┘         │  Set-Cookie: refresh_token
  │                                    │ ←─────────────────────────
  │  POST /v1/auth/mfa/verify          │
  │  { userId, mfaToken, code }        │
  │ ──────────────────────────────────→ │
  │                                    ├─ Rate limit (10/300s)
  │                                    ├─ Verify TOTP (±1 window)
  │                                    ├─ Issue full tokens
  │  { accessToken, expiresAt }        │
  │  Set-Cookie: refresh_token         │
  │ ←────────────────────────────────── │
```

### Passkey (WebAuthn) Flow

**Registration:**

```
Client                              Server
  │                                    │
  │  POST /v1/auth/passkey/begin       │
  │  { email, mode: REGISTER }        │
  │ ──────────────────────────────────→ │
  │                                    ├─ Rate limit (10/60s)
  │                                    ├─ Create AuthChallenge (5m TTL)
  │                                    ├─ RelyingParty.startRegistration()
  │  { challengeId, publicKeyOptions } │
  │ ←────────────────────────────────── │
  │                                    │
  │  navigator.credentials.create()    │
  │  (user interacts with authenticator)
  │                                    │
  │  POST /v1/auth/passkey/verify      │
  │  { email, challengeId, credential }│
  │ ──────────────────────────────────→ │
  │                                    ├─ Load + validate AuthChallenge
  │                                    ├─ RelyingParty.finishRegistration()
  │                                    ├─ Store PasskeyCredential
  │                                    ├─ Issue tokens
  │  { accessToken, expiresAt }        │
  │  Set-Cookie: refresh_token         │
  │ ←────────────────────────────────── │
```

**Authentication** follows the same pattern with `startAssertion()` / `finishAssertion()`.

### Token Refresh (Rotation)

```
Client                              Server
  │                                    │
  │  POST /v1/auth/refresh             │
  │  Cookie: refresh_token=<token>     │
  │ ──────────────────────────────────→ │
  │                                    ├─ Hash token (SHA-256)
  │                                    ├─ Lookup by hash
  │                                    ├─ Validate: not revoked, not expired
  │                                    ├─ Revoke old token
  │                                    ├─ Issue new token (same familyId)
  │  { accessToken, expiresAt }        │
  │  Set-Cookie: refresh_token=<new>   │
  │ ←────────────────────────────────── │
```

**Reuse Detection:**

```
                 familyId: ABC
           ┌──────────┬──────────┐
           ▼          ▼          ▼
        Token-1    Token-2    Token-3
        (revoked)  (revoked)  (active)
           │
           └──→ Reuse attempt!
                    │
                    ▼
             Revoke ALL in family ABC
             Audit: REFRESH_REUSE_DETECTED
```

## MFA (TOTP)

### Enrollment

```
POST /v1/auth/mfa/enable (requires valid access token)
  │
  ├─ Generate 20-byte secret
  ├─ Encrypt with AES-128-GCM
  │   ├─ Key: SHA-256(MFA_ENCRYPTION_KEY)
  │   ├─ IV: 12 random bytes
  │   └─ Auth tag: 128 bits
  ├─ Generate 8 backup codes (Base64)
  ├─ Hash backup codes (SHA-256)
  ├─ Store MfaSecretEntity
  ├─ Set user.mfaEnabled = true
  │
  └─ Response:
      ├─ provisioningUri (otpauth://totp/...)
      └─ backupCodes[] (one-time display)
```

### TOTP Parameters

| Parameter | Value |
|---|---|
| Algorithm | SHA-1 |
| Digits | 6 |
| Period | 30 seconds |
| Window | ±1 (90-second tolerance) |
| Standard | RFC 6238 |

### MFA Enforcement Rules

| Role | MFA Required | Behavior |
|---|---|---|
| owner | Yes | Login returns `MFA_REQUIRED` until TOTP verified |
| admin | Yes | Same as owner |
| member | No | Login proceeds directly to `AUTHENTICATED` |

## Rate Limiting

Redis-backed per-IP/fingerprint rate limiting:

| Endpoint | Limit | Window | Response |
|---|---|---|---|
| Login | 5 attempts | 60 seconds | 429 + `retryAfterSeconds` |
| Passkey | 10 attempts | 60 seconds | 429 + `retryAfterSeconds` |
| MFA verify | 10 attempts | 300 seconds | 429 + `retryAfterSeconds` |
| Token refresh | 30 attempts | 60 seconds | 429 + `retryAfterSeconds` |

## Cookie Configuration

| Attribute | Value |
|---|---|
| Name | `refresh_token` |
| HttpOnly | `true` |
| Secure | Configurable (`AUTH_COOKIE_SECURE`) |
| SameSite | `Lax` (configurable) |
| Max-Age | 2,592,000 (30 days) |
| Path | `/` |

## CORS Policy

| Setting | Value |
|---|---|
| Allowed Origins | Configurable (default: `http://localhost:3000,http://localhost:3001`) |
| Allow Credentials | `true` |
| Allowed Methods | GET, POST, PUT, PATCH, DELETE, OPTIONS |
| Allowed Headers | All |

## Public Routes (No Auth Required)

| Route | Purpose |
|---|---|
| `/actuator/health` | Health check |
| `/actuator/info` | App info |
| `/.well-known/jwks.json` | JWT public key discovery |
| `/webhooks/stripe` | Stripe webhook ingestion (signature-verified) |
| `/internal/billing/stripe-webhooks/dead-letter/recover` | Ops recovery (token-verified) |
| `/v1/auth/**` | All authentication endpoints |
| `/v1/onboarding/status` | Onboarding progress (peeks cookie) |

## Cryptographic Algorithms

| Purpose | Algorithm | Parameters |
|---|---|---|
| JWT signing | RS256 | RSA-2048 |
| Password hashing | Argon2id | Default params |
| Token hashing | SHA-256 | — |
| MFA secret encryption | AES-128-GCM | 12-byte IV, 128-bit tag |
| Backup code hashing | SHA-256 | — |
| Email verification token | SecureRandom | 32-byte, Base64 URL-safe |
| Password reset code | SecureRandom | 8 chars, no ambiguous letters (I, O, L) |

## Threat Model Summary

| Threat | Mitigation |
|---|---|
| Credential stuffing | Rate limiting (5/60s login), Argon2id hashing |
| Token replay | Refresh token rotation with family-based reuse detection |
| Token theft | HTTP-only cookies, short access token TTL (15 min) |
| Session hijacking | SameSite=Lax, Secure flag in production |
| MFA bypass | Admin/owner enforcement, encrypted TOTP secrets |
| Phishing (auth) | WebAuthn passkeys bound to RP ID + origin |
| Webhook forgery | Stripe signature verification |
| Brute-force MFA | Rate limiting (10/300s), backup codes hashed |
| Privilege escalation | Role-based access checks at controller layer |

## Monitoring & Metrics

| Metric | Type | Purpose |
|---|---|---|
| `auth_refresh_reuse_detected_total` | Counter | Detect token reuse attacks |
| `stripe_webhook_ingested_total` | Counter (by type) | Webhook processing health |
| `stripe_webhook_dead_letter_events` | Gauge | Failed webhook accumulation |

## Audit Trail

All security-relevant events are recorded in the `audit_events` table:

| Event | Trigger |
|---|---|
| `USER_REGISTERED` | Successful signup |
| `AUTH_LOGIN_SUCCESS` | Successful login |
| `AUTH_LOGIN_FAILED` | Failed login attempt |
| `MFA_ENABLED` | MFA enrollment completed |
| `PASSKEY_REGISTERED` | WebAuthn credential registered |
| `EMAIL_VERIFIED` | Email verification token used |
| `PASSWORD_RESET_REQUESTED` | Password reset initiated |
| `PASSWORD_RESET_COMPLETED` | Password successfully changed |
| `SESSION_REVOKED` | Logout or token revocation |
| `REFRESH_REUSE_DETECTED` | Token reuse attack detected |
