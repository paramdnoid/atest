---
name: responsiv
description: Prüft Frontend-Ansichten systematisch auf Responsive-Fehler, Ausrichtungsprobleme und visuelle Regressionen über mehrere Gerätegrößen im Browser. Verwenden, wenn der Nutzer Responsive-Checks, Layout-QA, Device-Tests oder Frontend-Fehlersuche über Seiten und Breakpoints verlangt.
---

# Responsiv Frontend QA

## Ziel

Stelle vor Abschluss eines UI-Tasks sicher, dass alle relevanten Seiten auf mobilen, Tablet- und Desktop-Breakpoints visuell korrekt funktionieren.

## Dashboard Pflicht-Routen

Pruefe diese Routen immer vollstaendig (inklusive Device-Matrix):

- `/dashboard`
- `/aufmass`
- `/aufmass/[id]` (mindestens eine echte Detailseite)
- `/kunden`
- `/kunden/[id]` (mindestens eine echte Detailseite)
- `/angebote`
- `/angebote/[id]` (mindestens eine echte Detailseite)
- `/abnahmen`
- `/abnahmen/[id]` (mindestens eine echte Detailseite)
- `/baustellen`
- `/rechnungen`
- `/nachkalkulation`
- `/material`
- `/zeiten`
- `/devices`
- `/licenses`
- `/team`
- `/settings`

Wenn eine Route temporär nicht erreichbar ist, als Befund mit Grund dokumentieren statt überspringen.

## Verbindlicher Ablauf

1. **Prüfumfang definieren**
   - Pflichtumfang: **alle Dashboard-Seiten inklusive aller erreichbaren Unterseiten** prüfen.
   - Die Liste unter **Dashboard Pflicht-Routen** ist verbindlich und muss komplett abgearbeitet werden.
   - Starte bei der Dashboard-Startseite und arbeite alle Navigationspunkte (inkl. verschachtelter Menüs, Tabs, Detailseiten) vollständig ab.
   - Keine Seite auslassen; bei dynamischen Routen mindestens je eine repräsentative Detailansicht öffnen.
   - Erstelle vor dem Test eine vollständige Routenliste und hake jede Route erst nach abgeschlossener Device-Matrix ab.

2. **Browser-Session korrekt starten**
   - Wenn bereits ein Tab offen ist: zuerst locken.
   - Wenn kein Tab offen ist: zur Startseite navigieren, dann locken.
   - Vor jeder Interaktion immer Snapshot ziehen.

3. **Device-Matrix vollständig abarbeiten**
   - Mobile klein: `320x568`
   - Mobile groß: `390x844`
   - Tablet hoch: `768x1024`
   - Laptop: `1366x768`
   - Desktop groß: `1920x1080`

4. **Jede Route auf jedem Device prüfen**
   - Horizontaler Scrollbalken unerwartet vorhanden?
   - Inhalte abgeschnitten, überlappend oder außerhalb des Viewports?
   - Buttons/Inputs/Tabellen korrekt ausgerichtet und klickbar?
   - Sticky Header/Sidebars verdecken Inhalte?
   - Modals/Drawers/Dropdowns korrekt positioniert?
   - Typografie, Abstände und Grid-Breakpoints konsistent?
   - Leere Zustände, Fehlerzustände und lange Inhalte stabil?

5. **Interaktionen pro Seite testen**
   - Primäre CTA klicken
   - Formulareingabe prüfen
   - Tabs/Accordion/Filter öffnen
   - Falls vorhanden: Tabelle horizontal/vertikal scrollen

6. **Befunde dokumentieren**
   - Für jeden Fund: Route, Device-Größe, kurze Reproduktion, erwartetes Verhalten, tatsächliches Verhalten.
   - Schweregrad nutzen: `kritisch`, `mittel`, `niedrig`.
   - Ohne Befund explizit "kein Fehler gefunden" pro Route und Device notieren.

7. **Session sauber beenden**
   - Browser erst unlocken, wenn alle Prüfungen abgeschlossen sind.

## Ausgabeformat

Nutze dieses kompakte Format:

```markdown
## Responsive QA Report

- Geprüfte Routen: /route-a, /route-b
- Geprüfte Devices: 320x568, 390x844, 768x1024, 1366x768, 1920x1080

### Befunde
- [kritisch] /route-a @ 320x568: Primärer Button außerhalb Viewport. Repro: ...
- [mittel] /route-b @ 768x1024: Tabellenkopf überlappt Filterleiste. Repro: ...

### Ohne Befund
- /route-a @ 1920x1080
- /route-b @ 1366x768
```

## Qualitätsregeln

- Kein Device aus der Matrix überspringen.
- Keine Dashboard-Seite oder Unterseite überspringen.
- Keine pauschale Aussage wie "sieht gut aus", ohne route- und device-spezifischen Nachweis.
- Bei langen Ladezuständen in kurzen Intervallen warten und erneut prüfen.
- Bei Unsicherheit immer Snapshot-basierte Verifikation wiederholen.
