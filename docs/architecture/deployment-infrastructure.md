# Deployment & Infrastructure

## Local Development Stack

```
┌───────────────────────────────────────────────────┐
│                docker-compose                      │
│                                                    │
│  ┌──────────────┐  ┌────────┐  ┌───────────────┐ │
│  │ PostgreSQL 16│  │Redis 7 │  │   Mailpit     │ │
│  │ :5432        │  │ :6379  │  │ SMTP :1025    │ │
│  │              │  │        │  │ UI   :8025    │ │
│  └──────────────┘  └────────┘  └───────────────┘ │
└───────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│                Application Layer                      │
│                                                       │
│  pnpm dev:landing    pnpm dev:web    gradle bootRun  │
│  (Next.js :3000)     (Next.js :3001) (API :8080/:9090)│
│                                                       │
│  pnpm dev:mobile                                      │
│  (Expo Metro)                                         │
└──────────────────────────────────────────────────────┘
```

### Quick Start

```bash
# 1. Start infrastructure
docker compose -f infra/docker-compose.yml up -d

# 2. Install frontend deps
pnpm install

# 3. Start backend
cd services/api && gradle bootRun

# 4. Start frontends (separate terminals)
pnpm dev:landing    # http://localhost:3000
pnpm dev:web        # http://localhost:3001
pnpm dev:mobile     # Expo dev server
```

### Docker Compose Services

| Service | Image | Port | Volume | Purpose |
|---|---|---|---|---|
| `zunftgewerk-postgres` | postgres:16 | 5432 | `pg_data` | Primary database |
| `zunftgewerk-redis` | redis:7 | 6379 | — | Rate limiting, session cache |
| `zunftgewerk-mailpit` | mailpit | SMTP 1025, UI 8025 | — | Local email testing |

## Kubernetes Architecture

```
┌─────────────────────────────────────────────────┐
│               namespace: zunftgewerk             │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │         API Deployment (2 replicas)       │   │
│  │                                           │   │
│  │  ┌─────────┐  ┌─────────┐               │   │
│  │  │ Pod 1   │  │ Pod 2   │               │   │
│  │  │ :8080   │  │ :8080   │               │   │
│  │  │ :9090   │  │ :9090   │               │   │
│  │  └─────────┘  └─────────┘               │   │
│  └──────────────────┬───────────────────────┘   │
│                     │                            │
│  ┌──────────────────┴───────────────────────┐   │
│  │         API Service (ClusterIP)           │   │
│  │         gRPC :9090                        │   │
│  └──────────────────┬───────────────────────┘   │
│                     │                            │
│  ┌──────────────────┴───────────────────────┐   │
│  │         Envoy Gateway                     │   │
│  │         HTTP/2 → gRPC bridge              │   │
│  │         CORS support                      │   │
│  │         :8080                             │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Kubernetes Resources

**Namespace:** `zunftgewerk`

**API Deployment:**
- Replicas: 2
- Image: `ghcr.io/<org>/zunftgewerk-api:latest`
- Ports: 9090 (gRPC)
- Resources:
  - Requests: 250m CPU / 512Mi memory
  - Limits: 1000m CPU / 1Gi memory
- Secrets: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `JWT_ISSUER`

**API Service:**
- Type: ClusterIP
- Port: 9090 (gRPC)

**Envoy Gateway:**
- HTTP/2 support for gRPC-web
- CORS configuration
- Routes to `zunftgewerk-api:9090`
- Listens on port 8080

## CI/CD Pipeline

### GitHub Actions (`ci.yml`)

Triggered on: push to `main`, all pull requests.

```
┌──────────────────────────────────────────────────┐
│                 CI Pipeline                       │
│                                                   │
│  ┌─────────────────────┐  ┌────────────────────┐ │
│  │     web (parallel)  │  │   api (parallel)   │ │
│  │                     │  │                    │ │
│  │  ubuntu-latest      │  │  ubuntu-latest     │ │
│  │  Node.js 22         │  │  Java 21 (Temurin) │ │
│  │  pnpm 10            │  │  Gradle            │ │
│  │                     │  │                    │ │
│  │  1. pnpm install    │  │  1. gradle test    │ │
│  │  2. build landing   │  │                    │ │
│  │  3. build web       │  │                    │ │
│  └─────────────────────┘  └────────────────────┘ │
└──────────────────────────────────────────────────┘
```

| Job | Runner | Steps |
|---|---|---|
| `web` | ubuntu-latest, Node 22, pnpm 10 | Install deps → build landing → build web |
| `api` | ubuntu-latest, Java 21 | Gradle test (H2 in-memory) |

### E2E Testing

```bash
# Prerequisites
cp apps/web/.env.e2e.example apps/web/.env.e2e
# Fill: E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, E2E_ADMIN_TOTP_SECRET

# Seed test user (requires running Postgres container)
./scripts/e2e-seed-web-user.sh

# Run tests (auto-starts web dev server)
pnpm --filter @zunftgewerk/web test:e2e
```

The seed script:
1. Generates Argon2id password hash using JShell + Gradle-cached JVM jars
2. Encrypts TOTP secret with AES-128-GCM using `MFA_ENCRYPTION_KEY`
3. Inserts test tenant, user, membership, and MFA secret into PostgreSQL

## Build System

### Monorepo Orchestration

```
┌────────────────────────────────────────────┐
│             Turborepo (turbo.json)          │
│                                            │
│  build:  dependsOn: [^build]              │
│          outputs: [.next/**, dist/**, build/**]
│                                            │
│  dev:    cache: false, persistent: true    │
│                                            │
│  lint:   dependsOn: [^lint]               │
│                                            │
│  typecheck: dependsOn: [^typecheck]       │
└────────────────────────────────────────────┘

pnpm-workspace.yaml:
  - apps/*        (landing, web, mobile)
  - packages/*    (proto)
```

### Build Commands

| Command | Scope | Tool |
|---|---|---|
| `pnpm build` | All packages | Turborepo |
| `pnpm --filter @zunftgewerk/landing build` | Landing app | Next.js |
| `pnpm --filter @zunftgewerk/web build` | Web app | Next.js |
| `pnpm typecheck` | All packages | TypeScript |
| `pnpm lint` | All packages | ESLint |
| `cd services/api && gradle build` | Backend API | Gradle |
| `cd services/api && gradle test` | API tests | JUnit (H2) |

### Proto Build Integration

Proto files in `packages/proto/` are compiled into Java stubs at API build time via Gradle `sourceSets` override pointing to `../../packages/proto`.

## Environment Configuration

### Required Environment Variables

| Variable | Service | Purpose |
|---|---|---|
| `DATABASE_URL` | API | PostgreSQL JDBC connection |
| `DATABASE_USERNAME` | API | DB user |
| `DATABASE_PASSWORD` | API | DB password |
| `JWT_PRIVATE_KEY_PEM` | API | RS256 signing key |
| `JWT_PUBLIC_KEY_PEM` | API | RS256 verification key |
| `MFA_ENCRYPTION_KEY` | API + E2E seed | AES-128-GCM key for TOTP |
| `STRIPE_SECRET_KEY` | API | Stripe API authentication |
| `STRIPE_WEBHOOK_SECRET` | API | Webhook signature verification |
| `PASSKEY_RP_ID` | API | WebAuthn relying party ID |
| `PASSKEY_ORIGIN` | API | Must match frontend origin exactly |
| `NEXT_PUBLIC_API_URL` | Landing | API base URL for landing app |
| `NEXT_PUBLIC_API_BASE_URL` | Web | API base URL for web app |
| `OPENROUTESERVICE_API_KEY` | Landing | Geocoding API key |

See `.env.example` at repository root for the complete list with defaults.
