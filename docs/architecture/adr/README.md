# Architecture Decision Records

Diese ADRs dokumentieren dauerhafte Architekturentscheidungen inkl. Begruendung und Konsequenzen.

## Prozess

1. ADR im Status `Proposed` erstellen (siehe [Template](./template.md)).
2. Relevante Alternativen und Trade-offs dokumentieren.
3. Review durch verantwortliche Engineers/Tech Lead.
4. Nach Annahme Status auf `Accepted` setzen und betroffene Architekturdoku verlinken.
5. Bei Ablosung einer Entscheidung den Status auf `Superseded` setzen und Nachfolger-ADR verlinken.

## Index

| ADR | Status | Decision |
|---|---|---|
| [ADR-001](./001-modular-monolith.md) | Accepted | Modular monolith over microservices |
| [ADR-002](./002-dual-protocol.md) | Accepted | REST + gRPC dual protocol |
| [ADR-003](./003-vector-clock-sync.md) | Accepted | Vector-clock based sync engine |
| [ADR-004](./004-jwt-rs256-auth.md) | Accepted | RS256 JWT with refresh token rotation |
| [ADR-005](./005-multi-tenant-data.md) | Accepted | Shared database with tenant_id isolation |
| [ADR-006](./006-stripe-webhook-resilience.md) | Accepted | Webhook retry with dead-letter queue |

## Statuswerte

- `Proposed`: In Diskussion.
- `Accepted`: Gilt als aktuelle Leitentscheidung.
- `Superseded`: Durch neuere ADR ersetzt.
- `Deprecated`: Nicht mehr gueltig und ohne Nachfolger.
