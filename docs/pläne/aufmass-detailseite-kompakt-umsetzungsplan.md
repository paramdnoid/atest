# Entwicklungsplan (Detailstufe Delivery): Aufmaß-Detailseite kompaktisieren

## 1) Zielbild, Scope, Qualitätsanspruch

Dieser Plan ist absichtlich **nicht generisch**, sondern als umsetzbarer Delivery-Plan auf Dateiebene aufgebaut.

- Ziel: Aufmaß-Detailseite wird kompakt, eindeutig und task-orientiert, ohne Informationsverlust.
- Scope: Frontend `apps/web` für `Aufmaß`-Detailroute und direkte Komponenten.
- Non-Goals: keine Backend-Änderungen, keine neue Domain-Logik außerhalb der vorhandenen State-Machine.
- Qualitätsanspruch:
  - klare Primäraktion je Status
  - Blocker in max. 1 Klick lösbar/navigierbar
  - kein Kontextverlust bei Raum/Tab-Wechsel
  - A11y mindestens stabil, ideal verbessert

## 2) Betroffene Dateien (verbindlich)

- `apps/web/app/(dashboard)/aufmass/[id]/page.tsx`
- `apps/web/components/aufmass/aufmass-detail-header.tsx`
- `apps/web/components/aufmass/aufmass-kpi-strip.tsx`
- `apps/web/components/aufmass/aufmass-workspace-tabs.tsx`
- `apps/web/components/aufmass/aufmass-detail-context-rail.tsx`
- `apps/web/components/aufmass/measurement-grid.tsx`
- `apps/web/components/aufmass/room-tree-panel.tsx`
- `apps/web/components/aufmass/review-diff-panel.tsx`
- `apps/web/components/aufmass/billing-preview-card.tsx`
- `apps/web/components/dashboard/ui-tokens.ts`

## 3) Prioritäten, Aufwand, Gates

- Prioritäten:
  - `P0` = Muss vor produktiver UX-Freigabe
  - `P1` = Soll für vollständige Wirkung
  - `P2` = Optimierung/Feinschliff
- Aufwand:
  - `S` <= 0.5 PT
  - `M` = 1-2 PT
  - `L` >= 3 PT oder mehrere Komponenten mit Kopplung
- Gate-Logik:
  - Gate A nach Phase 0
  - Gate B nach P0
  - Gate C nach P1
  - Gate D nach P2/Release

---

## 4) Exakte Reihenfolge (Schritt-für-Schritt, Ticket-fähig)

## Phase 0 - Vorbereitung (kein UI-Umbau)

### T-000 Baseline-Metriken und Messplan
- Prio: `P0` | Aufwand: `S` | Abhängigkeiten: keine
- Schritte:
  1. Metrikdefinition finalisieren: `TTFA`, `Time-to-first-blocker-resolution`, Fehlklickrate Statusaktionen, Tab-Ping-Pong.
  2. „Messpunkt pro Ereignis“ definieren (z. B. Tabwechsel, CTA-Klick, Blocker-Sprung).
  3. Baseline-Erhebung mit aktuellem UI dokumentieren.
  4. Sollwerte festlegen.
- Output: Messdokument + Baseline-Tabelle.
- Exit: Baseline liegt vor und ist teamweit abgestimmt.

### T-001 UI-Inventar und Informationsklassifizierung
- Prio: `P0` | Aufwand: `S` | Abhängigkeiten: T-000
- Schritte:
  1. Alle sichtbaren Informationsblöcke in `page.tsx` und Child-Komponenten erfassen.
  2. Je Block Klassifizierung: `Primary`, `Secondary`, `Expert`.
  3. Duplikate markieren (gleiche Information an mehreren Stellen).
  4. Zielzuordnung in 3 Zonen: `Top`, `Main`, `Context`.
- Output: Mapping-Tabelle mit Owner-Komponente.
- Exit: Keine ungeklärten Duplikate.

### T-002 Implementierungs-Sicherheitsnetz
- Prio: `P0` | Aufwand: `S` | Abhängigkeiten: T-001
- Schritte:
  1. Feature-Flag für „kompaktes Detaillayout“ vorbereiten.
  2. Rollback-Pfad definieren (Flag Off = altes Verhalten).
  3. Visuelle Vergleichs-Screenshots „vorher“ erstellen (Desktop + Mobile).
- Output: Rollout-/Rollback-Notiz.
- Exit: Team kann neue UI jederzeit gefahrlos deaktivieren.

### Gate A (Go/No-Go)
- Go wenn: T-000 bis T-002 vollständig.
- No-Go wenn: keine Baseline oder kein Rollback-Pfad vorhanden.

---

## Phase 1 - P0 Kernumbau (muss zuerst fertig sein)

### T-010 Header-Aktionsmodell normalisieren
- Prio: `P0` | Aufwand: `M` | Abhängigkeiten: T-002
- Dateien: `aufmass-detail-header.tsx`, `page.tsx`
- Schritte:
  1. Statusmatrix finalisieren (`DRAFT`, `IN_REVIEW`, `APPROVED`, `BILLED`) inklusive erlaubter Primäraktion.
  2. Primäraktion je Status als einzige dominante CTA rendern.
  3. Sekundäraktionen (Prüfdialog, Abrechnung etc.) in klar sekundäres Muster verschieben.
  4. Disabled-State mit handlungsorientiertem Grundtext ergänzen.
  5. Regressionstest: alle Status durchklicken.
- Akzeptanz: pro Status exakt 1 Primary CTA.
- Risiko: Gewohnte Bedienpfade brechen.
- Mitigation: sekundäre Aktionen weiterhin erreichbar.

### T-011 Globales Blocker-Banner mit Deep Links
- Prio: `P0` | Aufwand: `M` | Abhängigkeiten: T-010
- Dateien: `page.tsx`, `review-diff-panel.tsx`, `measurement-grid.tsx` (falls nötig)
- Schritte:
  1. Einheitliche Blockerquelle definieren (keine konkurrierenden Listen).
  2. Sticky Banner direkt unter Header platzieren.
  3. Top-Blocker priorisiert anzeigen (max. 3 direkt + „weitere x“).
  4. Für jeden Blocker Zielanker definieren (Tab + Element).
  5. Sprunglogik implementieren (Tab aktivieren -> Element fokussieren).
  6. „Erneut versuchen“-Pfad auf bestehende Statusaktion verdrahten.
- Akzeptanz: Jeder sichtbare Blocker ist anklickbar und führt zur Ursache.

### T-012 KPI-Strip auf Essentials reduzieren
- Prio: `P0` | Aufwand: `S` | Abhängigkeiten: T-010
- Dateien: `aufmass-kpi-strip.tsx`
- Schritte:
  1. Drei Kern-KPIs festschreiben (`Blocker`, `Summen`, `Räume/Positionen`).
  2. Nebenwerte in sekundäre Ebene (Popover/Tooltip) auslagern.
  3. Zahlen-/Einheitenformat standardisieren (`tabular-nums`, feste Präzision).
  4. Farblogik auf „Exception-first“ umstellen.
- Akzeptanz: Kein KPI-Rauschen mehr im Default-View.

### T-013 Tabs auf Aufgabenfluss ausrichten
- Prio: `P0` | Aufwand: `S` | Abhängigkeiten: T-011
- Dateien: `aufmass-workspace-tabs.tsx`
- Schritte:
  1. Task-Labels + kurze Orientierungstexte ergänzen.
  2. Badge-Semantik trennen: blockierend vs. warnend.
  3. Keyboard/A11y der Tabs gegen WAI-Tab-Verhalten prüfen.
  4. Mobile Horizontal-Scroll und aktive Sichtbarkeit prüfen.
- Akzeptanz: Tabbezeichnungen erklären den nächsten Arbeitsschritt.

### T-014 Context Rail einklappbar und verdichtet
- Prio: `P0` | Aufwand: `M` | Abhängigkeiten: T-011
- Dateien: `aufmass-detail-context-rail.tsx`, `page.tsx`
- Schritte:
  1. Rail-Inhalte priorisieren (Essentials zuerst).
  2. Historie/Datennetz in progressive Disclosure verschieben.
  3. Toggle-Zustände definieren: default kompakt, optional expanded.
  4. Auf kleinen Breakpoints als Accordion/Bottom-Sheet-Muster vorbereiten.
- Akzeptanz: Main-Arbeitsbereich bleibt visuell dominant.

### T-015 P0 Verifikation (technisch + UX)
- Prio: `P0` | Aufwand: `S` | Abhängigkeiten: T-010 bis T-014
- Schritte:
  1. Lint/Typecheck für `apps/web` ausführen.
  2. Manueller Testlauf: 4 Statuspfade + Blocker-Navigation.
  3. A11y-Smoke-Test (Tastatur + Fokus).
  4. Baseline-Metriken stichprobenartig gegen P0 prüfen.
- Exit: P0 stabil, keine Blocker-Regressions.

### Gate B (Go/No-Go)
- Go wenn:
  - eine Primäraktion je Status
  - funktionierende Blocker-Deep-Links
  - keine Regression in Statuswechseln
- No-Go wenn:
  - Blocker nicht navigierbar
  - fachlicher Ablauf (Review/Freigabe/Abrechnung) inkonsistent

---

## Phase 2 - P1 Strukturumbau (volle UX-Wirkung)

### T-020 3-Zonen-Seitenlayout in `page.tsx`
- Prio: `P1` | Aufwand: `L` | Abhängigkeiten: Gate B
- Dateien: `page.tsx`, `ui-tokens.ts`
- Schritte:
  1. Zielstruktur im JSX fixieren (`Top`, `Main`, `Context`).
  2. Bestehende Blöcke in die richtigen Zonen verschieben.
  3. Spaltenverhältnis für Desktop über Tokens definieren.
  4. Collapsing-Logik für Context-Zone integrieren.
  5. Layout auf `lg/xl/2xl` validieren.
- Akzeptanz: keine doppelten Infos in mehreren Zonen.

### T-021 Master-Detail stabilisieren (Room -> Grid)
- Prio: `P1` | Aufwand: `M` | Abhängigkeiten: T-020
- Dateien: `room-tree-panel.tsx`, `measurement-grid.tsx`, `page.tsx`
- Schritte:
  1. `activeRoomId` als persistente Quelle definieren.
  2. Wechselverhalten bei Tab-Wechsel fixieren (keine Rücksetzung).
  3. Raumkontext über Grid anzeigen.
  4. Arrow-Key-Navigation und Fokusindikator prüfen.
- Akzeptanz: Kein Kontextverlust beim Navigieren.

### T-022 Measurement Grid auf schnelle Erkennung trimmen
- Prio: `P1` | Aufwand: `M` | Abhängigkeiten: T-021
- Dateien: `measurement-grid.tsx`
- Schritte:
  1. Sticky erste Spalte + kompakter Row-Rhythmus.
  2. Numerik rechtsbündig + tabellarische Ziffern.
  3. Ausnahme-Markierung nur für relevante Abweichungen.
  4. Tabellen-Semantik verbessern (`th`, `scope`, beschreibende Header).
  5. Sehr lange Formeln/Notizen visuell kontrolliert kürzen.
- Akzeptanz: Kritische Zeilen in wenigen Sekunden auffindbar.

### T-023 Review-Diff von „Liste“ zu „Lösungsworkflow“
- Prio: `P1` | Aufwand: `M` | Abhängigkeiten: T-011, T-022
- Dateien: `review-diff-panel.tsx`, `page.tsx`
- Schritte:
  1. Issues nach Schweregrad gruppieren.
  2. Zweitgruppierung nach Raum/Position ergänzen.
  3. Jede Issue mit „zum Messwert springen“ verbinden.
  4. Erledigungsrückmeldung klar sichtbar machen.
- Akzeptanz: 100% der Blocker haben direkte Handlung.

### T-024 Billing-Ready-Check als Pflicht-Gate
- Prio: `P1` | Aufwand: `M` | Abhängigkeiten: T-023
- Dateien: `billing-preview-card.tsx`, `aufmass-detail-header.tsx`
- Schritte:
  1. Muss-/Kann-Kriterienliste im UI einführen.
  2. Abschlussaktion nur bei erfüllten Muss-Kriterien aktivieren.
  3. Fehlkriterien mit Sprungzielen verknüpfen.
  4. Erfolgszustand klar und revisionssicher visualisieren.
- Akzeptanz: keine Abrechnung ohne bestandenen Ready-Check.

### T-025 Density-Token-System
- Prio: `P1` | Aufwand: `M` | Abhängigkeiten: T-020
- Dateien: `ui-tokens.ts`, alle Aufmaß-Komponenten
- Schritte:
  1. Token definieren (`compact/default` für spacing, header, row).
  2. Komponenten in fixer Reihenfolge migrieren:
     - Header
     - KPI Strip
     - Tabs
     - Grid
     - Context Rail
  3. Visuelle Regression je Schritt prüfen.
- Akzeptanz: einheitliche Dichte über alle Bereiche.

### T-026 P1 Verifikation (Layout + Verhalten)
- Prio: `P1` | Aufwand: `S` | Abhängigkeiten: T-020 bis T-025
- Schritte:
  1. Lint/Typecheck.
  2. Testmatrix Desktop/Mobile/Keyboard.
  3. Vergleichsscreenshots gegen P0.
  4. Metrik-Delta gegen Baseline prüfen.
- Exit: P1 stabil, kein A11y- oder Flow-Rückschritt.

### Gate C (Go/No-Go)
- Go wenn:
  - 3-Zonen-Layout stabil
  - Master-Detail ohne Kontextverlust
  - Review/Billing handlungsorientiert
- No-Go wenn:
  - Nutzer zwischen Tabs „pendeln“ muss, um einfache Aufgaben zu erledigen

---

## Phase 3 - P2 Optimierung und Finish

### T-030 Mikrointeraktionen und visuelle Ruhe
- Prio: `P2` | Aufwand: `S` | Abhängigkeiten: Gate C
- Dateien: `page.tsx`, Tabs, Grid
- Schritte:
  1. Übergänge auf relevante Interaktionen begrenzen.
  2. Layout-Shift vermeiden (stabile Höhen bei Ladezuständen).
  3. `prefers-reduced-motion` berücksichtigen.
- Akzeptanz: keine irritierenden Sprünge.

### T-031 Kompakte Trendvisualisierung (optional, nur bei Nutzen)
- Prio: `P2` | Aufwand: `M` | Abhängigkeiten: T-022
- Dateien: `measurement-grid.tsx` oder Subkomponente
- Schritte:
  1. Sparklines nur dort einsetzen, wo sie Entscheidung beschleunigen.
  2. Platzbedarf gegen Lesbarkeit validieren.
  3. Bei fehlendem Mehrwert Feature zurückstellen.
- Akzeptanz: Mehrwert messbar, sonst nicht ausrollen.

### T-032 Kontext-Hilfe an kritischen Stellen
- Prio: `P2` | Aufwand: `S` | Abhängigkeiten: T-023, T-024
- Dateien: Review/Billing/Grid
- Schritte:
  1. Nur 3-5 Hochrisiko-Begriffe mit Hilfe versehen.
  2. Hilfetexte kurz, handlungsorientiert, nicht erklärbär-lastig.
  3. Konsistentes Tooltip/Popover-Muster nutzen.
- Akzeptanz: Hilfe ohne Clutter.

### T-033 Telemetrie-Abschluss und Entscheidung
- Prio: `P2` | Aufwand: `S` | Abhängigkeiten: T-030 bis T-032
- Schritte:
  1. Finales Metrikfenster aufnehmen.
  2. Vorher/Nachher Bericht erzeugen.
  3. Rollout-Empfehlung: `voll`, `teilweise`, `nacharbeiten`.
- Akzeptanz: Entscheidung datenbasiert.

### Gate D (Release-Gate)
- Go wenn Zielwerte erreicht oder mit klarer Begründung akzeptiert.
- No-Go wenn Kernmetriken deutlich verfehlt.

---

## 5) Abhängigkeitsgraph (Detail)

- T-000 -> T-001 -> T-002 -> Gate A
- Gate A -> T-010 -> T-011 -> (T-013, T-014, T-023)
- T-010 -> T-012
- (T-010..T-014) -> T-015 -> Gate B
- Gate B -> T-020 -> (T-021, T-025)
- T-021 -> T-022 -> T-023 -> T-024
- (T-020..T-025) -> T-026 -> Gate C
- Gate C -> (T-030, T-031, T-032) -> T-033 -> Gate D

## 6) Definition of Done je Priorität

### P0 DoD
- Primäraktion je Status eindeutig.
- Blocker global sichtbar, deep-linkbar, reproduzierbar.
- KPI-Strip reduziert auf Essentials.
- Keine Regression in Status-/Freigabeabläufen.

### P1 DoD
- 3-Zonen-Layout konsistent.
- Master-Detail stabil, kein Kontextverlust.
- Review und Billing führen Nutzer zur nächsten Handlung.
- Dichte-/Spacing-System überall konsistent.

### P2 DoD
- Interaktionsqualität sichtbar verbessert.
- Optional-Visualisierungen nur bei nachweisbarem Mehrwert.
- Telemetrie bestätigt Nutzwertsteigerung.

## 7) Test- und Prüfcheckliste pro Ticket (Mindeststandard)

Für **jedes** Ticket verpflichtend:
1. Lint/Typecheck auf betroffene App.
2. Tastaturdurchlauf (Tabs -> Tree -> Grid -> CTA).
3. Responsive Smoke-Test (`md`, `lg`, `xl`).
4. Statuspfad-Test (`DRAFT` -> `IN_REVIEW` -> `APPROVED` -> `BILLED`).
5. Screenshot-Delta vor/nach bei visuellen Änderungen.

## 8) Zielmetriken für Abnahme

- `TTFA`: mindestens -30%
- Zeit bis erste Blockerauflösung: mindestens -25%
- Fehlklickrate bei Statusaktionen: mindestens -40%
- Tab-Ping-Pong: mindestens -20%
- Erfolgreiche Freigabe beim ersten Versuch: mindestens +20%

## 9) Umsetzungsreihenfolge im Sprint-Schnitt

- Sprint A: T-000 bis T-015 (P0 komplett)
- Sprint B: T-020 bis T-026 (P1 komplett)
- Sprint C: T-030 bis T-033 (P2 + Release-Entscheid)

## 10) Hinweis zur Umsetzung

Wenn während der Umsetzung neue fachliche Anforderungen auftauchen: zuerst in T-001/T-020 Mapping ergänzen, dann priorisieren. Keine „ungeplanten“ UI-Blöcke außerhalb des 3-Zonen-Modells aufnehmen.

## 11) Entscheidungsansicht (Behalten / Parken / Streichen)

Diese Ansicht ist für eine schnelle Team-Entscheidung vor Sprint-Start.

### Behalten (für Start empfohlen)

- **Sprint A (P0) vollständig behalten**
  - T-000, T-001, T-002
  - T-010, T-011, T-012, T-013, T-014, T-015
- **Begründung:** Ohne diese Tickets fehlt die notwendige Basis für Klarheit, Blocker-Navigation und sichere Einführung.

### Parken (erst nach stabiler P1-Basis entscheiden)

- **T-031 Kompakte Trendvisualisierung (Sparklines)**
- **Begründung:** Optionaler Mehrwert, aber kein Kernproblem-Löser für aktuelle Unübersichtlichkeit.

### Streichen (aktuell nicht streichen)

- **Aktuell keine Tickets streichen.**
- **Begründung:** Alle übrigen Tickets sind direkt mit dem UX-Zielbild gekoppelt und bauen logisch aufeinander auf.

## 12) Sofortige Startreihenfolge (konkret)

Wenn ihr jetzt startet, exakt so vorgehen:

1. **T-010** Header-Aktionsmodell normalisieren  
2. **T-011** Globales Blocker-Banner + Deep Links  
3. **T-012** KPI-Strip auf Essentials  
4. **T-013** Tabs task-orientiert  
5. **T-014** Context Rail einklappen  
6. **T-015** P0 Verifikation  

Danach Gate B Entscheidung.
