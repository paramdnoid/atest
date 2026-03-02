# Task 2: K8s Secrets Setup — Complete Implementation

> **Status**: ✅ Fully Configured & Ready for Execution
> **Created**: 2026-03-02
> **Estimated Time**: 1-2 hours (with K8s cluster access)
> **Blocker**: MUST complete before production deployment

---

## 📋 What's Been Done

### ✅ Infrastructure Files Created/Updated

1. **`infra/k8s/base/secrets-template.yaml`** — Template for K8s Secret
   - All 11 keys documented with descriptions
   - Placeholder values for safe distribution
   - Ready to be filled with actual values

2. **`infra/k8s/base/api-deployment.yaml`** — Updated API Deployment
   - Now uses `envFrom.secretRef` to inject all secrets as environment variables
   - Cleaner than individual `valueFrom` references
   - Automatically picks up all secret keys

3. **`infra/k8s/SECRETS.md`** — Complete Secrets Management Guide
   - Setup instructions (Step 1-4)
   - 90-day rotation procedure for passwords/API keys
   - 180-day rotation procedure for JWT/DB
   - Emergency access procedures
   - Audit trail template
   - Backup & disaster recovery
   - RBAC configuration examples
   - Troubleshooting section

4. **`infra/k8s/deploy-secrets.sh`** — Automated Deployment Script
   - Pre-flight checks (kubectl, cluster, namespace)
   - Validates all required secret keys
   - Creates K8s Secret safely
   - Applies manifests
   - Waits for rollout
   - Verifies pods are running
   - Securely deletes temporary secrets file

### ✅ Documentation Created

5. **`docs/task-2-planning-guide.md`** — Strategic Planning Guide
   - 6 secret types explained with sources
   - Infrastructure prerequisites
   - Secrets inventory checklist
   - Security best practices

6. **`docs/task-2-decision-tree.md`** — Navigation Tree
   - PATH A: K8s ready now (6 hours)
   - PATH B: K8s ready in 1-2 weeks (phased approach)
   - PATH C: K8s undecided (strategic planning)

### ✅ Existing CI/CD Setup

7. **`.github/workflows/ci.yml`** — Already Has Deploy Job
   - Uses `KUBECONFIG_B64` secret for kubectl access
   - Applies manifests automatically on main branch push
   - Performs blue-green deployment
   - Waits for rollout completion

---

## 🚀 How to Use This

### Quick Start (1 hour, requires K8s access)

```bash
# 1. Gather all secret values (see below)
# 2. Create temporary secrets file
cat > /tmp/k8s-secrets.env << 'EOF'
DATABASE_URL=jdbc:postgresql://YOUR_HOST:5432/zunftgewerk
DATABASE_USERNAME=zunftgewerk_prod
DATABASE_PASSWORD=YOUR_STRONG_PASSWORD
# ... add all 11 keys (see Step 1 below)
EOF

# 3. Run deployment script
cd /Users/andre/Projects/atest
./infra/k8s/deploy-secrets.sh

# 4. Verify
kubectl get pods -n zunftgewerk
kubectl logs deployment/zunftgewerk-api -n zunftgewerk
```

### Detailed Step-by-Step (See Full Checklist)

Read: `docs/task-2-k8s-secrets-checklist.md`
- Step 0: kubectl verification
- Step 1: Gather all 11 secret values
- Step 2: Create K8s Secret
- Step 3: Update deployments (already done ✓)
- Step 4: Set GitHub Secret (KUBECONFIG_B64)
- Step 5: Test deployment pipeline
- Step 6: Verify production
- Step 7: Cleanup & document

---

## 🔐 Secret Values You Need to Gather

### **1. JWT Keys** (RSA Pair)
**Source**: Generate new or use existing
```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
cat private.pem    # JWT_PRIVATE_KEY_PEM
cat public.pem     # JWT_PUBLIC_KEY_PEM
```

### **2. Stripe Credentials**
**Source**: https://dashboard.stripe.com/apikeys
- `STRIPE_SECRET_KEY`: sk_live_...
- `STRIPE_WEBHOOK_SECRET`: whsec_...

### **3. MFA Encryption Key** (AES-128)
**Source**: Generate new (16 bytes hex)
```bash
openssl rand -hex 16  # Result: 32 hex characters
```

### **4. Database (PostgreSQL)**
**Source**: Your production PostgreSQL instance
- `DATABASE_URL`: jdbc:postgresql://HOST:5432/zunftgewerk
- `DATABASE_USERNAME`: zunftgewerk_prod
- `DATABASE_PASSWORD`: Min 20 chars, mixed case, numbers, symbols

### **5. Redis**
**Source**: Your production Redis instance
- `REDIS_HOST`: redis.example.com
- `REDIS_PORT`: 6379 (default)

### **6. OpenRouteService** (Optional)
**Source**: https://openrouteservice.org/ (only if using address autocomplete)
- `OPENROUTESERVICE_API_KEY`: or_...

---

## 📊 What Gets Injected Into Pods

Once deployed, each pod gets all 11 environment variables:

```bash
# In API container
$DATABASE_URL         ← Connected to PostgreSQL
$DATABASE_USERNAME    ↓
$DATABASE_PASSWORD
$JWT_PRIVATE_KEY_PEM  ← Signs access tokens
$JWT_PUBLIC_KEY_PEM
$STRIPE_SECRET_KEY    ← Processes payments
$STRIPE_WEBHOOK_SECRET
$MFA_ENCRYPTION_KEY   ← Encrypts TOTP secrets
$REDIS_HOST          ← Cache & rate limiting
$REDIS_PORT
$OPENROUTESERVICE_API_KEY (optional)
```

---

## ✅ Pre-Deployment Checklist

Before running the deployment script:

- [ ] K8s cluster provisioned and accessible
- [ ] `kubectl` installed and configured
- [ ] `zunftgewerk` namespace exists (script creates if needed)
- [ ] PostgreSQL database provisioned
- [ ] Redis instance provisioned
- [ ] Stripe account created (test or production)
- [ ] All 11 secret values gathered/generated
- [ ] `/tmp/k8s-secrets.env` file created with all values
- [ ] GitHub Actions secret `KUBECONFIG_B64` set
- [ ] Secrets not committed to git (`.gitignore` has `secrets-*.yaml`)

---

## 🔄 Deployment Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. Gather Secrets (1.5 hours)                          │
│    - Get JWT keys, Stripe, DB, Redis, MFA             │
│    - Create /tmp/k8s-secrets.env                       │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 2. Run Deployment Script (15 min)                       │
│    - ./infra/k8s/deploy-secrets.sh                     │
│    - Creates K8s Secret                                │
│    - Applies manifests                                 │
│    - Waits for rollout                                │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 3. Verify Production (15 min)                           │
│    - Check pod status                                  │
│    - Test API health endpoint                          │
│    - Review logs for errors                            │
│    - Test web app login                                │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│ 4. Cleanup & Document (15 min)                          │
│    - Delete /tmp/k8s-secrets.env                       │
│    - Update infra/k8s/SECRETS.md audit trail          │
│    - Commit changes                                    │
│    - Setup 90-day rotation reminders                   │
└─────────────────────────────────────────────────────────┘
```

**Total Time**: ~2-3 hours (1.5 hours gathering, 1 hour deployment & verification)

---

## 🐛 If Something Goes Wrong

### Pod not starting?
```bash
kubectl describe pod POD_NAME -n zunftgewerk
kubectl logs deployment/zunftgewerk-api -n zunftgewerk --tail=50
```

### Secret keys not being read?
```bash
# Check secret exists
kubectl get secret zunftgewerk-secrets -n zunftgewerk

# Verify keys are there
kubectl describe secret zunftgewerk-secrets -n zunftgewerk
```

### Database connection failing?
```bash
# Verify secret value
kubectl get secret zunftgewerk-secrets -n zunftgewerk \
  -o jsonpath='{.data.DATABASE_URL}' | base64 -d

# Test from pod
kubectl exec -it POD_NAME -n zunftgewerk -- \
  psql $DATABASE_URL -U $DATABASE_USERNAME
```

See full troubleshooting: `infra/k8s/SECRETS.md` Troubleshooting section

---

## 📅 After Deployment

### Immediate (Day 1)
- [ ] Verify all pods are running
- [ ] Test login/logout flows
- [ ] Check API logs for errors
- [ ] Monitor resource usage

### Week 1
- [ ] Setup monitoring/alerting
- [ ] Test backup procedures
- [ ] Document any issues encountered
- [ ] Verify log aggregation isn't capturing secrets

### Month 1
- [ ] Setup automated secret rotation (90 days)
- [ ] Test disaster recovery procedure
- [ ] Brief team on secret access procedures
- [ ] Create emergency contact list

---

## 🔐 Security Reminders

### ❌ Never
- Commit secrets to git
- Share secrets in Slack/email
- Log secrets to stdout
- Include secrets in Docker images
- Store secrets in multiple places

### ✅ Always
- Keep secrets encrypted at rest
- Use K8s RBAC to restrict access
- Rotate secrets every 90 days
- Maintain audit trail
- Test disaster recovery regularly
- Use secure channels for sharing

---

## 📚 Related Documentation

- **Main checklist**: `docs/task-2-k8s-secrets-checklist.md` (700+ lines)
- **Planning guide**: `docs/task-2-planning-guide.md` (for understanding)
- **Decision tree**: `docs/task-2-decision-tree.md` (choose your path)
- **Quick reference**: `docs/task-2-quick-reference.md` (errors & debugging)
- **Secret rotation**: `infra/k8s/SECRETS.md` (after initial setup)
- **Architecture**: `docs/architecture/` (overall system design)

---

## 🎯 What's Next After Task 2?

Once secrets are in K8s:

1. **Monitoring** → Setup Prometheus + Grafana
2. **Alerting** → Configure PagerDuty/Slack alerts
3. **Logging** → Aggregate logs with Loki/CloudWatch
4. **Backups** → Automate DB + Redis backups
5. **CDN** → Optimize static asset delivery

---

## 💬 Questions?

Review the relevant documentation above, or contact your DevOps lead.

---

**Ready to deploy?** Start with Step 0: `docs/task-2-k8s-secrets-checklist.md`
