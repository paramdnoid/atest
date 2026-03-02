# Component Architecture (C4 Level 3)

## API Module Map

The backend is a **modular monolith** under `com.zunftgewerk.api`. Each module is self-contained with its own controllers, services, entities, and repositories.

```
com.zunftgewerk.api
├── modules/
│   ├── identity/       Auth, JWT, passkeys, MFA, sessions
│   ├── tenant/         Workspaces, memberships, roles
│   ├── plan/           Plan catalog, subscriptions
│   ├── billing/        Stripe integration, webhook processing
│   ├── license/        Devices, seat licensing, entitlements
│   ├── sync/           Vector-clock sync engine
│   ├── audit/          Immutable audit event store
│   └── onboarding/     Multi-step progress tracking
├── config/             Security, CORS, Redis, JPA config
└── shared/             Base entities, tenant context, utils
```

## Module Details

### Identity Module

Owns all authentication and authorization logic.

```
identity/
├── AuthController          REST endpoints (signup, login, passkey, MFA, refresh, logout)
├── JwksController          /.well-known/jwks.json
├── AuthGrpcService         gRPC auth service
├── IdentityService         Orchestrator for all auth operations
├── JwtService              RS256 token issuance and verification
├── PasskeyService          WebAuthn registration + authentication (Yubico)
├── MfaService              TOTP enrollment + verification (AES-128-GCM)
├── RefreshTokenService     Token rotation with family-based reuse detection
├── PasswordHasher          Argon2id hashing
├── AuthRateLimitService    Redis-backed rate limiting
├── AuthCookieService       HTTP-only refresh token cookies
├── EmailService            Verification + password reset emails
├── TokenHashService        SHA-256 hashing for all tokens
├── Entities:
│   ├── UserEntity                  email, passwordHash, mfaEnabled
│   ├── RefreshTokenEntity          tokenHash, familyId, revokedAt, expiresAt
│   ├── MfaSecretEntity             encryptedSecret, hashedBackupCodes
│   ├── PasskeyCredentialEntity     credentialId, cosePublicKey, signCount
│   ├── EmailVerificationTokenEntity tokenHash, usedAt, expiresAt
│   ├── PasswordResetTokenEntity     code, usedAt, expiresAt
│   └── AuthChallengeEntity          challenge, expiresAt (5-min TTL)
```

**JWT Claims:**
- `sub` — user ID
- `tid` — tenant ID
- `roles` — role keys array
- `mfa` — boolean (MFA completed)
- `amr` — authentication methods reference (password, passkey, mfa, refresh)

### Tenant Module

Multi-tenancy: workspace management, team memberships, role-based access.

```
tenant/
├── WorkspaceController     GET/PATCH /v1/workspace/me (name, slug, address, geolocation)
├── TenantGrpcService       gRPC tenant operations
├── Entities:
│   ├── TenantEntity        name, tradeSlug, address (JSON), deviceRegistrationToken
│   ├── MembershipEntity    user ↔ tenant ↔ role link
│   └── RoleEntity          per-tenant role definitions with permission sets
```

### Plan Module

Subscription plan catalog and tenant subscription state.

```
plan/
├── PlanGrpcService         gRPC plan operations
├── PlanCatalog             Hardcoded plan definitions:
│   │                         Free     — 5 seats, $0/mo
│   │                         Starter  — 5 seats, $199/mo
│   │                         Professional — 10 seats, $399/mo
├── Entities:
│   └── SubscriptionEntity  stripeCustomerId, stripeSubscriptionId, status, billingCycle
```

### Billing Module

Stripe payment integration with webhook processing and retry logic.

```
billing/
├── BillingRestController           GET /v1/billing/summary
├── StripeWebhookController         POST /webhooks/stripe
├── StripeWebhookOpsController      Dead-letter recovery endpoint
├── StripeBillingService            Webhook verification, deduplication, processing
├── StripeWebhookRetryWorker        Scheduled retry with exponential backoff
├── Entities:
│   ├── StripeWebhookEventEntity    Event storage with retry metadata
│   └── BillingAuditLogEntity       Billing event audit log
```

**Webhook Processing Pipeline:**

```
Stripe → Signature Verify → Deduplicate → Queue (RECEIVED)
                                              │
                        StripeWebhookRetryWorker (scheduled)
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                          Process OK     Retry (backoff)   Dead Letter
                          (PROCESSED)    (RETRY)           (DEAD_LETTER)
```

### License Module

Device licensing and seat management.

```
license/
├── DeviceController        Full CRUD for devices + license assignment
├── LicenseGrpcService      gRPC license operations
├── Entities:
│   ├── DeviceEntity        name, platform, status (pending/licensed/revoked)
│   ├── SeatLicenseEntity   Per-user seat allocation
│   └── EntitlementEntity   Feature entitlements (key/enabled)
```

### Sync Module

Vector-clock aware bidirectional sync between mobile clients and server.

```
sync/
├── SyncEngineService       Pull, push, and stream operations
├── SyncGrpcService         gRPC sync service (incl. server streaming)
├── Entities:
│   ├── ChangeLogEntity         Immutable changelog with vector clocks + conflict flags
│   ├── ClientOperationEntity   Client operations for idempotency
│   └── EntitySyncStateEntity   Per-entity version + vector clock
```

**Sync Flow:**

```
Mobile Client                          Server
     │                                    │
     │──── PushChanges(ops, vectorClock) ─→│
     │                                    ├── Idempotency check
     │                                    ├── Conflict detection (vector clock comparison)
     │                                    ├── Resolve conflicts
     │                                    ├── Write ChangeLog
     │←── PushResponse(accepted, conflicts)│
     │                                    │
     │──── PullChanges(sinceCursor) ─────→│
     │←── ChangeEvents[] ────────────────│
     │                                    │
     │──── StreamChanges() ──────────────→│
     │←── stream ChangeEvent ────────────│ (server-streaming RPC)
```

### Audit Module

Immutable append-only audit trail for compliance.

```
audit/
├── AuditService            Record events with tenant/actor/type/payload
├── AuditEventEntity        Tenant-scoped, timestamped audit events
```

**Event Types:** `USER_REGISTERED`, `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, `MFA_ENABLED`, `PASSKEY_REGISTERED`, `EMAIL_VERIFIED`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`, `SESSION_REVOKED`, `REFRESH_REUSE_DETECTED`

### Onboarding Module

Tracks multi-step onboarding progress without requiring authentication.

```
onboarding/
├── OnboardingController    GET /v1/onboarding/status (peeks refresh token cookie)
│                           Returns: auth status, email verification, subscription, next step
```

## Shared Infrastructure

```
config/
├── SecurityConfig          Spring Security filter chain, public routes, CORS
├── CorsConfig              Configurable allowed origins
├── RedisConfig             Redis connection factory
├── JpaConfig               JPA/Hibernate settings

shared/
├── BaseEntity              Common fields (id, createdAt, updatedAt)
├── TenantContextHolder     ThreadLocal tenant context for gRPC
├── AuthPrincipalHolder     ThreadLocal auth principal for gRPC
├── GrpcAuthInterceptor     JWT extraction from gRPC metadata
```

## Frontend Component Structure

### Landing App Components

```
components/
├── Layout & Navigation
│   ├── header.tsx              Landing page header
│   ├── app-shell.tsx           Authenticated layout (SidebarProvider)
│   ├── app-sidebar.tsx         Navigation sidebar
│   └── nav-user.tsx            User dropdown
│
├── Landing Sections
│   ├── hero-section.tsx        Hero with Three.js 3D scene
│   ├── features-section.tsx    Feature carousel
│   ├── pricing-section.tsx     Plan comparison cards
│   ├── trades-section.tsx      Trade categories
│   ├── how-it-works-section.tsx Steps walkthrough
│   ├── cta-section.tsx         Call-to-action
│   └── footer.tsx              Site footer
│
├── Auth
│   ├── login-form.tsx          Email/password + MFA + passkey
│   ├── auth-form-card.tsx      Shared card wrapper
│   └── auth-page-shell.tsx     Auth page layout
│
├── Onboarding
│   ├── onboarding-wizard.tsx   6-step orchestrator
│   ├── onboarding-stepper.tsx  Progress indicator
│   ├── address-autocomplete.tsx Leaflet map + search
│   └── steps/                  Individual step components
│
├── Dashboard
│   ├── stats-grid.tsx          KPI cards (members, plan, status)
│   ├── company-info-card.tsx   Workspace metadata
│   ├── billing-events-table.tsx Stripe event timeline
│   ├── devices-panel.tsx       Device management
│   └── leaflet-map.tsx         Address map
│
└── ui/                         30+ Radix UI primitives (button, card, dialog, etc.)
```

## Cross-Module Dependencies

```
                  ┌─────────────┐
                  │  Onboarding │
                  └──────┬──────┘
                         │ reads
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │ Identity │   │  Tenant  │   │   Plan   │
    └────┬─────┘   └────┬─────┘   └────┬─────┘
         │              │              │
         │         ┌────┴────┐         │
         │         ▼         ▼         │
         │    ┌─────────┐ ┌────────┐   │
         │    │ License │ │ Audit  │←──┘
         │    └────┬────┘ └────────┘
         │         │
         └─────────┤
                   ▼
             ┌──────────┐
             │ Billing  │
             └──────────┘
                   │
              ┌────┴────┐
              ▼         ▼
         ┌────────┐ ┌──────┐
         │  Sync  │ │Stripe│
         └────────┘ └──────┘
```
