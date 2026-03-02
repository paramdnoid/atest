# Data Architecture

## Entity Relationship Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Core Domain                                 │
│                                                                      │
│  ┌──────────┐ 1    * ┌──────────────┐ *    1 ┌──────────┐          │
│  │  Users   │───────│ Memberships  │───────│ Tenants  │          │
│  └──────────┘        └──────────────┘        └──────────┘          │
│       │ 1                  │                      │ 1              │
│       │               ┌────┘                      │                │
│       │               ▼                           │                │
│       │         ┌──────────┐              ┌───────┴───────┐        │
│       │         │  Roles   │              │               │        │
│       │         └──────────┘         ┌────┴───┐    ┌──────┴─────┐  │
│       │                              │Devices │    │Subscription│  │
│  ┌────┴────────────────┐             └────────┘    └────────────┘  │
│  │ Auth Entities       │                                           │
│  │ (RefreshTokens,     │                                           │
│  │  MfaSecrets,        │                                           │
│  │  Passkeys,          │                                           │
│  │  VerificationTokens)│                                           │
│  └─────────────────────┘                                           │
└──────────────────────────────────────────────────────────────────────┘
```

## Database Schema (Flyway Migrations V1–V8)

### Core Tables

**users**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| mfa_enabled | BOOLEAN | DEFAULT false |
| email_verified | BOOLEAN | DEFAULT false |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**tenants**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(255) | NOT NULL |
| trade_slug | VARCHAR(100) | |
| address | JSONB | Nullable (contains street, city, zip, country, lat, lng) |
| device_registration_token | VARCHAR(255) | Nullable (V8) |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**memberships**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users, NOT NULL |
| tenant_id | UUID | FK → tenants ON DELETE CASCADE, NOT NULL |
| role_key | VARCHAR(50) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

**roles**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants ON DELETE CASCADE |
| key | VARCHAR(50) | NOT NULL |
| permissions | JSONB | |
| created_at | TIMESTAMP | NOT NULL |

### Auth Tables (V2)

**refresh_tokens**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users, NOT NULL |
| token_hash | VARCHAR(255) | NOT NULL |
| family_id | UUID | NOT NULL (for reuse detection) |
| revoked_at | TIMESTAMP | Nullable |
| expires_at | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

**mfa_secrets**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users, UNIQUE, NOT NULL |
| encrypted_secret | TEXT | AES-128-GCM encrypted |
| hashed_backup_codes | TEXT[] | SHA-256 hashed |
| created_at | TIMESTAMP | NOT NULL |

**passkey_credentials**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users, NOT NULL |
| credential_id | BYTEA | UNIQUE, NOT NULL |
| cose_public_key | BYTEA | NOT NULL |
| sign_count | BIGINT | NOT NULL |
| aaguid | BYTEA | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |

**email_verification_tokens**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users, NOT NULL |
| token_hash | VARCHAR(255) | NOT NULL |
| used_at | TIMESTAMP | Nullable |
| expires_at | TIMESTAMP | NOT NULL (24h TTL) |
| created_at | TIMESTAMP | NOT NULL |

**password_reset_tokens**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users, NOT NULL |
| code | VARCHAR(8) | NOT NULL |
| used_at | TIMESTAMP | Nullable |
| expires_at | TIMESTAMP | NOT NULL (1h TTL) |
| created_at | TIMESTAMP | NOT NULL |

**auth_challenges**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| challenge | TEXT | NOT NULL |
| expires_at | TIMESTAMP | NOT NULL (5-min TTL) |
| created_at | TIMESTAMP | NOT NULL |

### Billing Tables (V3, V6)

**stripe_webhook_events**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| stripe_event_id | VARCHAR(255) | UNIQUE, NOT NULL |
| event_type | VARCHAR(100) | NOT NULL |
| payload | JSONB | NOT NULL |
| status | VARCHAR(20) | RECEIVED / PROCESSED / RETRY / DEAD_LETTER |
| retry_count | INT | DEFAULT 0 |
| next_retry_at | TIMESTAMP | Nullable |
| dead_lettered_at | TIMESTAMP | Nullable (V6) |
| error_message | TEXT | Nullable |
| created_at | TIMESTAMP | NOT NULL |
| processed_at | TIMESTAMP | Nullable |

**billing_audit_log**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants |
| event_type | VARCHAR(100) | NOT NULL |
| payload | JSONB | |
| created_at | TIMESTAMP | NOT NULL |

### Subscription & Licensing Tables

**subscriptions**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants, UNIQUE, NOT NULL |
| plan_id | VARCHAR(50) | NOT NULL |
| stripe_customer_id | VARCHAR(255) | |
| stripe_subscription_id | VARCHAR(255) | |
| status | VARCHAR(20) | NOT NULL |
| billing_cycle | VARCHAR(10) | monthly / yearly |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**seat_licenses**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants ON DELETE CASCADE |
| user_id | UUID | FK → users |
| status | VARCHAR(20) | |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

**entitlements**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants ON DELETE CASCADE |
| key | VARCHAR(100) | NOT NULL |
| enabled | BOOLEAN | DEFAULT true |
| created_at | TIMESTAMP | NOT NULL |

**devices** (V8)
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants ON DELETE CASCADE, NOT NULL |
| name | VARCHAR(255) | NOT NULL |
| platform | VARCHAR(50) | |
| status | VARCHAR(20) | pending / licensed / revoked |
| licensed_at | TIMESTAMP | Nullable |
| revoked_at | TIMESTAMP | Nullable |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### Sync Tables (V1, V4, V5)

**change_log**
| Column | Type | Constraints |
|---|---|---|
| id | BIGSERIAL | PK |
| tenant_id | UUID | FK → tenants ON DELETE CASCADE, NOT NULL |
| entity_type | VARCHAR(100) | NOT NULL |
| entity_id | UUID | NOT NULL |
| operation | VARCHAR(20) | CREATE / UPDATE / DELETE |
| payload_delta_json | JSONB | |
| server_version | BIGINT | (V4) |
| vector_clock | JSONB | (V4) |
| conflict | BOOLEAN | DEFAULT false (V4) |
| occurred_at | TIMESTAMP | NOT NULL |

**client_operations**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants ON DELETE CASCADE, NOT NULL |
| device_id | VARCHAR(100) | NOT NULL |
| client_op_id | VARCHAR(255) | NOT NULL |
| entity_type | VARCHAR(100) | NOT NULL |
| entity_id | UUID | NOT NULL |
| operation | VARCHAR(20) | NOT NULL |
| payload_delta_json | JSONB | |
| server_version | BIGINT | (V5) |
| occurred_at | TIMESTAMP | NOT NULL |

**entity_sync_state** (V4)
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants ON DELETE CASCADE, NOT NULL |
| entity_type | VARCHAR(100) | NOT NULL |
| entity_id | UUID | NOT NULL |
| version | BIGINT | NOT NULL |
| vector_clock | JSONB | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

### Audit Tables

**audit_events**
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK → tenants |
| actor_user_id | UUID | |
| event_type | VARCHAR(100) | NOT NULL |
| payload | JSONB | |
| occurred_at | TIMESTAMP | NOT NULL |

## Key Indexes

| Table | Columns | Purpose |
|---|---|---|
| memberships | (tenant_id) | Tenant member lookup |
| memberships | (user_id) | User membership lookup |
| change_log | (tenant_id, id DESC) | Cursor-based sync pull |
| change_log | (tenant_id, entity_type, entity_id, id DESC) | Entity-specific changelog |
| client_operations | (tenant_id, device_id) | Device operation dedup |
| audit_events | (tenant_id, occurred_at DESC) | Chronological audit trail |
| entity_sync_state | (tenant_id, updated_at DESC) | Sync state queries |
| devices | (tenant_id) | Tenant device listing |

## Migration History

| Version | Name | Scope |
|---|---|---|
| V1 | `baseline` | Core schema (users, tenants, memberships, roles, subscriptions, seats, entitlements, changelog, client operations, audit events) |
| V2 | `auth_security` | Auth tables (refresh tokens, MFA, email verification, password reset, passkeys, challenges) |
| V3 | `stripe_webhooks` | Stripe webhook event tracking with retry metadata |
| V4 | `sync_vector_clock` | Vector clock support (entity sync state, changelog enhancements) |
| V5 | `client_operations_server_version` | Server version tracking for client operations |
| V6 | `stripe_webhook_retry_dlq` | Dead-letter queue for failed webhooks |
| V7 | `signup_verification` | Email verification during signup flow |
| V8 | `devices` | Device table + registration token on tenants |

## Data Flow Patterns

### Write Path (Tenant-Scoped)

All mutations enforce tenant context:

```
Request → Auth (JWT/Cookie) → Extract tenantId
                                    │
                              ┌─────┴─────┐
                              ▼           ▼
                         Business      AuditService
                         Logic         .record(event)
                              │
                              ▼
                         Repository
                         .save(entity)
                              │
                              ▼
                    PostgreSQL (tenant_id = ?)
```

### Sync Data Flow

```
Mobile Client                    Server
     │                             │
     │  Push: [ClientOperation]    │
     │ ─────────────────────────→  │
     │                             ├─ Check idempotency (clientOpId)
     │                             ├─ Load entity sync state
     │                             ├─ Compare vector clocks
     │                             │   ├─ No conflict → apply
     │                             │   └─ Conflict → resolve
     │                             ├─ Write ChangeLog entry
     │                             ├─ Update EntitySyncState
     │                             │
     │  Response: accepted +       │
     │  conflicts + serverVersion  │
     │ ←─────────────────────────  │
     │                             │
     │  Pull: sinceCursor          │
     │ ─────────────────────────→  │
     │                             ├─ Query ChangeLog WHERE id > cursor
     │  ChangeEvents[]             │
     │ ←─────────────────────────  │
```

### Stripe Webhook Processing

```
Stripe ──webhook──→ StripeWebhookController
                         │
                    Verify signature
                         │
                    Deduplicate (stripe_event_id)
                         │
                    Store as RECEIVED
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
    StripeWebhookRetryWorker    (async processing)
              │
         Process event
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
 PROCESSED  RETRY    DEAD_LETTER
            (backoff)  (max attempts)
```
