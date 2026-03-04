# Projektplan — Zunftgewerk

> Erstellt: 2026-03-02 | Zuletzt aktualisiert: 2026-03-04 (Session 10)

---

## Status-Übersicht

| Bereich | Fertig | Kommentar |
|---|---|---|
| `apps/landing` | **100%** | Alle Features, Middleware, MFA, Billing, Onboarding, 69 Unit-Tests |
| `apps/web` | **92%** | Dashboard, Auth, Passkeys, MFA, E2E Tests |
| `services/api` | **100%** | 8 Module, 35 Backend-Tests, Team-Invite, Cookie-Consent, V10 Migrations |
| `apps/mobile` | **65%** | Auth + Dashboard + Sync-Stub + Settings; iOS 12/12, Android offen |
| CI/CD | **100%** | Docker, K8s Deploy, E2E, Jacoco, Mobile TypeCheck |
| Infra/K8s | **100%** | Secrets, TLS/cert-manager, Traefik, PG-Backup CronJob, .de Domains |

---

## Offene Punkte

### Production-Readiness (manuell / braucht Keys)

| # | Task | Dauer | Bemerkung |
|---|---|---|---|
| 1 | `KUBECONFIG_B64` GitHub Secret setzen | ~15min | `cat ~/.kube/config \| base64 \| tr -d '\n'` → GitHub Secrets |
| 2 | `OPENROUTESERVICE_API_KEY` in K8s Secret patchen | ~5min | `kubectl -n zunftgewerk patch secret ...` |
| 3 | Stripe-Webhook lokal testen (Stripe CLI) | ~1h | `stripe listen --forward-to localhost:8080/webhooks/stripe` |
| 4 | MFA Enforcement manuell verifizieren | ~30min | Flag ist `true` — als Admin einloggen, MFA-Erzwingung bestätigen |

### Niedrig-Priorität / Zukunft

| # | Task | Dauer | Blocker |
|---|---|---|---|
| 5 | Mobile Android Acceptance Testing (12 Cases) | ~2h | Android SDK/Emulator |
| 6 | gRPC Sync: Proto Code-Gen für Mobile + Client | ~1 Woche | — |
| 7 | Legal-Seiten Inhalte finalisieren | ~1h | Juristisch |
| 8 | Log-Aggregation (Loki/CloudWatch) + Alerting | ~1 Tag | — |
| 9 | Landing-App Invite Accept Page (`/invite/accept?token=...`) | ~2h | — |

---

## Abgeschlossene Meilensteine

- **P1.1** Web Dashboard — alle Seiten, API-Integration, Skeleton Loading
- **P1.2** Feature Flags — Runtime-System, Admin-Endpoint, alle Flags aktiv
- **P1.3** Stripe Billing — Checkout, Portal, Events, Webhook-Retry + DLQ
- **P2.1** CI/CD — E2E in Pipeline, Docker Build, Deploy-Job, Jacoco
- **P2.2** Deployment — K8s Manifeste, Secrets, TLS, Traefik, PG-Backup, .de Domains
- **P2.3** Dynamische Preispläne — ISR, Fallback, Plan-Switching
- **P2.4** Runtime Feature Flag System — ConfigurationProperties, Admin-API
- **P3.1** Landing — Billing-Step, Employees, Billing-Dashboard, Address Autocomplete
- **P3.2** Web Auth — Middleware, Passkey-Registration, Refresh-Token-Reuse-Tests (12 Unit-Tests)
- **P3.3** Workspace & Team API — CRUD, Admin-Checks, SecurityConfig
- **P3.4** Datenschutz — DSGVO-Delete, Audit-Export (JSON/CSV), Cookie Consent UI + Backend-Tracking
- **P3.5** MFA Management — Setup/Disable Dialogs, Backend-Endpoints, QR-Code
- **P4.1** Mobile iOS — 12/12 Acceptance Tests bestanden
- **P4.2** Observability — Prometheus Metrics, OTLP Tracing, Trace-ID Logging
- **P4.3** Test-Abdeckung — 35 Backend-Tests + 69 Frontend-Tests, Jacoco 50% Gate, E2E Playwright
- **Session 9** Architektur-Review — X-Forwarded-For Fix, GlobalExceptionHandler, SecurityConfig gehärtet, PG-Backup CronJob
- **Session 10** Team-Invite (V9 Migration, Email, Accept-Endpoint), Cookie-Consent Backend (V10), Vitest Setup + 69 Tests
