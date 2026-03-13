# Sprint 2 Backlog - Auftragsabwicklung Backend

Datum: 2026-03-13  
Sprintfenster: 2026-03-30 bis 2026-04-11 (Annahme)  
Ziel: Aufmaß + Abnahmen produktionsreif auf Core-Niveau inkl. vollständiger Edit/Delete-Pfade und Cross-Module-Übergängen

## Scope-Freeze für Sprint 2

- In Scope:
  - ARB-004, ARB-005, ARB-006
  - Verschlüsselungsintegration für Aufmaß/Abnahmen gemäß Architekturplan
- Out of Scope:
  - Key-Rotation-Automation (Sprint 3)
  - Größere Performance-Read-Optimierungen (Sprint 3)

## Sprint-Backlog (ausführbar)

### ARB-004 - Aufmaß API Core + Review-Blocker + Bearbeiten/Löschen

- **Priorität:** P0
- **Aufwand:** 22h
- **Abhängigkeiten:** ARB-001, ARB-011
- **Lieferobjekte:**
  - Endpunkte für Record/Room/Measurement/Mapping inkl. `PATCH`, `DELETE`, `restore`
  - Transition-Endpunkt mit harter State-Machine
  - Review-Blocker-Neuberechnung + persistenter Audit-Trail
- **Akzeptanzkriterien:**
  - Ungültige Statuswechsel werden technisch blockiert (`400`/`409`)
  - Lösch-/Restore-Flows sind konsistent und tenant-sicher
  - Blocker-Regeln reproduzierbar (idempotent bei gleicher Eingabe)
- **Tests/Gates:**
  - Unit: State Machine + Rule Engine
  - Integration: Controller + Repository + optimistic locking
  - `./gradlew test --tests "*Aufmass*"`

### ARB-005 - Abnahmen API Core + Defect/Rework inkl. Edit/Delete

- **Priorität:** P0
- **Aufwand:** 22h
- **Abhängigkeiten:** ARB-001, ARB-011
- **Lieferobjekte:**
  - Defect/Rework/Evidence CRUD inkl. `PATCH`, `DELETE`, `restore`
  - Protocol/Signoff/Transition-Endpunkte
  - Blocking-Regeln für `critical` Defects bis `CLOSED`
- **Akzeptanzkriterien:**
  - Abschluss nur mit erfüllten Signoff-/Defect-Regeln
  - Evidence-Compliance-Checks technisch erzwungen
  - Vollständiger Audit-Trail aller Defect-/Rework-Aktionen
- **Tests/Gates:**
  - Unit: Defect/Rework State Machine
  - Integration: Transition Guards + negative Compliance Cases
  - `./gradlew test --tests "*Abnahme*"`

### ARB-006 - Cross-Module Workflow APIs

- **Priorität:** P1
- **Aufwand:** 12h
- **Abhängigkeiten:** ARB-003, ARB-004, ARB-005
- **Lieferobjekte:**
  - Übergänge:
    - Angebot `CONVERTED_TO_ORDER` -> Aufmaß initial
    - Aufmaß `APPROVED/BILLED` -> Abnahme-Vorbereitung
  - Referenz-IDs und fachliche Korrelation stabil persistiert
  - Event-/Webhook-Hooks (synchroner Core, async optional)
- **Akzeptanzkriterien:**
  - Übergänge sind idempotent und doppelsicher
  - Keine orphaned records bei Teilfehlern
  - Konsistente Query-API für Cross-Module-Status
- **Tests/Gates:**
  - Integration: End-to-End Übergangstests
  - Retry-/Idempotency-Tests

### ARB-011-F2 - Encryption Integration Aufmaß/Abnahmen

- **Priorität:** P0
- **Aufwand:** 10h
- **Abhängigkeiten:** ARB-011
- **Lieferobjekte:**
  - Sensible Felder in Aufmaß/Abnahmen verschlüsselt (AES-256-GCM + AAD)
  - Schlüsselversionierung (`key_version`) pro relevanter Entität
  - Logging-Redaction für Klartextschutz
- **Akzeptanzkriterien:**
  - Keine sensiblen Klartexte in DB/logs/events
  - Decrypt nur mit korrekter Tenant-/AAD-Bindung
- **Tests/Gates:**
  - Crypto-roundtrip + AAD mismatch Tests
  - `./gradlew test --tests "*Crypto*"`

## Architektur-/Qualitätsgates Sprint 2

- API Consistency Gate:
  - Einheitliche Fehlermodellierung (`error` Feld, stabile HTTP-Codes)
- Security Gate:
  - Rollen-/Tenant-Policy pro Endpunkt validiert
- Data Integrity Gate:
  - Soft-delete-Integrität inkl. Restore und referentieller Konsistenz

## Kapazität & Zuweisung (Vorschlag)

- Commit-Kapazität: 102h
- Geplante Last: ~66h + 14h Integrations-/Härtungspuffer = 80h
- Reserve: 22h

Vorschlag Team-Fokus:
- Engineer A: ARB-004 Core + Transition
- Engineer B: ARB-004 Rule Engine + Tests
- Engineer C: ARB-005 Core + Compliance
- Engineer D: ARB-006 + ARB-011-F2
- QA/Lead: Security/Audit/Contract Gates

## Definition of Done (Sprint 2)

- ARB-004/005 vollständig grün und demo-fähig
- Cross-Module Übergänge stabil inkl. Fehlerpfade
- Verschlüsselung in Aufmaß/Abnahmen aktiv und nachweisbar
- Keine offenen P0 Security-/Data-Integrity Findings
