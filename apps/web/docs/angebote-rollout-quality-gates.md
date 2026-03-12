# Angebote Rollout Quality Gates

## Feature Flags

In `lib/angebote/rollout-flags.ts`:

- `NEXT_PUBLIC_ANGEBOTE_INTELLIGENCE`
- `NEXT_PUBLIC_ANGEBOTE_OPTION_BUILDER`
- `NEXT_PUBLIC_ANGEBOTE_QUICK_CONVERT`

## Rollout Phasen

1. **Foundation**
   - Liste, Filter, Tabellenansicht, Basis-KPIs
2. **Workflow Core**
   - Detailroute, Statusmaschine, Approval-Flow, Audit-Trail
3. **Differentiation**
   - Option Builder, Intelligence, Quick Convert
4. **Hardening**
   - Unit/E2E Stabilisierung, Accessibility, Performance-Tuning

## Quality Gates

- Keine Businesslogik in UI-Komponenten (nur in `lib/angebote/*`)
- Jeder Statuswechsel schreibt Audit-Event
- `not-found.tsx` und `loading.tsx` fuer Detailroute vorhanden
- Guard-Fehler muessen im UI sichtbar sein
- Feature Flags muessen degradierbar sein (Funktion ausblendbar ohne Crash)

## Abnahmecheckliste

- Angebotsliste mit Saved Views, Sortierung und Batch-Aktionen laeuft
- Detail-Workspace mit Tabs und Freigabeentscheidungen laeuft
- Option Builder und Intelligence geben sichtbaren Mehrwert
- Quick Convert setzt Status nur innerhalb gueltiger Transitionen
