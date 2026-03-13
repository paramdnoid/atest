# apps/web Mock Footprint Final Cleanup (2026-03-13)

Status: Umsetzung abgeschlossen (lokal verifiziert)

## Ziel

Die letzten verbleibenden Runtime-Mock-Reste im Web-Modul vollständig entfernen.

## Umgesetzt

- E2E-Login-Helper bereinigt:
  - `e2e/helpers/workflow.ts`
  - `mockProfileId` Option entfernt
  - kein Schreiben von `zg_mock_profile_id` mehr in `localStorage`

- E2E-Spec robuster auf echte Daten umgestellt:
  - `e2e/kunden-workflow.spec.ts`
  - kein harter Mock-Datensatz (`KND-2026-1001`) mehr
  - stattdessen erster vorhandener Kunden-Link (`/kunden/*`) mit sauberem Skip-Fallback

- Mock-Hilfsmodul entfernt:
  - `lib/capability-mock.ts` gelöscht

## Verifikation

- `pnpm --filter @zunftgewerk/web typecheck` -> erfolgreich
- `rg "capability-mock|zg_mock_profile_id|mockProfileId" apps/web` -> keine Treffer
- `ReadLints` auf geänderte Dateien -> keine Fehler
