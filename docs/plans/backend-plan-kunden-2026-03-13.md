# Backend Plan - Modul Kunden (Enterprise)

Datum: 2026-03-13  
Modul: `services/api/modules/kunden` (neu)

## 1) Zielbild

- Mandantenfähiges CRM-Backend für Kunden, Objekte, Ansprechpartner, Reminder/SLA und Duplikat-Management.
- Datenschutz-/Rollenanforderungen (`owner/admin/dispo/tech`) hart auf API- und Query-Ebene durchsetzen.
- Vollständige Auditierbarkeit aller status- und datenschutzrelevanten Änderungen.

## 2) Domain Scope

- Aggregate:
  - `Kunde`
  - `Objekt`
  - `Ansprechpartner`
  - `Reminder`
  - `DuplicateCandidate`
- Kernprozesse:
  - Lead -> Aktiv -> Ruhend -> Archiviert
  - Primary Contact Governance
  - Consent-Status-Änderungen
  - SLA-Risiko-Erkennung + Follow-Up
  - Merge-/Dismiss-Workflow für Duplikate

## 3) Datenmodell (Flyway)

- Tabellen (tenant-scoped):
  - `kunden`
  - `kunden_objekte`
  - `kunden_ansprechpartner`
  - `kunden_reminder`
  - `kunden_duplicate_candidate`
  - `kunden_activity`
- Grundregeln:
  - UUID-PKs
  - `tenant_id` auf allen fachlichen Tabellen
  - `TIMESTAMPTZ` für Zeitfelder
  - `ON DELETE CASCADE` auf abhängigen Tabellen
  - Standard-Löschsemantik: `deleted_at`, `deleted_by`, `delete_reason` (soft delete)
  - Hard Delete nur über dedizierten Retention/DSGVO-Job
- Indizes:
  - (`tenant_id`, `status`)
  - (`tenant_id`, `updated_at desc`)
  - (`tenant_id`, `next_follow_up_at`)
  - Fuzzy-Dupe-Index auf normalisiertem Namen/Region

## 4) API Surface (v1)

- `GET /v1/kunden` (Filter + Sort + Pagination)
- `GET /v1/kunden/{id}`
- `POST /v1/kunden`
- `PATCH /v1/kunden/{id}` (Status/Owner/Consent/Meta)
- `DELETE /v1/kunden/{id}` (soft delete)
- `POST /v1/kunden/{id}/restore`
- `POST /v1/kunden/{id}/objekte`
- `PATCH /v1/kunden/{id}/objekte/{objektId}`
- `DELETE /v1/kunden/{id}/objekte/{objektId}` (soft delete)
- `POST /v1/kunden/{id}/ansprechpartner`
- `PATCH /v1/kunden/{id}/ansprechpartner/{kontaktId}`
- `DELETE /v1/kunden/{id}/ansprechpartner/{kontaktId}` (soft delete)
- `POST /v1/kunden/{id}/reminder`
- `PATCH /v1/kunden/{id}/reminder/{reminderId}`
- `DELETE /v1/kunden/{id}/reminder/{reminderId}`
- `POST /v1/kunden/{id}/duplicates/{candidateId}/merge`
- `POST /v1/kunden/{id}/duplicates/{candidateId}/dismiss`

## 5a) Verschlüsselungsdesign (verpflichtend)

- Transport:
  - TLS 1.3 extern
  - mTLS für interne Service-Kommunikation (wenn getrennte Dienste)
- At-Rest:
  - Verschlüsselte Volumes + verschlüsselte Backups
- Field-Level (App-seitig):
  - AES-256-GCM für sensible Felder (`email`, `telefon`, `zugangshinweise`, ggf. `payload`)
  - Envelope Encryption: Data Encryption Key (DEK) pro Datensatz/Kategorie
  - Key Encryption Key (KEK) via KMS/HSM
  - AAD enthält `tenant_id`, `table`, `record_id`, `field_name`
- Suche auf verschlüsselten Feldern:
  - zusätzlicher HMAC-SHA256 Blind Index für exakte Suche
- Rotation:
  - `key_version` pro Ciphertext
  - geplanter Re-Encryption Job pro Tenant/Bucket

## 6) Sicherheits-/Compliance-Design

- AuthN: bestehender JWT/Refresh-Flow
- AuthZ:
  - Rollenbasierte Policy pro Endpoint
  - Feldmaskierung für `tech`-Rolle (PII minimal)
- Consent:
  - Zustandsübergänge nur über definierte Commands
  - Audit Event bei jeder Consent-Änderung
- Abuse:
  - Rate-Limits auf mutierenden Endpunkten

## 7) Service-Layer & Validierung

- `KundenService` mit klaren Commands:
  - `createKunde`, `updateKundeStatus`, `setPrimaryAnsprechpartner`, `mergeDuplicate`
- Validierungsregeln:
  - Aktivierung nur mit mind. einem Primary Contact + mind. einem Objekt
  - `archiviert` nur ohne offene CRITICAL Reminder
  - Merge nur tenant-intern und nur bei `resolution=OPEN`
  - Löschen nur, wenn keine harten fachlichen Sperren; sonst `409`
  - Restore nur innerhalb definierter Retention-Frist

## 8) Testing Strategy

- Unit:
  - State Machine (Statusübergänge)
  - Consent-/Privacy-Policy
  - Duplicate Merge Regeln
- Integration:
  - Repository-Filter tenant-sicher
  - Controller Validation/HTTP Codes
- Security:
  - Rollenmatrix-Tests pro Endpoint
- Crypto:
  - Roundtrip-Tests encrypt/decrypt je Feld
  - Falscher Tenant/AAD muss Decrypt ablehnen
  - Key-Rotation Kompatibilität (`key_version`)
- Delete/Restore:
  - Soft-delete invisibility in Standard-Queries
  - Restore stellt Referenzen konsistent wieder her

## 9) Observability

- Metriken:
  - `kunden_requests_total{endpoint,status}`
  - `kunden_merge_duration_ms`
  - `kunden_sla_risk_count`
- Logs:
  - strukturierte Audit-Logs mit `tenantId`, `actorId`, `entityId`
- Tracing:
  - Controller -> Service -> Repository Spans
- Zusätzliche Metriken:
  - `kunden_crypto_encrypt_total`, `kunden_crypto_decrypt_fail_total`
  - `kunden_soft_delete_total`, `kunden_restore_total`

## 10) Delivery Plan (2 Wellen)

### Welle 1 (P0)
- Datenmodell + CRUD + Statusmaschine + Rollenmatrix
- Primary Contact/Objekt-Aktivierungsregeln
- Pflicht: Encrypt-at-rest + Field-Level Encryption + Soft Delete

### Welle 2 (P1)
- Duplicate Workflow + SLA/Reminder-Optimierung
- Observability + Performance-Härtung
- Key Rotation + Re-Encryption + Restore/Retention-Hardening

## 11) Akzeptanzkriterien

- Vollständige tenant-sichere CRUD + Filter APIs
- Keine unerlaubten Statusübergänge
- Datenschutz-/Rollenanforderungen durch Tests abgesichert
- Migrations + Tests + Baseline-Performance grün
- Bearbeiten und Löschen/Restore funktionieren über alle Kunden-Subressourcen
- Verschlüsselung vollständig aktiv für alle sensiblen Felder

## 12) Risiken & Mitigation

- Risiko: Falsche Merge-Entscheidungen bei Duplikaten  
  Mitigation: Merge nur explizit + reversible Audit Trail
- Risiko: PII-Leaks  
  Mitigation: role-aware DTO Mapping + dedicated tests
