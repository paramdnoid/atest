# ARB-009 – Read-Model Optimization Baseline (services/api)

## Umgesetzt
- Neue read-optimized API im Ops-Modul:
  - `GET /v1/ops/read-model/overview`
- Tenant-sicher, session-basiert analog bestehendem Pattern (`zg_refresh_token` aus `Cookie`).
- Null-sichere Aggregation über Domänen:
  - `kunden`
  - `angebote`
  - `aufmass`
  - `abnahmen`

## Response-Baseline
- `overview.generatedAt`
- je Domäne:
  - `total`
  - `statusSplit` (alle gefundenen Stati inkl. `UNKNOWN`)
  - `relevantStatusSplit` (vordefinierte Kern-Stati + `UNKNOWN`)

## Technische Umsetzung
- Neue Komponenten:
  - `OpsReadModelController`
  - `OpsReadModelService`
- Repository-Erweiterungen:
  - `countActiveByStatus(UUID tenantId)` via JPA-`@Query` + `GROUP BY status`
- Keine neue Infrastruktur, keine externen Frameworks.

## Betroffene Dateien
- `services/api/src/main/java/com/zunftgewerk/api/modules/opsworkflow/web/OpsReadModelController.java`
- `services/api/src/main/java/com/zunftgewerk/api/modules/opsworkflow/service/OpsReadModelService.java`
- `services/api/src/main/java/com/zunftgewerk/api/modules/kunden/repository/KundenRepository.java`
- `services/api/src/main/java/com/zunftgewerk/api/modules/angebote/repository/AngebotRepository.java`
- `services/api/src/main/java/com/zunftgewerk/api/modules/aufmass/repository/AufmassRecordRepository.java`
- `services/api/src/main/java/com/zunftgewerk/api/modules/abnahmen/repository/AbnahmeRecordRepository.java`
