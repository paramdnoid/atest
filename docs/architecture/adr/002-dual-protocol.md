# ADR-002: REST + gRPC Dual Protocol

## Status
Accepted

## Context
The platform serves three distinct frontend clients with different requirements:
- **Landing app (Next.js):** Server Components need cookie forwarding; standard browser REST is simplest
- **Web app (Next.js):** Client-side SPA with Bearer token auth; REST is native to browsers
- **Mobile app (Expo/React Native):** Needs strongly typed contracts, efficient binary serialization, and streaming support for real-time sync

A single protocol would force compromises on at least one client.

## Decision
Expose **both REST (port 8080) and gRPC (port 9090)** from the same Spring Boot application. Both protocols share the same business logic modules — controllers delegate to the same services.

- REST endpoints serve the web frontends (landing and web apps)
- gRPC services serve the mobile app
- Proto definitions live in `packages/proto/` and are shared between the API and mobile app builds

## Consequences

**Benefits:**
- Each client uses the most natural protocol for its platform
- gRPC provides efficient binary serialization and server-streaming for sync
- Proto files serve as a shared contract between API and mobile
- Business logic is protocol-agnostic (services don't know REST vs gRPC)

**Trade-offs:**
- Two API surfaces to maintain (REST controllers + gRPC service classes)
- Auth mechanisms differ: REST uses cookies/Bearer, gRPC uses metadata interceptor
- Testing requires covering both protocols
- Envoy gateway needed in production for gRPC-web bridge
