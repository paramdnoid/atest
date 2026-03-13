# Sprint Planning Report - Auftragsabwicklung Backend

Datum: 2026-03-13  
Planungsmodus: Fallback ohne Linear-MCP (Git/Repo-Analyse + fachliche Annahmen)

## Linear Integration Status

- Linear MCP ist aktuell nicht verbunden.
- Für volle Integration bitte installieren/verbinden: [MCP Linear Server](https://github.com/modelcontextprotocol/servers)
- Planung wurde daher mit Repository-Daten, bestehender Architektur und Produktkontext erstellt.

## Sprint Overview

- Sprintdauer (Annahme): 2 Wochen je Sprint
- Start: 2026-03-16
- Zielbild: Vollständiges Enterprise-Backend für die vier Auftragsabwicklungs-Module:
  - `Kunden`
  - `Angebote`
  - `Aufmaß`
  - `Abnahmen`

## Planungsannahmen

- Team (Annahme): 4 Backend Engineers + 1 QA + 1 Tech Lead (teilverfügbar)
- Kapazität pro 2-Wochen-Sprint: ~120 fokussierte Engineering-Stunden
- Planbare Zielauslastung: 80-85% (Puffer für Ungeplantes, Reviews, Bugs)
- Vorhanden: modulare Spring-Boot-Basis, Security, Tenant-Konzept, Audit-Patterns
- Fehlend: Domänenmodule + Datenmodell + APIs für Auftragsabwicklung

## Capacity Analysis

- Gesamt (Annahme): 120h
- Empfohlene Commit-Kapazität (85%): 102h
- Reserve (15%): 18h
- Empfohlene Verteilung:
  - 60% Feature Implementation
  - 20% Tests/QA/Hardening
  - 10% Architektur/Dokumentation
  - 10% Bugfix/Unplanned

## Sprint-Zuschnitt (3 Sprints)

### Sprint 1 - Domain-Fundament + Kunden + Angebote Core
- Datenmodell/Flyway-Basis für 4 Module
- Kunden-Core APIs + Angebote-Core APIs
- Gemeinsame Patterns (State Machine, Policy, Audit, Idempotency)
- Vollständige CRUD-Basis inkl. Bearbeiten/Löschen (soft delete + restore)

### Sprint 2 - Aufmaß + Abnahmen Core + Integrationspfade
- Aufmaß-Core inkl. Rules/Review-Blocker-Mechanik
- Abnahmen-Core inkl. Defect/Rework/Protocol
- End-to-End-Übergänge Angebote -> Aufmaß -> Abnahmen
- Verschlüsselungsintegration auf Feldebene für sensible Daten

### Sprint 3 - Enterprise Hardening + Performance + Rollout
- Observability/SLIs/SLOs
- Sicherheits- und Lasttests
- Operative Readiness (Runbooks, Rollback, Migrationssicherheit)
- Key Rotation, Re-Encryption Jobs und Crypto-Runbook

## Proposed Sprint Backlog (Priorisiert)

### High Priority (P0)
1. ARB-001 Datenmodell + Flyway Foundations (16h)
2. ARB-002 Kunden API Core + Policy + vollständige CRUD inkl. Delete/Restore (18h)
3. ARB-003 Angebote API Core + Statusmaschine + Änderungs-/Löschpfade (20h)
4. ARB-004 Aufmaß API Core + Review-Blocker + Bearbeiten/Löschen Flows (22h)
5. ARB-005 Abnahmen API Core + Defect/Rework inkl. Edit/Delete (22h)
6. ARB-011 Encryption Foundation (Envelope + KMS + Field-Level) (16h)

### Medium Priority (P1)
1. ARB-006 Cross-Module Workflow APIs (12h)
2. ARB-007 Metrics/Tracing/Audit Queryability (10h)
3. ARB-008 E2E Contract Tests + Failure Paths (10h)
4. ARB-012 Key Rotation + Re-Encryption Batch + Crypto Monitoring (12h)

### Nice-to-Have (P2)
1. ARB-009 Read Model Optimierungen (8h)
2. ARB-010 Async Events für Integrationen (8h)

## Risiken

### Technische Risiken
- State-Machine-Regeln zwischen Modulen inkonsistent
- Tenant-Scope-Verletzungen bei komplexen Queries
- Performance-Risiko bei großen Defect-/Measurement-Mengen
- Falsch implementierte Löschsemantik (Hard Delete statt Soft Delete)
- Kryptografische Fehlkonfiguration (Key Reuse, fehlende Rotation)

### Ressourcenrisiken
- Domain-Klärung bei Abnahme-Protokoll/Reservierungslogik kann Zeit ziehen
- QA-Engpass bei parallelen Modulen

### Dependency-Risiken
- UI erwartet bereits stabilisierte Feldstrukturen aus Mock-Typen
- Migrationen müssen vorwärts/rückwärts sauber bleiben

## Empfehlungen

1. Zuerst gemeinsame Backend-Patterns als Baseline implementieren (Policy, Audit, Validation).
2. API-Verträge früh als OpenAPI-Dokumente fixieren und mit Frontend abstimmen.
3. Pro Modul früh Contract-Tests + negative Szenarien (Validation/Auth/Tenant).
4. Deployment-Strategie mit Feature Flags/Readiness Gates absichern.
5. Löschstrategie verbindlich festlegen: Soft Delete standardmäßig, Hard Delete nur DSGVO-/Retention-Job.
6. Verschlüsselung als Pflichtumfang behandeln, nicht als Nice-to-have.

## Metrics to Track

- Delivery Velocity (Story Points / Sprint)
- Cycle Time pro API-Feature
- Blocked Time (Abhängigkeiten)
- Test Stability (Flaky Rate)
- p95 API Latency pro Modul
- 4xx/5xx Rate pro Endpoint-Gruppe
- Crypto Error Rate (encrypt/decrypt failures)
- Key Rotation Success Rate
- Delete/Restore Success + Data Integrity Rate

## Output-Artefakte in diesem Paket

- `docs/plans/backend-plan-kunden-2026-03-13.md`
- `docs/plans/backend-plan-angebote-2026-03-13.md`
- `docs/plans/backend-plan-aufmass-2026-03-13.md`
- `docs/plans/backend-plan-abnahmen-2026-03-13.md`
- `docs/plans/backend-plan-encryption-architecture-2026-03-13.md`
- `docs/plans/sprint1-backlog-auftragsabwicklung-backend-2026-03-13.md`
- `docs/plans/sprint2-backlog-auftragsabwicklung-backend-2026-03-13.md`
- `docs/plans/sprint3-backlog-auftragsabwicklung-backend-2026-03-13.md`
