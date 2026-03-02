# Zunftgewerk

Enterprise-first Multi-Tenant SaaS scaffold for:

- Landing page (`apps/landing`)
- Web app (`apps/web`)
- Mobile app (`apps/mobile`)
- gRPC-first backend (`services/api`)
- Protobuf contracts (`packages/proto`)
- Infrastructure baseline (`infra`)

## Tech Stack

- Frontend: Next.js + shadcn/ui + Tailwind CSS
- Mobile: Expo React Native (offline-first ready)
- Backend: Spring Boot modular monolith + gRPC + Postgres
- Billing: Stripe integration points
- Sync: server-authoritative with vector-clock aware conflict metadata

## Monorepo Layout

- `apps/landing` - marketing and pricing
- `apps/web` - tenant admin and core web operations
- `apps/mobile` - field/offline client
- `services/api` - backend services and data model
- `packages/proto` - protobuf service definitions
- `infra` - docker, k8s, and gateway artifacts

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 10+
- Java 21+
- Docker (optional for local Postgres/Redis)

### Install

```bash
pnpm install
```

### Run frontend apps

```bash
pnpm dev:landing
pnpm dev:web
pnpm dev:mobile
```

### Run API

```bash
cd services/api
gradle bootRun
```

### Local infrastructure

```bash
docker compose -f infra/docker-compose.yml up -d
```

## Web E2E (Playwright + WebAuthn + MFA)

These tests run against a running API and start the web app automatically via Playwright `webServer`.

Required environment variables:

```bash
export E2E_ADMIN_EMAIL="admin@example.com"
export E2E_ADMIN_PASSWORD="your-password"
export E2E_ADMIN_TOTP_SECRET="BASE32SECRET"
```

Optional overrides:

```bash
export E2E_BASE_URL="http://127.0.0.1:3001"
export E2E_API_BASE_URL="http://localhost:8080"
```

Run:

```bash
pnpm --filter @zunftgewerk/web test:e2e
```

Important: `PASSKEY_ORIGIN` on the API must match `E2E_BASE_URL` origin (scheme + host + port), otherwise WebAuthn verification will fail.

## Security Baseline

- Tenant-scoped data model (`tenant_id` on tenant-owned entities)
- Immutable audit event table
- Idempotent client operation tracking for sync
- Key-sealed local encryption strategy documented for web/mobile
- RS256 JWT with JWKS endpoint and rotating refresh tokens
- Passkey challenge flow and TOTP MFA step-up for admin roles
- Stripe webhook processing with idempotent event store

## Status

This repository is a production-oriented foundation scaffold. It includes:

- Architectural boundaries
- Domain entities
- Proto contracts
- Migration baseline
- CI skeleton

Feature-complete business workflows still require implementation and integration (Auth providers, Stripe runtime config, passkeys, MFA, and full sync transport wiring).
