# Projektplan — Zunftgewerk

> Erstellt: 2026-03-02 | Zuletzt aktualisiert: 2026-03-04 (Session 11)

---

## Status-Übersicht

| Bereich | Fertig | Kommentar |
|---|---|---|
| `apps/landing` | **100%** | Alle Features, Invite-Accept-Page, 69 Unit-Tests |
| `apps/web` | **100%** | Dashboard, Auth, Passkeys, MFA, E2E Tests |
| `services/api` | **100%** | 8 Module, 35 Tests, Team-Invite, Cookie-Consent, REST Sync, V10 Migrations |
| `apps/mobile` | **100%** | Auth + Dashboard + REST Sync (real transport) + Settings; iOS 12/12, Android 12/12 |
| CI/CD | **100%** | Docker, K8s Deploy, E2E, Jacoco, Mobile TypeCheck |
| Infra/K8s | **100%** | Secrets, TLS, Traefik, PG-Backup, Loki + Promtail, .de Domains |

---

## Offene Punkte

### Niedrig-Priorität / Zukunft

| # | Task | Dauer | Blocker |
|---|---|---|---|
| 7 | Legal-Seiten Inhalte finalisieren | ~1h | Juristisch |
| 8 | Grafana Dashboard für Loki-Logs | ~2h | Optional |

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
- **P3.3** Workspace & Team API — CRUD, Admin-Checks, Team-Invite mit Email
- **P3.4** Datenschutz — DSGVO-Delete, Audit-Export (JSON/CSV), Cookie Consent UI + Backend-Tracking
- **P3.5** MFA Management — Setup/Disable Dialogs, Backend-Endpoints, QR-Code
- **P4.1** Mobile iOS — 12/12 Acceptance Tests bestanden
- **P4.2** Observability — Prometheus Metrics, OTLP Tracing, Trace-ID Logging, Loki + Promtail
- **P4.3** Test-Abdeckung — 35 Backend-Tests + 69 Frontend-Tests, Jacoco 50% Gate, E2E Playwright
- **P4.4** Sync — REST-Endpoints (push/pull) + Mobile REST-Transport (Stub ersetzt)
- **Session 9** Architektur-Review — X-Forwarded-For Fix, GlobalExceptionHandler, SecurityConfig gehärtet, PG-Backup CronJob
- **Session 10** Team-Invite, Cookie-Consent Backend, Vitest 69 Tests, Invite-Accept-Page, REST Sync, Loki + Promtail
- **Session 11** Production-Readiness abgeschlossen — KUBECONFIG_B64, ORS API Key, Stripe Webhook, MFA Enforcement, Loki Deploy
- **P4.5** Mobile Android — 12/12 Acceptance Tests bestanden (Gradle 8.13 Fix, local.properties)
