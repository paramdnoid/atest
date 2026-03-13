# services/api Sprint 1 - ARB-003 Angebote API Core (2026-03-13)

Status: Umsetzung abgeschlossen (lokal verifiziert)

## Ziel

Umsetzung der Angebots-Backend-API mit vollständigen Bearbeiten/Löschen-Flows:

- Angebot Core CRUD (inkl. Soft-Delete + Restore)
- Positions-CRUD
- Options-CRUD
- Tenant-Scope + Rollenpolicy für Schreiboperationen

## Umgesetzte Änderungen

1. Neues Modul `modules/angebote`:
   - Entities:
     - `AngebotEntity` (`ops_angebote`)
     - `AngebotPositionEntity` (`ops_angebote_position`)
     - `AngebotOptionEntity` (`ops_angebote_option`)
   - Repositories:
     - `AngebotRepository`
     - `AngebotPositionRepository`
     - `AngebotOptionRepository`
   - Service:
     - `AngebotService` mit Domain-Validierung, Soft-Delete-Logik und tenant-sicherem Zugriff
   - Controller:
     - `AngebotController` unter `/v1/angebote`

2. API-Scope:
   - `GET /v1/angebote`, `GET /v1/angebote/{id}`
   - `POST/PATCH/DELETE /v1/angebote/{id}` + `POST /v1/angebote/{id}/restore`
   - Positions-Endpoints:
     - `GET/POST /v1/angebote/{id}/positionen`
     - `PATCH/DELETE /v1/angebote/{id}/positionen/{positionId}`
   - Options-Endpoints:
     - `GET/POST /v1/angebote/{id}/optionen`
     - `PATCH/DELETE /v1/angebote/{id}/optionen/{optionId}`

3. Security/Policy:
   - Session-Auflösung via `zg_refresh_token`
   - Schreibrechte auf Rollen `owner`, `admin`, `dispo`
   - Leserechte für authentifizierte Sessions

4. Tests:
   - `AngebotControllerTest` hinzugefügt:
     - Unauthorized bei fehlender Session
     - Forbidden für `member`
     - Erfolgreiches Create für `admin`

## Verifikation

- `./gradlew test --tests 'com.zunftgewerk.api.modules.angebote.web.AngebotControllerTest'` -> erfolgreich
- `./gradlew test` -> erfolgreich
- `ReadLints` auf neue Angebote-Dateien -> keine Fehler

## Nächste Schritte

- Sprint 1 ARB-011: Verschlüsselungsfundament in Service-Layern integrieren (`field-level`, `key_version`, Safe-Access-Pattern)
- Danach Sprint 2 (Aufmaß + Abnahmen API Core + Workflow-APIs)
