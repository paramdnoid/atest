# API Reference

## REST Endpoints (Port 8080)

### Authentication (`/v1/auth`)

| Method | Endpoint | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/signup` | None | Signup-Daten | Zugriffstoken + Session-Cookie |
| GET | `/verify-email?token=` | None | Query param | Redirect to landing app |
| POST | `/request-password-reset` | None | `{ email }` | `{ message }` |
| POST | `/reset-password` | None | `{ email, code, newPassword }` | `{ message }` |
| POST | `/login` | None | `{ email, password }` | Auth-State (`AUTHENTICATED` oder `MFA_REQUIRED`) |
| POST | `/passkey/begin` | None | `{ email, mode }` | Challenge + PublicKey Options |
| POST | `/passkey/verify` | None | Verify-Daten | Auth-State + Session-Update |
| POST | `/mfa/enable` | Bearer JWT | — | Provisioning-Infos + Backup-Codes |
| POST | `/mfa/verify` | None | MFA-Daten | Zugriffstoken + Session-Update |
| POST | `/refresh` | Cookie/Body | — | Neues Zugriffstoken + rotierte Session |
| POST | `/logout` | Cookie/Body | — | 204 |
| POST | `/revoke-family` | Cookie/Body | — | 204 |

### JWKS (`/.well-known`)

| Method | Endpoint | Auth | Response |
|---|---|---|---|
| GET | `/jwks.json` | None | JWKS (RSA public key) |

### Workspace (`/v1/workspace`)

| Method | Endpoint | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/me` | Cookie | — | `{ id, name, tradeSlug, address, members[] }` |
| PATCH | `/me` | Cookie (admin) | `{ name?, tradeSlug? }` | Updated workspace |
| PATCH | `/me/address` | Cookie (admin) | `{ street, city, zip, country, latitude?, longitude? }` | Updated address |

### Devices (`/v1/devices`)

| Method | Endpoint | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/` | Cookie | — | `{ devices[] }` |
| GET | `/registration-token` | Cookie (admin) | — | `{ token }` |
| POST | `/registration-token/renew` | Cookie (admin) | — | `{ token }` |
| POST | `/{id}/license` | Cookie (admin) | — | `{ device }` |
| DELETE | `/{id}/license` | Cookie (admin) | — | 204 |
| DELETE | `/{id}` | Cookie (admin) | — | 204 |

### Billing (`/v1/billing`)

| Method | Endpoint | Auth | Response |
|---|---|---|---|
| GET | `/summary` | Cookie | `{ plan, subscription, memberCount, licensedCount, recentEvents[] }` |

### Onboarding (`/v1/onboarding`)

| Method | Endpoint | Auth | Response |
|---|---|---|---|
| GET | `/status` | Optional Cookie | `{ authenticated, emailVerified, subscriptionState, billingState, nextStep }` |

### Stripe Webhooks (`/webhooks`)

| Method | Endpoint | Auth | Request |
|---|---|---|---|
| POST | `/stripe` | Stripe signature | Raw webhook payload |

### Ops (`/internal`)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/billing/stripe-webhooks/dead-letter/recover` | Ops token | Recover dead-letter events |

---

## gRPC Services (Port 9090)

Alle gRPC-Aufrufe nutzen JWT in Metadata.

### AuthService

```protobuf
service AuthService {
  rpc Register(RegisterRequest) returns (RegisterResponse);
  rpc Login(LoginRequest) returns (LoginResponse);
  rpc BeginPasskey(BeginPasskeyRequest) returns (BeginPasskeyResponse);
  rpc VerifyPasskey(VerifyPasskeyRequest) returns (VerifyPasskeyResponse);
  rpc EnableMfa(EnableMfaRequest) returns (EnableMfaResponse);
  rpc VerifyMfa(VerifyMfaRequest) returns (VerifyMfaResponse);
  rpc RefreshToken(RefreshTokenRequest) returns (RefreshTokenResponse);
}
```

Wichtige Enums/Zustaende: `AuthState`, `PasskeyMode`.

### SyncService

```protobuf
service SyncService {
  rpc PullChanges(PullChangesRequest) returns (PullChangesResponse);
  rpc PushChanges(PushChangesRequest) returns (PushChangesResponse);
  rpc StreamChanges(StreamChangesRequest) returns (stream ChangeEvent);
}
```

Wichtige Typen: `ClientOperation`, `ChangeEvent`, `VectorClockEntry`.

### PlanService

```protobuf
service PlanService {
  rpc ListPlans(ListPlansRequest) returns (ListPlansResponse);
  rpc ChangePlan(ChangePlanRequest) returns (ChangePlanResponse);
  rpc PreviewInvoice(PreviewInvoiceRequest) returns (PreviewInvoiceResponse);
}
```

### TenantService

```protobuf
service TenantService {
  rpc CreateTenant(CreateTenantRequest) returns (CreateTenantResponse);
  rpc InviteMember(InviteMemberRequest) returns (InviteMemberResponse);
  rpc AssignRole(AssignRoleRequest) returns (AssignRoleResponse);
  rpc ListMembers(ListMembersRequest) returns (ListMembersResponse);
}
```

Tenant-Operationen nutzen Tenant-Kontext.

### LicenseService

```protobuf
service LicenseService {
  rpc ListSeats(ListSeatsRequest) returns (ListSeatsResponse);
  rpc AssignSeat(AssignSeatRequest) returns (AssignSeatResponse);
  rpc RevokeSeat(RevokeSeatRequest) returns (RevokeSeatResponse);
  rpc ListEntitlements(ListEntitlementsRequest) returns (ListEntitlementsResponse);
}
```

---

## Proto File Locations

Alle Proto-Definitionen liegen in `packages/proto/zunftgewerk/v1/`.

| File | Service |
|---|---|
| `auth.proto` | AuthService |
| `sync.proto` | SyncService |
| `plan.proto` | PlanService |
| `tenant.proto` | TenantService |
| `license.proto` | LicenseService |
| `common.proto` | Shared messages (TenantContext, Pagination) |

Diese Dateien sind gemeinsame Vertragsquelle fuer API und Mobile-Client.

---

## Fehlerformat (REST)

```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

Rate-Limit-Fehler liefern zusaetzlich `retryAfterSeconds`.

```json
{
  "error": "RATE_LIMITED",
  "retryAfterSeconds": 45
}
```
