# apps/web Capability Mock Runtime Removal (2026-03-13)

Status: Umsetzung abgeschlossen (lokal verifiziert)

## Ziel

Den verbleibenden Runtime-Teil der Mock-Profilsteuerung aus dem Shell-/Profilpfad entfernen.

## Umgesetzt

- `lib/effective-profile.ts`
  - Import von `capability-mock` entfernt.
  - `EffectiveProfile.source` auf API-Quelle vereinheitlicht.
  - `loadEffectiveProfile` ohne Mock-Fallback (`fallbackProfileId`) umgesetzt.
  - Robuste API-basierte Defaults (`member`/`MALER`/`Workspace`) statt lokalem Mock-Profil.

- `components/shell/app-shell.tsx`
  - LocalStorage-basierte Mock-Profil-Auswahl entfernt.
  - `loadEffectiveProfile(token)` ohne Mock-Parameter.
  - Signout ohne Mock-Storage-Cleanup.

## Verifikation

- `pnpm --filter @zunftgewerk/web typecheck` -> erfolgreich
- `ReadLints` auf geänderte Dateien -> keine Fehler

## Hinweis

- `lib/capability-mock.ts` verbleibt aktuell nur als Test-/Hilfsartefakt.
- Runtime-Referenz existiert nur noch in E2E-Helfern (`e2e/helpers/workflow.ts`) für explizite Testsimulation.
