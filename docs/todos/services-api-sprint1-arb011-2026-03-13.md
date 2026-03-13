# services/api Sprint 1 - ARB-011 Encryption Foundation (2026-03-13)

Status: Umsetzung abgeschlossen (Foundation lokal verifiziert)

## Ziel

Technische Basis für feldbasierte Verschlüsselung in den Auftragsabwicklungsmodulen schaffen:

- AES-256-GCM Verschlüsselungsservice
- AAD-Unterstützung (tenant/table/field context)
- Key-Versioning
- Blind-Index-Grundfunktion für exakte Suche auf sensiblen Werten

## Umgesetzte Änderungen

1. Neuer Security-Service:
   - `shared/security/FieldEncryptionService`
   - Funktionen:
     - `encrypt(plaintext, aad)`
     - `decrypt(ciphertext, aad)`
     - `blindIndex(value, aad)`
   - Format:
     - `encv1:<keyVersion>:<base64url(iv+ciphertext+tag)>`

2. Kryptographie-Details:
   - AES/GCM/NoPadding
   - 12-Byte IV, 128-Bit Auth-Tag
   - 256-Bit Schlüssel
   - deterministische Blind-Index-Bildung (`SHA-256`) über normalisierte Werte + AAD-Kontext

3. Konfiguration ergänzt:
   - `application.yml`
     - `zunftgewerk.security.field-encryption-enabled`
     - `zunftgewerk.security.field-encryption-key`
     - `zunftgewerk.security.field-encryption-key-version`
   - `.env.example`
     - `FIELD_ENCRYPTION_ENABLED`
     - `FIELD_ENCRYPTION_KEY`
     - `FIELD_ENCRYPTION_KEY_VERSION`

4. Tests:
   - `FieldEncryptionServiceTest`
     - Encrypt/Decrypt roundtrip mit AAD
     - Pass-through Verhalten im disabled mode
     - deterministische Blind-Index-Eigenschaften

## Verifikation

- `./gradlew test --tests 'com.zunftgewerk.api.shared.security.FieldEncryptionServiceTest'` -> erfolgreich
- `./gradlew test` -> erfolgreich
- `ReadLints` -> keine Fehler

## Hinweis zum Scope

Diese Umsetzung liefert das technische Fundament. Die modulweise Vollintegration (feldspezifische Verschlüsselung + Key-Rotation-Runbook + Re-Encryption-Jobs) folgt in den nächsten Blöcken (Sprint 2/3).
