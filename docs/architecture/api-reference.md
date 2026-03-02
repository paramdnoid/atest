# API Reference

## REST Endpoints (Port 8080)

### Authentication (`/v1/auth`)

| Method | Endpoint | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/signup` | None | `{ email, password, workspaceName, tradeSlug, address? }` | `{ userId, tenantId, accessToken, expiresAt }` + Set-Cookie |
| GET | `/verify-email?token=` | None | Query param | Redirect to landing app |
| POST | `/request-password-reset` | None | `{ email }` | `{ message }` |
| POST | `/reset-password` | None | `{ email, code, newPassword }` | `{ message }` |
| POST | `/login` | None | `{ email, password }` | `{ state, accessToken?, mfaToken?, userId?, expiresAt? }` + Set-Cookie |
| POST | `/passkey/begin` | None | `{ email, mode }` | `{ challengeId, publicKeyOptionsJson }` |
| POST | `/passkey/verify` | None | `{ email, challengeId, credentialJson, mode }` | `{ state, accessToken, expiresAt }` + Set-Cookie |
| POST | `/mfa/enable` | Bearer JWT | — | `{ provisioningUri, backupCodes[] }` |
| POST | `/mfa/verify` | None | `{ userId, mfaToken, code?, backupCode? }` | `{ accessToken, expiresAt }` + Set-Cookie |
| POST | `/refresh` | Cookie/Body | — | `{ accessToken, expiresAt }` + Set-Cookie |
| POST | `/logout` | Cookie/Body | — | 204 + Clear-Cookie |
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

All gRPC calls require JWT in metadata (extracted by `GrpcAuthInterceptor`).

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

**Key types:**
- `AuthState`: `AUTHENTICATED`, `MFA_REQUIRED`, `CHALLENGE_REQUIRED`
- `PasskeyMode`: `REGISTER`, `AUTHENTICATE`

### SyncService

```protobuf
service SyncService {
  rpc PullChanges(PullChangesRequest) returns (PullChangesResponse);
  rpc PushChanges(PushChangesRequest) returns (PushChangesResponse);
  rpc StreamChanges(StreamChangesRequest) returns (stream ChangeEvent);
}
```

**Key types:**
- `VectorClockEntry`: `{ node, counter }`
- `ClientOperation`: `{ clientOpId, entityType, entityId, operation, payloadDeltaJson, baseVersion, occurredAt, vectorClock[] }`
- `ChangeEvent`: `{ id, entityType, entityId, operation, payloadDeltaJson, serverVersion, occurredAt, resultVectorClock[], conflict }`
- `ConflictResolution`: `{ clientOpId, resolutionType, resolvedPayloadJson, serverVectorClock[], serverVersion, reason }`

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

All tenant operations require `TenantContext { tenant_id, actor_user_id }`.

### LicenseService

```protobuf
service LicenseService {
  rpc ListSeats(ListSeatsRequest) returns (ListSeatsResponse);
  rpc AssignSeat(AssignSeatRequest) returns (AssignSeatResponse);
  rpc RevokeSeat(RevokeSeatRequest) returns (RevokeSeatResponse);
  rpc ListEntitlements(ListEntitlementsRequest) returns (ListEntitlementsResponse);
}
```

### Common Types

```protobuf
message TenantContext {
  string tenant_id = 1;
  string actor_user_id = 2;
}

message PaginationRequest {
  int32 page_size = 1;
  string page_token = 2;
}

message PaginationResponse {
  string next_page_token = 1;
}
```

---

## Proto File Locations

All proto definitions live in `packages/proto/zunftgewerk/v1/`:

| File | Service |
|---|---|
| `auth.proto` | AuthService |
| `sync.proto` | SyncService |
| `plan.proto` | PlanService |
| `tenant.proto` | TenantService |
| `license.proto` | LicenseService |
| `common.proto` | Shared messages (TenantContext, Pagination) |

Proto files are shared between the Spring Boot API (via Gradle `sourceSets`) and the mobile app.

---

## Error Responses

### REST Error Format

```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}
```

### Rate Limit Response (429)

```json
{
  "error": "RATE_LIMITED",
  "retryAfterSeconds": 45
}
```

### Auth State Responses

| State | HTTP | Meaning |
|---|---|---|
| `AUTHENTICATED` | 200 | Login complete, tokens issued |
| `MFA_REQUIRED` | 200 | Must verify TOTP before tokens are issued |
| `CHALLENGE_REQUIRED` | 200 | WebAuthn challenge in progress |
