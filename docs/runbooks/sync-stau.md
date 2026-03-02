# Runbook: Sync-Stau

## Symptome

- Erhoehte Sync-Latenz
- Wachsende Anzahl pending client operations
- Steigende Conflict-Rate

## Sofortmassnahmen

1. `change_log` und `client_operations` Lag pro Tenant pruefen.
2. Fehlerraten in gRPC `PushChanges`/`PullChanges` vergleichen.
3. Problematische Tenants via Feature Flag auf reduced sync mode setzen.

## Diagnostik

- Datenbank-Indizes auf `change_log(tenant_id, id)` verifizieren
- Deadlocks/long-running transactions analysieren
- Client-Versionen und Operations-Frequenz korrelieren

## Recovery

1. API pods horizontal skalieren.
2. Queue-Batch-Groesse reduzieren.
3. Betroffene Clients auf Full-Resync triggern.

## Postmortem Daten

- Timeline
- Root cause
- Blast radius
- Guardrail action items
