# ADR-005: Shared Database with tenant_id Isolation

## Status
Accepted

## Context
Zunftgewerk is a multi-tenant SaaS platform. Each trade business (tenant) must have complete data isolation from other tenants. Three isolation strategies were considered:

1. **Separate databases** per tenant — strongest isolation, highest operational cost
2. **Separate schemas** per tenant — good isolation, complex migration management
3. **Shared tables with tenant_id** — simplest operations, relies on application-level enforcement

## Decision
Use a **single shared PostgreSQL database** with `tenant_id` column on all tenant-owned tables. Isolation is enforced at the application level.

Key invariants:
- Every tenant-owned entity carries a `tenant_id` foreign key referencing `tenants` with `ON DELETE CASCADE`
- All queries for tenant-scoped data include `WHERE tenant_id = ?`
- gRPC requests carry `TenantContext` (tenant_id + actor_user_id) extracted by interceptor
- REST requests derive tenant context from the JWT `tid` claim or cookie peek
- The `subscriptions` table has a UNIQUE constraint on `tenant_id` (1:1 relationship)

Tables **not** tenant-scoped: `users`, `stripe_webhook_events` (global), `auth_challenges` (ephemeral).

## Consequences

**Benefits:**
- Single database simplifies operations, backups, and migrations
- Flyway migrations apply once to all tenants
- Cross-tenant queries are possible for platform analytics (admin use only)
- No per-tenant infrastructure provisioning needed

**Trade-offs:**
- Data isolation depends on correct application-level `tenant_id` filtering
- A missing `WHERE tenant_id = ?` clause could leak data across tenants
- Single database is a shared resource (noisy neighbor risk at scale)
- No per-tenant backup/restore capability

**Mitigations:**
- Consistent use of repository methods that always include tenant context
- `ON DELETE CASCADE` ensures tenant deletion removes all associated data
- Index on `tenant_id` on all tenant-scoped tables for query performance
