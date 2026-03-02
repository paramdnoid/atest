# System Context (C4 Level 1)

## System Context Diagram

```
                    ┌──────────────┐
                    │  Tradesperson │
                    │   (End User)  │
                    └──────┬───────┘
                           │ uses
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌───────────┐ ┌──────────┐
     │  Landing   │ │    Web    │ │  Mobile  │
     │   Site     │ │ Dashboard │ │   App    │
     │  (Browser) │ │ (Browser) │ │(iOS/And) │
     └─────┬──────┘ └─────┬─────┘ └────┬─────┘
           │               │             │
           └───────────────┼─────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │                        │
              │    Zunftgewerk API     │
              │    (Spring Boot)       │
              │                        │
              └──┬─────┬─────┬────┬───┘
                 │     │     │    │
        ┌────────┘     │     │    └────────┐
        ▼              ▼     ▼             ▼
   ┌─────────┐   ┌────────┐ ┌──────┐ ┌──────────┐
   │ Stripe  │   │  SMTP  │ │Redis │ │PostgreSQL│
   │Payments │   │ Server │ │      │ │          │
   └─────────┘   └────────┘ └──────┘ └──────────┘
        │
        ▼
   ┌─────────┐
   │ Stripe  │
   │Dashboard│
   │ (Admin) │
   └─────────┘
```

## Actors

| Actor | Type | Description |
|---|---|---|
| Tradesperson | Human | End user who manages their trade business (electrician, plumber, etc.) |
| Business Owner | Human | Tenant owner who manages subscription, billing, team members |
| Field Worker | Human | Uses mobile app for offline-first job documentation |
| Stripe Admin | Human | Finance team managing billing via Stripe Dashboard |

## External Systems

| System | Integration | Purpose |
|---|---|---|
| **Stripe** | REST API + Webhooks | Payment processing, subscription lifecycle, invoicing |
| **SMTP Server** | SMTP (port 587) | Email delivery for verification, password reset |
| **OpenRouteService** | REST API | Address autocomplete and reverse geocoding |
| **Mailpit** (dev only) | SMTP (port 1025) | Local email testing with web UI at :8025 |

## System Boundaries

### Internal (owned by Zunftgewerk)

- **Landing App** — Marketing site, auth flows, onboarding wizard, authenticated dashboard
- **Web App** — Tenant admin dashboard, license management, sync operations cockpit
- **Mobile App** — Offline-first field client with encrypted local storage and deterministic sync
- **API** — Modular monolith handling all business logic, auth, billing, sync

### External (third-party)

- Stripe handles all payment processing and PCI compliance
- SMTP provider handles email delivery
- OpenRouteService provides geocoding (address lookup for workspace settings)

## Communication Patterns

| From | To | Protocol | Auth |
|---|---|---|---|
| Landing App | API | HTTPS REST | HTTP-only cookie (refresh token) |
| Web App | API | HTTPS REST | Bearer JWT (access token) |
| Mobile App | API | gRPC (HTTP/2) | JWT in metadata |
| API | Stripe | HTTPS REST | API key |
| Stripe | API | HTTPS Webhook | Signature verification |
| API | SMTP | SMTP/TLS | Username/password |
| API | PostgreSQL | TCP :5432 | Username/password |
| API | Redis | TCP :6379 | None (local) |
| Landing App | OpenRouteService | HTTPS REST | API key (proxied via Next.js API route) |
