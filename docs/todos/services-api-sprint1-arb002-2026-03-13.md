# services/api Sprint 1 - ARB-002 Kunden API Core (2026-03-13)

Status: Umsetzung abgeschlossen (lokal verifiziert)

## Ziel

Implementierung des Kunden-Backends als tenant-sichere API mit vollständigen Bearbeiten/Löschen-Flows:

- Kunden Core CRUD (inkl. Soft-Delete + Restore)
- Subressourcen-CRUD: Objekte, Ansprechpartner, Reminder
- Rollen-/Policy-Gate für Schreibzugriffe (`owner`, `admin`, `dispo`)

## Umgesetzte Änderungen

1. Neues Backend-Modul `modules/kunden` erstellt:
   - Entities:
     - `KundenEntity` (`ops_kunden`)
     - `KundenObjektEntity` (`ops_kunden_objekte`)
     - `KundenAnsprechpartnerEntity` (`ops_kunden_ansprechpartner`)
     - `KundenReminderEntity` (`ops_kunden_reminder`)
   - Repositories:
     - `KundenRepository`
     - `KundenObjektRepository`
     - `KundenAnsprechpartnerRepository`
     - `KundenReminderRepository`
   - Service:
     - `KundenService` mit Domain-Validierung, tenant-scope und Soft-Delete-Logik
   - Controller:
     - `KundenController` unter `/v1/kunden`

2. Endpoints (Auszug):
   - `GET /v1/kunden`, `GET /v1/kunden/{id}`
   - `POST /v1/kunden`, `PATCH /v1/kunden/{id}`, `DELETE /v1/kunden/{id}`, `POST /v1/kunden/{id}/restore`
   - `GET/POST/PATCH/DELETE` für:
     - `/v1/kunden/{id}/objekte`
     - `/v1/kunden/{id}/ansprechpartner`
     - `/v1/kunden/{id}/reminder`

3. Security/Policy:
   - Session-Auflösung über `zg_refresh_token` (bestehendes Pattern)
   - Schreiboperationen nur für Rollen `owner`, `admin`, `dispo`
   - Lesefälle für authentifizierte Nutzer

4. Tests:
   - `KundenControllerTest` hinzugefügt:
     - Unauthorized bei fehlender Session
     - Forbidden für `member` bei Create
     - Erfolgreiches Create für `admin`

## Verifikation

- `./gradlew test --tests 'com.zunftgewerk.api.modules.kunden.web.KundenControllerTest'` -> erfolgreich
- `./gradlew test` -> erfolgreich
- `ReadLints` für neue Kunden-Dateien -> keine Fehler

## Rest-/Folgethemen

- ARB-003 als nächster direkter Schritt (Angebote API Core)
- ARB-011 Verschlüsselungsfundament (service-layer integration + key versioning) anschließend für Sprint-1-Abschluss
