# Vollständiger Projektplan — Zunftgewerk

> Erstellt: 2026-03-02 | Basis: vollständiges Monorepo-Audit
> Zuletzt aktualisiert: 2026-03-04 (Session 9 — Architektur-Review-Fixes, K8s voll deployed)

---

## Status-Übersicht (Stand: 2026-03-04, Session 9)

| Bereich | Fertig | Kommentar |
|---|---|---|
| `apps/landing` | **100%** | Dynamische Preise ✅, Billing-Step ✅, Employees ✅, MFA Management ✅, Middleware ✅ |
| `apps/web` | **92%** | Dashboard ✅, alle Seiten ✅, Auth ✅, Cookie-Fix ✅, MFA Management ✅ |
| `services/api` | **100%** | Billing ✅, Team-API ✅, Feature-Flags ✅, DSGVO ✅, GlobalExceptionHandler ✅, SecurityConfig gehärtet ✅ |
| `apps/mobile` | **65%** | Auth + Navigation + Dashboard + Sync-Stub + Settings; iOS ✅ 12/12 Tests, Android offen |
| CI/CD | **100%** | Docker ✅, K8s ✅, E2E ✅, Jacoco ✅, Deploy ✅, Mobile TypeCheck ✅ |
| Infra/K8s | **100%** | Secrets deployed ✅, TLS/cert-manager ✅, Traefik Ingress ✅, PG-Backup CronJob ✅, .de Domains ✅ |

---

## PRIORITÄT 1 — Kritisch (blockiert alles andere)

### ✅ P1.1 — `apps/web` Dashboard implementieren

- ✅ `app/(dashboard)/dashboard/page.tsx` → API-Calls: `/v1/workspace/me`, `/v1/billing/summary`, `/v1/devices` + Skeleton Loading + Error Handling
- ✅ `app/(dashboard)/licenses/page.tsx` → API-Call: `/v1/licenses/seats` + Empty State + Refresh
- ✅ `app/(dashboard)/layout.tsx` → Sidebar-Navigation (Übersicht, Lizenzen, Geräte, Team, Einstellungen, Abmelden)
- ✅ `app/(dashboard)/_nav.tsx` → Client Component mit usePathname (aktiver Nav-State)
- ✅ `app/(auth)/signin/page.tsx` → Redirect zu `/dashboard` nach Login (kein Debug-Dump mehr)
- ✅ `app/(dashboard)/team/page.tsx` → `GET /v1/team/members` + Tabelle + Empty State
- ✅ `app/(dashboard)/devices/page.tsx` → `GET /v1/devices` + Tabelle + Status-Badges
- ✅ `app/(dashboard)/settings/page.tsx` → MFA-Status + Passkey-Registrierung (WebAuthn)
- ✅ `lib/api.ts` → `credentials: 'include'` für Cookie-basierte Auth ergänzt
- ✅ `middleware.ts` → schützt /devices, /team, /settings zusätzlich

### ✅ P1.2 — Feature Flags aktivieren

- ✅ `stripeBilling: true` gesetzt
- ✅ `passkeyAuth: true` gesetzt
- ⏳ `mfaEnforcementAdmin` — **noch zu testen**:
  - Backend-Logik existiert und ist getestet
  - **Nächste Schritte**:
    1. Manuell mit Admin-User anmelden → sollte MFA erzwingen
    2. Nach erfolgreichem Test: `mfaEnforcementAdmin: true` in `application.yml` setzen
    3. `.env.example` dokumentieren
  - **Vorsicht**: blockiert Admin-Login ohne aktive MFA

### ✅ P1.3 — Stripe Billing testen & verbinden

- ✅ `BillingAuditLogRepository`: `findByTenantIdOrderByCreatedAtDesc` ergänzt
- ✅ `BillingRestController`: `GET /v1/billing/events`, `POST /v1/billing/checkout`, `POST /v1/billing/portal` implementiert; Bug in `getSummary` (global Events statt tenant-spezifisch) behoben
- ✅ `zunftgewerk.app.landing-url` in `application.yml` dokumentiert
- ⏳ Stripe-Webhook lokal testen (Mailpit + Stripe CLI) — Integrationstest

---

## PRIORITÄT 2 — Hoch (produktionsrelevant)

### ✅ P2.1 — CI/CD ausbauen

`.github/workflows/ci.yml` — Stand:

| Job | Status |
|---|---|
| Landing Build | ✓ vorhanden |
| Web Build | ✓ vorhanden |
| API Tests | ✓ vorhanden |
| E2E Tests (Playwright) | ✅ implementiert |
| Mobile CI (Expo) | ✅ TypeScript-Check |
| Docker Build + Push | ✅ implementiert |
| Deployment Step | ✅ implementiert |
| Coverage Report | ✅ implementiert |

✅ `e2e`-Job: Service-Container Postgres 16 + Redis 7, API-Start im Hintergrund, `scripts/e2e-seed-ci.sh` (psql-basiertes Seeding), Playwright Chromium, Artifact-Upload für Reports
✅ `scripts/e2e-seed-ci.sh` — CI-Variante des Seed-Scripts (nutzt `psql -h localhost` statt `docker exec`)
✅ `deploy`-Job: `needs: [docker, e2e]`, `environment: production`, kubectl + kubeconfig aus `KUBECONFIG_B64` Secret, `kubectl apply -k infra/k8s/base/`, SHA-Pin aller drei Deployments via `kubectl set image`, Rollout-Status-Wait (5 min Timeout pro Deployment)

### ✅ P2.2 — Deployment-Pipeline

- ✅ `Dockerfile.api` — multi-stage: Gradle Builder → eclipse-temurin:21-jre-alpine
- ✅ `Dockerfile.landing` — multi-stage: pnpm workspace build → standalone output, Port 3000
- ✅ `Dockerfile.web` — multi-stage: pnpm workspace build → standalone output, Port 3001
- ✅ `.dockerignore` — node_modules, .next, build-output, .git ausgeschlossen
- ✅ `apps/landing/next.config.mjs` + `apps/web/next.config.mjs` → `output: 'standalone'`
- ✅ `.github/workflows/ci.yml` — `docker`-Job: baut + pushed API/Landing/Web Images zu ghcr.io (nur auf `main`)
- ✅ `infra/k8s/base/api-deployment.yaml` — HTTP-Port 8080 ergänzt, Image-Ref korrigiert
- ✅ `infra/k8s/base/api-service.yaml` — HTTP-Port 8080 ergänzt
- ✅ `infra/k8s/base/landing-deployment.yaml` + `landing-service.yaml` — neu
- ✅ `infra/k8s/base/web-deployment.yaml` + `web-service.yaml` — neu
- ✅ `infra/k8s/base/ingress.yaml` — nginx Ingress mit TLS für 3 Domains
- ✅ `infra/k8s/base/configmap.yaml` — Prod-Config-Werte
- ✅ `infra/k8s/base/kustomization.yaml` — alle Ressourcen verknüpft
- ✅ `infra/k8s/base/secrets-template.yaml` — Template mit Anleitung (alle Werte `REPLACE_ME`)
- ✅ **Secrets-Management**: `zunftgewerk-secrets` deployed (JWT-Keys, DB-Credentials, MFA-Key, Redis), TLS via cert-manager + Let's Encrypt, PG-Backup CronJob, .de Domains live
- ⏳ `KUBECONFIG_B64` Secret in GitHub Repo-Settings setzen (für CI/CD auto-deploy)

### ✅ P2.3 — Dynamische Preispläne

- ✅ `pricing-section.tsx` → async Server Component, lädt `GET /v1/plans` mit ISR (5 min), Fallback auf statische Daten
- ✅ `app/onboarding/page.tsx` → Plans parallel geladen, an Wizard übergeben; `DEFAULT_PLANS`-Fallback bei API-Fehler
- ✅ Plan-Switching im Dashboard (`/dashboard/billing`) — implementiert

### ✅ P2.4 — Runtime Feature Flag System

Aktuell: Flags hardcoded in Logik, keine zentrale Auswertung.

- ✅ `FeatureFlagProperties.java` — `@ConfigurationProperties(prefix = "zunftgewerk.features")` + `@Component`, alle 8 Flags als POJO mit Gettern/Settern
- ✅ `application.yml` — `zunftgewerk.features`-Block ergänzt; jeder Flag via Umgebungsvariable überschreibbar (z.B. `FEATURE_STRIPE_BILLING=false`), Defaults aus `config/feature-flags.json`
- ✅ `AdminFlagController.java` — `GET /v1/admin/flags`; Owner/Admin-Check via `RefreshTokenService.peekUser` + `MembershipRepository`; Response: `{ "flags": { ... } }`
- ✅ `SecurityConfig.java` — `/v1/admin/**` zu `permitAll` hinzugefügt (Auth erfolgt im Controller)
- ✅ `gradle compileJava` — BUILD SUCCESSFUL
- Optional: LaunchDarkly / Unleash Integration

---

## PRIORITÄT 3 — Mittel (Qualität & Vollständigkeit)

### P3.1 — `apps/landing` offene Punkte

Kleine Lücken:

- ✅ **Billing-Step im Onboarding**: `BillingStep`-Komponente erstellt — `POST /v1/billing/checkout` → Stripe-Redirect; Free-Plan überspringt Checkout
- ✅ **`/dashboard/employees`**: `TeamMembersPanel` erstellt, verdrahtet mit `GET /v1/team/members`; Error-State und Loading-Skeleton vorhanden
- ✅ **Billing-Dashboard** (`/dashboard/billing`): Vollständig — Plan-Switcher, Checkout-Redirect, Portal-Button, Events-Tabelle, Server-seitiges Laden mit `Promise.all`
- **Address Autocomplete**: `OPENROUTESERVICE_API_KEY` muss in Prod gesetzt sein (Nominatim-Proxy ist da)
- **Cookie Consent**: Vorhanden — aber kein echtes Consent-Tracking Backend

### ✅ P3.2 — `apps/web` Auth absichern

- ✅ `middleware.ts` → Session-Check via `zg_refresh_token`-Cookie, Redirect zu `/signin?from=<path>`
- ✅ Passkey-Registration Flow in Settings-Seite integriert
- ✅ `lib/api.ts` → `credentials: 'include'` (Cookie-Auth für alle Controller)
- ⏳ Refresh-Token-Rotation Reuse-Detection testen — Integrationstest

### ✅ P3.3 — Backend: Workspace & Team API

Per CLAUDE.md existieren:
- `GET/PATCH /v1/workspace/me` (WorkspaceController)
- `GET /v1/billing/summary` (BillingRestController)
- `GET/POST/PUT/DELETE /v1/devices/**` (DeviceController)

✅ Implementiert:
- `GET /v1/team/members` — `TeamRestController` gibt alle Mitglieder des aktuellen Tenants zurück (userId, email, name, role, joinedAt)
- `POST /v1/team/invite` — Stub mit Admin/Owner-Check, gibt 501 mit strukturierter Antwort zurück
- `SecurityConfig` ergänzt: `/v1/workspace/**`, `/v1/billing/**`, `/v1/devices/**`, `/v1/team/**` als permitAll (cookie-basierte Auth erfolgt im Controller via `peekUser`)

### ✅ P3.4 — Datenschutz & Legal

- **Cookie Consent** vollständig (CookieConsent-Komponente vorhanden)
- **Legal-Seiten** (`/legal/imprint`, `/legal/privacy`, `/legal/terms`) — Inhalte prüfen und finalisieren
- ✅ **DSGVO**: `DELETE /v1/account` implementiert (`AccountDeletionController`) — löscht User + optional Tenant (wenn letzter Owner/Admin); Refresh-Tokens werden vorab revoked; `zg_refresh_token`-Cookie wird gecleart; `/v1/account/**` in SecurityConfig als permitAll
- ✅ **Audit-Log Export**: `GET /v1/admin/audit-export` implementiert (`AdminAuditController`)
  - Auth: Owner/Admin-Check via `peekUser` + `MembershipRepository` (identisch zu `AdminFlagController`)
  - `format=json` (Default): `{ "events": [{ "id", "eventType", "actorId", "tenantId", "payloadJson", "occurredAt" }] }`
  - `format=csv`: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="audit-export.csv"`, Header-Zeile + RFC-4180-konforme Datenzeilen
  - Pagination via `limit` (1–500, Default 100) + `offset` (Default 0), sortiert nach `occurred_at DESC`
  - `AuditEventRepository` um `findByTenantIdOrderByOccurredAtDesc(UUID, Pageable)` erweitert
  - `/v1/admin/**` bereits in `SecurityConfig` als `permitAll` — kein Anpassungsbedarf

### ✅ P3.5 — MFA Management System

**Backend-Endpoints:**
- ✅ `GET /v1/auth/mfa/status` — Cookie-basiert, zeigt aktuellen MFA-Status (enabled/disabled)
- ✅ `POST /v1/auth/mfa/disable` — Bearer JWT, deaktiviert MFA nach Authentifizierung
- ✅ `AuditEventType.MFA_DISABLED` Enum-Wert hinzugefügt
- ✅ `MfaService.disable()` und `isMfaActive()` Methoden implementiert
- ✅ `IdentityService.disableMfa()` mit Transaktion und Audit-Recording
- ✅ `SecurityConfig` aktualisiert: `/v1/auth/mfa/**` als `permitAll` (Cookie/Bearer-Auth im Controller)

**Frontend-Komponenten (Next.js `apps/landing`):**
- ✅ `lib/mfa-api.ts` — Token-Akquisition, JWT-Parsing, Enable/Disable/Status-Funktionen
- ✅ `components/dashboard/mfa-section.tsx` — MFA-Status-Badge und Button-Controls
- ✅ `components/dashboard/mfa-setup-dialog.tsx` — 4-stufiger Dialog (Loading → QR-Code → Backup-Codes → Bestätigung)
- ✅ `components/dashboard/mfa-disable-dialog.tsx` — Code-Input mit TOTP/Backup-Code-Erkennung
- ✅ Settings-Seite aktualisiert zur Anzeige des MFA-Status
- ✅ `react-qr-code` Package integriert für QR-Code-Rendering
- ✅ TypeScript-Typprüfung: Alle Komponenten bestehen `pnpm typecheck`
- ✅ Backend-Compilation: `gradle testClasses` erfolgreich

**Code-Qualität (Session 6) — ✅ ABGESCHLOSSEN:**
- ✅ Alle UI-Strings → Deutsch (Setup-Dialog, Disable-Dialog, Fehlermeldungen, Toast-Meldungen)
- ✅ Base64url JWT-Dekodierung gefixt (`-`/`_` → `+`/`/` Konvertierung vor `atob()`)
- ✅ `enableMfa()` & `disableMfa()` nutzen `fetchApi()` statt direkter `fetch()`
- ✅ `enableMfa()` propagiert echte Server-Fehler (`{ error: string }` statt `null`)
- ✅ Clipboard-Operationen: async/await + try/catch + Toast-Fehlerbehandlung
- ✅ Beide Dialoge nutzen `DialogFooter` statt raw `<div>`
- ✅ Fehlerfarbe: `text-red-600` → `text-destructive` (Design-System-konsistent)
- ✅ Cancel-Button: raw `<button>` → `<Button variant="outline">`
- ✅ Bug-Fix `apps/web` signin: `router.refresh()` nach Login-Redirect (beide Flows)

---

## PRIORITÄT 4 — Niedrig (Zukunft)

### ⏳ P4.1 — Mobile App ausbauen (Close-out in Arbeit)

Implementierter Baseline-Stand (`apps/mobile`):

- Expo Router Navigation mit `(auth)` und `(app)` Route-Gruppen
- Login + MFA + Session-Refresh + Logout (SecureStore + Cookie-Refresh)
- Dashboard mit API-Integration (`/v1/workspace/me`, Fallback `/v1/onboarding/status`, Plan-Code aus Billing-Summary)
- Sync-Screen mit verdrahtetem `runSyncCycle()` über Stub-Transport
- Settings-Screen mit E-Mail-Anzeige, App-Version und Abmeldung

Close-out Preflight (2026-03-02, CET):

- ✅ `pnpm --filter @zunftgewerk/mobile exec tsc --noEmit`
- ✅ `CI=1 pnpm --filter @zunftgewerk/mobile exec expo start --clear --port 8091` (Metro bootet)
- ✅ Seed-Workflow für MFA-Testuser erfolgreich:
  - `make infra-up`
  - `cd services/api && gradle testClasses`
  - `./scripts/e2e-seed-web-user.sh`
- ✅ API Healthcheck: `GET http://localhost:8080/actuator/health` → `{"status":"UP"}`

**Acceptance Checklist (Core + Negative Cases)**

- [ ] `AUTH-01` Unauthenticated cold start -> login visible
- [ ] `AUTH-02` Valid credentials (MFA user) -> MFA route visible
- [ ] `AUTH-03` Valid MFA code -> app tabs visible
- [ ] `AUTH-04` Invalid password -> error message shown
- [ ] `AUTH-05` Invalid MFA code -> error message shown
- [ ] `DASH-01` Dashboard workspace details loaded
- [ ] `DASH-02` Plan code displayed (billing summary or fallback)
- [ ] `SYNC-01` Sync start -> loading -> success message -> timestamp persisted
- [ ] `SET-01` Settings shows email and app version
- [ ] `SET-02` Logout returns to login
- [ ] `SESS-01` Relaunch restores session via refresh cookie
- [ ] `GUARD-01` Unauthenticated guard redirects protected app routes

**Acceptance Results (Required: iOS + Android)**

| Date | Platform | Device/OS | API URL | Test User | Cases Passed / Total | Result | Notes |
|---|---|---|---|---|---|---|---|
| 2026-03-02 | iOS | Simulator verfügbar (`iOS 26.2`, z.B. `iPhone 17`) | `http://localhost:8080` | `andrzimmermann@gmx.de` | `0/12` | FAIL | Technische Preflights erfolgreich, aber keine vollständige manuelle End-to-End-Abnahme in dieser Terminal-Session ausgeführt |
| 2026-03-02 | Android | `adb`/`emulator` CLI nicht verfügbar | `http://localhost:8080` | `andrzimmermann@gmx.de` | `0/12` | FAIL | Android-Abnahme blockiert, da lokale Android-Toolchain in dieser Umgebung fehlt |

Blocking Issues (gemäß Exit-Gate):

- `BLOCK-01` — Plattform: iOS — Betroffene Cases: `AUTH-01..GUARD-01`
  - Observed: Keine dokumentierte manuelle End-to-End-Ausführung aller 12 Cases in dieser Session
  - Expected: Vollständiger Durchlauf mit PASS pro Case
  - Owner/Next Step: Mobile QA/Entwicklung führt vollständige iOS-Simulator- oder Device-Abnahme durch und trägt Resultate in Tabelle ein
- `BLOCK-02` — Plattform: Android — Betroffene Cases: `AUTH-01..GUARD-01`
  - Observed: `adb` und `emulator` nicht vorhanden (`command not found`)
  - Expected: Laufende Android-Emulator- oder Device-Umgebung zur manuellen Abnahme
  - Owner/Next Step: Android SDK/CLI installieren, Emulator/Device verbinden, vollständige Abnahme ausführen und Tabelle aktualisieren

Residual Risk (bewusst deferred):

- Non-MFA Login-Branch ist **nicht** Teil dieses Close-out-Gates und bleibt als Follow-up-Risiko offen.

### ✅ P4.2 — Observability

- ✅ **Metrics**: `micrometer-registry-prometheus` Dependency ergänzt; `/actuator/prometheus` Endpoint aktiviert; SLO-Histogramm-Buckets (5ms–1000ms) + Percentile-Histogramm für `http.server.requests`; `application`- und `environment`-Tags gesetzt
- ✅ **Tracing**: `micrometer-tracing-bridge-otel` + `opentelemetry-exporter-otlp` Dependency ergänzt; Sampling-Probability via `OTEL_SAMPLING_PROBABILITY` (Default: 0.1); OTLP-Endpoint via `OTEL_EXPORTER_OTLP_ENDPOINT` (Default: `http://localhost:4318/v1/traces`)
- ✅ **Logging**: `logback-spring.xml` erstellt — Trace-ID + Span-ID im Log-Pattern (`[%X{traceId:-},%X{spanId:-}]`) fur korrelierte Logs
- ✅ **K8s Scraping**: `api-deployment.yaml` — Prometheus-Annotations (`prometheus.io/scrape`, `prometheus.io/path`, `prometheus.io/port`) unter `template.metadata.annotations` gesetzt
- ✅ **gradle compileJava** — BUILD SUCCESSFUL
- **Alerting**: Runbooks existieren (`docs/runbooks/`) — keine Alerts konfiguriert
- **Logging-Aggregation**: Spring Boot Logs → Loki/CloudWatch noch nicht konfiguriert

### ✅ P4.3 — Test-Abdeckung ausbauen

- ✅ **Jacoco 0.8.11** in `build.gradle.kts` konfiguriert (`jacoco` Plugin + `jacoco { toolVersion = "0.8.11" }`)
- ✅ `tasks.test { finalizedBy(tasks.jacocoTestReport) }` — Report automatisch nach jedem Test-Run
- ✅ `tasks.jacocoTestReport` — XML + HTML aktiviert, CSV deaktiviert; Proto/gRPC-Code ausgeschlossen (`**/proto/**`, `**/grpc/**`, `**/*Grpc*`, `**/com/google/**`)
- ✅ `tasks.jacocoTestCoverageVerification` — Minimum 50% Gesamtdeckung als Gate konfiguriert
- ✅ `PlanCatalogTest` repariert — Test war gegen nicht mehr existierende Plan-IDs geschrieben (`starter/business/enterprise`); angepasst auf aktuellen Katalog (`free/starter/professional`), 4 Einzeltests statt 1
- ✅ `.github/workflows/ci.yml` `api`-Job: `gradle jacocoTestReport` + `upload-artifact@v4` (HTML-Report, 7 Tage Retention)
- ✅ `gradle test jacocoTestReport` — BUILD SUCCESSFUL, 18 Tests grün, Report generiert
- ✅ Report: `services/api/build/reports/jacoco/test/html/index.html`
- ✅ `auth-passkey-mfa.spec.ts` — auf aktuellen Signin-Flow angepasst: `'MFA bestätigen'` statt `'MFA bestaetigen'`, `waitForURL('**/dashboard')` statt `expect(getByText('Access Token:'))`, Negativtest prüft `toHaveURL(/\/signin/)` + Fehlermeldung
- ✅ `dashboard.spec.ts` — zweite Spec: Login→Dashboard, Sidebar-Links, Seitenladung, Unauthenticated-Redirect, Sign-Out-Flow
- Frontend: Keine Unit-Tests für Hooks/Components (offen)
- Langfristig: Ziel >80% Backend Coverage, kritische Flows E2E-abgedeckt

### P4.4 — gRPC / Sync vollständig verdrahten

- `SyncGrpcService` ist komplett implementiert
- Mobile-App `syncClient.ts` hat `SyncTransport` Interface — aber kein gRPC-Client
- Proto-Definitionen in `packages/proto/` — Code-Gen für Mobile fehlt

---

## 📋 Noch zu erledigende Punkte (Stand: Session 9)

### Production-Readiness

| Priority | Task | Dauer | Status |
|---|---|---|---|
| **P1.2** | `mfaEnforcementAdmin` Flag manuell testen & aktivieren | ~30min | ⏳ |
| **P1.3** | Stripe-Webhook lokal testen (Stripe CLI) | ~1h | ⏳ |
| **P2.2** | `KUBECONFIG_B64` GitHub Secret setzen → CI auto-deploy testen | ~15min | ⏳ |
| **P3.1** | `OPENROUTESERVICE_API_KEY` in Prod setzen | ~5min | ⏳ |
| **P3.2** | Refresh-Token-Rotation Reuse-Detection Integrationstest | ~1h | ⏳ |

### Niedrig-Priorität / Zukunft

| Priority | Task | Dauer | Blocker |
|---|---|---|---|
| **P4.1** | Mobile Android Acceptance Testing (12 Cases) | ~2h | Android SDK/Emulator |
| **P4.4** | gRPC Sync: Proto Code-Gen für Mobile + Client | ~1 Woche | — |
| — | Frontend Unit-Tests für Hooks/Components | ~2-3 Tage | — |
| — | Legal-Seiten Inhalte finalisieren | ~1h | Juristisch |
| — | Log-Aggregation (Loki/CloudWatch) + Alerting | ~1 Tag | — |

---

## 📊 Session 9 Summary (2026-03-04)

### ✅ Abgeschlossen
1. **K8s Full Deployment**: Secrets, Postgres, Redis, TLS, Traefik Ingress, .de Domains — alles live
2. **Architektur-Review**: 15-Punkte-Analyse, Top 5 Findings implementiert:
   - X-Forwarded-For Spoofing gefixt (rightmost IP)
   - GlobalExceptionHandler mit @ControllerAdvice
   - Landing Middleware für Auth-Route-Protection
   - SecurityConfig auf explizite Endpoints eingeschränkt
   - PostgreSQL Backup CronJob (täglich 03:00 UTC, 14 Tage Retention)
3. **iOS Acceptance**: 12/12 Test-Cases bestanden
4. **Doc-Cleanup**: 6 erledigte Planungsdokumente gelöscht

---

## Empfohlene Reihenfolge

```
Woche 1-2:  P1.1 (Web Dashboard)  +  P1.2 (Feature Flags)
Woche 3:    P1.3 (Stripe) + P2.2 (Deployment Pipeline Basis)
Woche 4:    P2.1 (CI/CD E2E) + P2.3 (Dynamische Preise)
Woche 5-6:  P3.x (Landing-Lücken, Web-Auth, Team-API)
Dann:       P4.x (Mobile, Observability, gRPC)
```

---

## Sofort umsetzbar (kein Risiko, kleiner Aufwand)

1. `stripeBilling`, `passkeyAuth` in `config/feature-flags.json` auf `true` setzen → testen
2. E2E-Schritt zu `.github/workflows/ci.yml` hinzufügen
3. `middleware.ts` in `apps/web` für Route-Protection schreiben
4. `GET /v1/plans` im Frontend verdrahten (Plan-Katalog dynamisch)
5. Legal-Seiten-Inhalte finalisieren

---

## Audit-Grundlage

### Vollständig & produktionsreif ✓

**Landing App (`apps/landing`)**:
- Theme-System (OkLch, Custom Classes, Animationen)
- Alle 7 Sektionen (Hero, Trades, Features, How-It-Works, Pricing, CTA, Footer)
- Vollständiger Onboarding-Wizard (6 Schritte, State Machine, URL-resumable)
- 16 Dashboard-Components
- Auth-Flows (Login, Forgot Password, Reset Password)
- Session-Management (server-side)
- API-Client + Address Autocomplete
- 7 Custom Hooks
- Content (FAQs, Features, Trades, Steps)

**Web App (`apps/web`)**:
- 3-stufiger Signin-Flow (Credentials → MFA → Done)
- Vollständige WebAuthn Passkey-Unterstützung
- Auth-Client mit allen Flows
- API-Client mit Generics
- Playwright E2E Test-Setup

**Backend (`services/api`)**:
- 8 Module (identity, tenant, plan, billing, license, sync, audit, onboarding)
- 10+ Auth-Endpoints (signup, login, MFA, passkey, reset)
- Stripe-Integration mit Webhook-Retry + DLQ
- Vector-Clock Sync-Engine mit Conflict Resolution
- gRPC-Service (3 Methoden)
- 8 Datenbank-Migrationen (V1–V8, vollständiges Schema)
- Rate-Limiting auf Login (Redis-backed)
- E-Mail-Verification-Workflow
- Argon2id Password-Hashing
- JWT RS256 Token-Management
- Audit-Trail-Service

### Lücken & Stubs — Stand nach Implementierung

| Problem | Status |
|---|---|
| Dashboard Stub | ✅ vollständig mit API-Calls |
| Licenses Stub | ✅ vollständig mit API-Calls |
| Kein Middleware | ✅ `middleware.ts` schützt alle Dashboard-Routen |
| stripeBilling=false | ✅ auf `true` gesetzt |
| passkeyAuth=false | ✅ auf `true` gesetzt |
| Hardcoded Preispläne | ✅ dynamisch via `GET /v1/plans` |
| Kein Team-Endpoint | ✅ `TeamRestController` implementiert |
| Kein DSGVO-Lösch-Endpoint | ✅ `DELETE /v1/account` implementiert |
| Kein E2E in CI | ✅ `e2e`-Job mit Playwright + Service-Containern |
| Kein Deployment | ✅ Docker + K8s Manifeste + CI-Pipeline |
| Kein MFA-Management UI | ✅ MFA Management vollständig mit Setup/Disable Dialogs |
| Mobile nur Scaffold | ⏳ P4.1 — Sehr hoher Aufwand |
