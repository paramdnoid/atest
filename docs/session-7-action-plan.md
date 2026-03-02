# Session 7 Action Plan — Remaining Tasks
> **Created**: 2026-03-02
> **Status**: Ready for implementation
> **Estimated Duration**: 2–3 hours total
> **Resource**: 1 person (QA + DevOps)

---

## Overview

Session 6 completed all code-level tasks. Session 7 consists of **3 operational tasks** required before production deployment:

| Task | Type | Duration | Blocker? | Owner |
|---|---|---|---|---|
| P1.2: Activate `mfaEnforcementAdmin` | QA Testing | ~30min | No | QA/Dev |
| P2.2: Setup K8s Secrets | DevOps | ~1h | **Yes** (blocks deploy) | DevOps/Admin |
| P4.1: Mobile iOS Acceptance | QA Testing | ~2h (optional) | No | Mobile QA |

---

## TASK 1: Activate `mfaEnforcementAdmin` Flag (P1.2)

**Purpose**: Enable mandatory MFA enforcement for admin/owner roles in production.

**Estimated Time**: 30 minutes
**Prerequisites**: Local dev environment running, test admin account available

### Step 1.1: Verify Current State

```bash
# Check current flag value
cd /Users/andre/Projects/atest
grep -n "mfaEnforcementAdmin" services/api/src/main/resources/application.yml
# Expected: mfaEnforcementAdmin: false (or not present, defaults to false)
```

**Validation Criteria**:
- ✓ Flag currently `false` or absent
- ✓ Flag is documented in `application.yml`

---

### Step 1.2: Start Dev Environment

```bash
# Terminal 1: Backend API
cd services/api
gradle bootRun
# Expected output: "Started ZunftgewerkApplication in X seconds"
# API should be available at http://localhost:8080/actuator/health

# Terminal 2: Landing App (authenticated dashboard)
cd apps/landing
pnpm dev
# Expected: http://localhost:3000

# Terminal 3 (optional): Infrastructure
docker compose -f infra/docker-compose.yml up -d
# Postgres + Redis running (needed for API)
```

**Validation Criteria**:
- ✓ API health check returns `{"status":"UP"}`
- ✓ Landing app accessible at `http://localhost:3000`
- ✓ Can access `/dashboard` (authenticated route)

---

### Step 1.3: Obtain/Create Admin Test User

**Option A**: Use existing admin from seed script
```bash
# If running e2e, admin user already exists:
# Email: andrzimmermann@gmx.de
# Password: YourSecurePassword123!
# TOTP Secret: (from e2e-seed-web-user.sh script)
```

**Option B**: Create new admin via API (if needed)
```bash
curl -X POST http://localhost:8080/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin-test@zunftgewerk.local",
    "password": "AdminTest123!",
    "tenantName": "Test Org"
  }'
# Response: { "userId": "...", "state": "AUTHENTICATED", "accessToken": "..." }
```

Then promote to owner:
```bash
# Login to Postgres
psql -h localhost -U zunftgewerk -d zunftgewerk
# Then:
UPDATE memberships SET role = 'owner'
WHERE user_id = (SELECT id FROM users WHERE email = 'admin-test@zunftgewerk.local');
```

**Validation Criteria**:
- ✓ Admin test user exists
- ✓ User has `owner` or `admin` role in database
- ✓ Can login at http://localhost:3000/login

---

### Step 1.4: Test Current Behavior (Flag = false)

**Scenario**: Login as admin with MFA disabled

```bash
# 1. Navigate to http://localhost:3000/login
# 2. Enter admin credentials
# 3. Expected: Direct login to dashboard (NO MFA prompt)
# 4. Go to /dashboard/settings → MFA Management
# 5. Expected: MFA shows as "Disabled"
```

**Validation Criteria**:
- ✓ Admin logins WITHOUT MFA requirement (current state)
- ✓ Dashboard accessible immediately after login
- ✓ MFA section shows "Disabled" status

---

### Step 1.5: Activate MFA for Test Admin

```bash
# In /dashboard/settings:
# 1. Click "Enable MFA"
# 2. Scan QR code with authenticator (Google Authenticator, Authy, etc.)
# 3. Enter 6-digit code to verify
# 4. Copy backup codes to safe location
# 5. Click "Done"
# Expected: Toast "MFA wurde erfolgreich aktiviert."
```

**Validation Criteria**:
- ✓ MFA setup dialog appears and completes
- ✓ Success toast displays
- ✓ Settings page shows MFA as "Enabled"
- ✓ Backup codes saved locally

---

### Step 1.6: Test MFA Enforcement (Still with Flag = false)

```bash
# 1. Logout from dashboard
# 2. Login again as same admin
# 3. Current behavior (flag=false):
#    - No MFA prompt during login
#    - Directly lands on dashboard (MFA not enforced)
# This is the CURRENT behavior we're testing
```

**Validation Criteria**:
- ✓ MFA is NOT enforced on login (this is the current behavior)
- ✓ Can login and access dashboard without MFA code

---

### Step 1.7: Activate `mfaEnforcementAdmin` Flag

Edit `services/api/src/main/resources/application.yml`:

```yaml
# Find this section (around line 60-70):
zunftgewerk:
  features:
    stripeBilling: true
    passkeyAuth: true
    mfaEnforcementAdmin: false  # ← CHANGE THIS

# Change to:
zunftgewerk:
  features:
    stripeBilling: true
    passkeyAuth: true
    mfaEnforcementAdmin: true   # ← NOW TRUE
```

**Validation Criteria**:
- ✓ File saved successfully
- ✓ YAML syntax is valid (check with `yamllint` or IDE)

---

### Step 1.8: Rebuild API with New Flag

```bash
cd services/api
gradle bootRun
# Watch for restart message
# Expected: "Started ZunftgewerkApplication in X seconds"
# NEW behavior: mfaEnforcementAdmin loaded as TRUE
```

**Validation Criteria**:
- ✓ API restarts without errors
- ✓ No compilation errors in logs
- ✓ Health check still returns `{"status":"UP"}`

---

### Step 1.9: Test MFA Enforcement (Flag = true)

```bash
# 1. Logout from dashboard
# 2. Login again as admin with MFA enabled
# 3. NEW behavior (flag=true):
#    - After credentials, redirected to MFA screen
#    - Must enter 6-digit TOTP code from authenticator
#    - Only after successful MFA: lands on dashboard
```

**Detailed Steps**:
```
a) http://localhost:3000/login
b) Enter email: admin@...
c) Enter password: ***
d) Click "Mit Passwort anmelden"
e) Expected: Redirect to MFA screen "MFA erforderlich"
f) Open authenticator app (Google Authenticator, Authy, etc.)
g) Enter 6-digit code
h) Click "MFA bestätigen"
i) Expected: Redirect to /dashboard with fresh session
```

**Validation Criteria**:
- ✓ MFA screen appears after credentials
- ✓ Invalid code rejected with error message
- ✓ Valid code accepted, dashboard loads
- ✓ Session persists on page reload

---

### Step 1.10: Test Non-Admin User (Should NOT enforce MFA)

```bash
# Create or use non-admin member account:
# 1. Create new user via signup (member role, not owner)
# 2. Login as this member user
# 3. Expected: Direct access to dashboard (NO MFA required)
#    - Only admins/owners should have MFA enforcement
```

**Validation Criteria**:
- ✓ Member users bypass MFA enforcement
- ✓ Only admin/owner roles are affected

---

### Step 1.11: Update `.env.example` Documentation

Edit `.env.example` at repo root:

```bash
# Find or add this section:
# --- FEATURE FLAGS ---
# Control runtime behavior for feature rollouts
FEATURE_STRIPE_BILLING=true
FEATURE_PASSKEY_AUTH=true
FEATURE_MFA_ENFORCEMENT_ADMIN=true  # ← ADD THIS LINE

# Comment explaining the flag:
# Set to true to require MFA for all admin/owner users on login.
# WARNING: Enables MFA enforcement. All admins must have MFA configured before enabling.
```

**Validation Criteria**:
- ✓ `.env.example` updated with new variable
- ✓ Comment explains the flag purpose and risk
- ✓ File syntax valid (can parse as shell)

---

### Step 1.12: Commit Changes

```bash
cd /Users/andre/Projects/atest

# Stage changes
git add services/api/src/main/resources/application.yml
git add .env.example

# Verify changes
git diff --cached

# Commit
git commit -m "Activate mfaEnforcementAdmin flag for production

- Enable mandatory MFA enforcement for admin/owner roles
- Update application.yml with mfaEnforcementAdmin: true
- Document flag in .env.example with usage notes
- Tested: Admin users now require MFA code on login
- Tested: Non-admin users bypass MFA enforcement

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

**Validation Criteria**:
- ✓ Commit created successfully
- ✓ Commit message is clear and references testing
- ✓ `git log` shows new commit on main branch

---

### Task 1 Summary

| Checkpoint | Status |
|---|---|
| Flag initially false | ✓ Verified |
| Dev environment running | ✓ Running |
| Admin test user ready | ✓ Created |
| MFA enabled on test admin | ✓ Enabled |
| Flag set to true in YAML | ✓ Changed |
| API restarted with new flag | ✓ Restarted |
| MFA enforced on admin login | ✓ Verified |
| Non-admin users bypass MFA | ✓ Verified |
| `.env.example` updated | ✓ Updated |
| Changes committed | ✓ Committed |

**Result**: P1.2 ✅ **COMPLETE**

---

## TASK 2: Setup K8s Secrets (P2.2)

**Purpose**: Populate production Kubernetes secrets required for deployment.

**Estimated Time**: 1 hour
**Prerequisites**:
- Access to production Kubernetes cluster
- `kubectl` installed and configured
- Git access to this repository

**⚠️ WARNING**: This blocks the deployment pipeline. Without secrets, the `deploy` job in CI will fail.

---

### Step 2.1: Collect Secret Values

Create a local file (DO NOT COMMIT) with all secret values. Use this template:

```bash
# File: /tmp/k8s-secrets.env (local only, never commit)
# Fill in ALL values below

# JWT Key Pair (RS256)
JWT_PRIVATE_KEY_PEM="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(your actual private key)
-----END RSA PRIVATE KEY-----"

JWT_PUBLIC_KEY_PEM="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...
(your actual public key)
-----END PUBLIC KEY-----"

# Stripe API Keys
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# MFA Encryption (AES-128-GCM, 16 bytes hex)
MFA_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"

# Database (if not using externally managed)
DATABASE_URL="jdbc:postgresql://postgres:5432/zunftgewerk"
DATABASE_USERNAME="zunftgewerk"
DATABASE_PASSWORD="your-secure-db-password"

# Redis (if not using externally managed)
REDIS_HOST="redis"
REDIS_PORT="6379"

# Optional: Address Geocoding
OPENROUTESERVICE_API_KEY="or_..."

# Auth Cookie Settings
AUTH_COOKIE_SAMESITE="Lax"  # or "None" for cross-domain

# Email (if using external SMTP)
MAIL_HOST="smtp.example.com"
MAIL_PORT="587"
MAIL_USERNAME="noreply@example.com"
MAIL_PASSWORD="app-password"
```

**Where to Get Values**:

| Secret | Source | Notes |
|---|---|---|
| `JWT_PRIVATE_KEY_PEM` | Backend config or generate new | Must match public key |
| `JWT_PUBLIC_KEY_PEM` | Backend config or generate new | Must match private key |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys | sk_live_* (production) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks | whsec_* token |
| `MFA_ENCRYPTION_KEY` | Generate: `openssl rand -hex 16` | 16 bytes, hex format |
| `DATABASE_URL` | Production Postgres instance | User needs full CRUD permissions |
| `DATABASE_USERNAME` | Production Postgres | Service account |
| `DATABASE_PASSWORD` | Production Postgres | Rotate regularly |
| `REDIS_HOST`, `REDIS_PORT` | Production Redis | If not using managed service |

**Validation Criteria**:
- ✓ All 10+ secrets have values (no `REPLACE_ME` remaining)
- ✓ Keys are correctly formatted (PEM files with proper headers)
- ✓ Passwords are strong (minimum 16 characters, mixed case+numbers+symbols)
- ✓ File is **NOT** committed to git

---

### Step 2.2: Create Kubernetes Secret

Verify kubectl is connected to production cluster:

```bash
# Check current context
kubectl config current-context
# Expected: your-prod-cluster name

# Check if zunftgewerk namespace exists
kubectl get namespace zunftgewerk
# If not, create it:
kubectl create namespace zunftgewerk
```

**Validation Criteria**:
- ✓ `kubectl` is authenticated to production cluster
- ✓ `zunftgewerk` namespace exists (or created)

---

### Step 2.3: Create Secret from Template

Option A: **Interactive (Recommended)**

```bash
# Source the values you collected
source /tmp/k8s-secrets.env

# Create the secret with all values
kubectl create secret generic zunftgewerk-secrets \
  --namespace=zunftgewerk \
  --from-literal=JWT_PRIVATE_KEY_PEM="$JWT_PRIVATE_KEY_PEM" \
  --from-literal=JWT_PUBLIC_KEY_PEM="$JWT_PUBLIC_KEY_PEM" \
  --from-literal=STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  --from-literal=STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  --from-literal=MFA_ENCRYPTION_KEY="$MFA_ENCRYPTION_KEY" \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=DATABASE_USERNAME="$DATABASE_USERNAME" \
  --from-literal=DATABASE_PASSWORD="$DATABASE_PASSWORD" \
  --from-literal=REDIS_HOST="$REDIS_HOST" \
  --from-literal=REDIS_PORT="$REDIS_PORT" \
  --from-literal=OPENROUTESERVICE_API_KEY="$OPENROUTESERVICE_API_KEY" \
  --from-literal=AUTH_COOKIE_SAMESITE="$AUTH_COOKIE_SAMESITE"

# Expected: secret/zunftgewerk-secrets created
```

Option B: **From YAML File**

```bash
# Edit infra/k8s/base/secrets-template.yaml with real values
# THEN apply (DO NOT commit with secrets):
kubectl apply -f infra/k8s/base/secrets-template.yaml
```

**⚠️ SECURITY WARNING**:
- Never commit secrets to git
- Use `.gitignore` to exclude: `/tmp/k8s-secrets.env`
- Rotate secrets regularly (every 90 days)
- Use external secret management (Vault, AWS Secrets Manager) for rotation

**Validation Criteria**:
- ✓ Secret created without errors
- ✓ No secrets visible in git history
- ✓ `kubectl get secrets -n zunftgewerk` shows `zunftgewerk-secrets`

---

### Step 2.4: Verify Secret Contents

```bash
# List all secrets in namespace
kubectl get secrets -n zunftgewerk
# Expected: zunftgewerk-secrets listed

# Verify structure (don't display values)
kubectl describe secret zunftgewerk-secrets -n zunftgewerk
# Expected: Shows all keys without values:
#   JWT_PRIVATE_KEY_PEM:          XXXX bytes
#   JWT_PUBLIC_KEY_PEM:           XXXX bytes
#   STRIPE_SECRET_KEY:            XXXX bytes
#   ... (etc)

# Test decode one key (CAREFUL - prints secret value!)
# kubectl get secret zunftgewerk-secrets -n zunftgewerk -o jsonpath='{.data.JWT_PUBLIC_KEY_PEM}' | base64 -d
```

**Validation Criteria**:
- ✓ All keys listed in secret description
- ✓ Key sizes match expected values (PEM keys are large)
- ✓ Secret is accessible by pods in namespace

---

### Step 2.5: Update Deployment Manifests

Verify that API deployment references the secrets. Check `infra/k8s/base/api-deployment.yaml`:

```yaml
# Should contain:
spec:
  template:
    spec:
      containers:
      - name: api
        image: ghcr.io/yourorg/api:latest
        ports:
        - containerPort: 8080
        envFrom:
        - secretRef:
            name: zunftgewerk-secrets  # ← MUST reference our secret
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod,kubernetes"
```

If not present, add it:

```bash
# Edit the deployment manifest
kubectl edit deployment api -n zunftgewerk

# Add the envFrom section under containers
```

**Validation Criteria**:
- ✓ Deployment manifest references `zunftgewerk-secrets`
- ✓ All environment variables are sourced from secret
- ✓ Manifest validates with `kubectl apply --dry-run=client`

---

### Step 2.6: Setup GitHub Secrets for CI

This allows the CI `deploy` job to authenticate with your cluster.

**Get Kubeconfig (Base64)**:

```bash
# On your local machine with kubectl access:
# Encode your kubeconfig file
cat ~/.kube/config | base64 -w 0
# Copy the output (long base64 string)
```

**Add to GitHub**:

```
1. Go to: https://github.com/your-org/atest
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: KUBECONFIG_B64
5. Value: (paste the base64 string from above)
6. Click "Add secret"
```

**Verify**:

```bash
# In GitHub Actions, the deploy job will:
# 1. Decode KUBECONFIG_B64
# 2. Write to ~/.kube/config
# 3. Use kubectl to deploy
```

**Validation Criteria**:
- ✓ Secret `KUBECONFIG_B64` exists in GitHub
- ✓ Value is valid base64 (can be decoded)
- ✓ Decoded value is valid kubeconfig YAML

---

### Step 2.7: Test Deployment Pipeline

Trigger a deployment to verify everything works:

```bash
# Option A: Push to main branch (triggers CI automatically)
git push origin main

# Option B: Manual trigger (if GitHub Actions allows)
# Go to: https://github.com/your-org/atest/actions
# Select workflow → "Run workflow" → Choose branch

# Watch the deploy job:
# 1. Should read KUBECONFIG_B64
# 2. Should apply Kubernetes manifests
# 3. Should set image hashes for all 3 deployments (api, landing, web)
# 4. Should wait for rollout
```

**Expected Output**:
```
deployment.apps/api patched
deployment.apps/landing patched
deployment.apps/web patched
Waiting for deployment "api" rollout to finish...
Waiting for deployment "landing" rollout to finish...
Waiting for deployment "web" rollout to finish...
deployment "api" successfully rolled out
deployment "landing" successfully rolled out
deployment "web" successfully rolled out
```

**Validation Criteria**:
- ✓ CI deploy job runs without errors
- ✓ All 3 deployments patched successfully
- ✓ Pods start and reach "Ready" state
- ✓ Services are accessible from ingress

---

### Step 2.8: Verify Production Deployment

```bash
# Check pod status
kubectl get pods -n zunftgewerk
# Expected: All pods running and ready

# Check services
kubectl get svc -n zunftgewerk
# Expected: api, landing, web services with external IPs/LBs

# Check ingress
kubectl get ingress -n zunftgewerk
# Expected: Ingress configured with your domains

# Test API connectivity
curl https://api.zunftgewerk.com/actuator/health
# Expected: { "status": "UP" }

# Test web app
curl https://app.zunftgewerk.com
# Expected: 200 OK with HTML content

# Test landing page
curl https://zunftgewerk.com
# Expected: 200 OK with landing page HTML
```

**Validation Criteria**:
- ✓ All pods are `Running` and `Ready`
- ✓ Services are healthy and load-balanced
- ✓ Ingress routes to correct services
- ✓ TLS certificates valid (check HTTPS)
- ✓ Health endpoints respond with `UP`

---

### Step 2.9: Monitor Deployment Health

```bash
# Watch pod logs for errors
kubectl logs -f -n zunftgewerk deployment/api --tail=100

# Check for any startup errors
kubectl describe pod -n zunftgewerk <pod-name>

# Monitor resource usage
kubectl top pods -n zunftgewerk

# Check events
kubectl get events -n zunftgewerk --sort-by='.lastTimestamp'
```

**Validation Criteria**:
- ✓ No ERROR or FATAL logs in API
- ✓ Startup sequence completes (see "Started ZunftgewerkApplication")
- ✓ Database migrations run successfully
- ✓ No OOM (Out Of Memory) events
- ✓ No ImagePullBackOff errors

---

### Step 2.10: Document Secret Management

Create `infra/k8s/SECRETS.md` for team reference:

```markdown
# Kubernetes Secrets Management

## Secrets in This Cluster

### `zunftgewerk-secrets`
Contains all environment variables for the API deployment.

**Created**: [date]
**Last Rotated**: [date]
**Rotation Schedule**: Every 90 days

**Keys**:
- JWT_PRIVATE_KEY_PEM (RSA private key)
- JWT_PUBLIC_KEY_PEM (RSA public key)
- STRIPE_SECRET_KEY (Stripe API)
- STRIPE_WEBHOOK_SECRET (Stripe Webhooks)
- MFA_ENCRYPTION_KEY (AES-128-GCM)
- DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD
- REDIS_HOST, REDIS_PORT
- OPENROUTESERVICE_API_KEY
- AUTH_COOKIE_SAMESITE

## Rotation Procedure

1. Generate new secret values (see `.env.example` for sources)
2. Create new secret version: `kubectl create secret generic zunftgewerk-secrets-v2 ...`
3. Update deployment to reference new secret
4. Monitor rollout and logs
5. Delete old secret after verification: `kubectl delete secret zunftgewerk-secrets-v1`
6. Document rotation date

## Emergency Access

For emergency secret access:
1. Contact DevOps lead
2. Use: `kubectl get secret zunftgewerk-secrets -o jsonpath='{.data.KEY_NAME}' | base64 -d`
3. Log all access in [audit log system]
```

**Validation Criteria**:
- ✓ Document created in `infra/k8s/SECRETS.md`
- ✓ Instructions are clear and complete
- ✓ Rotation schedule documented

---

### Task 2 Summary

| Checkpoint | Status |
|---|---|
| Secrets collected from all sources | ✓ Collected |
| Kubectl authenticated to prod cluster | ✓ Verified |
| zunftgewerk namespace exists | ✓ Created/Verified |
| K8s secret created with all values | ✓ Created |
| Secret structure verified | ✓ Verified |
| Deployment manifests updated | ✓ Updated |
| KUBECONFIG_B64 set in GitHub | ✓ Set |
| CI deploy job runs successfully | ✓ Tested |
| All pods healthy and running | ✓ Running |
| Services accessible via ingress | ✓ Accessible |
| Documentation created | ✓ Created |

**Result**: P2.2 ✅ **COMPLETE**

---

## TASK 3: Mobile iOS Acceptance Testing (P4.1 — Optional)

**Purpose**: Validate all 12 acceptance test cases on iOS Simulator or Device.

**Estimated Time**: ~2 hours
**Prerequisites**:
- Xcode installed (for iOS Simulator)
- Expo development environment running
- Test user account with MFA enabled
- Local backend API running

**Note**: This is **optional** for core product launch but required before iOS App Store submission.

---

### Step 3.1: Setup iOS Simulator

```bash
# Open Xcode and launch simulator
open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app

# Or via command line
xcrun simctl list devices
xcrun simctl boot "iPhone 17"  # Choose available device

# Verify simulator is running
xcrun simctl list devices | grep booted
```

**Validation Criteria**:
- ✓ Simulator boots and shows home screen
- ✓ Simulator is reachable at `localhost` (can access dev API)

---

### Step 3.2: Start Mobile App in Simulator

```bash
cd apps/mobile

# Start Expo dev server (connects to simulator)
pnpm dev

# Or explicitly for iOS:
pnpm exec expo start --ios --clear

# You should see:
# › Connected to Expo on iOS
# › Waiting for you to choose an iOS build...
# Press 'i' to open iOS Simulator
```

**Validation Criteria**:
- ✓ Metro bundler starts without errors
- ✓ App loads in simulator
- ✓ Splash screen appears

---

### Step 3.3: Verify API Connectivity

Before running tests, ensure the app can reach your local API:

```bash
# In mobile app:
# 1. Settings screen → Check "API URL" display
# 2. Expected: Shows http://localhost:8080 (or your config)
# 3. Try sync → should communicate with API
```

**Validation Criteria**:
- ✓ API URL matches your running backend
- ✓ Sync test succeeds (or shows specific error, not connection timeout)

---

### Step 3.4–3.15: Run 12 Acceptance Test Cases

Use this template for each test case. Record results in the table below.

#### Template for Each Test Case

```
TEST CASE: AUTH-01
Name: Unauthenticated cold start → login visible
Expected: Login screen appears on first launch

Steps:
1. Force-quit app (swipe up in simulator)
2. Relaunch from home screen
3. Observe initial screen

Result: [PASS / FAIL]
Notes: [Any observations]
```

---

### Test Cases 1–6: Authentication (AUTH-XX)

#### **AUTH-01: Unauthenticated Cold Start → Login Visible**
```
Steps:
1. Uninstall app (Simulator: Settings → App Management → Zunftgewerk → Remove)
2. Relaunch from App Store (or development bundle)
3. Observe: Should show login form immediately

Expected: Login screen with email + password fields visible
Result: [ ] PASS  [ ] FAIL
Notes:
```

#### **AUTH-02: Valid Credentials (MFA User) → MFA Route Visible**
```
Steps:
1. At login screen, enter:
   - Email: andrzimmermann@gmx.de
   - Password: YourSecurePassword123!
2. Tap "Mit Passwort anmelden"
3. Observe: Should redirect to MFA screen

Expected: Screen shows "MFA Code Input" with 6-digit code field
Result: [ ] PASS  [ ] FAIL
Notes:
```

#### **AUTH-03: Valid MFA Code → App Tabs Visible**
```
Steps:
1. From AUTH-02, open authenticator app
2. Get current 6-digit TOTP code
3. Paste code into MFA input field
4. Tap "MFA bestätigen"
5. Observe: Should navigate to app dashboard

Expected: Tab bar visible (Dashboard, Sync, Settings, etc.)
Result: [ ] PASS  [ ] FAIL
Notes:
```

#### **AUTH-04: Invalid Password → Error Message Shown**
```
Steps:
1. At login screen, enter:
   - Email: andrzimmermann@gmx.de
   - Password: WrongPassword123!
2. Tap "Mit Passwort anmelden"
3. Observe: Should show error

Expected: Red error message appears (e.g., "Ungültige Anmeldedaten")
Result: [ ] PASS  [ ] FAIL
Notes:
```

#### **AUTH-05: Invalid MFA Code → Error Message Shown**
```
Steps:
1. Complete AUTH-02 (arrive at MFA screen)
2. Enter incorrect code: "000000"
3. Tap "MFA bestätigen"
4. Observe: Should show error

Expected: Red error message appears (e.g., "MFA-Code ungültig")
Result: [ ] PASS  [ ] FAIL
Notes:
```

#### **AUTH-06 (Optional): Backup Code Fallback**
```
Steps:
1. At MFA screen, use backup code instead of TOTP
2. Enter: (one of the backup codes from setup)
3. Tap "MFA bestätigen"
4. Observe: Should accept backup code

Expected: Dashboard loads, indicates backup code was consumed
Result: [ ] PASS  [ ] FAIL
Notes:
```

---

### Test Cases 7–8: Dashboard (DASH-XX)

#### **DASH-01: Dashboard Workspace Details Loaded**
```
Steps:
1. Login successfully (complete AUTH-01 to AUTH-03)
2. Dashboard tab should be active/visible
3. Scroll to see workspace details

Expected:
- Workspace name displayed
- Plan name displayed
- Organization details visible
Result: [ ] PASS  [ ] FAIL
Notes:
```

#### **DASH-02: Plan Code Displayed**
```
Steps:
1. From DASH-01, look for plan information
2. Should show: "Free", "Starter", or "Professional"

Expected: Plan code/name visible in dashboard
Result: [ ] PASS  [ ] FAIL
Notes:
```

---

### Test Cases 9–10: Sync (SYNC-XX)

#### **SYNC-01: Sync Start → Loading → Success Message → Timestamp Persisted**
```
Steps:
1. Navigate to Sync tab
2. Tap "Start Sync" button
3. Observe: Loading indicator appears
4. Wait: Should show success message
5. Check: Timestamp should be saved

Expected:
- Loading spinner visible during sync
- Success toast message appears
- Timestamp updates (e.g., "Last sync: 14:32:15")
Result: [ ] PASS  [ ] FAIL
Notes:
```

---

### Test Cases 11–12: Settings (SET-XX)

#### **SET-01: Settings Shows Email and App Version**
```
Steps:
1. Navigate to Settings tab
2. Scroll through settings screen

Expected:
- Email address displayed: andrzimmermann@gmx.de
- App version visible (e.g., "v1.0.0")
Result: [ ] PASS  [ ] FAIL
Notes:
```

#### **SET-02: Logout Returns to Login**
```
Steps:
1. From SET-01, scroll to bottom
2. Tap "Logout" button
3. Confirm logout (if prompted)
4. Observe: Should return to login screen

Expected: Login form visible, all session data cleared
Result: [ ] PASS  [ ] FAIL
Notes:
```

---

### Step 3.16: Test Session Persistence (SESS-XX)

#### **SESS-01: Relaunch Restores Session via Refresh Cookie**
```
Steps:
1. Complete full login (AUTH-01 to AUTH-03)
2. Navigate to Dashboard tab
3. Force-quit app (swipe up)
4. Relaunch app
5. Observe: Should skip login screen

Expected: Dashboard loads immediately (session restored)
Result: [ ] PASS  [ ] FAIL
Notes:
```

---

### Step 3.17: Test Route Protection (GUARD-XX)

#### **GUARD-01: Unauthenticated Guard Redirects Protected App Routes**
```
Steps:
1. In code, bypass login (e.g., delete refresh token from SecureStore)
2. Try to access protected routes directly via deep linking
3. Example: zunftgewerk://app/sync or zunftgewerk://app/settings
4. Observe: Should redirect to login

Expected: Login screen appears (route guard working)
Result: [ ] PASS  [ ] FAIL
Notes:
```

---

### Step 3.18: Compile Results

Fill in the master results table:

| Case | Name | Pass? | Notes |
|---|---|---|---|
| AUTH-01 | Unauthenticated cold start → login visible | [ ] | |
| AUTH-02 | Valid credentials (MFA user) → MFA route visible | [ ] | |
| AUTH-03 | Valid MFA code → app tabs visible | [ ] | |
| AUTH-04 | Invalid password → error message shown | [ ] | |
| AUTH-05 | Invalid MFA code → error message shown | [ ] | |
| DASH-01 | Dashboard workspace details loaded | [ ] | |
| DASH-02 | Plan code displayed | [ ] | |
| SYNC-01 | Sync start → loading → success → timestamp persisted | [ ] | |
| SET-01 | Settings shows email and app version | [ ] | |
| SET-02 | Logout returns to login | [ ] | |
| SESS-01 | Relaunch restores session via refresh cookie | [ ] | |
| GUARD-01 | Unauthenticated guard redirects protected routes | [ ] | |

**Validation Criteria**:
- ✓ All 12 cases pass (or documented failures with root cause)
- ✓ No blocking issues (auth, network, rendering)

---

### Step 3.19: Document Results in Projektplan

Update `docs/projektplan.md` table:

```markdown
| Date | Platform | Device/OS | API URL | Test User | Cases Passed / Total | Result | Notes |
|---|---|---|---|---|---|---|---|
| 2026-03-02 | iOS | Simulator (iPhone 17) | http://localhost:8080 | andrzimmermann@gmx.de | 12/12 | ✅ PASS | All tests passed |
| 2026-03-02 | Android | — | — | — | 0/12 | ⏳ PENDING | Android SDK not available in this environment |
```

**Validation Criteria**:
- ✓ Results table updated with pass/fail counts
- ✓ Notes section explains any failures
- ✓ Document committed to git

---

### Task 3 Summary

| Checkpoint | Status |
|---|---|
| iOS Simulator booted and reachable | ✓ Running |
| Mobile app loads in simulator | ✓ Loaded |
| API connectivity verified | ✓ Connected |
| AUTH-01 to AUTH-05 tests run | ✓ Tested |
| DASH-01, DASH-02 tests run | ✓ Tested |
| SYNC-01 test run | ✓ Tested |
| SET-01, SET-02 tests run | ✓ Tested |
| SESS-01 test run | ✓ Tested |
| GUARD-01 test run | ✓ Tested |
| Results documented | ✓ Documented |
| Projektplan updated | ✓ Updated |

**Result**: P4.1 (iOS) ✅ **COMPLETE** (or documented with failures)

---

## Execution Summary

### Recommended Sequence

1. **Start with Task 1** (P1.2 — MFA Testing) — ~30 min, no blockers
   - Can be done while waiting for K8s setup
   - Validates MFA enforcement works as intended

2. **Parallel: Task 2 Part A** (P2.2 — Secrets Collection) — ~20 min
   - Gather all secret values from sources
   - Create local `/tmp/k8s-secrets.env`

3. **Task 2 Part B** (P2.2 — K8s Deployment) — ~40 min
   - Create secrets in production cluster
   - Update GitHub secrets
   - Trigger deployment pipeline

4. **Task 3** (P4.1 — Mobile Testing) — ~2h, optional
   - Can be done in parallel with Task 2
   - Lower priority for launch
   - Document results for App Store submission

### Total Time

```
Required (P1.2 + P2.2): 1.5 hours
Optional (P4.1 iOS):    2 hours
---
Total:                  3.5 hours (if doing all)
```

### Risk Mitigation

| Risk | Mitigation |
|---|---|
| Secrets exposed in git | Use `.gitignore`, `git-secrets` pre-commit hook, review all diffs |
| Deployment fails | Test with `--dry-run`, check logs, have rollback plan |
| MFA breaks logins | Keep backup codes, have MFA disable procedure |
| iOS tests fail | Document failures, prioritize critical flows (AUTH, DASH) |

---

## Final Checklist

- [ ] Task 1 (P1.2): MFA enforcement active, tested, committed
- [ ] Task 2 (P2.2): K8s secrets created, deployment successful, monitoring active
- [ ] Task 3 (P4.1): iOS tests completed and documented (optional)
- [ ] All changes committed with clear commit messages
- [ ] `docs/projektplan.md` updated with completion dates
- [ ] Team notified of completion and status
- [ ] Production deployment verified healthy

---

**Session 7 Status**: Ready for execution
**Expected Completion**: ~1–3.5 hours depending on parallel work and optional iOS testing

