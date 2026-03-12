# Kunden Rollout Quality Gates

## Feature Flags

In `lib/kunden/rollout-flags.ts`:

- `NEXT_PUBLIC_KUNDEN_MODULE_ENABLED`
- `NEXT_PUBLIC_KUNDEN_ELITE_FEATURES_ENABLED`
- `NEXT_PUBLIC_KUNDEN_OFFLINE_QUEUE_ENABLED`
- `NEXT_PUBLIC_KUNDEN_DUPLICATE_DETECTION_ENABLED`
- `NEXT_PUBLIC_KUNDEN_SLA_ENGINE_ENABLED`

## Rollout Phasen

1. **Foundation**
   - Liste, Filter, KPIs, Detailroute-Basis
2. **Workflow Core**
   - Statusmaschine, Objekte, Ansprechpartner, Timeline
3. **Elite Layer**
   - SLA/Reminder, Duplikaterkennung, Intelligence, Compliance
4. **Offline & Hardening**
   - Offline Queue, Sync-Indikator, Testabdeckung, Stabilisierung

## Quality Gates

- Keine Businesslogik in UI-Komponenten (nur in `lib/kunden/*`)
- Jeder relevante Statuswechsel erzeugt Audit-Eintrag
- `not-found.tsx` und `loading.tsx` fuer Detailroute vorhanden
- Guard-Fehler muessen im UI sichtbar sein
- Feature Flags muessen degradierbar sein (abschaltbar ohne Crash)
- Sensible Kontaktdaten fuer nicht-berechtigte Rollen maskieren

## Abnahmecheckliste

- Kundenliste mit Saved Views, Such-/Filterlogik und KPI-Strip laeuft
- Detail-Workspace mit allen Tabs laeuft
- SLA-/Reminder-Panel zeigt Risiko korrekt
- Duplikat-Review kann Entscheidungen treffen
- Compliance-Tab zeigt Consent und Retention nachvollziehbar
- Offline Queue kann manuell synchronisiert werden
