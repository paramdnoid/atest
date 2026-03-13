# services/api Sprint 3 - ARB-007 Monitoring/Audit Baseline (2026-03-13)

Status: Umsetzung abgeschlossen (minimal-invasiv, produktionsnah)

## Ziel

Eine zentrale Monitoring-/Audit-Baseline fuer mutierende Operationen in den neuen Ops-Domains bereitstellen:

- `kunden`
- `angebote`
- `aufmass`
- `abnahmen`

## Umgesetzte Änderungen

1. Zentrale Metrics-Komponente:
   - `DomainMutationMetrics` unter `shared/monitoring`
   - Micrometer Counter `zg_domain_mutation_total` mit Tags:
     - `domain`: `kunden|angebote|aufmass|abnahmen`
     - `operation`: `create|update|delete|restore`

2. Integration in mutierende Service-Methoden (low-risk, Top-Level-CRUD):
   - `KundenService`: `createKunde`, `updateKunde`, `softDeleteKunde`, `restoreKunde`
   - `AngebotService`: `create`, `update`, `delete`, `restore`
   - `AufmassService`: `create`, `update`, `delete`, `restore`
   - `AbnahmeService`: `create`, `update`, `delete`, `restore`

3. Strukturierte Audit-Baseline:
   - `DomainMutationAuditLogger` unter `shared/audit`
   - no-op-kompatibel:
     - nutzt `AuditService` nur, wenn verfuegbar
     - bei fehlenden IDs oder Persistenzfehlern: kein Hard-Fail
   - neues Event in `AuditEventType`: `DOMAIN_MUTATION`
   - Payload (JSON) mit:
     - `domain`
     - `operation`
     - `entityId`

## Tests

- `KundenServiceMetricsTest`
  - Smoke-Test fuer Metric-Hook bei `createKunde`
  - validiert Counter-Inkrement fuer `domain=kunden` + `operation=create`

## Verifikation

- `./gradlew test --tests com.zunftgewerk.api.modules.kunden.service.KundenServiceMetricsTest`
- `./gradlew test`
