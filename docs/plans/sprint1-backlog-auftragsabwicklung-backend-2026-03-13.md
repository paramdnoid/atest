# Sprint 1 Backlog - Auftragsabwicklung Backend

Datum: 2026-03-13  
Sprintfenster: 2026-03-16 bis 2026-03-28 (Annahme)  
Ziel: belastbares Backend-Fundament inkl. CRUD + Edit/Delete + Encryption-Basics für `Kunden` und `Angebote`

## Scope-Freeze für Sprint 1

- In Scope:
  - ARB-001, ARB-002, ARB-003, ARB-011
- Out of Scope:
  - Aufmaß-/Abnahmen-Implementierung (Sprint 2)
  - Key Rotation/Re-Encryption Automation (Sprint 3)

## Sprint-Backlog (ausführbar)

### ARB-001 - Datenmodell + Flyway Foundations

- **Priorität:** P0
- **Aufwand:** 16h
- **Abhängigkeiten:** keine
- **Lieferobjekte:**
  - Neue Flyway Migrationen für Basistabellen der 4 Module
  - Tenant-sichere Constraints + Basisindizes
  - Soft-delete-Spalten (`deleted_at`, `deleted_by`, `delete_reason`) auf relevanten Entitäten
- **Akzeptanzkriterien:**
  - Migrationen laufen clean auf leerer und bestehender DB
  - Rollforward ohne manuelle Nacharbeit
  - Schema-Dokumentation aktualisiert
- **Tests/Gates:**
  - Migration Smoke-Test
  - `cd services/api && ./gradlew test`

### ARB-002 - Kunden API Core + vollständige CRUD inkl. Delete/Restore

- **Priorität:** P0
- **Aufwand:** 18h
- **Abhängigkeiten:** ARB-001
- **Lieferobjekte:**
  - `GET/POST/PATCH/DELETE/restore` für Kunden
  - Subressourcen-CRUD für Objekte, Ansprechpartner, Reminder
  - Rollen-/Tenant-Policy enforcement
- **Akzeptanzkriterien:**
  - Bearbeiten/Löschen/Restore für alle Kunden-Subressourcen funktioniert
  - Soft-delete Datensätze erscheinen nicht in Standard-Listen
  - Keine tenant-fremden Datenzugriffe möglich
- **Tests/Gates:**
  - Controller + Service Tests
  - Negative Security Tests (role/tenant)
  - `./gradlew test --tests "*Kunden*"`

### ARB-003 - Angebote API Core + Statusmaschine + Edit/Delete

- **Priorität:** P0
- **Aufwand:** 20h
- **Abhängigkeiten:** ARB-001
- **Lieferobjekte:**
  - Quote CRUD inkl. Positionen/Optionen editierbar/löschbar
  - Statusmaschine (`DRAFT -> ... -> SENT`)
  - Approval-Step Grundpfad
- **Akzeptanzkriterien:**
  - Ungültige Transitionen sind technisch blockiert
  - Bearbeiten/Löschen rekalkuliert Summen konsistent
  - AuditTrail bei jeder mutierenden Aktion vollständig
- **Tests/Gates:**
  - State-Machine Unit Tests
  - Pricing/Consistency Tests
  - `./gradlew test --tests "*Angebot*"`

### ARB-011 - Encryption Foundation (Pflicht)

- **Priorität:** P0
- **Aufwand:** 16h
- **Abhängigkeiten:** ARB-001
- **Lieferobjekte:**
  - Reusable Crypto-Komponente (AES-256-GCM, AAD, key_version)
  - Envelope-Grundgerüst (DEK/KEK Integration vorbereiten)
  - Field-level encryption für sensible Felder in Kunden+Angebote aktiv
  - Blind-Index Basis für exakte Suche
- **Akzeptanzkriterien:**
  - Sensitive Felder liegen nicht im Klartext in DB
  - Decrypt nur bei korrekter AAD/Tenant-Bindung
  - Fehlerpfade liefern keine Crypto-Details nach außen
- **Tests/Gates:**
  - Crypto roundtrip Tests
  - AAD mismatch/falscher tenant Tests
  - `./gradlew test --tests "*Crypto*"`

## Kapazität & Zuweisung (Vorschlag)

- Gesamtkapazität: 102h commitbar
- Geplante Last: 70h (P0 Kernumfang) + 12h Integrations-/Review-Puffer = 82h
- Reserve: 20h

Vorschlag Team-Fokus:
- Engineer A: ARB-001 + ARB-011 Basis
- Engineer B: ARB-002
- Engineer C: ARB-003 Status/Approval
- Engineer D: ARB-003 Pricing/Tests + ARB-011 Integration
- QA/Lead: Gates, Security Review, API Contract Review

## Definition of Done (Sprint 1)

- Alle vier ARB-Tickets mit grünen Tests abgeschlossen
- API-Verträge dokumentiert (OpenAPI/Markdown)
- Keine P0-Befunde offen in Security-/Validation-Review
- Demo-fähige End-to-end Flows:
  - Kunden erstellen/bearbeiten/löschen/restore
  - Angebote erstellen, bearbeiten, Statuswechsel durchführen
  - Encryption-Nachweis für sensitive Felder
