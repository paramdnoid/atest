# Sprint 3 Backlog - Auftragsabwicklung Backend

Datum: 2026-03-13  
Sprintfenster: 2026-04-13 bis 2026-04-25 (Annahme)  
Ziel: Enterprise-Hardening, operatives Go-Live-Setup, Performance, Rotation und Release-Readiness

## Scope-Freeze für Sprint 3

- In Scope:
  - ARB-007, ARB-008, ARB-009, ARB-010, ARB-012
  - Operative Runbooks + Incident/Recovery-Prozesse
- Out of Scope:
  - neue große Business-Features
  - strukturelle Domain-Erweiterungen ohne Incident-Relevanz

## Sprint-Backlog (ausführbar)

### ARB-007 - Metrics/Tracing/Audit Queryability

- **Priorität:** P1
- **Aufwand:** 10h
- **Abhängigkeiten:** ARB-002..006
- **Lieferobjekte:**
  - Standardisierte Metrikfamilien pro Modul
  - Tracing-Spans über Controller -> Service -> Repository
  - Audit Query Endpunkte (tenant- und rollenbasiert)
- **Akzeptanzkriterien:**
  - p95-Latenz und Fehlerquoten je Modul sichtbar
  - Audit-Query für Incident-Analyse praxistauglich
- **Tests/Gates:**
  - Integrationstests für Audit-Filter
  - Observability-Snapshot im Staging

### ARB-008 - E2E Contract Tests + Failure Paths

- **Priorität:** P1
- **Aufwand:** 10h
- **Abhängigkeiten:** ARB-002..006
- **Lieferobjekte:**
  - Contract-Test-Suite für Kernendpunkte
  - Negative Szenarien: Validation/AuthZ/Tenant/Crypto
  - Stabiler CI-Job mit reproduzierbaren Fixtures
- **Akzeptanzkriterien:**
  - Keine breaking changes ohne Testsignal
  - Fehlerpfade sind deterministisch und abgesichert
- **Tests/Gates:**
  - CI grün über 2 aufeinanderfolgende Runs

### ARB-009 - Read Model Optimierungen

- **Priorität:** P2
- **Aufwand:** 8h
- **Abhängigkeiten:** ARB-007
- **Lieferobjekte:**
  - gezielte Indizes + Query-Optimierungen für Listen/Detail
  - Pagination- und Projection-Härtung
- **Akzeptanzkriterien:**
  - p95-Zielwerte in Staging erreicht
- **Tests/Gates:**
  - SQL/Repository Performance Benchmarks

### ARB-010 - Async Events für Integrationen

- **Priorität:** P2
- **Aufwand:** 8h
- **Abhängigkeiten:** ARB-006
- **Lieferobjekte:**
  - Event-Publishing für Kernstatuswechsel
  - idempotenter Consumer-Rahmen (wenn benötigt)
  - DLQ-/Retry-Grundkonzept
- **Akzeptanzkriterien:**
  - Event-Duplikate führen zu keiner fachlichen Inkonsistenz
- **Tests/Gates:**
  - idempotency/retry Integrationstests

### ARB-012 - Key Rotation + Re-Encryption + Crypto Monitoring

- **Priorität:** P1
- **Aufwand:** 12h
- **Abhängigkeiten:** ARB-011 + ARB-011-F2
- **Lieferobjekte:**
  - produktionsfähiger Rotation-Runbook-Flow
  - Re-Encryption Batch (checkpoint/resume/throttle)
  - Alerts für crypto failures/rotation backlog
- **Akzeptanzkriterien:**
  - Rotation ohne Downtime erfolgreich
  - Re-Encryption kann sicher fortgesetzt/abgebrochen werden
- **Tests/Gates:**
  - Dry-Run im Staging
  - Recovery-Test bei Batch-Abbruch

## Release Readiness Paket

### Operative Artefakte (Pflicht)
- Runbook: Rollout/Rollback
- Runbook: Key Rotation + Incident Handling
- Runbook: Data-Restore + Soft-delete/Retention
- Security Checklist (OWASP/API Top 10 Bezug)

### Go/No-Go Kriterien
- Funktional:
  - alle P0/P1 Tickets aus Sprint 1/2/3 abgeschlossen
- Qualität:
  - CI vollständig grün, keine kritischen Flakes
- Sicherheit:
  - keine offenen Critical Findings aus Security Review
- Betrieb:
  - Monitoring/Alerts aktiv + on-call-fähig dokumentiert

## Kapazität & Zuweisung (Vorschlag)

- Commit-Kapazität: 102h
- Geplante Last: ~48h + 20h Release/Hardening + 12h Reserve = 80h
- Reserve: 22h

Vorschlag Team-Fokus:
- Engineer A: ARB-007 + ARB-009
- Engineer B: ARB-008 + CI hardening
- Engineer C: ARB-012 (Rotation/Re-Encryption)
- Engineer D: ARB-010 + Integrationshärtung
- QA/Lead: Release-Readiness + Go/No-Go

## Definition of Done (Sprint 3)

- Observability-, Contract- und Crypto-Rotation-Paket vollständig aktiv
- Release-Readiness-Artefakte liegen vollständig vor
- Go/No-Go-Entscheidung datenbasiert möglich
- System ist produktionsbereit auf Enterprise-Niveau
