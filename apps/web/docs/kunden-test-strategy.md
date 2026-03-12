# Kunden Test Strategy

## Scope

Frontend-only Modul `kunden` mit Fokus auf:

- Listenworkflow (Saved Views, Facets, Such-/Filterlogik)
- Detailworkflow (Statusmodell, Tabs, SLA/Reminder, Duplikatentscheidungen)
- Compliance/Privacy (Consent-Blocker, Maskierung, Retention-Hinweise)
- Offline-Readiness (Queue-Status und manuelle Synchronisation)

## Unit Tests (`lib/kunden`)

- `selectors.spec.ts`
  - Query-Filter, Saved-Views, KPI-Berechnung
- `state-machine.spec.ts`
  - erlaubte und verbotene Statuswechsel
  - Guard-Blocker bei fehlenden Pflichtdaten
- `duplicate-detection.spec.ts`
  - Duplikat-Scoring und Resolution-Flow
- `sla-engine.spec.ts`
  - Reminder-Bewertung (`ON_TRACK`, `AT_RISK`, `BREACHED`)
- `privacy-policy.spec.ts`
  - rollenbasierte Feldsichtbarkeit, Maskierung, Consent-Blocker
- `intelligence.spec.ts`
  - Signals und Next-Best-Action

## E2E Tests (`e2e/kunden-workflow.spec.ts`)

- Modulzugriff ueber Sidebar (Capability-abhaengig, sonst `test.skip`)
- Navigation Liste -> Detail
- Tabwechsel (`Objekte`, `Ansprechpartner`, `Compliance`, `Duplikate`)
- Sichtbarkeitschecks fuer Kernfunktionen (Offline-Sync, SLA-Panel, Duplicate-Review)

## Lokales E2E Setup

- Zugangsdaten liegen lokal in `apps/web/.env.e2e`.
- Starten ohne Inline-Variablen:
  - `pnpm --filter @zunftgewerk/web exec playwright test e2e/kunden-workflow.spec.ts`
  - `pnpm --filter @zunftgewerk/web exec playwright test e2e/auth-passkey-mfa.spec.ts`
- Optional fuer MFA-Accounts: `E2E_ADMIN_TOTP_SECRET` in `apps/web/.env.e2e` setzen.

## Regressionsfokus

- Statuswechsel darf keine ungueltigen Transitionen erlauben
- Consent-/Retention-Infos muessen im Compliance-Tab konsistent erscheinen
- Duplikatentscheidungen muessen in der UI nachvollziehbar bleiben
- Offline Queue darf bei manuellem Sync sauber leeren

## CI Empfehlung

- Pflicht: `typecheck` + Unit-Tests fuer `lib/kunden`
- Optional nachgelagert: Playwright E2E mit bestehender E2E-Umgebung
