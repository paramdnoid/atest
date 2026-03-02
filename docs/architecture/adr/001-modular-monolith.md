# ADR-001: Modular Monolith over Microservices

## Status
Accepted

## Context
Zunftgewerk is an enterprise multi-tenant SaaS platform serving the skilled trades industry. The backend needs to handle authentication, tenant management, billing, licensing, offline sync, and auditing. The team needed to choose between a microservices architecture and a monolithic approach.

Key considerations:
- Small team with limited operational capacity
- Strong domain boundaries exist (identity, tenant, billing, sync, etc.)
- Transactions frequently span multiple domains (e.g., signup creates a user, tenant, membership, and subscription)
- Early-stage product with rapidly evolving requirements

## Decision
Use a **modular monolith** architecture with Spring Boot. Each business domain (identity, tenant, plan, billing, license, sync, audit, onboarding) is implemented as a self-contained module under `com.zunftgewerk.api.modules.*` with its own controllers, services, entities, and repositories.

Shared infrastructure (security config, CORS, Redis, JPA) lives in `config/` and `shared/`.

## Consequences

**Benefits:**
- Single deployable unit simplifies operations (one JVM, one database)
- Cross-module transactions use standard JPA transactions (no distributed transactions)
- Modules enforce domain boundaries through package structure without network overhead
- Easy to refactor and move code between modules
- Single CI/CD pipeline and deployment process

**Trade-offs:**
- All modules scale together (cannot independently scale the sync engine)
- A bug in one module can affect the entire application
- Module boundaries are enforced by convention, not by the runtime

**Migration path:**
- Each module already owns its own data and exposes a clear service interface
- Extracting a module into a separate service is straightforward if scaling demands it
- The gRPC service layer already mirrors what an inter-service API would look like
