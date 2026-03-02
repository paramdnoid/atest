# Zunftgewerk Architecture Documentation

Enterprise multi-tenant SaaS for the skilled trades industry. This documentation follows the [C4 model](https://c4model.com/) for describing software architecture at multiple levels of abstraction.

## Table of Contents

| Document | Scope |
|---|---|
| [System Context](./system-context.md) | C4 Level 1 — external actors, systems, and boundaries |
| [Container Architecture](./container-architecture.md) | C4 Level 2 — deployable units and their interactions |
| [Component Architecture](./component-architecture.md) | C4 Level 3 — internal modules and responsibilities |
| [Data Architecture](./data-architecture.md) | Schema, migrations, sync engine, data flow |
| [Security Architecture](./security-architecture.md) | Auth, JWT, passkeys, MFA, rate limiting |
| [API Reference](./api-reference.md) | REST endpoints, gRPC services, API contracts |
| [Deployment & Infrastructure](./deployment-infrastructure.md) | Docker, Kubernetes, CI/CD, environments |
| [Architecture Decision Records](./adr/) | Historical decisions and rationale |

## System at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        Zunftgewerk SaaS                         │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Landing  │  │   Web    │  │  Mobile  │  │  Spring Boot  │  │
│  │ Next.js  │  │ Next.js  │  │  Expo    │  │     API       │  │
│  │  :3000   │  │  :3001   │  │          │  │ :8080 / :9090 │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──┬──────┬─────┘  │
│       │              │             │            │      │        │
│       └──────────────┴─────────────┘      ┌────┘      │        │
│                  REST (cookie/bearer)     │     gRPC   │        │
│                                     ┌────┴───┐  ┌────┴───┐    │
│                                     │Postgres│  │ Redis  │    │
│                                     │  :5432 │  │ :6379  │    │
│                                     └────────┘  └────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         ┌─────────┐   ┌──────────┐   ┌────────────┐
         │  Stripe  │   │  SMTP    │   │ OpenRoute  │
         │ Payments │   │  Server  │   │  Service   │
         └─────────┘   └──────────┘   └────────────┘
```

## Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js (App Router) | 16.1.6 |
| Mobile | Expo / React Native | 55 / 0.84.1 |
| UI | Tailwind CSS v4, Radix UI | 4.2.1 / 1.4.3 |
| Backend | Spring Boot (Java 21) | 3.3.6 |
| Database | PostgreSQL | 16 |
| Cache/Sessions | Redis | 7 |
| RPC | gRPC + Protocol Buffers | 1.63.0 / 3.25.5 |
| Build | pnpm + Turborepo / Gradle | 10.30.3 / 9.3.1 |
| E2E Testing | Playwright | 1.58.2 |
