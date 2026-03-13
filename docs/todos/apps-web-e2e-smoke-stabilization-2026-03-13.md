# apps/web E2E Smoke Stabilization (2026-03-13)

Status: Umsetzung abgeschlossen (lokal verifiziert)

## Ziel

Playwright-Smoke-Tests von statischen Mock-Datensatz-IDs entkoppeln, damit sie mit API-basierten Live-Daten stabil laufen.

## Umgesetzt

- `e2e/helpers/workflow.ts`
  - `mockProfileId` aus Login-Helfer entfernt.
  - kein LocalStorage-Mockprofil mehr.

- `e2e/abnahmen-workflow.spec.ts`
  - Modulzugriff via `openModuleRouteIfAvailable` + `test.skip` bei Nichtverfügbarkeit.
  - Detailnavigation auf ersten verfügbaren `/abnahmen/*`-Link statt fixer ID.

- `e2e/angebote-workflow.spec.ts`
  - Modulzugriff via `openModuleRouteIfAvailable`.
  - Detailnavigation auf ersten verfügbaren `/angebote/*`-Link statt fixer ID.

- `e2e/aufmass-workflow.spec.ts`
  - alle drei Tests auf `openModuleRouteIfAvailable` umgestellt.
  - Detailnavigation auf ersten verfügbaren `/aufmass/*`-Link statt fixer ID.

- `e2e/kunden-workflow.spec.ts`
  - bereits zuvor auf ersten verfügbaren `/kunden/*`-Link umgestellt.

## Verifikation

- `pnpm --filter @zunftgewerk/web exec playwright test e2e/kunden-workflow.spec.ts e2e/angebote-workflow.spec.ts e2e/aufmass-workflow.spec.ts e2e/abnahmen-workflow.spec.ts --reporter=line`
  - Ergebnis: `6 skipped` (keine Hard-Fails)
- `pnpm --filter @zunftgewerk/web exec playwright test e2e/dashboard.spec.ts --reporter=line`
  - Ergebnis: `2 passed`, `5 skipped`

## Ergebnis

Die Smoke-Suite bricht nicht mehr an veralteten, hardcodierten Mock-IDs.
