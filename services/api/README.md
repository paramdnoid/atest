# Zunftgewerk API

Spring Boot modular monolith with gRPC-first contracts.

## Modules

- Identity
- Tenant & Org
- Plans & Billing
- License Management
- Sync
- Audit

## Local run

```bash
gradle bootRun
```

## Test

```bash
gradle test
```

## Notes

- Java 21 required
- Protobuf contracts are sourced from `../../packages/proto`
- Flyway migration baseline: `src/main/resources/db/migration/V1__baseline.sql`
