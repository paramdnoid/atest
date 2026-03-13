# apps/web Deep Audit TODOs (Read-only Scan)

Datum: 2026-03-13  
Scope: `apps/web` (dateiweise Tiefenscan, keine Codeaenderungen)

## Audit-Abdeckung

- Vollstaendiger Struktur-Scan von `apps/web` (ca. 236 Dateien).
- Tiefenpruefung in:
  - `apps/web/app` (inkl. `(dashboard)`, `(auth)`, `loading.tsx`, `not-found.tsx`)
  - `apps/web/components` (Shell, Dashboard-Framework, Aufmass/Angebote/Abnahmen/Kunden, UI-Primitives mit hohem Impact)
  - `apps/web/lib` (Auth/API/HTTP/WebAuthn/State-Machines/Selectors/Rollout/Offline)
  - `apps/web/e2e` inkl. Helper und Playwright-Setup
  - Konfiguration im `apps/web`-Scope (`tsconfig`, ESLint, Next, Playwright)
- Querschnittspruefungen auf Security, Typunsicherheit, Error-Handling, Loading/State und Anti-Patterns.

## TODOs nach Prioritaet

### CRITICAL

- [ ] `apps/web/lib/session-token.ts`  
  Problem: Access Token wird in `localStorage` persistiert.  
  Impact: Bei XSS ist Account-Takeover durch Token-Exfiltration moeglich.  
  TODO: Entferne Token-Persistenz in `localStorage` und migriere auf `httpOnly` Cookie-Session plus kurzes In-Memory-Access-Token.

- [ ] `apps/web/lib/effective-profile.ts`  
  Problem: Bei API-Fehlern faellt Profilaufloesung auf Mock-Profil zurueck (`source: 'mock'`) und blendet Module frontendseitig ein.  
  Impact: Fail-open Verhalten zeigt potenziell unzulaessige Features/Flows bei Backend-Stoerung.  
  TODO: Stelle auf fail-closed um (bei Profilfehler: Session invalidieren/Sign-in erzwingen, Mock nur explizit in Dev-Flag erlauben).

### HIGH

- [ ] `apps/web/app/(dashboard)/angebote/[id]/page.tsx`  
  Problem: `notFound()` wird in einer Client Component verwendet.  
  Impact: Potenzieller Laufzeitfehler statt sauberer 404-Navigation.  
  TODO: Verlege Not-Found-Entscheidung in Server-Page/Route-Segment oder ersetze im Client durch kontrollierte Navigation auf eine dedizierte 404-Route.

- [ ] `apps/web/app/(dashboard)/kunden/[id]/page.tsx`  
  Problem: Gleiches `notFound()`-Muster in Client Component.  
  Impact: Inkonsistentes Fehlerverhalten bei fehlender Entitaet.  
  TODO: Implementiere serverseitige Entitaetsaufloesung oder clientseitige Fallback-Navigation ohne `notFound()`.

- [ ] `apps/web/lib/webauthn.ts`  
  Problem: `navigator.credentials.get/create` wird direkt auf `PublicKeyCredential` gecastet; `null`/Abbruchfaelle werden nicht abgefangen.  
  Impact: User-Abbruch erzeugt harte Runtime-Fehler statt kontrollierter UX.  
  TODO: Pruefe auf `null`, wirf typisierten fachlichen Fehler (z. B. `UserCancelled`) und behandle ihn im UI.

- [ ] `apps/web/components/shell/app-shell.tsx`  
  Problem: Zwei getrennte Effects pruefen Auth/Token und triggern redundante Tokenaufloesung.  
  Impact: Race Conditions, unnoetige Refresh-Aufrufe und Redirect-Flackern.  
  TODO: Zentralisiere Auth-Guard plus Profil-Laden in eine einzige State-Maschine (single source of truth).

- [ ] `apps/web/components/shell/app-sidebar.tsx`  
  Problem: Eigenes User-Menue mit `role=\"menu\"` ohne vollstaendige Keyboard/Focus-Interaktion.  
  Impact: A11y-Verstoss (Tastatur/SR-Nutzung eingeschraenkt).  
  TODO: Ersetze durch ein robustes Menue-Primitive (z. B. Radix DropdownMenu) mit roving focus und Escape/Arrow-Support.

- [ ] `apps/web/e2e/aufmass-workflow.spec.ts`  
  Problem: Assertions erwarten nicht mehr vorhandene Labels/Heading (`Aufmass Workspace`, Tab-Namen).  
  Impact: Falsche Test-Fehlschlaege trotz funktionierendem UI.  
  TODO: Ersetze fragile textbasierte Selektoren durch stabile `data-testid`-Selektoren und aktualisiere Erwartungstexte.

- [ ] `apps/web/e2e/abnahmen-workflow.spec.ts`  
  Problem: Erwartet `Abnahme Workspace`, UI verwendet andere Titelstruktur.  
  Impact: E2E-Rauschen reduziert Vertrauen in CI-Signale.  
  TODO: Harmonisiere Selektoren mit aktuellem DOM (vorzugsweise `data-testid` statt lokalisierter Strings).

### MEDIUM

- [ ] `apps/web/lib/http-client.ts`  
  Problem: `apiJson<T>` castet `payload as T` ohne Laufzeitvalidierung.  
  Impact: TypeScript-Schein-Sicherheit, Datenfehler schlagen spaeter und schwerer debugbar auf.  
  TODO: Validiere Response-Payloads schema-basiert (z. B. Zod) pro Endpoint.

- [ ] `apps/web/lib/session-token.ts`  
  Problem: Bei vorhandenem (aber abgelaufenem) Token erfolgt keine proaktive Erneuerung vor API-Aufrufen.  
  Impact: Wiederkehrende 401-Fehler und inkonsistenter Session-Zustand.  
  TODO: Implementiere Expiry-Check/Refresh-Strategie plus 401-Recovery (Token loeschen, einmalig refreshen, retryen).

- [ ] `apps/web/app/(dashboard)/angebote/page.tsx`  
  Problem: Sehr grosse duplizierte Filter/Dropdown-UI zwischen Desktop und Mobile.  
  Impact: Hoher Wartungsaufwand und Regressionen bei kuenftigen Filteraenderungen.  
  TODO: Extrahiere wiederverwendbare Filter-Panel-Komponenten und parametrisiere nur layout-spezifische Unterschiede.

- [ ] `apps/web/app/(dashboard)/kunden/page.tsx`  
  Problem: Gleiches Duplication-Muster wie oben (Desktop/Mobile-Block nahezu doppelt).  
  Impact: Inkonsistente Bugfixes bei identischer Logik wahrscheinlich.  
  TODO: Entkopple Logik/Content von Darstellung und reuse dieselbe Filter-Content-Komponente.

- [ ] `apps/web/components/dashboard/dashboard-tabs.tsx`  
  Problem: Wiederholtes `findIndex` pro Render/KeyDown innerhalb `map`.  
  Impact: Unnoetige Render-Kosten und unnoetige Komplexitaet.  
  TODO: Verwende den vorhandenen `map`-Index direkt und speichere Ref per Index.

- [ ] `apps/web/components/dashboard/leaflet-map.tsx`  
  Problem: Marker-Assets werden von externem CDN (`unpkg`) geladen.  
  Impact: Laufzeitabhaengigkeit von Drittanbieter/CDN, potenziell instabil/offline-anfaellig.  
  TODO: Bundle Leaflet-Assets lokal im Projekt und referenziere interne statische Pfade.

- [ ] `apps/web/app/(dashboard)/settings/page.tsx`  
  Problem: Fehler bei `workspace/me` werden still geschluckt (`catch {}`), kein Abort bei Unmount.  
  Impact: Diagnostikverlust und potenziell veraltete State-Updates.  
  TODO: Fuege kontrolliertes Error-Handling mit Telemetrie sowie Abbruchlogik (`AbortController`) hinzu.

- [ ] `apps/web/components/license-seat-table.tsx`  
  Problem: Tabelle rendert zusaetzlich eigene `DashboardCard` innerhalb `ModuleTableCard`.  
  Impact: Verschachtelte Card-Semantik und unnoetige Layout-Komplexitaet.  
  TODO: Entferne die innere Card-Huelle und rendere Tabelle direkt im Parent-Card-Body.

- [ ] `apps/web/e2e/helpers/flush-rate-limits.ts`  
  Problem: Redis-Flush nutzt `KEYS` plus Shell-Pipelines/Docker-Aufrufe in Tests.  
  Impact: Flaky/slow Test-Setup und potenziell blockierende Redis-Operationen.  
  TODO: Ersetze durch gezielte Prefix-Loeschung via `SCAN`-basierten Helper oder dedizierten Test-Endpoint.

### LOW

- [ ] `apps/web/components/ui/sidebar.tsx`  
  Problem: Cookie `sidebar_state` wird geschrieben, aber nirgendwo gelesen.  
  Impact: Toter Persistenzpfad verwirrt und erhoeht kognitive Last.  
  TODO: Entweder tatsaechliches Rehydrating aus Cookie implementieren oder Cookie-Schreiben entfernen.

- [ ] `apps/web/e2e/dashboard.spec.ts`  
  Problem: Doppelte Login-Logik statt Nutzung gemeinsamer Workflow-Helper.  
  Impact: Testwartung kostet unnoetig Zeit.  
  TODO: Vereinheitliche Login-Flows auf `e2e/helpers/workflow.ts`.

- [ ] `apps/web/hooks/use-mobile.ts`  
  Problem: Hook berechnet `innerWidth` statt primaer `mql.matches`.  
  Impact: Kleinere Inkonsistenz zwischen MediaQuery und Width-Check moeglich.  
  TODO: Nutze `mql.matches` als primaere Quelle und halte Event-Handler daran konsistent.

## Offene Fragen und Annahmen

- Annahme: `notFound()` in Client Components ist in eurem Next-Setup nicht supportet oder nicht gewuenscht. Falls bewusst so implementiert, bitte bestaetigen.
- Annahme: Mock-Capability-Fallback in `loadEffectiveProfile` ist aktuell produktiv aktivierbar. Falls nur lokal gedacht, sollte es hart per Env-Guard abgesichert werden.
- Annahme: E2E-Textmismatches sind unbeabsichtigt und nicht als bewusstes Contract-Testing mit anderer Sprachvariante gedacht.

## Hinweis

- Dieser Bericht basiert auf Read-only Analyse. Es wurden keine Produktivdateien in `apps/web` veraendert.
