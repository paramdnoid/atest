# Backend Plan - Modul Abnahmen (Enterprise)

Datum: 2026-03-13  
Modul: `services/api/modules/abnahmen` (neu)

## 1) Zielbild

- Revisionssicheres Abnahme-Backend für Protokoll, Mängel, Nacharbeit und Abschluss.
- Datenschutzkonforme Verarbeitung von Fotoevidenz.
- Verlässliche Steuerung des Defect/Rework-Lifecycle bis `CLOSED`.

## 2) Domain Scope

- Aggregate:
  - `AbnahmeRecord`
  - `AbnahmeProtocol`
  - `DefectEntry`
  - `ReworkEntry`
  - `PhotoEvidence`
  - `AbnahmeAuditEvent`
- Statusworkflow:
  - `PREPARATION` -> `INSPECTION_*` -> `DEFECTS_*` -> `ACCEPTED*` -> `CLOSED`

## 3) Datenmodell (Flyway)

- Tabellen:
  - `abnahme_record`
  - `abnahme_protocol`
  - `abnahme_participant`
  - `abnahme_defect`
  - `abnahme_rework`
  - `abnahme_evidence`
  - `abnahme_audit_event`
- Invarianten:
  - `CLOSED` nur wenn keine offenen kritischen Defects
  - `signoff_status=signed` braucht `signed_at`
  - Evidence mit `has_people/has_license_plate` benötigt gültige Compliance-Flags
  - Soft Delete für Defect/Rework/Evidence mit Retention-konformer Wiederherstellung

## 4) API Surface (v1)

- `GET /v1/abnahmen`
- `GET /v1/abnahmen/{id}`
- `POST /v1/abnahmen`
- `PATCH /v1/abnahmen/{id}`
- `DELETE /v1/abnahmen/{id}` (soft delete)
- `POST /v1/abnahmen/{id}/restore`
- `PATCH /v1/abnahmen/{id}/protocol`
- `POST /v1/abnahmen/{id}/defects`
- `PATCH /v1/abnahmen/{id}/defects/{defectId}`
- `DELETE /v1/abnahmen/{id}/defects/{defectId}`
- `POST /v1/abnahmen/{id}/rework`
- `PATCH /v1/abnahmen/{id}/rework/{reworkId}`
- `DELETE /v1/abnahmen/{id}/rework/{reworkId}`
- `POST /v1/abnahmen/{id}/evidence`
- `PATCH /v1/abnahmen/{id}/evidence/{evidenceId}`
- `DELETE /v1/abnahmen/{id}/evidence/{evidenceId}`
- `POST /v1/abnahmen/{id}/transition`
- `POST /v1/abnahmen/{id}/signoff`

## 4a) Verschlüsselungsdesign (verpflichtend)

- Field-Level Encryption:
  - AES-256-GCM für sensible Evidenz-Metadaten (`payload`, `geo`, personenbezogene Marker-Notizen)
  - verschlüsselte Speicherung von `reservationText`/internen Protokollnotizen
- Envelope Encryption:
  - KEK via KMS/HSM
  - `key_version` + AAD (`tenant_id`, `abnahme_id`, `entity_id`, `field`)
- Storage-Härtung:
  - Objekt-Storage serverseitig verschlüsselt
  - signierte, kurzlebige Download-URLs

## 5) Compliance & Security

- Rollen-/Berechtigungsregeln:
  - Defect erstellen/bearbeiten vs. final akzeptieren trennen
- Datenschutz:
  - Evidenz mit Personen/Kennzeichen nur bei zulässiger Rechtsgrundlage
  - Redaction-Flag verpflichtend, falls sensible Marker erkannt
- Error Hygiene:
  - Keine Leaks interner Compliance-Entscheidungsdetails

## 6) Workflow Rules

- Defect `critical` blockiert `ACCEPTED`/`CLOSED`, solange nicht `RESOLVED`
- Rework `DONE` braucht Review und explizites `APPROVED`
- `ACCEPTED_WITH_RESERVATION` verlangt `reservationText`
- `CLOSED` nur mit signiertem Protokoll und ohne offene Pflichtpunkte
- Löschen nur in erlaubten Statusfenstern; bei `CLOSED` nur Compliance-Delete Prozess

## 7) Testing Strategy

- Unit:
  - Defect/Rework State Machine
  - Compliance-Regeln (Evidence)
  - Signoff-Regeln
- Integration:
  - Controller Validation + Transition Guards
  - Tenant- und Rollenabdeckung
- Negative:
  - ungültige Rechtsgrundlage
  - Abschluss trotz kritischer Mängel
- CRUD/Delete:
  - Defect/Rework/Evidence bearbeiten/löschen/restore
- Crypto:
  - Verschlüsselungs-Roundtrip + Key-Version Kompatibilität
  - Zugriff mit falschem Tenant/AAD muss scheitern

## 8) Observability

- Metriken:
  - `abnahme_open_critical_defects`
  - `abnahme_rework_cycle_time_ms`
  - `abnahme_transition_total{from,to}`
- Audit:
  - jede Defect- und Rework-Änderung als immutable Event
- Zusätzliche Metriken:
  - `abnahme_soft_delete_total`, `abnahme_restore_total`
  - `abnahme_crypto_decrypt_fail_total`

## 9) Delivery Plan

### Welle 1 (P0)
- Core Entities + Defect/Rework CRUD
- Transition Engine + Blocking Rules
- Protocol/Signoff Mindestpfad
- Pflicht: Bearbeiten/Löschen + Verschlüsselung für sensible Evidenz-/Protokolldaten

### Welle 2 (P1)
- Compliance-Härtung für Evidence
- Operative Queries + Performance-Tuning
- Key Rotation + Re-Encryption + Retention-Purge-Job

## 10) Akzeptanzkriterien

- Defect/Rework-Lifecycle vollständig und regelkonform
- Kein Abschluss bei offenen kritischen Mängeln
- Signoff/Reservation-Regeln technisch erzwungen
- Vollständiger Audit Trail + grüne Test-Suite
- Bearbeiten/Löschen funktioniert für Defect/Rework/Evidence inklusive Restore
- Verschlüsselungstechnologie vollständig implementiert und betrieblich abgesichert

## 11) Risiken & Mitigation

- Risiko: Compliance-Regeln werden zu spät entdeckt  
  Mitigation: frühe negative Tests + Compliance Checklist im PR-Gate
- Risiko: Hohe Defect-Volumina belasten Reads  
  Mitigation: statusbasierte Indizes + paginierte Detail-Reads
