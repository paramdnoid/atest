# apps/web Runtime Mock Removal (2026-03-13)

Status: Umsetzung abgeschlossen (lokal verifiziert)

## Ziel

Runtime-Mockdaten aus den Dashboard-Modulen entfernen und stattdessen echte Backend-Daten über API-Adapter laden.

## Umgesetzt

- Dashboard-Seiten auf async API-Laden umgestellt:
  - `app/(dashboard)/kunden/page.tsx`
  - `app/(dashboard)/kunden/[id]/page.tsx`
  - `app/(dashboard)/angebote/page.tsx`
  - `app/(dashboard)/angebote/[id]/page.tsx`
  - `app/(dashboard)/abnahmen/page.tsx`
  - `app/(dashboard)/abnahmen/[id]/page.tsx`
  - `app/(dashboard)/aufmass/page.tsx`
  - `app/(dashboard)/aufmass/[id]/page.tsx`

- Neue API-Adapter eingeführt:
  - `lib/kunden/data-adapter.ts`
  - `lib/angebote/data-adapter.ts`
  - `lib/abnahmen/data-adapter.ts`
  - `lib/aufmass/data-adapter.ts` von Mock-Placeholder auf echte API-Mappings erweitert

- `lib/auftragsabwicklung/cross-module-intelligence.ts` von direkten Mock-Imports entkoppelt (mock-freier Fallback).

## Verifikation

- `pnpm --filter @zunftgewerk/web typecheck` -> erfolgreich
- `pnpm --filter @zunftgewerk/web exec tsx --test "lib/aufmass/data-adapter.spec.ts"` -> erfolgreich
- `ReadLints` auf geänderte Bereiche -> keine Fehler

## Resthinweis

- Mock-Daten bleiben für Tests (`*.spec.ts`) weiterhin als Fixture-Quelle vorhanden.
- Separater möglicher Follow-up: Runtime-`capability-mock` in Shell/Profile-Pfad vollständig entfernen.
