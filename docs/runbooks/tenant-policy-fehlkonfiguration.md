# Runbook: Tenant-Policy Fehlkonfiguration

## Scope

- Betrifft falsche Rollen-/Policy-Konfigurationen innerhalb eines Tenants.
- Fokus auf schnelle Risikoreduktion und kontrollierte Wiederherstellung.

## Symptome

- Unberechtigte Zugriffe oder denied operations
- Rollenupdates fuehren zu Regressionen

## Auswirkung

- Sicherheitsrisiko bei zu weiten Rechten.
- Betriebsstoerung bei zu restriktiven Rechten.

## Sofortmassnahmen

1. Letzte Role/Policy-Aenderungen in Audit Events abrufen.
2. Tenant auf bekannte sichere Rollen-Matrix zuruecksetzen.
3. Kritische Admin-Aktionen temporar auf owner-role einschranken.

## Diagnose

1. Diff zwischen aktueller und zuletzt stabiler Rollen-/Policy-Konfiguration erstellen.
2. Betroffene Endpunkte/Use-Cases mit reproduzierbaren Checks dokumentieren.
3. Scope klaeren: einzelner Tenant oder systematische Fehlkonfiguration.

## Recovery Schritte

1. Policy Diff erstellen.
2. Rollen erneut deployen und Zugriffstests durchfuehren.
3. Tenant-bezogenen RCA-Eintrag dokumentieren.

## Verifikation

1. Kritische Zugriffsfluesse funktionieren wieder erwartungsgemaess.
2. Keine unberechtigten Zugriffe in Audit-Ereignissen sichtbar.
3. Support-Rueckmeldungen zum Tenant sind stabil.

## Absicherung danach

- Regressionsfall als automatisierten Test ablegen.
- Rollout kuenftiger Policy-Aenderungen tenantweise/stufenweise fahren.

## Eskalation

- Bei sicherheitsrelevanter Fehlfreigabe sofort an Security + Incident-Owner eskalieren.
- Bei tenant-uebergreifender Ursache an Plattform-/Identity-Owner eskalieren.
