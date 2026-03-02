# ADR-004: RS256 JWT with Refresh Token Rotation

## Status
Accepted

## Context
The platform needs to authenticate users across three frontends (landing, web, mobile) with different transport requirements. The auth system must support multiple authentication methods (password, passkeys, MFA) and detect token theft.

Requirements:
- Short-lived access tokens to limit exposure
- Long-lived sessions without frequent re-authentication
- Token theft detection
- Stateless access token verification (for scalability)
- Support for cookie-based (web) and header-based (mobile) auth

## Decision
Use **RS256 (RSA-2048) signed JWTs** with a **refresh token rotation** scheme:

- **Access tokens** (15-min TTL): Stateless, verified by any service with the public key. Contain `sub`, `tid`, `roles`, `mfa`, `amr` claims.
- **Refresh tokens** (30-day TTL): Stored hashed (SHA-256) in the database. Rotated on every use — old token is revoked, new token issued.
- **Family-based reuse detection**: All tokens in a rotation chain share a `familyId`. If a revoked token is reused, the entire family is revoked (indicating token theft).
- **MFA tokens** (5-min TTL): Intermediate state during multi-step login.

Transport:
- Landing app: refresh token in HTTP-only cookie
- Web app: access token in localStorage, refresh via cookie
- Mobile app: JWT in gRPC metadata

Public key discovery via `/.well-known/jwks.json`.

## Consequences

**Benefits:**
- Asymmetric keys allow any service to verify tokens without the private key
- Short access TTL limits damage from token compromise
- Rotation + family revocation detects and responds to token theft
- JWKS endpoint enables key rotation without client updates

**Trade-offs:**
- Refresh tokens require database lookup (not stateless)
- Token rotation requires client-side handling of new tokens on every refresh
- RSA-2048 keys are larger than HMAC keys (but negligible at this scale)
- Revocation of access tokens requires waiting for TTL expiry (no real-time revocation)
