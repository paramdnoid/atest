# apps/web Top-10 Execution Backlog

Datum: 2026-03-13  
Basis: `docs/todos/apps-web-deep-audit-2026-03-13.md`  
Ziel: Risiko zuerst reduzieren, dann Stabilitaet und Wartbarkeit verbessern.

## Bewertungslogik

- Prioritaet: `P0` (sofort) bis `P2` (geplant)
- Aufwand: `S` (0.5 Tag), `M` (1 Tag), `L` (1.5-2 Tage)
- Reihenfolge basiert auf: Sicherheitsrisiko, Produktionsauswirkung, Umsetzungsrisiko, Abhaengigkeiten.

## Top-10 (in Umsetzungsreihenfolge)

Status 2026-03-13:
- Erledigt: 1, 2, 3, 4, 6, 8
- Groesstenteils erledigt: 5, 7, 9
- Erledigt nachgezogen: 10

### 1) Token-Speicherung absichern

- **Prioritaet:** P0
- **Aufwand:** L
- **Dateien:** `apps/web/lib/session-token.ts`, `apps/web/lib/auth-client.ts`, betroffene Auth-Consumer
- **Issue-Referenz:** CRITICAL (`localStorage`-Token)
- **Abhaengigkeiten:** Backend-Session/Refresh-Cookie-Verhalten verifiziert
- **Akzeptanzkriterien:**
  - Kein Access-Token mehr in `localStorage`
  - Session funktioniert nach Reload weiterhin kontrolliert
  - Logout entfernt alle clientseitigen Auth-Reste
- **Quality Gates:**
  - `pnpm --filter @zunftgewerk/web typecheck`
  - `pnpm --filter @zunftgewerk/web test:e2e` (mind. Auth-relevante Specs)
  - Manuell: Sign-in, Reload, Logout, Session-Timeout

### 2) Fail-open Profil-Fallback auf fail-closed umstellen

- **Prioritaet:** P0
- **Aufwand:** M
- **Dateien:** `apps/web/lib/effective-profile.ts`, `apps/web/components/shell/app-shell.tsx`
- **Issue-Referenz:** CRITICAL (Mock-Fallback bei API-Fehler)
- **Abhaengigkeiten:** Entscheidung Product/Security fuer Verhalten bei Profil-Fehler
- **Akzeptanzkriterien:**
  - Bei Profil-Ladefehler kein Modul-Fallback auf produktive UI
  - Fehlerfall fuehrt in sicheren Zustand (z. B. Re-Auth oder kontrollierter Fehlerzustand)
  - Mock-Profil nur explizit in Dev erlaubt
- **Quality Gates:**
  - Typecheck + Lint
  - Negativtest: simuliertes `workspace/me`-Failure
  - Manueller Security-Review des Fehlerpfads

### 3) `notFound()`-Fehlerpfade in Client-Seiten korrigieren

- **Prioritaet:** P0
- **Aufwand:** M
- **Dateien:** `apps/web/app/(dashboard)/angebote/[id]/page.tsx`, `apps/web/app/(dashboard)/kunden/[id]/page.tsx`
- **Issue-Referenz:** HIGH
- **Abhaengigkeiten:** Entscheidung, ob Server-Resolution oder clientseitige Fallback-Route
- **Akzeptanzkriterien:**
  - Fehlende Entitaet erzeugt konsistente 404-/Fallback-Navigation
  - Keine Runtime-Exceptions durch unzulaessiges `notFound()`-Pattern
- **Quality Gates:**
  - Typecheck
  - E2E: Invalid-ID-Navigation fuer beide Seiten
  - Manuell: Browser-Back/Forward Verhalten

### 4) WebAuthn-Abbruch robust behandeln

- **Prioritaet:** P1
- **Aufwand:** M
- **Dateien:** `apps/web/lib/webauthn.ts`, zugehoerige Auth-UI
- **Issue-Referenz:** HIGH
- **Abhaengigkeiten:** Einheitliches Error-Mapping in Auth-Flow
- **Akzeptanzkriterien:**
  - `null`/Cancel bei `navigator.credentials.*` wird sauber abgefangen
  - UI zeigt fachlich korrekte Meldung statt generischem Crash
  - Keine unhandled promise rejections
- **Quality Gates:**
  - Typecheck
  - E2E/Integration: Abbruchfall simulieren
  - Manuell: Passkey-Abbruch im Browserdialog

### 5) Auth-State orchestration in `app-shell` entkoppeln

- **Prioritaet:** P1
- **Aufwand:** L
- **Dateien:** `apps/web/components/shell/app-shell.tsx`
- **Issue-Referenz:** HIGH (duplizierte Effects, Race-Risiko)
- **Abhaengigkeiten:** Task 1 und 2 sollten zuerst umgesetzt sein
- **Akzeptanzkriterien:**
  - Ein konsistenter Auth-/Profil-Flow ohne doppelte Trigger
  - Keine Redirect-Flackereffekte
  - Refresh-Aufrufe sind deterministisch und nachvollziehbar
- **Quality Gates:**
  - Typecheck + Lint
  - E2E: Login, Token-Refresh, Logout
  - Manuell: Netzwerk-Tab auf redundante Calls pruefen

### 6) E2E-Selektoren stabilisieren (Aufmass/Abnahmen)

- **Prioritaet:** P1
- **Aufwand:** M
- **Dateien:** `apps/web/e2e/aufmass-workflow.spec.ts`, `apps/web/e2e/abnahmen-workflow.spec.ts`, ggf. betroffene Components
- **Issue-Referenz:** HIGH
- **Abhaengigkeiten:** Verfuegbare `data-testid`-Strategie abstimmen
- **Akzeptanzkriterien:**
  - Keine fragilen textbasierten Kern-Selektoren mehr
  - Tests sind sprach-/copy-aenderungsrobust
  - CI-Fehlalarme sinken
- **Quality Gates:**
  - `pnpm --filter @zunftgewerk/web test:e2e`
  - 2 aufeinanderfolgende gruene Runs lokal

### 7) API-Response-Laufzeitvalidierung einziehen

- **Prioritaet:** P1
- **Aufwand:** L
- **Dateien:** `apps/web/lib/http-client.ts`, erste kritische Endpoint-Consumer
- **Issue-Referenz:** MEDIUM
- **Abhaengigkeiten:** Entscheidung fuer Schema-Tooling (z. B. Zod)
- **Akzeptanzkriterien:**
  - Kritische Responses haben Laufzeitvalidierung
  - Validiere mindestens Auth-/Profil-nahe Payloads zuerst
  - Validierungsfehler liefern kontrollierte Fehlermeldungen
- **Quality Gates:**
  - Typecheck
  - Unit-Tests fuer Validatoren
  - Negativtests mit invaliden Payloads

### 8) Token-Expiry/401-Recovery vereinheitlichen

- **Prioritaet:** P1
- **Aufwand:** M
- **Dateien:** `apps/web/lib/session-token.ts`, relevante API-Caller
- **Issue-Referenz:** MEDIUM
- **Abhaengigkeiten:** Task 1
- **Akzeptanzkriterien:**
  - Abgelaufene Tokens triggern kontrollierten Refresh-Prozess
  - Max. ein Retry pro Request-Kette
  - Kein 401-Loop
- **Quality Gates:**
  - Typecheck
  - Integrationstest fuer 401->Refresh->Retry
  - Manuell: Session-Ablauf simulieren

### 9) A11y-Menue im Sidebar-Usermenu auf robustes Primitive heben

- **Prioritaet:** P2
- **Aufwand:** M
- **Dateien:** `apps/web/components/shell/app-sidebar.tsx`
- **Issue-Referenz:** HIGH (A11y)
- **Abhaengigkeiten:** Design-Feinabstimmung fuer Menu-Verhalten
- **Akzeptanzkriterien:**
  - Vollstaendige Keyboard-Navigation (Arrow, Escape, Enter, Tab)
  - Fokusmanagement korrekt
  - Screenreader-Semantik valide
- **Quality Gates:**
  - Lint + Typecheck
  - Manuell: Keyboard-only Durchlauf
  - Optional: a11y-Audit-Tool lokal

### 10) Duplication bei Angebote/Kunden-Filtern abbauen

- **Prioritaet:** P2
- **Aufwand:** L
- **Dateien:** `apps/web/app/(dashboard)/angebote/page.tsx`, `apps/web/app/(dashboard)/kunden/page.tsx`
- **Issue-Referenz:** MEDIUM
- **Abhaengigkeiten:** Keine harten; nach Stabilitaets-Tasks bevorzugt
- **Akzeptanzkriterien:**
  - Gemeinsame, wiederverwendbare Filter-Content-Bloecke
  - Keine funktionale Aenderung des UI-Verhaltens
  - Reduzierte Duplikation in Desktop/Mobile-Zweigen
- **Quality Gates:**
  - Typecheck + Lint
  - Snapshot/visueller Schnellcheck fuer beide Seiten
  - E2E-Smoke fuer Filterinteraktionen

## Release- und Abnahmeplan

- **Welle 1 (P0):** Tasks 1-3
- **Welle 2 (P1):** Tasks 4-8
- **Welle 3 (P2):** Tasks 9-10

## Definition of Done (global)

- Akzeptanzkriterien des Tasks erfuellt
- Keine neuen Lint-/Type-Fehler
- Relevante Tests gruen
- Kurze Change-Notiz in `docs/todos` oder PR-Beschreibung mit:
  - Risiko
  - Testnachweis
  - Rollback-Hinweis
