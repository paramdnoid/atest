# Runbook: Sync-Stau

## Scope

- Betrifft hohe Rueckstaende in `PushChanges`/`PullChanges` und verzogene Client-Syncs.
- Fokus auf Stabilisierung von Latenz und Konfliktrate pro Tenant.

## Symptome

- Erhoehte Sync-Latenz
- Wachsende Anzahl pending client operations
- Steigende Conflict-Rate

## Auswirkung

- Nutzer sehen verzoegerte Datenaktualisierung.
- Konfliktaufloesungen nehmen zu und belasten API/Support.

## Sofortmassnahmen

1. Lag in `change_log` und `client_operations` tenantweise pruefen.
2. Fehlerraten in `PushChanges`/`PullChanges` vergleichen.
3. Betroffene Tenants und Client-Versionen eingrenzen.

## Diagnostik

- Datenbank-Indizes auf `change_log(tenant_id, id)` verifizieren.
- Deadlocks/long-running transactions analysieren.
- Client-Versionen und Operations-Frequenz korrelieren.

## Recovery Schritte

1. API pods horizontal skalieren.
2. Verarbeitungslast reduzieren (z. B. Batch/Parallelitaet konservativ anpassen).
3. Fuer stark driftende Clients Full-Resync anstossen.
4. Danach Metriken beobachten, bis Lag und Konfliktrate stabil sinken.

## Verifikation

1. Rueckstand in `change_log`/`client_operations` sinkt nachhaltig.
2. `PushChanges`/`PullChanges` Fehlerraten sind wieder im Normalbereich.
3. Konfliktrate normalisiert sich auf Vorfallniveau.

## Postmortem Daten

- Timeline
- Root cause
- Blast radius
- Guardrail action items

## Eskalation

- Bei DB-Engpaessen/Locks an DBA oder Platform-Team eskalieren.
- Bei client-seitiger Ursache (Version/Bug) an Mobile/Web-Owner mit betroffenem Tenant-Scope eskalieren.
