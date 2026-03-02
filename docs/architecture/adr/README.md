# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) documenting key architectural decisions for the Zunftgewerk platform.

## Index

| ADR | Status | Decision |
|---|---|---|
| [ADR-001](./001-modular-monolith.md) | Accepted | Modular monolith over microservices |
| [ADR-002](./002-dual-protocol.md) | Accepted | REST + gRPC dual protocol |
| [ADR-003](./003-vector-clock-sync.md) | Accepted | Vector-clock based sync engine |
| [ADR-004](./004-jwt-rs256-auth.md) | Accepted | RS256 JWT with refresh token rotation |
| [ADR-005](./005-multi-tenant-data.md) | Accepted | Shared database with tenant_id isolation |
| [ADR-006](./006-stripe-webhook-resilience.md) | Accepted | Webhook retry with dead-letter queue |

## Template

```markdown
# ADR-NNN: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-NNN]

## Context
[What is the issue that we're seeing that is motivating this decision?]

## Decision
[What is the change that we're proposing and/or doing?]

## Consequences
[What becomes easier or more difficult to do because of this change?]
```
