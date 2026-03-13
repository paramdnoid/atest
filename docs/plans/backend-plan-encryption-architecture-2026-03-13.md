# Backend Plan - Verschlüsselungsarchitektur (Pflicht)

Datum: 2026-03-13  
Geltungsbereich: `Kunden`, `Angebote`, `Aufmaß`, `Abnahmen`

## 1) Ziel

- End-to-end abgesicherte Verschlüsselungsarchitektur auf Enterprise-Niveau.
- Technisch vollständig planbar und umsetzbar inkl. Betrieb (Rotation, Monitoring, Recovery).

## 2) Verschlüsselungsmodell

### 2.1 In Transit
- TLS 1.3 für alle externen Verbindungen.
- mTLS für interne Service-zu-Service Kommunikation.
- Strict transport policy in Gateway/Ingress.

### 2.2 At Rest
- Verschlüsselte Volumes (DB/Storage Hosts).
- Verschlüsselte Backups/Snapshots.
- Secret Stores niemals im Klartext in Git/Env-Files.

### 2.3 Field-Level Encryption (App Layer)
- Algorithmus: AES-256-GCM.
- Envelope Encryption:
  - KEK (Key Encryption Key) in KMS/HSM.
  - DEK (Data Encryption Key) pro Datensatz oder klar definiertem Daten-Bucket.
- Persistenzschema pro sensitives Feld:
  - `ciphertext`
  - `iv`
  - `auth_tag` (oder im Ciphertext-Format enthalten)
  - `key_version`
  - optional `algorithm`
- AAD verpflichtend mit:
  - `tenant_id`
  - `table_name`
  - `record_id`
  - `field_name`

## 3) Suchbarkeit auf verschlüsselten Feldern

- Exakte Suche nur über Blind Index:
  - HMAC-SHA256 mit separatem Index-Key.
- Keine LIKE/Prefix-Suche auf verschlüsselten Klartextfeldern.
- Für Volltextsuche separate redaktionell sichere Such-Read-Modelle.

## 4) Key Management

- KEKs pro Environment (`dev`, `staging`, `prod`) strikt getrennt.
- Optional pro Tenant separater KEK-Alias für High-Security-Mandanten.
- Zugriff auf KMS nur über dedizierte Service-Identity (least privilege).

## 5) Key Rotation & Re-Encryption

- Rotationstypen:
  - KEK-Rotation periodisch (z. B. 90 Tage).
  - DEK-Rotation anlassbezogen oder batchweise.
- Re-Encryption-Job:
  - idempotent
  - tenant-bucketed
  - resumable (checkpoint-basiert)
  - throttled (kein SLA-Bruch)
- Rollback/Recovery:
  - Schlüsselhistorie mit `key_version`
  - Lesekompatibilität für alte Versionen bis Migration abgeschlossen

## 6) API-/Service-Patterns

- Encrypt on write, decrypt on read (nur bei Berechtigung).
- DTO-Mapping schließt Klartextfelder für unberechtigte Rollen aus.
- Fehlerhygiene:
  - keine kryptografischen Implementierungsdetails in Client-Fehlern
  - standardisierte Fehlercodes (`crypto_failed`, `forbidden_field_access`)

## 7) Monitoring & Alerting

- Pflichtmetriken:
  - `crypto_encrypt_total`
  - `crypto_decrypt_total`
  - `crypto_decrypt_fail_total`
  - `crypto_key_rotation_total`
  - `crypto_reencryption_backlog`
- Alerts:
  - Decrypt-Fehlerrate > Schwellwert
  - KMS-Latenz/Fehler spikes
  - Rotation/Batch-Job Stagnation

## 8) Teststrategie

- Unit:
  - Encrypt/Decrypt roundtrip
  - AAD mismatch muss fehlschlagen
  - falsche `key_version`/Key nicht akzeptieren
- Integration:
  - Persistenzschema vollständig
  - Rollenabhängige Decrypt-Pfade
- Security:
  - Pen-Test-Cases für Key misuse / privilege escalation
  - Chaos-Test: KMS-Ausfall + degradierte Betriebsstrategie

## 9) Akzeptanzkriterien (Definition of Done)

- Alle sensiblen Felder in den vier Modulen sind per Feldverschlüsselung abgesichert.
- Key-Rotation + Re-Encryption sind automatisiert und dokumentiert.
- Monitoring/Alerting aktiv und getestet.
- Kein Klartext sensibler Felder in Logs, Events oder Standard-DB-Dumps.
