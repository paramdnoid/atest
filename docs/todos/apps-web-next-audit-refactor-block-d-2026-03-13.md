# apps/web Next Audit/Refactor Block D

Datum: 2026-03-13  
Ausgangslage: Block C ist abgeschlossen. Fokus dieses Blocks: Phase 2 + Phase 3 aus dem Delivery-Plan der Aufmaß-Detailseite.

Status: Umsetzung abgeschlossen (lokal verifiziert).

## Scope (abgeschlossen)

### T-020 3-Zonen-Seitenlayout
- Top/Main/Context-Struktur in `aufmass/[id]/page.tsx` konsistent gezogen.
- Workspace-Navigation zentralisiert (Tabs als eigener Top-Bereich).
- Main/Context-Gitter auf `dashboardUiTokens.mainGrid` vereinheitlicht.

### T-021 Master-Detail stabilisieren
- Raumselektion robust gemacht (Fallback auf ersten Raum ohne Reset-Effekt).
- `RoomTreePanel` mit roving-focus Verhalten (`tabIndex`, `Home`, `End`, Arrow-Navigation).
- Aktiver Raum bleibt über Workspace-Wechsel erhalten.

### T-022 Measurement Grid auf schnelle Erkennung
- Raumkontextzeile ergänzt.
- Zeilen mit stabilen Test-IDs versehen.
- Lange Formeln/Notizen kontrolliert gekürzt (inkl. `title` für Volltext).
- Numerik und Ausnahme-Markierung wurden beibehalten und geschärft.

### T-023 Review-Diff als Lösungsworkflow
- Review-Issues nach Severity gruppiert (`blocking`, `warning`, `info`).
- Zweitgruppierung nach Raum/Position.
- Direkter Sprung aus jeder Issue bleibt erhalten.
- Erledigungsziel im Panel explizit visualisiert.

### T-024 Billing Ready-Check als Gate
- Muss-Kriterien + Blockerliste im Billing-Bereich sichtbar.
- Blocker erhalten konkrete "Öffnen"-Aktion mit Sprung in passenden Workspace.
- Abschlussaktion bleibt strikt an Gate gebunden (`canBill`).

### T-025 Density-Token-System
- Aufmaß-Dichte-Tokens in `dashboard/ui-tokens.ts` ergänzt und in Hauptflow verwendet.
- Kompaktes Spacing-/Panel-Raster in den Kernbereichen vereinheitlicht.

### T-030 Mikrointeraktionen und visuelle Ruhe
- `motion-reduce`-Fallbacks für zentrale Transitions gesetzt.
- Schwebende/animierte Bereiche auf reduzierte Bewegung vorbereitet.

### T-031 Kompakte Trendvisualisierung
- Leichte Sparkline-Vorschau in der Billing-Zusammenfassung ergänzt.
- Visualisierung bleibt klein und entscheidungsorientiert.

### T-032 Kontext-Hilfe an kritischen Stellen
- Review/Billing-Flow führt mit klaren, handlungsorientierten Labels und Jump-Aktionen.
- Kritische Begriffe erhalten bessere Einordnung durch Segmentierung und Kontextblöcke.

### T-033 Telemetrie-Abschluss und Entscheidung
- Lokale Session-Metriken ergänzt (Tab-Wechsel, Blocker-Sprünge, Statusversuche/-erfolge, Schnellerfassungen).
- Direkte Rollout-Empfehlung (`voll` / `teilweise` / `nacharbeiten`) im UI sichtbar.

## Geänderte Dateien

- `apps/web/app/(dashboard)/aufmass/[id]/page.tsx`
- `apps/web/components/aufmass/room-tree-panel.tsx`
- `apps/web/components/aufmass/measurement-grid.tsx`
- `apps/web/components/aufmass/review-diff-panel.tsx`
- `apps/web/components/aufmass/billing-preview-card.tsx`
- `apps/web/components/dashboard/ui-tokens.ts`

## Verifikation

- `pnpm --filter @zunftgewerk/web typecheck` ✅
- `pnpm --filter @zunftgewerk/web lint` ✅
- `pnpm --filter @zunftgewerk/web test:unit` ✅
- `pnpm --filter @zunftgewerk/web exec playwright test e2e/aufmass-workflow.spec.ts e2e/abnahmen-workflow.spec.ts` ✅

## Restpunkte

- Keine offenen Block-D-Restpunkte identifiziert.
- Nächster sinnvoller Fokus (Block E): optionaler Cross-Module-Finetune außerhalb des Aufmaß-Detailflows.
