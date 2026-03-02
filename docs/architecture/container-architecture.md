# Container Architecture (C4 Level 2)

## Container Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                           Zunftgewerk                                  │
│                                                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐      │
│  │  Landing App    │  │    Web App      │  │   Mobile App     │      │
│  │                 │  │                 │  │                  │      │
│  │  Next.js 16    │  │  Next.js 16    │  │  Expo 55         │      │
│  │  App Router    │  │  App Router    │  │  React Native    │      │
│  │  Port 3000     │  │  Port 3001     │  │  0.84.1          │      │
│  │                 │  │                 │  │                  │      │
│  │  Marketing,    │  │  Tenant admin, │  │  Offline-first   │      │
│  │  auth flows,   │  │  license mgmt, │  │  field client,   │      │
│  │  onboarding,   │  │  operations    │  │  encrypted DB,   │      │
│  │  dashboard     │  │  cockpit       │  │  sync engine     │      │
│  └───────┬─────────┘  └───────┬─────────┘  └────────┬─────────┘      │
│          │ REST (cookie)      │ REST (bearer)        │ gRPC           │
│          └────────────────────┼───────────────────────┘               │
│                               ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                     Spring Boot API                            │   │
│  │                                                                │   │
│  │  Java 21 • Spring Boot 3.3.6 • Modular Monolith              │   │
│  │                                                                │   │
│  │  ┌──────────┐ ┌────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ │   │
│  │  │ Identity │ │ Tenant │ │  Plan   │ │ Billing │ │  Sync  │ │   │
│  │  │          │ │        │ │         │ │         │ │        │ │   │
│  │  │ Auth,JWT │ │ Roles, │ │ Plans,  │ │ Stripe, │ │ Vector │ │   │
│  │  │ Passkeys │ │ Perms  │ │ Subs    │ │ Webhooks│ │ Clock  │ │   │
│  │  └──────────┘ └────────┘ └─────────┘ └─────────┘ └────────┘ │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐                  │   │
│  │  │ License  │ │  Audit   │ │  Onboarding  │                  │   │
│  │  │          │ │          │ │              │                  │   │
│  │  │ Devices, │ │ Immutable│ │ Multi-step   │                  │   │
│  │  │ Seats    │ │ Events   │ │ Progress     │                  │   │
│  │  └──────────┘ └──────────┘ └──────────────┘                  │   │
│  │                                                                │   │
│  │  REST :8080  •  gRPC :9090  •  Flyway Migrations             │   │
│  └──────────┬──────────────────────────┬─────────────────────────┘   │
│             │                          │                              │
│    ┌────────┴─────────┐      ┌─────────┴────────┐                    │
│    │   PostgreSQL 16  │      │     Redis 7      │                    │
│    │                  │      │                  │                    │
│    │  zunftgewerk DB  │      │  Rate limiting,  │                    │
│    │  Flyway managed  │      │  session cache   │                    │
│    │  Port 5432       │      │  Port 6379       │                    │
│    └──────────────────┘      └──────────────────┘                    │
└────────────────────────────────────────────────────────────────────────┘
```

## Container Details

### Landing App (`apps/landing`)

| Attribute | Value |
|---|---|
| Runtime | Next.js 16.1.6 (App Router, Server Components) |
| Port | 3000 |
| Package | `@zunftgewerk/landing` |
| UI Stack | Tailwind v4, Radix UI 1.4.3, Framer Motion 12, Three.js |
| Fonts | Chakra Petch (display), IBM Plex Sans (body) |
| API Communication | REST with `credentials: "include"` (cookie-based auth) |

**Key Routes:**

| Route | Purpose |
|---|---|
| `/` | Landing homepage (hero, features, pricing, CTA) |
| `/login` | Email/password login with MFA support |
| `/signup` | Direct signup |
| `/onboarding` | 6-step wizard (plan → account → verify → signin → billing → complete) |
| `/forgot-password`, `/reset-password` | Password recovery flow |
| `/pricing` | Pricing comparison page |
| `/legal/*` | Privacy, terms, imprint |
| `/(authenticated)/dashboard/*` | Protected workspace dashboard, billing, employees, settings |
| `/api/address/*` | Next.js API routes proxying OpenRouteService |

**Session detection:** `getSession()` calls `GET /v1/onboarding/status` with forwarded cookies. Unauthenticated users are redirected to `/login`.

### Web App (`apps/web`)

| Attribute | Value |
|---|---|
| Runtime | Next.js 16.1.6 (App Router) |
| Port | 3001 |
| Package | `@zunftgewerk/web` |
| UI Stack | Tailwind v4, Lucide React |
| API Communication | Bearer JWT in Authorization header |
| E2E Tests | Playwright 1.58.2 |

**Key Routes:**

| Route | Purpose |
|---|---|
| `/(auth)/signin` | Login with credentials, passkey, and MFA |
| `/(dashboard)/dashboard` | Tenant operations overview |
| `/(dashboard)/licenses` | License seat management |

### Mobile App (`apps/mobile`)

| Attribute | Value |
|---|---|
| Runtime | Expo 55 / React Native 0.84.1 |
| Package | `@zunftgewerk/mobile` |
| Storage | SQLCipher (encrypted) via expo-secure-store |
| API Communication | gRPC (Protocol Buffers) |
| Sync | Vector-clock based push/pull with conflict resolution |

**Key Capabilities:**
- Offline-first with encrypted local database
- Deterministic sync with server via vector clocks
- Device key managed in iOS Keychain / Android Keystore

### Spring Boot API (`services/api`)

| Attribute | Value |
|---|---|
| Runtime | Java 21, Spring Boot 3.3.6 |
| REST Port | 8080 |
| gRPC Port | 9090 |
| Database | PostgreSQL 16 (Flyway migrations) |
| Cache | Redis 7 (rate limiting, sessions) |
| Build | Gradle 9.3.1 |

**Dual protocol:** REST for web frontends, gRPC for mobile app. Both share the same business logic modules.

### PostgreSQL

| Attribute | Value |
|---|---|
| Version | 16 |
| Database | `zunftgewerk` |
| Schema Management | Flyway (V1–V8 migrations) |
| Key Invariant | All tenant-owned entities carry `tenant_id` with ON DELETE CASCADE |

### Redis

| Attribute | Value |
|---|---|
| Version | 7 |
| Uses | Auth rate limiting, session cache |
| Persistence | Not configured (ephemeral) |

## Inter-Container Communication

```
Landing App ──── REST (cookie) ───→ API :8080
                                     │
Web App    ──── REST (bearer) ───→ API :8080
                                     │
Mobile App ──── gRPC ────────────→ API :9090
                                     │
                              ┌──────┴──────┐
                              │             │
                         PostgreSQL      Redis
                           :5432         :6379
```

### Protocol Selection Rationale

| Client | Protocol | Why |
|---|---|---|
| Landing | REST + cookies | Server Components need cookie forwarding; standard browser auth |
| Web | REST + bearer | Client-side SPA auth with localStorage token |
| Mobile | gRPC | Strongly typed contracts, efficient binary serialization, streaming support for sync |
