# services/api Sprint 2 - ARB-006 Cross-Module Workflow APIs (2026-03-13)

Status: Umsetzung abgeschlossen (lokal verifiziert)

## Ziel

Modulübergreifende Workflow-Sicht für Auftragsabwicklung bereitstellen (Kunden, Angebote, Aufmaß, Abnahmen), tenant-sicher und direkt nutzbar im Operations-Cockpit.

## Umgesetzte Änderungen

1. Neues Modul `opsworkflow`:
   - `OpsWorkflowService`
   - `OpsWorkflowController`

2. API:
   - `GET /v1/ops/workflow/overview`
   - liefert Gesamtzahlen und Statusverteilungen je Modul:
     - `kunden`
     - `angebote`
     - `aufmass`
     - `abnahmen`

3. Security:
   - Session über `zg_refresh_token` + `RefreshTokenService.peekUser`
   - Zugriff nur bei authentifizierter Session (`401` sonst)

4. Datenquelle:
   - Aggregation über bestehende Repositories (`findByTenantIdAndDeletedAtIsNull`)
   - Null-sichere Ergebnisstruktur

5. Tests:
   - `OpsWorkflowControllerTest`
     - Unauthorized ohne Session
     - Erfolgreiche Overview bei authentifizierter Session

## Verifikation

- `./gradlew test --tests 'com.zunftgewerk.api.modules.opsworkflow.web.OpsWorkflowControllerTest'` -> erfolgreich
- `./gradlew test` -> erfolgreich
- `ReadLints` -> keine Fehler
