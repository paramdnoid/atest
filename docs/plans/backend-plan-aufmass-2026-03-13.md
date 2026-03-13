# Backend Plan - Modul Aufmaß (Enterprise)

Datum: 2026-03-13  
Modul: `services/api/modules/aufmass` (neu)

## 1) Zielbild

- Backend für Aufmaß-Arbeitsbereich mit prüfbarer, versionssicherer Mengenlogik.
- Statusgesteuerter Workflow (`DRAFT` -> `IN_REVIEW` -> `APPROVED` -> `BILLED`).
- Nachvollziehbarkeit jeder Mengenänderung und Regelentscheidung.

## 2) Domain Scope

- Aggregate:
  - `AufmassRecord`
  - `AufmassRoom`
  - `AufmassPosition`
  - `AufmassMeasurement`
  - `AufmassMapping`
  - `AufmassReviewIssue`
- Speziallogik:
  - Formula AST / Legacy Migration Status
  - Overmeasure/Deduct Rules
  - Review Blocker Engine

## 3) Datenmodell (Flyway)

- Tabellen:
  - `aufmass_record`
  - `aufmass_room`
  - `aufmass_position`
  - `aufmass_measurement`
  - `aufmass_mapping`
  - `aufmass_review_issue`
  - `aufmass_audit_event`
- Wichtige Felder:
  - `version` (optimistic locking)
  - `status`
  - `formula_ast_json`, `formula_source`, `formula_migration_status`
  - Soft Delete Felder für mutable Subressourcen (`deleted_at`, `deleted_by`)
- Indizes:
  - (`tenant_id`, `status`, `updated_at`)
  - (`tenant_id`, `record_id`, `room_id`)

## 4) API Surface (v1)

- `GET /v1/aufmass`
- `GET /v1/aufmass/{id}`
- `POST /v1/aufmass`
- `PATCH /v1/aufmass/{id}`
- `DELETE /v1/aufmass/{id}` (soft delete)
- `POST /v1/aufmass/{id}/restore`
- `POST /v1/aufmass/{id}/rooms`
- `PATCH /v1/aufmass/{id}/rooms/{roomId}`
- `DELETE /v1/aufmass/{id}/rooms/{roomId}`
- `POST /v1/aufmass/{id}/measurements`
- `PATCH /v1/aufmass/{id}/measurements/{measurementId}`
- `DELETE /v1/aufmass/{id}/measurements/{measurementId}`
- `POST /v1/aufmass/{id}/mappings`
- `DELETE /v1/aufmass/{id}/mappings/{mappingId}`
- `POST /v1/aufmass/{id}/transition` (targetStatus)
- `POST /v1/aufmass/{id}/recalculate-review`

## 4a) Verschlüsselungsdesign (verpflichtend)

- AES-256-GCM für sensible Inhalte:
  - `note`, interne Kommentare, ggf. Foto-/Anhang-Metadaten
- Formula-Daten:
  - `formula_ast_json` optional verschlüsselt, wenn sensible Variablen enthalten
- Envelope Encryption:
  - KEK über KMS/HSM
  - DEK + `key_version` je Datensatz
  - AAD: `tenant_id`, `record_id`, `measurement_id`, `field`
- Rotation:
  - geplanter Re-Encryption Batch ohne Downtime

## 5) State Machine & Transition Policy

- `DRAFT -> IN_REVIEW` nur wenn:
  - mind. 1 Raum
  - mind. 1 Messwert
  - mind. 1 Mapping
- `IN_REVIEW -> APPROVED` nur ohne `blocking` Issues
- `APPROVED -> BILLED` nur mit erfülltem Billing-Ready-Check
- Verbotene Transitionen liefern `400` + stabile Fehlermeldung
- Löschen gesperrt ab `BILLED`, außer über dedizierten Compliance-Prozess

## 6) Regel-Engine (Review/Billing)

- Service `AufmassReviewService`:
  - erzeugt Issues aus Measurements + Overmeasure Rules
  - markiert Severity (`info`, `warning`, `blocking`)
- Service `AufmassBillingGateService`:
  - validiert Muss-Kriterien vor `BILLED`
- Alle Entscheidungen als AuditEvent persistieren

## 7) Testing Strategy

- Unit:
  - Formula parsing/evaluation
  - Overmeasure engine
  - State machine transitions
- Integration:
  - Transition-Endpunkte
  - Review-Regelberechnung
  - Optimistic-lock Konflikte
- CRUD/Delete:
  - Edit/Delete/Restore für Räume und Messwerte inkl. Review-Recalc
- Crypto:
  - Verschlüsselungs-Roundtrip + AAD-Mismatch-Fehler
- Contract:
  - stabile DTO-Strukturen für Frontend

## 8) Observability

- Metriken:
  - `aufmass_transition_total{from,to}`
  - `aufmass_blocking_issues_count`
  - `aufmass_recalc_duration_ms`
- Logs:
  - `recordId`, `tenantId`, `actorId`, `targetStatus`
- Zusätzliche Metriken:
  - `aufmass_soft_delete_total`, `aufmass_restore_total`
  - `aufmass_crypto_encrypt_total`, `aufmass_crypto_decrypt_fail_total`

## 9) Delivery Plan

### Welle 1 (P0)
- Record/Room/Measurement/Mappings CRUD
- Transition Engine + Blocker Checks
- Audit + Validation + Tenant Guards
- Pflicht: Edit/Delete-Flow + Verschlüsselung sensibler Felder

### Welle 2 (P1)
- Formula AST Persistenz + Migration-Unterstützung
- Review/Billing Rule Refinements + Performance
- Key Rotation + Re-Encryption + Restore-Hardening

## 10) Akzeptanzkriterien

- Statuswechsel strikt regelbasiert und testabgedeckt
- Review-Blocker sind reproduzierbar und erklärbar
- Keine Datenverluste bei konkurrierenden Updates
- p95 Read-Latenz für Detailansicht im Zielbereich (<250ms intern)
- Bearbeiten und Löschen funktioniert für Record/Subressourcen inklusive Restore
- Verschlüsselung vollständig implementiert und über Tests abgesichert

## 11) Risiken & Mitigation

- Risiko: Komplexe Regelengine driftet von Frontend-Erwartung  
  Mitigation: gemeinsame Contract- und Golden-Tests
- Risiko: Große Measurement-Mengen  
  Mitigation: paginierte ReadModels + gezielte Indizes
