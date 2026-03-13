# apps/web Next Audit/Refactor Block E

Datum: 2026-03-13  
Ausgangslage: Blocks B, C und D sind vollständig umgesetzt und gemerged. Kritische und hohe Risiken aus dem ursprünglichen Audit sind adressiert.

Status: Aufgesetzt (bereit für optionale Optimierungen, keine Blocker offen).

## Ziel von Block E

- Restliche Optimierungen außerhalb der Kern-Deliverables bündeln.
- Stabilität und Developer-Feedback verbessern, ohne neue Produktregressionen zu riskieren.
- Nur umsetzen, wenn zusätzlicher Produktnutzen klar ist.

## Scope (optional)

### 1) Cross-Module Feinschliff (Aufmaß ↔ Abnahmen ↔ Dashboard)
- Navigationssprünge und Kontextübergabe prüfen.
- Edgecases bei Rollen-/Modulsichtbarkeit weiter glätten.

### 2) E2E-Resilienz für profilabhängige Wege
- Für derzeit übersprungene Szenarien robuste Profil-/Feature-Gates dokumentieren.
- Skip-Strategie konsolidieren, damit CI-Signale klar bleiben.

### 3) A11y-Feinschliff im Detail-Workflow
- Fokus-Reihenfolge bei Kontext-Sheet, Tabs und Blocker-Jumps nochmals auditieren.
- Screenreader-Texte für kritische Aktionsflächen schärfen.

### 4) Performance-Mikroprofiling im Aufmaß-Detail
- Renderfrequenz bei großen Messwertlisten prüfen.
- Potenzielle Memoisierungspunkte nur bei messbarem Gewinn umsetzen.

## Akzeptanzkriterien

- Keine offenen P0/P1-Risiken aus dem ursprünglichen Audit.
- Zusätzliche Optimierungen nur mit nachweisbarem Nutzen (UX, Stabilität, Performance).
- Alle Änderungen weiterhin durch `typecheck`, `lint`, `test:unit` und relevante E2E-Specs abgesichert.

## Hinweis

- Block E ist bewusst optional und kein Pflichtumfang für den aktuellen Abschluss.
- Der produktionsrelevante Kernumfang ist bereits vollständig abgeschlossen.
