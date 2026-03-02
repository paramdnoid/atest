# Task 2: K8s Secrets Setup — Planning & Requirements Guide

> **Purpose**: Understand what's needed to set up production K8s secrets
> **Created**: 2026-03-02
> **Status**: Planning Phase — Before K8s Execution
> **Owner**: DevOps / Administrator

---

## 🎯 Task Overview

**Goal**: Move all production secrets from `.env` into Kubernetes, enabling:
- ✅ Secure, encrypted secret storage in K8s
- ✅ Automated deployment via CI/CD with secret injection
- ✅ Secret rotation without re-deploying code
- ✅ Audit trail for who accessed what secrets when

**Blocker Status**: ⚠️ **BLOCKING production deployment** — must complete before going live

---

## 📋 What Secrets Need to be Managed?

### 1️⃣ **JWT Authentication Keys** (RS256)
**What**: RSA key pair for signing and verifying JWT access tokens
**Scope**: Both `apps/landing` and `apps/web` send JWTs to the API
**Storage**: Currently in `.env` (development), needs to move to K8s Secret

**Keys**:
- `JWT_PRIVATE_KEY_PEM` — Private key (keep secret, only in K8s)
- `JWT_PUBLIC_KEY_PEM` — Public key (can be in code or K8s)

**Format**:
```
-----BEGIN RSA PRIVATE KEY-----
[multiline base64 content]
-----END RSA PRIVATE KEY-----
```

**Size**: ~1700 bytes each

**Source**:
- [ ] Check if you have existing keys (maybe from previous deployment?)
- [ ] If not, generate new: `openssl genrsa -out private.pem 2048`

---

### 2️⃣ **Stripe API Credentials**
**What**: Stripe integration for billing/payments
**Scope**: `services/api` only (backend handles Stripe webhooks)
**Links**: [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

**Keys**:
- `STRIPE_SECRET_KEY` — Secret API key (starts with `sk_live_` or `sk_test_`)
- `STRIPE_WEBHOOK_SECRET` — Webhook signing secret (starts with `whsec_`)

**Size**: ~50-100 bytes each

**Source**:
- [ ] Log into Stripe Dashboard
- [ ] API Keys section → copy "Secret key" (eye icon reveals it)
- [ ] Webhooks section → copy "Signing secret"

**⚠️ Security**: These are LIVE keys — only devs with Stripe access should copy

---

### 3️⃣ **MFA Encryption Key** (AES-128-GCM)
**What**: Encrypts TOTP secrets when storing user's MFA setup
**Scope**: `services/api` only
**Currently**: Hardcoded in `.env.example`, needs to move to K8s

**Keys**:
- `MFA_ENCRYPTION_KEY` — 16-byte hex string (32 characters)

**Format**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

**Size**: 32 hex characters = 16 bytes

**Source**:
- [ ] Generate new: `openssl rand -hex 16` OR `python3 -c "import secrets; print(secrets.token_hex(16))"`
- [ ] Must be exactly 32 characters (16 bytes hex)

---

### 4️⃣ **Database Credentials** (PostgreSQL)
**What**: Connection to production PostgreSQL database
**Scope**: `services/api` only
**Currently**: `docker-compose.yml` for dev, needs production URL in K8s

**Keys**:
- `DATABASE_URL` — JDBC connection string: `jdbc:postgresql://HOST:5432/zunftgewerk`
- `DATABASE_USERNAME` — DB user (e.g., `zunftgewerk_prod`)
- `DATABASE_PASSWORD` — Strong password for DB user

**Size**:
- URL: ~80 bytes
- Username: ~20 bytes
- Password: 20+ bytes (min recommended)

**Source**:
- [ ] Where is your prod PostgreSQL?
  - [ ] Self-hosted? (get host from your server)
  - [ ] Cloud-managed? (RDS, CloudSQL, Aiven, etc.)
  - [ ] Get connection details from your DB admin
- [ ] If password doesn't exist, generate strong one:
  ```bash
  python3 -c "import secrets; print(secrets.token_urlsafe(24))"
  ```
- [ ] Minimum 20 characters, mixed case, numbers, symbols
- [ ] Cannot contain: quotes, backslashes, newlines

---

### 5️⃣ **Redis Configuration**
**What**: Cache/session store, rate limiting
**Scope**: `services/api` only
**Currently**: `docker-compose.yml` for dev, needs production URL in K8s

**Keys**:
- `REDIS_HOST` — Redis server hostname/IP
- `REDIS_PORT` — Port (default: 6379)
- `REDIS_PASSWORD` — Optional, only if Redis has auth enabled

**Size**:
- HOST: varies (IP or hostname)
- PORT: fixed (5 chars)
- PASSWORD: if needed, min 16 chars

**Source**:
- [ ] Where is your prod Redis?
  - [ ] Self-hosted? (get host from your server)
  - [ ] Cloud-managed? (Upstash, Redis Cloud, AWS ElastiCache, etc.)
  - [ ] Get connection details from Redis admin
- [ ] Test connectivity: `redis-cli -h HOST -p 6379 ping` (should return `PONG`)

---

### 6️⃣ **OpenRouteService API Key** (Optional)
**What**: Address autocomplete for address fields
**Scope**: `apps/landing` only (proxied through `/api/address/autocomplete`)
**Currently**: Optional in `.env`, can be left empty in K8s

**Keys**:
- `OPENROUTESERVICE_API_KEY` — Optional, starts with `or_`

**Source**:
- [ ] Only needed if you're using address autocomplete
- [ ] From [OpenRouteService Dashboard](https://openrouteservice.org/)

---

## 🏗️ Infrastructure Prerequisites

### ✅ Do You Have These?

| Component | Status | Notes |
|-----------|--------|-------|
| **Kubernetes Cluster** | Need to determine | GKE, EKS, AKS, or self-hosted? |
| **kubectl** | Need to verify | `which kubectl` |
| **kubeconfig** | Need to get | ~/.kube/config with cluster access |
| **PostgreSQL (prod)** | Need to determine | Where will DB live? |
| **Redis (prod)** | Need to determine | Where will cache live? |
| **Stripe Account** | Probably yes | Do you have production Stripe? |
| **GitHub Actions** | Yes | Already in repo |

---

## 📊 Secrets Inventory Checklist

Print or copy this, fill in as you gather info:

```
🔐 PRODUCTION SECRETS INVENTORY
Created: [TODAY'S DATE]
Status: [ ] Complete [ ] In Progress [ ] Blocked

1️⃣  JWT Keys
  [ ] Private Key (1700 bytes, PEM format)
      Source: _________________________________
      Generated: [ ] Yes [ ] Existing
  [ ] Public Key (450 bytes, PEM format)
      Source: _________________________________

2️⃣  Stripe Credentials
  [ ] Secret Key (sk_live_...)
      Source: Stripe Dashboard → API Keys
      Env: [ ] Production [ ] Sandbox
  [ ] Webhook Secret (whsec_...)
      Source: Stripe Dashboard → Webhooks

3️⃣  MFA Encryption
  [ ] AES-128 Key (32 hex chars)
      Source: openssl rand -hex 16
      Value Length: [ ] 32 chars ✓

4️⃣  Database
  [ ] Host: _________________________________
      Type: [ ] PostgreSQL 12+ [ ] PostgreSQL 16+
      Cloud: [ ] Self-hosted [ ] RDS [ ] CloudSQL [ ] Other
  [ ] Username: _________________________________
  [ ] Password: _________________________________
      Min 20 chars: [ ] Yes
      Special chars: [ ] Yes

5️⃣  Redis
  [ ] Host: _________________________________
      Type: [ ] Self-hosted [ ] Redis Cloud [ ] Upstash [ ] Other
  [ ] Port: _________ (default: 6379)
  [ ] Password (if needed): _________________________________
  [ ] Connectivity test: [ ] PONG received

6️⃣  OpenRouteService (Optional)
  [ ] API Key: _________________________________ (or skip)

INFRASTRUCTURE:
  [ ] K8s Cluster Name: _________________________________
  [ ] Cluster Type: [ ] GKE [ ] EKS [ ] AKS [ ] Self-hosted
  [ ] Region/Zone: _________________________________
  [ ] kubectl access: [ ] Configured [ ] Ready to configure
```

---

## 🔄 Workflow: From Planning to Execution

### Phase 1: Planning ✓ (You are here)
- [x] Read this guide
- [ ] Inventory all secrets
- [ ] Determine infrastructure
- [ ] Create action items

### Phase 2: Preparation (Before K8s)
1. Gather all secret values
2. Generate missing values (JWT, MFA key)
3. Test DB/Redis connectivity
4. Prepare temporary secure file
5. ✅ Document everything

### Phase 3: K8s Setup (With K8s Access)
1. Configure kubectl access
2. Create zunftgewerk namespace
3. Create K8s Secret object
4. Update deployment manifests
5. ✅ Verify secrets are mounted

### Phase 4: CI/CD Integration
1. Encode kubeconfig as base64
2. Set GitHub Secret: `KUBECONFIG_B64`
3. Test CI deploy job
4. Monitor pod startup
5. ✅ Verify no errors in logs

### Phase 5: Verification
1. Health checks (API `/actuator/health`)
2. Test web app login flow
3. Monitor resource usage
4. Verify no secrets in logs
5. ✅ Document audit trail

### Phase 6: Cleanup
1. Delete temporary secrets file
2. Create SECRETS.md documentation
3. Commit deployment manifests
4. Setup secret rotation schedule
5. ✅ Done!

---

## 🚨 Security Best Practices

### ❌ NEVER DO THIS:
```bash
❌ git add /tmp/k8s-secrets.env && git commit
❌ echo "PASSWORD=secret123" in shell history
❌ Share secrets in Slack, email, or screenshots
❌ Store secrets in Docker images
❌ Log secrets to stdout
❌ Include secrets in git diffs
```

### ✅ DO THIS INSTEAD:
```bash
✅ Keep secrets in /tmp/ (RAM disk, ephemeral)
✅ Use `source /tmp/secrets.env` in enclosed scripts
✅ Delete secrets file after use: shred -vfz /tmp/secrets.env
✅ Only share via 1password, Vault, or encrypted channels
✅ Rotate secrets every 90 days
✅ Maintain audit log of who accessed what when
✅ Use K8s RBAC to restrict secret access
```

---

## 🎯 Next Steps (In Order)

### 1. Fill out the inventory checklist above
Point to actual sources where you found each value:
- JWT keys: existing or generate?
- Stripe: which dashboard?
- DB: which cloud provider?
- Redis: self-hosted or managed?
- Cluster: which K8s?

### 2. Document the infrastructure
**Create a simple diagram** (can be text):
```
[Frontend Apps: landing, web]
         ↓ (HTTPS)
[API Server (K8s Pod)]
         ↓ (internal)
[PostgreSQL Server]
[Redis Cache]
```

### 3. Test connectivity (if possible)
- Can you reach the DB from your machine?
- Can you reach Redis from your machine?
- Do you have kubectl configured?

### 4. Create a deployment plan
- Timeline: When can K8s access be arranged?
- Owner: Who will execute Steps 2-6?
- Approval: Who needs to sign off?
- Rollback: What if something breaks?

### 5. Read the full checklist
Once you have answers to all of the above, read:
- `docs/task-2-k8s-secrets-checklist.md` (700+ lines)
- `docs/task-2-quick-reference.md` (200+ lines)

---

## 📞 Blockers & Questions

**What to clarify with your team**:

1. **K8s Infrastructure**
   - Do we have a production K8s cluster?
   - Who manages it? (DevOps, cloud provider, managed service?)
   - What cloud? (GCP, AWS, Azure, self-hosted?)

2. **Database**
   - Is PostgreSQL already provisioned?
   - Who has the password?
   - Can the K8s cluster reach it?

3. **Redis**
   - Do we have a production Redis instance?
   - Is it managed or self-hosted?
   - Does it have authentication?

4. **Secrets Rotation**
   - Who will rotate secrets every 90 days?
   - How will we track rotation history?
   - Emergency access procedure?

5. **Deployment Authority**
   - Who can deploy to production?
   - What's the approval process?
   - How do we roll back if needed?

---

## 🏁 Planning Checklist

When you're ready to proceed to Step 2-6 (actual K8s execution), ensure:

- [ ] All 6 secret types identified or generated
- [ ] All infrastructure components located
- [ ] K8s cluster access arranged
- [ ] Team knows the plan
- [ ] Someone assigned to run the steps
- [ ] Backup/rollback plan documented
- [ ] Secret rotation schedule decided

**When all ✓, you're ready for:**
→ `docs/task-2-k8s-secrets-checklist.md` (Execution)

---

## 💾 Generated Files This Planning Phase

After you complete Phase 2 (Preparation), generate:

1. **`infra/k8s/secrets-template.yaml`** — K8s Secret manifest (already exists, updated)
2. **`infra/k8s/SECRETS.md`** — Secret rotation procedures (create in Phase 6)
3. **`/tmp/k8s-secrets.env`** — Temporary secrets file (create, use, delete in Phase 3-4)

---

## 📖 Reference Links

- K8s Secrets: https://kubernetes.io/docs/concepts/configuration/secret/
- Stripe API Keys: https://dashboard.stripe.com/apikeys
- OpenRouteService: https://openrouteservice.org/
- JWT Best Practices: https://tools.ietf.org/html/rfc8725
- PostgreSQL JDBC: https://jdbc.postgresql.org/

---

## 🎓 Summary

**You now understand**:
1. ✅ What 6 types of secrets are needed
2. ✅ Where each secret comes from
3. ✅ How secrets flow from code → K8s → pods
4. ✅ Security best practices
5. ✅ What infrastructure you need
6. ✅ What the next steps are

**Next action**:
→ Use inventory checklist to gather all secret values
→ Determine K8s infrastructure
→ Come back with answers to proceed to execution

---

**Questions?** Review sections 1-6 above, or contact your DevOps lead.
