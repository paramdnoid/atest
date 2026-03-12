# Angebote Test Strategy

## Scope

Frontend-only Modul `angebote` mit Fokus auf:

- Listenworkflow (Filter, Saved Views, Tabellenaktionen)
- Detailworkflow (Statusmaschine, Freigabe, Option Builder)
- Differenzierungsfunktionen (Intelligence, Quick Convert)

## Unit Tests (`lib/angebote`)

- `selectors.spec.ts`
  - Query-Filter, Saved-View-Filter, KPI-Berechnung
- `state-machine.spec.ts`
  - erlaubte und verbotene Statuswechsel
  - Guard-Blocker bei Marge und Workflow-Constraints
- `pricing.spec.ts`
  - Netto-/Kosten-/Margenberechnung inkl. Rabatt
- `intelligence.spec.ts`
  - Signale fuer Margenrisiko, fehlende Kernpositionen

## E2E Tests (`e2e/angebote-workflow.spec.ts`)

- Modulzugriff ueber Sidebar (Capability-abhaengig, sonst `test.skip`)
- Navigation Liste -> Detail
- Tabwechsel (`Optionen`, `Freigabe`, `Historie`)
- Sichtbarkeitschecks fuer Kernfunktionen (Good/Better/Best, Freigabeaktion, Audit-Eintrag)

## Regressionsfokus

- Statuswechsel darf keine ungueltigen Uebergaenge erlauben
- Auswahl der Angebotsoption muss in Detailansicht konsistent bleiben
- Batch-Aktion in der Liste darf nur selektierte Datensaetze veraendern

## CI Empfehlung

- Pflicht: `typecheck` + Unit-Tests fuer `lib/angebote`
- Optional nachgelagert: Playwright E2E mit bestehender E2E-Umgebung
