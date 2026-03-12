# Abnahmen Teststrategie (Frontend-only)

## Ziel

Das Modul `abnahmen` soll eine nachvollziehbare Abnahme- und Mängelsteuerung liefern, inklusive:

- VOB/B-orientierter Workflow-Transitions
- DIN/ISO-nahe Nachvollziehbarkeit durch Audit-Trail
- DSGVO-by-Design für Fotoevidenzen

## Kernflüsse

- Abnahmeliste öffnen und filtern
- Detail-Workspace je Vorgang öffnen
- Mangel per Quick-Capture anlegen
- Nacharbeit in den Status `REWORK_READY_FOR_REVIEW` überführen
- Abnahme mit/ohne Vorbehalt setzen
- Vorgang schließen bei signiertem Protokoll

## Unit-Tests (lib/abnahmen)

### `state-machine.spec.ts`

- Erlaubte Transitionen sind korrekt (z. B. `INSPECTION_DONE -> DEFECTS_OPEN|ACCEPTED`)
- Nicht erlaubte Sprünge werden blockiert
- `ACCEPTED` wird bei kritischen offenen Mängeln blockiert

### `selectors.spec.ts`

- Kombinierte Filterlogik (Query + Status + Kritisch + Überfällig)
- KPI-Aggregation (`openAbnahmen`, `criticalDefects`, `overdueRework`)

### `compliance-rules.spec.ts`

- Pflichtfelder im Protokoll werden als Blocker erkannt
- Schließen wird ohne signiertes Protokoll geblockt

### `evidence-policy.spec.ts`

- Personenbezug ohne Redaktion/Rechtsgrundlage erzeugt Blocker
- Bereinigte Evidenz führt zu keinen blockierenden Policy-Meldungen

## E2E-Szenario

- Datei: `e2e/abnahmen-workflow.spec.ts`
- Ablauf:
  - Login (inkl. optional MFA)
  - Navigation zu `Abnahmen & Mängel` (falls Modul sichtbar)
  - Listenansicht validieren (Heading + KPI)
  - Detail öffnen (`ABN-26-001`)
  - Tabs `Mängel` und `Historie` prüfen
  - CTA `Mangel erfassen` sichtbar

## Guard-Testmatrix

- **State-Machine Guards**
  - `INSPECTION_DONE` nur mit vollständigem Protokoll
  - `ACCEPTED` nicht bei offenen kritischen Mängeln
  - `CLOSED` nur mit signiertem Protokoll
- **Compliance Guards**
  - Fehlende Teilnehmer/Ort/Begehungsdatum blockieren relevante Schritte
  - Vorbehaltstext ist für `ACCEPTED_WITH_RESERVATION` erforderlich
- **Evidence Guards**
  - Personenbezogene Evidenz ohne Redaktion blockiert Freigabe
  - Kritische Mängel ohne Evidenz erzeugen Warnung

## Akzeptanzkriterien

- Alle neuen Unit-Tests laufen grün
- E2E-Workflow läuft für Profile mit `handover:view`
- Liste und Detail zeigen konsistente Loading/Empty/Error-Semantik
- Audit-Trail aktualisiert sich bei Status- und Erfassungsaktionen
- Datenschutzhinweise sind im Detail sichtbar und blockierende Evidenz wird markiert
