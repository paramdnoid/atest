# Component Architecture (C4 Level 3)

## API Module Map

Das Backend ist ein **modularer Monolith** unter `com.zunftgewerk.api`. Module sind fachlich getrennt und stellen jeweils Controller/Service/Repository-Pfade bereit.

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
└── shared/             Gemeinsame technische Hilfskomponenten
```

## Module Details

### Identity Module

Verantwortet Authentifizierung und Session-Lebenszyklus (Signup/Login, MFA, Passkeys, Refresh-Rotation, JWT-Ausstellung).

### Tenant Module

Verantwortet Tenant-Stammdaten, Mitgliedschaften und Rollenmodell.

### Plan Module

Verantwortet Plan-Katalog und Subscription-Zustand je Tenant.

### Billing Module

Verantwortet Stripe-Integration inklusive Event-Entgegennahme, Verarbeitung und Recovery-Pfad fuer nicht verarbeitbare Events.

### License Module

Verantwortet Seats, Device-Lizenzen und Entitlements.

### Sync Module

Verantwortet Push/Pull/Stream-Synchronisation mit Idempotenz und Konfliktbehandlung.

### Audit Module

Verantwortet unveraenderliche, append-only Audit-Events.

### Onboarding Module

Verantwortet den Onboarding-Status inkl. naechstem Schritt fuer den Client.

## Shared Infrastructure

- `config/`: Security-, Persistence- und Infrastruktur-Konfiguration.
- `shared/`: technische Querschnittsfunktionen (z. B. Context-Handover, Interceptors, Utility).

## Frontend-Komponenten (Kurz)

Landing und Web folgen App-Router-Strukturen mit Feature-orientierten Komponentenordnern (Auth, Onboarding, Dashboard, UI-Primitives).

## Cross-Module Dependencies

- Onboarding liest Status aus Identity-, Tenant- und Plan-Sicht.
- Billing und License greifen auf Plan-/Tenant-Daten zu.
- Sync arbeitet tenant-gebunden und erzeugt nachvollziehbare Aenderungsspuren.
- Audit wird von sicherheits- und fachrelevanten Modulen beschrieben.
