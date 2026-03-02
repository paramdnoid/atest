# ADR-003: Vector-Clock Based Sync Engine

## Status
Accepted

## Context
The mobile app operates offline-first. Field workers create and modify records without network connectivity. When connectivity returns, changes must be synchronized with the server without data loss. Multiple devices may modify the same entity concurrently.

Requirements:
- Offline-first: all operations work without network
- Deterministic conflict resolution
- Idempotent operations (network retries must be safe)
- Real-time streaming when online

## Decision
Implement a **vector-clock based sync engine** with the following components:

1. **Client operations** are queued locally with unique `clientOpId` for idempotency
2. **Push** sends operations with the client's vector clock to the server
3. Server compares vector clocks to detect conflicts:
   - No conflict: apply operation, advance server version
   - Conflict: resolve deterministically, record resolution metadata
4. **Pull** returns changelog entries since a cursor (server version ID)
5. **StreamChanges** provides server-streaming for real-time updates when online
6. **EntitySyncState** tracks per-entity version and vector clock on the server

Data model:
- `change_log`: immutable append-only changelog with vector clocks
- `client_operations`: idempotency tracking per device
- `entity_sync_state`: current version + vector clock per entity

## Consequences

**Benefits:**
- True offline-first: clients work independently without server contact
- Deterministic conflict resolution preserves all changes
- Idempotent push operations make retries safe
- Server-streaming enables real-time sync when online
- Full audit trail via immutable changelog

**Trade-offs:**
- Vector clock storage grows with the number of participating devices
- Conflict resolution logic adds complexity to every entity type
- Client must maintain local operation queue and vector clock
- Mobile app requires encrypted local storage (SQLCipher) for offline data
