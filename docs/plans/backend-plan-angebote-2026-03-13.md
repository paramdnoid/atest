# Backend Plan - Modul Angebote (Enterprise)

Datum: 2026-03-13  
Modul: `services/api/modules/angebote` (neu)

## 1) Zielbild

- Enterprise-Angebotsbackend mit belastbarer Statusmaschine, Genehmigungsworkflow und revisionssicherem Audit Trail.
- Saubere Trennung zwischen Angebotsentwurf, Freigabe, Versand und Konvertierung.
- Vorbereitung auf spätere Integration in Auftrag/Abrechnung.

## 2) Domain Scope

- Aggregate:
  - `Quote`
  - `QuotePosition`
  - `QuoteOptionVariant`
  - `QuoteApprovalStep`
  - `QuoteAuditEvent`
- Kernzustände:
  - `DRAFT -> READY_FOR_REVIEW -> IN_APPROVAL -> APPROVED -> SENT -> CONVERTED_TO_ORDER`
  - `ARCHIVED` als Endzustand

## 3) Datenmodell (Flyway)

- Tabellen:
  - `quote`
  - `quote_position`
  - `quote_option`
  - `quote_approval_step`
  - `quote_audit_event`
- Invarianten:
  - Quote-Nummer tenant-lokal eindeutig
  - `selected_option_id` optional, aber referenziell konsistent
  - Summen optional materialisiert (für schnelle List-Views)
  - Soft Delete auf Quote-Ebene (`deleted_at`, `deleted_by`, `delete_reason`)
- Indizes:
  - (`tenant_id`, `status`)
  - (`tenant_id`, `valid_until`)
  - (`tenant_id`, `updated_at desc`)

## 4) API Surface (v1)

- `GET /v1/angebote`
- `GET /v1/angebote/{id}`
- `POST /v1/angebote`
- `PATCH /v1/angebote/{id}` (Draft-Änderungen)
- `DELETE /v1/angebote/{id}` (soft delete)
- `POST /v1/angebote/{id}/restore`
- `POST /v1/angebote/{id}/positions`
- `PATCH /v1/angebote/{id}/positions/{positionId}`
- `DELETE /v1/angebote/{id}/positions/{positionId}`
- `POST /v1/angebote/{id}/options`
- `PATCH /v1/angebote/{id}/options/{optionId}`
- `DELETE /v1/angebote/{id}/options/{optionId}`
- `POST /v1/angebote/{id}/submit-review`
- `POST /v1/angebote/{id}/approve-step`
- `POST /v1/angebote/{id}/send`
- `POST /v1/angebote/{id}/convert-order`
- `POST /v1/angebote/{id}/archive`

## 4a) Verschlüsselungsdesign (verpflichtend)

- Field-Level Encryption:
  - AES-256-GCM für sensible Freitexte (`note`, `description`, optionale interne Kommentare)
  - Envelope Encryption mit KMS-gebundenem KEK
  - `key_version` + AAD (`tenant_id`, `quote_id`, `field`)
- Blind Index:
  - HMAC-basierter Suchindex nur wo unbedingt notwendig
- Audit:
  - Zugriff auf entschlüsselte Felder als Security-Audit-Event

## 5) Business Rules

- `send` nur aus `APPROVED`
- `convert-order` nur aus `SENT`
- Änderungen an Positionen nur in `DRAFT`
- `selected_option_id` muss Positionen referenzieren, die zur Quote gehören
- Freigabeschritte nach Rollenmatrix (Vertrieb -> Projektleitung -> GF)

## 6) Pricing & Validation

- Pricing-Logik zentral im Service:
  - Netto-Position, Rabatt, Material/Labor-Anteile
  - Roundings konsistent und testbar
- Negative/inkonsistente Werte strikt mit `400` abweisen
- Sicherheitsprinzip: Keine internen Rechen-/Exception-Details im API-Fehler
- Delete/Restore-Regeln:
  - delete nur in erlaubten Zuständen (`DRAFT`/`ARCHIVED` oder fachlich freigegeben)
  - restore nur wenn kein kollidierender Status/Nummernkonflikt

## 7) Testing Strategy

- Unit:
  - Statusmaschine
  - Pricing-Berechnung
  - Approval-Transitionen
- Integration:
  - Controller-Validation
  - Persistence-Konsistenz (Optionen/Positionen)
- Regression:
  - AuditTrail-Vollständigkeit pro Transition
- CRUD:
  - Position/Option bearbeiten/löschen inkl. Summen-Rekalkulation
  - Quote delete/restore inkl. Sichtbarkeit in Listen
- Crypto:
  - Decrypt nur mit korrekter Tenant/AAD + Key-Version

## 8) Observability

- Metriken:
  - `quote_conversion_rate`
  - `quote_approval_lead_time_ms`
  - `quote_status_transition_total{from,to}`
- Logs:
  - Quote-ID, Tenant-ID, Actor-ID in allen mutierenden Aktionen
- Zusätzliche Metriken:
  - `quote_soft_delete_total`, `quote_restore_total`
  - `quote_crypto_decrypt_fail_total`

## 9) Delivery Plan

### Welle 1 (P0)
- Quote CRUD + Statusmaschine + Approval-Grundpfad
- Validation + Security + Audit
- Pflicht: Bearbeiten/Löschen-Flow + Verschlüsselung sensibler Texte

### Welle 2 (P1)
- Conversion-Pfad + Performance-ReadModel
- Erweiterte Analytics-Metriken
- Key Rotation + Re-Encryption + Restore-Hardening

## 10) Akzeptanzkriterien

- End-to-end Angebotsworkflow ohne ungültige Transitionen
- API-Fehler sind deterministisch und sanitisiert
- Pricing-/Approval-Tests vollständig grün
- AuditEvents sind vollständig und nachvollziehbar
- Bearbeiten/Löschen funktioniert für Quote, Positionen und Optionen ohne Inkonsistenz
- Verschlüsselungstechnologie vollständig implementiert und testbar

## 11) Risiken & Mitigation

- Risiko: Status-Bypass durch konkurrierende Requests  
  Mitigation: Optimistic Locking + Transition Guard im Service
- Risiko: Inkonsistente Summen  
  Mitigation: zentrale Pricing-Engine + Contract Tests
