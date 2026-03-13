# services/api Sprint 3 - ARB-012 Key-Rotation Baseline (2026-03-13)

Status: Umsetzung abgeschlossen (minimal-invasiv, produktionsnah)

## Ziel

Baseline fuer Key-Rotation im Field-Encryption-Pfad schaffen:

- key-version-aware Decrypt-Guard
- Ops-Endpoint fuer Rotationsstatus
- optionaler Roundtrip-Validate-Endpoint (admin/owner)

## Umgesetzte Änderungen

1. `FieldEncryptionService` erweitert:
   - harte Formatpruefung fuer `encv1:<keyVersion>:<payload>`
   - saubere Fehler bei:
     - ungueltigem Format
     - fehlender Key-Version
     - ungueltigem Base64-Payload
     - zu kurzem Payload
     - nicht unterstuetzter Key-Version
   - Hilfsmethode `roundTrip(value, aad)` fuer Ops-Validierung

2. Neuer Ops-Controller:
   - `OpsEncryptionRotationController`
   - Basis: `/v1/ops/encryption/rotation`
   - Endpunkte:
     - `GET /status` -> liefert `enabled` + `keyVersion`
     - `POST /validate` -> optionaler Roundtrip-Check
   - Zugriff nur fuer `owner|admin` (Cookie-Session via `zg_refresh_token`)

3. Security-Routing:
   - `SecurityConfig` um Permit-Liste fuer:
     - `/v1/ops/workflow/overview`
     - `/v1/ops/encryption/rotation/status`
     - `/v1/ops/encryption/rotation/validate`
   - Controller bleibt fuer Session-/Rollenpruefung verantwortlich

## Tests

- `OpsEncryptionRotationControllerTest`
  - Unauthorized ohne Session
  - erfolgreicher Status-Call fuer `owner`

## Verifikation

- `./gradlew test --tests com.zunftgewerk.api.modules.opsworkflow.web.OpsEncryptionRotationControllerTest`
- `./gradlew test`
