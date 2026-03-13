# apps/web Next Audit/Refactor Block B

Datum: 2026-03-13  
Ausgangslage: PR #6 ist gemerged, Basis-Backlog aus `apps-web-top10-execution-backlog-2026-03-13.md` ist weitgehend umgesetzt.

Status: Umsetzung abgeschlossen (lokal verifiziert).

## Ziel dieses Blocks

- Die verbleibenden Restpunkte aus dem ersten Audit sauber abschliessen.
- Fokus auf technische Restschuld, A11y-Haertung und robuste Runtime-Validierung.
- Keine Funktionsregression in den Kernflows (`signin`, `dashboard`, `aufmass`, `abnahmen`, `settings`).

## Scope (Block B)

### 1) App-Shell weiter entkoppeln (Task 5 Rest)

- **Warum:** Der grobe Race-Teil ist reduziert, aber die Orchestrierung ist noch komponentenbasiert statt klarer State-Maschine.
- **Lieferobjekt:**
  - Auth/Profile-Flow in klaren Zustandsgraphen ueberfuehren (`idle` -> `auth-check` -> `profile-load` -> `ready` / `unauthenticated` / `error`).
  - Redirect-Entscheidungen an genau einer Stelle.
  - Keine mehrfachen Guard-Wege.

### 2) Runtime-Validierung ausbauen (Task 7 Rest)

- **Warum:** Ein Teil ist verbessert, aber noch nicht breit genug fuer die kritischsten API-Eingangspunkte.
- **Lieferobjekt:**
  - Gemeinsame leichte Validator-Helfer in `lib/` (ohne schwere Abhaengigkeit, falls nicht gewuenscht).
  - Schrittweise Validierung fuer High-Risk-Endpunkte:
    - `/v1/workspace/me`
    - `/v1/auth/mfa/status`
    - `/v1/licenses/seats`
    - weitere aktuell genutzte Dashboard-Endpunkte nach Impact
  - Einheitliches Fehlerbild bei invaliden Payloads.

### 3) Sidebar-Usermenu auf robustes Primitive heben (Task 9 Rest)

- **Warum:** Keyboard/Focus ist besser, aber noch kein vollstaendiges, bewertes Menu-Primitive.
- **Lieferobjekt:**
  - Migration auf robustes Menu-Primitive (z. B. `radix-ui` DropdownMenu).
  - Vollstaendige Tastatur-Semantik (Arrow, Enter/Space, Escape, Tab-Verhalten).
  - Saubere ARIA-Zustaende ohne Custom-Edgecases.

### 4) E2E-Selektoren strategisch stabilisieren (Nachschaerfung Task 6)

- **Warum:** Tests sind wieder gruen, aber weiterhin teilweise textgetrieben.
- **Lieferobjekt:**
  - Kritische Interaktionspunkte mit `data-testid`.
  - E2E in `aufmass`, `abnahmen`, `dashboard` von fragilen Text-Selektoren entkoppeln.
  - Klare Selektor-Konvention dokumentieren.

## Reihenfolge (empfohlen)

1. Runtime-Validierung (2)  
2. App-Shell-Orchestrierung (1)  
3. Sidebar-Primitive (3)  
4. E2E-Selektoren-Nachschaerfung (4)

## Akzeptanzkriterien (Block B gesamt)

- `pnpm --filter @zunftgewerk/web typecheck` gruen
- `pnpm --filter @zunftgewerk/web lint` gruen
- `pnpm --filter @zunftgewerk/web test:unit` gruen
- Ziel-E2E-Suite gruen:
  - `e2e/aufmass-workflow.spec.ts`
  - `e2e/abnahmen-workflow.spec.ts`
  - `e2e/auth-passkey-mfa.spec.ts`
  - `e2e/dashboard.spec.ts`
- Keine neuen Security-Regressionen im Auth-/Session-Flow

## Definition of Done

- Jeder Teilschritt hat:
  - kurze technische Notiz (Warum + was geaendert)
  - Testnachweis
  - Risikohinweis (falls Trade-off)
- PR-Beschreibung enthaelt:
  - Scope Mapping zu diesem Block
  - Verifikation
  - Restpunkte fuer Block C (falls vorhanden)

## Arbeits-Commands (copy/paste)

```bash
pnpm --filter @zunftgewerk/web typecheck
pnpm --filter @zunftgewerk/web lint
pnpm --filter @zunftgewerk/web test:unit
pnpm --filter @zunftgewerk/web exec playwright test e2e/aufmass-workflow.spec.ts e2e/abnahmen-workflow.spec.ts e2e/auth-passkey-mfa.spec.ts e2e/dashboard.spec.ts
```
