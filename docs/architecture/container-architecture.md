# Container Architecture (C4 Level 2)

Diagrammquelle: `docs/architecture/diagrams/container-view.md`

## Uebersicht

Zunftgewerk besteht aus drei Clients (Landing, Web, Mobile), einem zentralen API-Backend sowie PostgreSQL und Redis.

## Container Details

### Landing App (`apps/landing`)

| Attribute | Value |
|---|---|
| Runtime | Next.js 16.1.6 (App Router, Server Components) |
| Port | 3000 |
| Package | `@zunftgewerk/landing` |
| API Communication | REST mit Cookie-Kontext (`credentials: "include"`) |

Kernrolle: Marketing, Auth-Flows, Onboarding und geschuetzte Basis-Dashboardseiten.

### Web App (`apps/web`)

| Attribute | Value |
|---|---|
| Runtime | Next.js 16.1.6 (App Router) |
| Port | 3001 |
| Package | `@zunftgewerk/web` |
| API Communication | Bearer JWT in Authorization header |

Kernrolle: Tenant-Administration, Team- und Lizenzverwaltung.

### Mobile App (`apps/mobile`)

| Attribute | Value |
|---|---|
| Runtime | Expo 55 / React Native 0.84.1 |
| Package | `@zunftgewerk/mobile` |
| API Communication | gRPC (Protocol Buffers) |

Kernrolle: Offline-first Nutzung und Synchronisation mobiler Arbeitsdaten.

### Spring Boot API (`services/api`)

| Attribute | Value |
|---|---|
| Runtime | Java 21, Spring Boot 3.3.6 |
| REST Port | 8080 |
| gRPC Port | 9090 |
| Database | PostgreSQL 16 (Flyway migrations) |
| Cache | Redis 7 (rate limiting, sessions) |
| Build | Gradle 9.3.1 |

Dual-Protocol-Ansatz: REST fuer Browser-Clients, gRPC fuer Mobile; beide greifen auf dieselbe Fachlogik zu.

### PostgreSQL

| Attribute | Value |
|---|---|
| Version | 16 |
| Database | `zunftgewerk` |
| Schema Management | Flyway |
| Key Invariant | Tenant-bezogene Daten verwenden `tenant_id` und werden tenant-spezifisch abgefragt |

### Redis

| Attribute | Value |
|---|---|
| Version | 7 |
| Uses | Auth rate limiting, session cache |
| Persistence | Not configured (ephemeral) |

## Container-Grenzen und Verantwortungen

- Frontends enthalten keine dauerhafte Geschaeftslogik fuer Kernprozesse; diese liegt im API-Backend.
- API kapselt Domänenlogik und Datenzugriff; Clients greifen ausschliesslich ueber REST/gRPC-Vertraege zu.
- PostgreSQL bleibt die fachliche Quelle der Wahrheit; Redis ist ein technischer Beschleuniger.
