# Task 2: Decision Tree — "What Do I Need to Do?"

> **Use this document to navigate Task 2**
> **Created**: 2026-03-02

---

## 🌳 Start Here: Where Are You Right Now?

```
Do you have production K8s cluster access?
│
├─ YES (kubectl configured, cluster online)
│  └─→ See: "PATH A: Full Execution"
│
├─ NO (but we're getting K8s soon)
│  └─→ See: "PATH B: Prepare Now, Execute Later"
│
└─ NO (we haven't decided on K8s yet)
   └─→ See: "PATH C: Strategic Planning"
```

---

## 📍 PATH A: Full Execution (K8s Ready Now)

**You have**: kubectl, cluster, and can start immediately

**Your checklist** (7-10 days):

```
Week 1:
  Day 1: Review task-2-k8s-secrets-checklist.md (Steps 0-1)
  Day 2: Gather all 6 secret types
  Day 3: Create K8s Secret object (Step 2)
  Day 4: Update deployment manifests (Step 3)
  Day 5: Set GitHub Secrets (Step 4)

Week 2:
  Day 6: Test deployment pipeline (Step 5)
  Day 7: Verify production (Step 6)
  Day 8: Cleanup & document (Step 7)
  Day 9: Buffer/debugging if needed
  Day 10: Deploy to production ✅
```

**Action**: Start with `task-2-k8s-secrets-checklist.md` Step 0

---

## 📍 PATH B: Prepare Now, Execute Later (K8s Coming Soon)

**You have**: Some infrastructure, K8s access arranged in 1-2 weeks

**Your checklist** (Phase-based):

### 🟢 Phase 1: Planning (This Week) — 4 hours
- [ ] Read `task-2-planning-guide.md`
- [ ] Fill out secrets inventory (fill in what you know)
- [ ] Identify where each secret comes from
- [ ] Create infrastructure diagram (text format)
- **Output**: Completed inventory checklist

### 🟡 Phase 2: Preparation (Next 1-2 Weeks) — 8 hours
- [ ] Arrange K8s cluster (with DevOps/cloud team)
- [ ] Arrange PostgreSQL access (with DB admin)
- [ ] Arrange Redis access (with ops team)
- [ ] Get Stripe credentials (with billing/financial team)
- [ ] Verify kubectl will work (test day before execution)
- [ ] Generate missing values (JWT, MFA key)
- [ ] Document everything in a shared doc/wiki
- **Output**: All secrets gathered, infrastructure ready

### 🔴 Phase 3: Execution (When K8s Ready) — 6 hours
- [ ] Run `task-2-k8s-secrets-checklist.md` Steps 0-7
- [ ] Monitor pod startup and logs
- [ ] Verify health checks
- [ ] Document secret rotation procedure
- [ ] Commit changes
- **Output**: Secrets in K8s, CI/CD working

**What to do RIGHT NOW (Phase 1)**:
1. Read: `task-2-planning-guide.md`
2. Fill in: Secrets inventory checklist (see below)
3. Identify: Who owns each piece?

### 📋 Quick Inventory (What You Know Now)

```
Circle YES or NO for each:

JWT Keys
  Do we have existing RSA keys? [ ] YES [ ] NO
  If YES, where? _______________________

Stripe
  Do we have production Stripe account? [ ] YES [ ] NO
  Who has dashboard access? _______________________

MFA Key
  Do we have one? [ ] YES [ ] NO
  Can we generate new one? [ ] YES [ ] NO

Database
  Do we have PostgreSQL provisioned? [ ] YES [ ] NO
  Cloud provider: [ ] Self [ ] RDS [ ] CloudSQL [ ] Other

Redis
  Do we have Redis provisioned? [ ] YES [ ] NO
  Cloud provider: [ ] Self [ ] Managed [ ] Other

K8s
  Cluster type: [ ] GKE [ ] EKS [ ] AKS [ ] Self [ ] Don't know yet
  Who manages it? _______________________
  When will access be ready? _______________________

Timeline
  When is production deployment needed? _______________________
  Is 2-3 weeks enough time? [ ] YES [ ] TIGHT [ ] NO
```

---

## 📍 PATH C: Strategic Planning (K8s Undecided)

**You have**: Code, but K8s infrastructure not yet decided

**Do these 4 things**:

### 1️⃣ Understand What You're Building
Read: `docs/architecture/` files (if they exist)

Questions to answer:
- [ ] How many concurrent users?
- [ ] How many server instances needed? (3? 5? 20?)
- [ ] High availability needed? (yes/no)
- [ ] Budget constraints? ($ per month)
- [ ] Compliance needs? (GDPR, SOC2, etc.)

### 2️⃣ Choose K8s Infrastructure
Options:
- **GKE** (Google Cloud) — Most popular for startups
- **EKS** (AWS) — If you're already on AWS
- **AKS** (Azure) — If you're already on Azure
- **Self-hosted** (DigitalOcean, Linode, bare metal) — Most control, most work
- **Managed K8s** (Aiven, Digital Ocean App Platform) — Simplest

**Decision factors**:
- Cost: which is cheapest for your scale?
- Team skill: who knows which platform?
- Vendor lock-in: acceptable?
- Support needs: SLA required?

**Recommendation for startups**: GKE (cheapest free tier, easiest scaling)

### 3️⃣ Choose Database & Cache
**PostgreSQL** (you have this):
- Cloud options: Google Cloud SQL, AWS RDS, Aiven, etc.
- Self-hosted: DigitalOcean, Linode, etc.
- Cost: ~$10-50/month for small database

**Redis** (you need this):
- Cloud options: Upstash (free tier!), Redis Cloud, AWS ElastiCache, Aiven
- Self-hosted: Redis on one of your servers
- Cost: free tier (Upstash), or ~$5-20/month

### 4️⃣ Create Implementation Timeline
```
Month 1:
  Week 1-2: Finalize K8s choice, provision infrastructure
  Week 3: Deploy task-2 (K8s secrets setup)
  Week 4: First production deployment

Month 2:
  Week 5-8: Monitor, optimize, iterate
```

**Action for Path C**: Schedule meeting with team to decide on K8s platform

---

## 🎯 Which Path Are You On?

| Path | If You... | Start With |
|------|-----------|-----------|
| **A** | Have kubectl access NOW | `task-2-k8s-secrets-checklist.md` Step 0 |
| **B** | Have infrastructure, K8s access 1-2 weeks | `task-2-planning-guide.md` Phase 1 (this week) |
| **C** | Haven't decided on K8s yet | Schedule arch decision meeting first |

---

## 💡 Examples

### Example 1: Startup with Existing GKE Cluster
**Path**: A
**Timeline**: 2 weeks
**Action**: Start Step 0 of checklist immediately
**Owner**: You + DevOps team

---

### Example 2: Enterprise Moving to Production
**Path**: B
**Timeline**: 4 weeks (2 weeks planning + 2 weeks execution)
**Action**: Complete Phase 1 this week, Phase 2 next week, Phase 3 week 3-4
**Owner**: DevOps lead + Security team + Database admin

---

### Example 3: New Project, No Infrastructure Yet
**Path**: C
**Timeline**: 6-8 weeks (decide arch → build infra → deploy secrets → go live)
**Action**: Schedule tech lead meeting, decide GKE/EKS/AKS
**Owner**: Tech lead + DevOps + CTO/PM

---

## ⚡ Quick Reference

**To execute Task 2, you MUST HAVE**:

```
✅ REQUIRED:
   [ ] K8s cluster (GKE, EKS, AKS, self-hosted)
   [ ] kubectl configured
   [ ] PostgreSQL (cloud or self-hosted)
   [ ] Redis (cloud or self-hosted)
   [ ] Stripe account (production or test)
   [ ] All 6 secret values gathered

⚠️ OPTIONAL (can generate):
   [ ] JWT keys (can generate new)
   [ ] MFA encryption key (can generate new)

❌ CANNOT SKIP:
   [ ] K8s namespace creation
   [ ] Secret object creation
   [ ] Deployment manifest updates
   [ ] GitHub Secret configuration
   [ ] Health check verification
```

**If you're missing ANY of the above**, you're in Path C (strategic planning) or early Path B (preparation).

---

## 🚀 Go Forward

**Choose your path above, then**:
- **Path A**: Jump to `task-2-k8s-secrets-checklist.md` Step 0
- **Path B**: Start `task-2-planning-guide.md` Phase 1
- **Path C**: Schedule infrastructure planning meeting

**Any questions?** Re-read the relevant path section above.

---
