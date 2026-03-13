# Aufmaß Sprint A Checklist (P0)

Zweck: Diese Liste ist für die tägliche Team-Abarbeitung von Sprint A (P0) und bildet die operative Reihenfolge mit klaren Done-Kriterien ab.

## Sprintziel

- Aufmaß-Detailseite wird sofort verständlicher durch:
  - eindeutige Primäraktion je Status
  - global sichtbare, klickbare Blocker
  - reduzierte KPI-Komplexität
  - task-orientierte Navigation
  - kompakter Kontextbereich

## Reihenfolge (verbindlich)

1. `T-010` Header-Aktionsmodell normalisieren
2. `T-011` Globales Blocker-Banner + Deep Links
3. `T-012` KPI-Strip auf Essentials
4. `T-013` Tabs task-orientiert
5. `T-014` Context Rail einklappen
6. `T-015` P0-Verifikation + Gate-B-Entscheidung

---

## T-010 Header-Aktionsmodell normalisieren

- Prio: `P0`
- Aufwand: `M`
- Dateien:
  - `apps/web/components/aufmass/aufmass-detail-header.tsx`
  - `apps/web/app/(dashboard)/aufmass/[id]/page.tsx`

### Aufgaben

- [ ] Statusmatrix final bestätigen (`DRAFT`, `IN_REVIEW`, `APPROVED`, `BILLED`)
- [ ] Genau 1 Primäraktion pro Status im Header sichtbar
- [ ] Sekundäraktionen klar als sekundär/overflow ausweisen
- [ ] Disabled-State mit verständlicher Ursache ausgeben
- [ ] Manueller Durchlauf aller Statuspfade

### Done-Kriterium

- [ ] Pro Status nur eine dominierende CTA, keine doppelte Steuerung

---

## T-011 Blocker-Banner + Deep Links

- Prio: `P0`
- Aufwand: `M`
- Dateien:
  - `apps/web/app/(dashboard)/aufmass/[id]/page.tsx`
  - `apps/web/components/aufmass/review-diff-panel.tsx`
  - optional `apps/web/components/aufmass/measurement-grid.tsx`

### Aufgaben

- [ ] Einheitliche Blockerquelle in `page.tsx` definieren
- [ ] Sticky Banner unter Header einfügen
- [ ] Top-3 Blocker + Restzähler anzeigen
- [ ] Blocker-Links auf Zielbereiche (Tab/Issue/Zeile) verdrahten
- [ ] Fokus nach Sprung korrekt setzen
- [ ] "Erneut versuchen" mit Statusaktion koppeln

### Done-Kriterium

- [ ] Jeder Blocker ist klickbar und führt reproduzierbar zur Ursache

---

## T-012 KPI-Strip auf Essentials

- Prio: `P0`
- Aufwand: `S`
- Datei:
  - `apps/web/components/aufmass/aufmass-kpi-strip.tsx`

### Aufgaben

- [ ] Nur 3 Primär-KPIs im Default
- [ ] Nebeninfos in sekundäre Darstellung verschieben
- [ ] Zahlenformat und Einheiten harmonisieren
- [ ] Farblogik nur für Ausnahmen/Blocker

### Done-Kriterium

- [ ] KPI-Strip ist auf einen Blick verständlich und nicht überladen

---

## T-013 Tabs task-orientiert

- Prio: `P0`
- Aufwand: `S`
- Datei:
  - `apps/web/components/aufmass/aufmass-workspace-tabs.tsx`

### Aufgaben

- [ ] Labels/Subtexte auf Aufgabenfluss ausrichten
- [ ] Review-Badge semantisch korrekt (blockierend/warnend)
- [ ] Keyboard-Steuerung (Tab/Arrow/Focus) prüfen
- [ ] Mobile-Sichtbarkeit/Horizontal-Scroll prüfen

### Done-Kriterium

- [ ] Nutzer erkennt je Tab sofort den Zweck und nächsten Schritt

---

## T-014 Context Rail einklappen

- Prio: `P0`
- Aufwand: `M`
- Dateien:
  - `apps/web/components/aufmass/aufmass-detail-context-rail.tsx`
  - `apps/web/app/(dashboard)/aufmass/[id]/page.tsx`

### Aufgaben

- [ ] Essentials in kompakter Standardansicht zeigen
- [ ] Historie/Datennetz in progressive Disclosure überführen
- [ ] Expand/Collapse State definieren und testen
- [ ] Auf kleineren Viewports kompakt halten

### Done-Kriterium

- [ ] Hauptarbeitsbereich bleibt visuell dominant, Kontext bleibt erreichbar

---

## T-015 P0-Verifikation + Gate B

- Prio: `P0`
- Aufwand: `S`
- Abhängigkeit: `T-010` bis `T-014` abgeschlossen

### Pflichtchecks

- [ ] Lint/Typecheck für `apps/web` ohne neue Fehler
- [ ] Manuelle Statuspfade vollständig getestet
- [ ] Blocker-Deep-Links funktionieren in allen relevanten Fällen
- [ ] Tastatur-Smoke-Test bestanden
- [ ] Desktop + Mobile Kurzprüfung dokumentiert

### Gate-B-Entscheidung (Go/No-Go)

- [ ] **Go**, wenn:
  - Primäraktion je Status eindeutig ist
  - Blocker-Navigation robust funktioniert
  - keine fachliche Regression sichtbar ist
- [ ] **No-Go**, wenn:
  - Blocker nicht zuverlässig navigierbar sind
  - Status-/Freigabeablauf inkonsistent ist

---

## Daily-Status (Template)

- Datum:
- Verantwortlich:
- Aktives Ticket:
- Was wurde abgeschlossen:
- Nächstes Ticket:
- Risiko/Blocker:
- Benötigte Entscheidung:
