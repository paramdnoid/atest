# Dashboard UX Referenz

Diese Referenz definiert die verbindlichen Regeln für die `Übersicht` und alle MALER-Unterseiten in `apps/web`.

## Verbindliche Zonen

- Zone A: Header mit Titel, Beschreibung, Badge und Aktionen
- Zone B: KPI-Strip mit 3 Kennzahlenkarten
- Zone C: Hauptinhalt links, Nebeninhalt rechts (`lg:grid-cols-2`)
- Zone D: Loading-, Error- und Empty-States pro Inhaltsblock

## Do

- Nutze für alle Modulseiten dieselbe Zonenreihenfolge A-B-C-D.
- Nutze bestehende Tokens aus `components/dashboard/ui-tokens.ts`.
- Halte Karten auf `rounded-lg border border-border` und Tabellenzellen auf `px-4 py-3`.
- Setze Statusindikatoren über `Badge`-Varianten statt über freie Farbcodes.
- Definiere pro Datenblock immer Loading, Error und Empty.

## Don't

- Keine Hardcoded-Farben oder Ad-hoc-Schatten pro Seite.
- Keine abweichenden Seitenraster oder zufällige Abstandswerte.
- Keine Tabellen ohne Empty-State.
- Keine Unterseiten ohne KPI-Strip.
- Keine zusätzlichen Header-Muster außerhalb von `PageHeader`.

## Abnahmekriterien

- `Übersicht` und alle MALER-Unterseiten nutzen dieselbe Grundstruktur.
- Typografie-, Spacing- und Radius-Werte entsprechen den Dashboard-Tokens.
- Jede MALER-Unterseite zeigt konsistente States (Loading/Error/Empty).
- UI-Komponenten sind auf Wiederverwendung ausgelegt (`ModulePageTemplate`, `KpiStrip`, `ModuleTableCard`).
