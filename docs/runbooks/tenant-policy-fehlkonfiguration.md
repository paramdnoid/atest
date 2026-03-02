# Runbook: Tenant-Policy Fehlkonfiguration

## Symptome

- Unberechtigte Zugriffe oder denied operations
- Rollenupdates fuehren zu Regressionen

## Sofortmassnahmen

1. Letzte Role/Policy-Aenderungen in Audit Events abrufen.
2. Tenant auf bekannte sichere Rollen-Matrix zuruecksetzen.
3. Kritische Admin-Aktionen temporar auf owner-role einschranken.

## Recovery

1. Policy Diff erstellen.
2. Rollen erneut deployen und Zugriffstests durchfuehren.
3. Tenant-bezogenen RCA-Eintrag dokumentieren.
