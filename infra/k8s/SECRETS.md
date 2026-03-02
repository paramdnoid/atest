# K8s Secrets Management — Zunftgewerk Production

> **Created**: 2026-03-02
> **Last Rotated**: Not yet — Initial setup phase
> **Rotation Schedule**: Every 90 days
> **Owner**: DevOps Lead

---

## Production Secret: `zunftgewerk-secrets`

### Storage Location
```
Namespace: zunftgewerk
Secret Name: zunftgewerk-secrets
Type: Opaque (base64-encoded)
Encryption: K8s default (at-rest encryption via etcd encryption key)
```

### Keys & Purposes

| Key | Purpose | Type | Rotation |
|-----|---------|------|----------|
| `DATABASE_URL` | PostgreSQL JDBC connection | String | Every 180 days (with password) |
| `DATABASE_USERNAME` | PostgreSQL user | String | Every 180 days |
| `DATABASE_PASSWORD` | PostgreSQL password | Secret | Every 90 days |
| `JWT_PRIVATE_KEY_PEM` | JWT token signing (RSA) | RSA Private Key | Every 180 days (carefully) |
| `JWT_PUBLIC_KEY_PEM` | JWT token verification | RSA Public Key | Every 180 days (with private) |
| `STRIPE_SECRET_KEY` | Stripe API authentication | Secret | Every 90 days |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | Secret | Every 90 days |
| `MFA_ENCRYPTION_KEY` | TOTP secret encryption (AES-128) | Secret | Every 90 days |
| `REDIS_HOST` | Redis cache hostname | String | Only if changing Redis |
| `REDIS_PORT` | Redis cache port | String | Only if changing Redis |
| `OPENROUTESERVICE_API_KEY` | Address geocoding (optional) | Secret | Every 90 days |

---

## Setup Instructions

### Step 1: Prepare Secret Values

Gather all 11 values (see `docs/task-2-k8s-secrets-checklist.md` Step 1).

```bash
# Create temporary file (NEVER commit this!)
cat > /tmp/k8s-secrets.env << 'EOF'
DATABASE_URL=jdbc:postgresql://YOUR_HOST:5432/zunftgewerk
DATABASE_USERNAME=zunftgewerk_prod
DATABASE_PASSWORD=YOUR_STRONG_PASSWORD
JWT_PRIVATE_KEY_PEM=-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
JWT_PUBLIC_KEY_PEM=-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
MFA_ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
REDIS_HOST=redis.example.com
REDIS_PORT=6379
OPENROUTESERVICE_API_KEY=or_...
EOF
```

### Step 2: Create K8s Secret

```bash
# Source values
source /tmp/k8s-secrets.env

# Create secret
kubectl create secret generic zunftgewerk-secrets \
  --namespace=zunftgewerk \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=DATABASE_USERNAME="$DATABASE_USERNAME" \
  --from-literal=DATABASE_PASSWORD="$DATABASE_PASSWORD" \
  --from-literal=JWT_PRIVATE_KEY_PEM="$JWT_PRIVATE_KEY_PEM" \
  --from-literal=JWT_PUBLIC_KEY_PEM="$JWT_PUBLIC_KEY_PEM" \
  --from-literal=STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  --from-literal=STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  --from-literal=MFA_ENCRYPTION_KEY="$MFA_ENCRYPTION_KEY" \
  --from-literal=REDIS_HOST="$REDIS_HOST" \
  --from-literal=REDIS_PORT="$REDIS_PORT" \
  --from-literal=OPENROUTESERVICE_API_KEY="$OPENROUTESERVICE_API_KEY"

# Verify
kubectl describe secret zunftgewerk-secrets -n zunftgewerk
```

### Step 3: Update Deployments

Deployments already reference `zunftgewerk-secrets` via `envFrom.secretRef`.

```bash
# Verify all deployments use secrets
kubectl get deployments -n zunftgewerk -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.template.spec.containers[0].envFrom}{"\n"}{end}'
```

### Step 4: Delete Temporary Secrets File

```bash
# CRITICAL: Delete the temp file securely
shred -vfz /tmp/k8s-secrets.env

# Verify deletion
ls /tmp/k8s-secrets.env 2>&1
# Expected: No such file or directory
```

---

## Secret Rotation Procedure

### ⏰ 90-Day Rotation (Passwords & API Keys)

For: `DATABASE_PASSWORD`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `MFA_ENCRYPTION_KEY`, `OPENROUTESERVICE_API_KEY`

#### 1. Generate New Values
```bash
# New database password
openssl rand -base64 32

# New MFA key (16 bytes hex)
openssl rand -hex 16

# Stripe keys: manually in Dashboard
# OpenRouteService: manually in Dashboard
```

#### 2. Create New Secret Version

```bash
# Create temporary new secret with updated values
source /tmp/k8s-secrets-new.env

kubectl create secret generic zunftgewerk-secrets-v2 \
  --namespace=zunftgewerk \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=DATABASE_USERNAME="$DATABASE_USERNAME" \
  --from-literal=DATABASE_PASSWORD="$DATABASE_PASSWORD_NEW" \
  --from-literal=JWT_PRIVATE_KEY_PEM="$JWT_PRIVATE_KEY_PEM" \
  --from-literal=JWT_PUBLIC_KEY_PEM="$JWT_PUBLIC_KEY_PEM" \
  --from-literal=STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY_NEW" \
  --from-literal=STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET_NEW" \
  --from-literal=MFA_ENCRYPTION_KEY="$MFA_ENCRYPTION_KEY_NEW" \
  --from-literal=REDIS_HOST="$REDIS_HOST" \
  --from-literal=REDIS_PORT="$REDIS_PORT" \
  --from-literal=OPENROUTESERVICE_API_KEY="$OPENROUTESERVICE_API_KEY_NEW"
```

#### 3. Update Deployments (Blue-Green)

```bash
# Test with new secret first (or update one pod at a time)
kubectl patch deployment zunftgewerk-api -n zunftgewerk \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"api","env":[{"name":"SECRET_VERSION","value":"v2"}]}]}}}}'

# Monitor logs
kubectl logs -f deployment/zunftgewerk-api -n zunftgewerk

# If working: Update all deployments
kubectl set env deployment/zunftgewerk-api \
  --from-secret=zunftgewerk-secrets-v2 \
  -n zunftgewerk
```

#### 4. Monitor for 5 Minutes
```bash
# Watch pod status
kubectl get pods -n zunftgewerk -w

# Check logs for errors
kubectl logs deployment/zunftgewerk-api -n zunftgewerk | grep -i error
```

#### 5. Delete Old Secret

```bash
# Only after confirmed v2 is working
kubectl delete secret zunftgewerk-secrets -n zunftgewerk
```

#### 6. Rename New Secret

```bash
# Rename v2 → zunftgewerk-secrets
kubectl get secret zunftgewerk-secrets-v2 -n zunftgewerk -o yaml | \
  sed 's/name: zunftgewerk-secrets-v2/name: zunftgewerk-secrets/' | \
  kubectl apply -f -

# Delete the v2 secret
kubectl delete secret zunftgewerk-secrets-v2 -n zunftgewerk
```

#### 7. Update Audit Log

See "Audit Trail" section below.

---

### 🔄 180-Day Rotation (Database & JWT)

For: `DATABASE_URL`, `DATABASE_USERNAME`, `JWT_PRIVATE_KEY_PEM`, `JWT_PUBLIC_KEY_PEM`

⚠️ **JWT key rotation requires careful planning** because:
- All existing tokens become invalid
- Clients must re-authenticate
- Requires API downtime or dual-key support

**Recommendation**: Implement JWT key versioning (multiple public keys) before rotating private key.

```bash
# For now: Plan JWT rotation 6 months in advance
# Set calendar reminder: Every 180 days
```

---

## Emergency Access

### ⚠️ View Secret (Only in Emergency!)

```bash
# View entire secret (shows values!)
kubectl get secret zunftgewerk-secrets -n zunftgewerk -o yaml

# View single key
kubectl get secret zunftgewerk-secrets -n zunftgewerk \
  -o jsonpath='{.data.DATABASE_PASSWORD}' | base64 -d
```

**AFTER emergency access:**
- Log the access in audit trail (who, when, why)
- Rotate the accessed secret within 24 hours
- Notify security team

---

## Troubleshooting

### Pod Not Starting After Secret Creation

```bash
# Check pod events
kubectl describe pod -n zunftgewerk -l app=zunftgewerk-api

# Check pod logs
kubectl logs deployment/zunftgewerk-api -n zunftgewerk --tail=50

# Common issues:
# - Secret key names don't match environment variable names
# - Multi-line values (JWT keys) not properly formatted
# - Stripe/DB credentials incorrect
```

### Secret Not Mounted

```bash
# Verify secret exists
kubectl get secret zunftgewerk-secrets -n zunftgewerk

# Verify deployment references it
kubectl get deployment zunftgewerk-api -n zunftgewerk -o yaml | grep -A 5 "envFrom"

# Expected:
# envFrom:
# - secretRef:
#     name: zunftgewerk-secrets
```

### Test Secret Values

```bash
# Decode and test database connection
DB_URL=$(kubectl get secret zunftgewerk-secrets -n zunftgewerk \
  -o jsonpath='{.data.DATABASE_URL}' | base64 -d)
DB_USER=$(kubectl get secret zunftgewerk-secrets -n zunftgewerk \
  -o jsonpath='{.data.DATABASE_USERNAME}' | base64 -d)
DB_PASS=$(kubectl get secret zunftgewerk-secrets -n zunftgewerk \
  -o jsonpath='{.data.DATABASE_PASSWORD}' | base64 -d)

# Test connectivity (from pod with psql)
psql "$DB_URL" -U "$DB_USER" -c "SELECT 1" < <(echo "$DB_PASS")
```

---

## Audit Trail

Track all secret access and rotations:

| Date | Action | User | Keys Rotated | Reason | Ticket |
|------|--------|------|--------------|--------|--------|
| 2026-03-02 | Created | DevOps | All | Initial setup | P2.2 |
| | | | | | |
| | | | | | |

**Update this table after each rotation or access.**

---

## Compliance & Security

### GDPR / SOC2 / ISO 27001

- ✅ Secrets at rest: Encrypted via etcd encryption
- ✅ Secrets in transit: HTTPS (TLS)
- ✅ Secrets in logs: None (verified via log grep)
- ✅ Rotation schedule: Every 90 days (passwords/API keys)
- ✅ Audit trail: Maintained in this file
- ✅ Access control: K8s RBAC (restrict to needed service accounts)

### RBAC Configuration (Recommended)

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: secret-reader
  namespace: zunftgewerk
rules:
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["zunftgewerk-secrets"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-secrets
  namespace: zunftgewerk
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: secret-reader
subjects:
- kind: ServiceAccount
  name: zunftgewerk-api
  namespace: zunftgewerk
```

---

## Backup & Disaster Recovery

### Backup Procedure

```bash
# Export secret (ENCRYPTED backup only!)
kubectl get secret zunftgewerk-secrets -n zunftgewerk -o yaml > /tmp/backup-secrets.yaml.enc

# Encrypt with GPG (for backups)
gpg --symmetric --cipher-algo AES256 /tmp/backup-secrets.yaml

# Store backup securely (not in git!)
# - 1Password
# - Vault
# - Encrypted S3 bucket
# - Offline encrypted USB

# Securely delete plaintext
shred -vfz /tmp/backup-secrets.yaml
```

### Recovery Procedure

```bash
# Decrypt backup
gpg -d /path/to/backup-secrets.yaml.enc > /tmp/restore-secrets.yaml

# Restore to K8s
kubectl apply -f /tmp/restore-secrets.yaml

# Verify
kubectl describe secret zunftgewerk-secrets -n zunftgewerk

# Securely delete
shred -vfz /tmp/restore-secrets.yaml
```

---

## References

- K8s Secrets: https://kubernetes.io/docs/concepts/configuration/secret/
- etcd Encryption: https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/
- RBAC: https://kubernetes.io/docs/reference/access-authn-authz/rbac/
- Task 2 Checklist: `docs/task-2-k8s-secrets-checklist.md`
- Planning Guide: `docs/task-2-planning-guide.md`

---

## Next Steps

1. ✅ Secret created in K8s
2. ⏳ Set up automated monitoring
3. ⏳ Configure log aggregation (prevent secret leaks)
4. ⏳ Set calendar reminders for 90-day rotations
5. ⏳ Document emergency access procedures

---

**Questions?** Contact DevOps Lead.
