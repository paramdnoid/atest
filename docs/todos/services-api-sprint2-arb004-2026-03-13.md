# ARB-004 - Aufmaß API Core (Sprint 2)

## Status

- Umsetzung abgeschlossen
- Tenant-sichere CRUD-API für Aufmaß-Kernobjekte implementiert
- Controller-Tests ergänzt und grün

## Umfang

### Modulstruktur

- Neues Backend-Modul unter `services/api/src/main/java/com/zunftgewerk/api/modules/aufmass`
- Schichten: `entity`, `repository`, `service`, `web`

### Datenmodell (Flyway V13)

Implementiert für:

- `ops_aufmass_record`
- `ops_aufmass_room`
- `ops_aufmass_position`
- `ops_aufmass_measurement`
- `ops_aufmass_mapping`

`ops_aufmass_review_issue` und `ops_aufmass_audit_event` wurden wie vorgesehen nicht als mutierende API umgesetzt.

### API-Endpunkte

Basis:

- `GET /v1/aufmass` (list)
- `GET /v1/aufmass/{id}` (get)
- `POST /v1/aufmass` (create)
- `PATCH /v1/aufmass/{id}` (update)
- `DELETE /v1/aufmass/{id}` (delete/soft-delete)
- `POST /v1/aufmass/{id}/restore` (restore)

Unterressourcen pro Aufmaß-Record:

- `room`: `GET/POST/PATCH/DELETE` auf `/v1/aufmass/{id}/room[...]`
- `position`: `GET/POST/PATCH/DELETE` auf `/v1/aufmass/{id}/position[...]`
- `measurement`: `GET/POST/PATCH/DELETE` auf `/v1/aufmass/{id}/measurement[...]`
- `mapping`: `GET/POST/PATCH/DELETE` auf `/v1/aufmass/{id}/mapping[...]`

### Security / Policy

- Session-Auflösung via `zg_refresh_token` + `RefreshTokenService.peekUser(...)`
- Lesen: jede authentifizierte Session
- Schreiben: nur Rollen `owner`, `admin`, `dispo`
- Tenant-Scoping in allen Repository-Zugriffen (`tenant_id` + Parent-ID-Kontext)

### Architekturkonventionen

- Constructor Injection verwendet
- `ResponseEntity` + `Map.of(...)`/`HashMap` gemäß bestehendem Pattern
- `@Transactional` auf mutierenden Service-Methoden
- Keine neuen Frameworks eingeführt
- Null-sensitive Antworten mit `HashMap` bei Record-Summary (Map.of/NPE-Risiko vermieden)

## Tests und Verifikation

### Neue Tests

- `AufmassControllerTest` mit mindestens:
  - Unauthorized (ohne Session)
  - Forbidden für `member`
  - Create success für `admin`

### Ausgeführte Commands

Im Verzeichnis `services/api`:

1. `./gradlew test --tests com.zunftgewerk.api.modules.aufmass.web.AufmassControllerTest`
2. `./gradlew test`

### Ergebnis

- Beide Commands erfolgreich
- `BUILD SUCCESSFUL`
