# ARB-005 - Abnahmen API Core (Sprint 2)

## Status

- Umsetzung abgeschlossen
- Tenant-sichere CRUD-API fuer Abnahmen-Kernobjekte implementiert
- Controller-Tests ergaenzt und gruen

## Umfang

### Modulstruktur

- Neues Backend-Modul unter `services/api/src/main/java/com/zunftgewerk/api/modules/abnahmen`
- Schichten: `entity`, `repository`, `service`, `web`

### Datenmodell (Flyway V13)

Implementiert fuer:

- `ops_abnahmen_record`
- `ops_abnahmen_protocol`
- `ops_abnahmen_participant`
- `ops_abnahmen_defect`
- `ops_abnahmen_rework`
- `ops_abnahmen_evidence`

`ops_abnahmen_audit_event` wurde read-only belassen (keine mutierende API).

### API-Endpunkte

Basis:

- `GET /v1/abnahmen` (list)
- `GET /v1/abnahmen/{id}` (get)
- `POST /v1/abnahmen` (create)
- `PATCH /v1/abnahmen/{id}` (update)
- `DELETE /v1/abnahmen/{id}` (delete/soft-delete)
- `POST /v1/abnahmen/{id}/restore` (restore)

Unterressourcen pro Abnahme-Record:

- `protocol`: `GET/POST/PATCH/DELETE` auf `/v1/abnahmen/{id}/protocol` (POST/PATCH als Upsert)
- `participant`: `GET/POST/PATCH/DELETE` auf `/v1/abnahmen/{id}/participant[...]`
- `defect`: `GET/POST/PATCH/DELETE` auf `/v1/abnahmen/{id}/defect[...]`
- `rework`: `GET/POST/PATCH/DELETE` auf `/v1/abnahmen/{id}/rework[...]`
- `evidence`: `GET/POST/PATCH/DELETE` auf `/v1/abnahmen/{id}/evidence[...]`

### Security / Policy

- Session-Aufloesung via `zg_refresh_token` + `RefreshTokenService.peekUser(...)`
- Lesen: jede authentifizierte Session
- Schreiben: nur Rollen `owner`, `admin`, `dispo`
- Tenant-Scoping in allen Repository-Zugriffen (`tenant_id` + Parent-ID-Kontext)

### Architekturkonventionen

- Constructor Injection verwendet
- `ResponseEntity` + `Map.of(...)`/`HashMap` gemaess bestehendem Pattern
- `@Transactional` auf mutierenden Service-Methoden
- Keine neuen Frameworks eingefuehrt
- Null-sensitive Antworten mit `HashMap` bei potentiell `null`-haltigen Antworten

## Tests und Verifikation

### Neue Tests

- `AbnahmeControllerTest` mit mindestens:
  - Unauthorized (ohne Session)
  - Forbidden fuer `member`
  - Create success fuer `admin`

### Ausgefuehrte Commands

Im Verzeichnis `services/api`:

1. `./gradlew test --tests com.zunftgewerk.api.modules.abnahmen.web.AbnahmeControllerTest`
2. `./gradlew test`

### Ergebnis

- Beide Commands erfolgreich
- `BUILD SUCCESSFUL`
