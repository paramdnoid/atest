# apps/web Next Audit/Refactor Block C

Datum: 2026-03-13  
Ausgangslage: Block B ist gemerged (PR #7). Der naechste produktrelevante Hebel liegt in der Kompaktisierung und Stabilisierung der Aufmass-Detailseite.

Status: Umsetzung abgeschlossen (lokal verifiziert).

## Ziel dieses Blocks

- Die Aufmass-Detailseite auf einen klaren, task-orientierten Arbeitsfluss ausrichten.
- Informationsdichte reduzieren, ohne fachliche Information zu verlieren.
- Blocker-Aufloesung beschleunigen (Deep-Link + Fokusfuehrung).
- A11y/Keyboard-Verhalten und E2E-Stabilitaet auf kritischen Pfaden absichern.

## Scope (Block C)

### 1) Header-Aktionsmodell normalisieren (P0)

- **Warum:** Der Header mischt aktuell mehrere konkurrierende Aktionen; Prioritaet je Status ist nicht immer eindeutig.
- **Lieferobjekt:**
  - Eine klare Statusmatrix (`DRAFT`, `IN_REVIEW`, `APPROVED`, `BILLED`) mit genau einer dominanten Primary-CTA je Status.
  - Sekundaeraktionen bleiben verfuegbar, aber visuell/semantisch klar nachgeordnet.
  - Disabled-Zustaende mit handlungsorientiertem Grundtext.
- **Dateien:**
  - `apps/web/components/aufmass/aufmass-detail-header.tsx`
  - `apps/web/app/(dashboard)/aufmass/[id]/page.tsx`

### 2) Globales Blocker-Banner mit Deep Links (P0)

- **Warum:** Blocker werden nicht durchgaengig zentral gefuehrt; Ursache-Aufruf kostet zu viele Klicks.
- **Lieferobjekt:**
  - Einheitliche Blockerquelle und Sticky-Banner unterhalb des Headers.
  - Priorisierte Top-Blocker (max. 3 direkt sichtbar + Restindikator).
  - Deep-Link-Navigation: Blocker-Klick aktiviert Ziel-Tab und fokussiert Zielbereich.
- **Dateien:**
  - `apps/web/app/(dashboard)/aufmass/[id]/page.tsx`
  - `apps/web/components/aufmass/review-diff-panel.tsx`
  - `apps/web/components/aufmass/measurement-grid.tsx`

### 3) KPI-Strip auf Essentials reduzieren (P0)

- **Warum:** Zu viele gleichgewichtete KPIs erzeugen visuelles Rauschen.
- **Lieferobjekt:**
  - Fokus auf Kernmetriken (`Blocker`, `Summen`, `Raeume/Positionen`).
  - Nebenwerte in sekundaeres Muster (Tooltip/Popover).
  - Einheitliche Zahlen-/Einheitenformatierung.
- **Dateien:**
  - `apps/web/components/aufmass/aufmass-kpi-strip.tsx`

### 4) Tabs auf Aufgabenfluss ausrichten (P0)

- **Warum:** Tab-Namen und Badge-Semantik sind fachlich korrekt, aber nicht optimal auf den naechsten Arbeitsschritt ausgelegt.
- **Lieferobjekt:**
  - Eindeutige, handlungsorientierte Tab-Labels.
  - Klare Badge-Semantik (blockierend vs. warnend).
  - Verifiziertes WAI-Tab-Keyboard-Verhalten inkl. Mobile-Sichtbarkeit.
- **Dateien:**
  - `apps/web/components/aufmass/aufmass-workspace-tabs.tsx`
  - `apps/web/e2e/aufmass-workflow.spec.ts`

### 5) Context Rail verdichten und einklappbar machen (P0)

- **Warum:** Context-Inhalte konkurrieren mit dem Main-Arbeitsbereich statt ihn zu unterstuetzen.
- **Lieferobjekt:**
  - Essenzielle Infos zuerst, sekundare Inhalte als progressive Disclosure.
  - Default: kompakt; optional: erweitert.
  - Mobile Verhalten als Accordion/Sheet-Pattern.
- **Dateien:**
  - `apps/web/components/aufmass/aufmass-detail-context-rail.tsx`
  - `apps/web/app/(dashboard)/aufmass/[id]/page.tsx`

## Reihenfolge (empfohlen)

1. Header-Aktionsmodell (1)  
2. Blocker-Banner + Deep Links (2)  
3. KPI-Strip (3)  
4. Task-orientierte Tabs (4)  
5. Context Rail Kompaktmodus (5)

## Akzeptanzkriterien (Block C gesamt)

- Pro Status exakt eine dominierende Primary-CTA im Header.
- Jeder sichtbare Blocker fuehrt per Klick zur konkreten Ursache (inkl. Fokusfuehrung).
- Main-Arbeitsbereich bleibt in Desktop und Mobile visuell dominant.
- Keine Regression in Statuswechseln, Review-Flow und Abrechnungsfreigabe.
- Tastaturbedienung in Tabs bleibt voll funktionsfaehig (Arrow/Home/End/Enter/Space/Escape gem. Pattern).

## Quality Gates

- `pnpm --filter @zunftgewerk/web typecheck`
- `pnpm --filter @zunftgewerk/web lint`
- `pnpm --filter @zunftgewerk/web test:unit`
- `pnpm --filter @zunftgewerk/web exec playwright test e2e/aufmass-workflow.spec.ts`
- Manueller UX-Check:
  - Statuspfade `DRAFT` -> `IN_REVIEW` -> `APPROVED` -> `BILLED`
  - Blocker-Klickpfad (Banner -> Zielstelle)
  - Keyboard-only Durchlauf in Header/Tabs/Rail

## Definition of Done

- Jede Teilaufgabe hat:
  - kurze Change-Notiz (Warum + was geaendert),
  - Testnachweis,
  - Risiko-/Trade-off-Hinweis.
- PR enthaelt:
  - Mapping auf die 5 Block-C-Tasks,
  - Verifikationsergebnisse,
  - explizite Restpunkte fuer Block D (falls vorhanden).

## Umsetzungsnotizen (2026-03-13)

- Task 1 umgesetzt: `page.tsx` nutzt jetzt eine klare Status-Action-Matrix mit genau einer dominanten Primary-CTA pro Status (inkl. Disabled-Reason).
- Task 2 umgesetzt: globales Blocker-Banner mit Top-3 Priorisierung, Restindikator und klickbaren Deep-Links in die Ziel-Workspaces.
- Task 3 umgesetzt: KPI-Strip auf 3 Kern-Karten reduziert (`Pruefblocker`, `Summen`, `Raeume`), Nebenwert `Messwerte` in die Summen-Subline integriert.
- Task 4 umgesetzt: task-orientierte Tab-Labels, deutlichere Blocker-Badge-Semantik, Guidance-Text und mobile aktive-Tab-Sichtbarkeit (auto scrollIntoView).
- Task 5 umgesetzt: Context Rail hat jetzt einen kompakten Default-Modus mit explizitem Expand/Collapse-Toggle.

### Verifikation

- `pnpm --filter @zunftgewerk/web typecheck` ✅
- `pnpm --filter @zunftgewerk/web lint` ✅
- `pnpm --filter @zunftgewerk/web test:unit` ✅
- `pnpm --filter @zunftgewerk/web exec playwright test e2e/aufmass-workflow.spec.ts` ✅
