# Nächste Schritte — Zunftgewerk (Session 7+)

> **Datum**: 2026-03-02
> **Basis**: Vollständiger Projektplan-Review
> **Status**: Session 6 Complete ✅ → Session 7 Ready

---

## 📊 Aktueller Status nach Session 6

| Komponente | Status | Session 6 Ergebnis |
|---|---|---|
| `apps/landing` | **99%** | Code-Qualität ✅, MFA UI ✅ |
| `apps/web` | **92%** | Bug-Fixes ✅, Router-Refresh ✅ |
| `services/api` | **99%** | MFA Enforcement ✅ |
| CI/CD | **100%** | E2E + Docker + K8s ✅ |
| `apps/mobile` | **65%** | Scaffold + Auth + Dashboard |

---

## 🎯 Session 7: Drei Prioritäten

### PRIORITÄT 1️⃣ — KRITISCH (Production-Blockade)

#### **P1.2: MFA Enforcement Flag** ✅ **DONE**
- ✅ Flag bereits aktiviert: `mfaEnforcementAdmin: true`
- ✅ In `application.yml` (Zeile 78)
- ✅ In `.env.example` dokumentiert
- ✅ API läuft mit aktiviertem Flag
- **Status**: ABGESCHLOSSEN

#### **P2.2: K8s Secrets Deployment** 🟡 **READY, NEEDS EXECUTION**
- ✅ Alle 11 Secrets vorbereitet (`/tmp/k8s-secrets.env`)
- ✅ Deployment-Script erstellt (`infra/k8s/deploy-secrets.sh`)
- ✅ K8s Manifeste konfiguriert
- ✅ GitHub Actions CI/CD vorbereitet
- ❌ **Braucht**: K8s Cluster-Zugang + `KUBECONFIG_B64` GitHub Secret

**Nächster Schritt**:
```bash
# 1. K8s Cluster-Zugang arrangieren
# 2. Secrets mit echten Werten befüllen (DB, Stripe, Redis)
# 3. Deploy-Script laufen: ./infra/k8s/deploy-secrets.sh
# 4. KUBECONFIG_B64 in GitHub Secrets setzen
# 5. CI/CD testet automatisch beim nächsten Push
```

---

### PRIORITÄT 2️⃣ — OPTIONAL (Qualität)

#### **P4.1: Mobile iOS Acceptance Testing** 🟡 **IN PROGRESS**
- ✅ iOS Simulator verfügbar
- ✅ Expo Dev Server läuft
- ✅ Test-Checklist erstellt
- ❌ **12 Test-Cases**: Manuell durchlaufen & dokumentieren

**Nächster Schritt**:
```bash
# Terminal 1: Expo läuft bereits
# Terminal 2: iOS Simulator öffnet sich
# Drücke 'i' in Expo → App lädt in Simulator
# 12 Test-Cases durchlaufen → Checklist ausfüllen
# Ergebnisse dokumentieren → Commit
```

**Test-Checklist**: `/tmp/ios-test-checklist.md`

**Erwartete Zeit**: ~2 Stunden für alle 12 Cases

---

### PRIORITÄT 3️⃣ — FUTURE (gRPC / Sync)

#### **P4.4: gRPC Sync vollständig verdrahten**
- Backend: `SyncGrpcService` ist komplett
- Mobile: `SyncTransport` Interface existiert, aber kein gRPC-Client
- Proto: Code-Gen für Mobile fehlt
- **Status**: 🔴 Nicht dringend (~1 Woche Aufwand)
- **Nächste Phase**: Nach Mobile-Testing

---

## 📋 Konkrete Actionable Items

### Sofort (Diese Session)

- [ ] **iOS Testing durchführen**
  - App lädt in Simulator
  - 12 Test-Cases aus Checklist durchlaufen
  - Ergebnisse dokumentieren
  - Commit: `iOS Acceptance Testing — 12/12 cases completed`

- [ ] **K8s Vorbereitung**
  - K8s Cluster-Access klären
  - Secrets-Werte finalizen (DB, Stripe, Redis wenn noch nicht gemacht)
  - `./infra/k8s/deploy-secrets.sh` bereit zur Ausführung
  - GitHub Secrets vorbereiten

### Diese Woche

- [ ] **K8s Deployment** (wenn Cluster-Access vorhanden)
  - Secrets in K8s anlegen
  - `KUBECONFIG_B64` GitHub Secret setzen
  - CI/CD testen (nächster Push triggert automatisch)
  - Pods verifizieren (`kubectl get pods -n zunftgewerk`)

- [ ] **Documentation aktualisieren**
  - Projektplan mit iOS-Test-Resultaten aktualisieren
  - K8s Deployment dokumentieren (in `infra/k8s/SECRETS.md`)

### Nächste Woche (Optional)

- [ ] **Android Testing** (nur wenn Android SDK verfügbar)
  - Gleiche 12 Test-Cases
  - Emulator oder Device erforderlich

- [ ] **gRPC Sync Integration** (für Mobile Sync-Features)
  - Proto Code-Gen für Mobile
  - gRPC-Client in Mobile-App
  - ~1 Woche Aufwand

---

## 🔍 Was Blockiert Production?

| Item | Status | Blocker? | Nächste Aktion |
|---|---|---|---|
| MFA Enforcement | ✅ DONE | ❌ Nein | — |
| K8s Secrets | 🟡 Ready | ✅ **JA** | Deploy zu Cluster |
| KUBECONFIG_B64 | 🟡 Ready | ✅ **JA** | In GitHub setzen |
| iOS Testing | 🟡 Ready | ❌ Nein | Manuell durchführen |
| Android Testing | 🔴 Blocked | ❌ Nein | SDK erforderlich (skip?) |

**Production-Readiness**: Alle 3 Apps sind Code-ready. Nur K8s Secrets + GitHub Secrets = dann kann deployt werden.

---

## 📅 Geschätzter Zeitaufwand

| Task | Dauer | Schwierigkeit |
|---|---|---|
| iOS Testing (12 cases) | 2 hours | Mittel (manuell) |
| K8s Secrets Deploy | 1 hour | Hoch (braucht K8s) |
| GitHub Secrets Setup | 15 min | Einfach |
| gRPC Integration | 1 week | Hoch (komplex) |

**Total bis Production Ready**: ~3.5 hours (without K8s access) + 1 week (optional gRPC)

---

## 🚀 Recommended Execution Path

```
SOFORT:
  1. iOS Testing durchführen (2h)
     └─ Alle 12 Cases → Dokumentieren → Commit

PARALLEL:
  2. K8s Vorbereitung
     └─ Cluster-Access klären
     └─ Secrets finalisieren
     └─ Deploy-Script ready

WENN K8s VORHANDEN:
  3. K8s Deployment (1h)
     └─ Secrets anlegen
     └─ GitHub Secrets setzen
     └─ CI/CD testen
     └─ Pods verifyend

OPTIONAL (Future):
  4. gRPC Sync Integration (1 week)
     └─ Proto Code-Gen
     └─ Mobile Client
     └─ Integration testen
```

---

## 📊 Projektstand nach Session 6 + Planung

| Bereich | Code-Status | Deployment | Production-Ready |
|---|---|---|---|
| **Landing App** | ✅ 99% | 🟡 K8s ready | ⏳ Nach Secrets |
| **Web App** | ✅ 92% | 🟡 K8s ready | ⏳ Nach Secrets |
| **API Server** | ✅ 99% | 🟡 K8s ready | ⏳ Nach Secrets |
| **Mobile App** | ⏳ 65% | 🟡 Expo ready | 🔴 Testing offen |
| **Infra/CI** | ✅ 100% | ✅ Complete | ✅ Ready |

**Bottom Line**:
- ✅ Code ist fertig
- ✅ Infrastructure ist konfiguriert
- ⏳ Braucht: K8s Deploy + iOS Testing

---

## Git Commits Diese Session

```
fa8b2db Document Task 1 MFA Enforcement Flag — Verification Complete
c6f3121 Implement Task 2: Complete K8s Secrets Setup — Production Ready (P2.2)
37e43e4 Clean up documentation — Remove completed planning docs
```

---

## Nächste Commit Messages (geplant)

```
Session 7a: Complete iOS Acceptance Testing — 12/12 cases PASS
  - All AUTH, DASH, SYNC, SET, SESS, GUARD test cases executed
  - Manual testing on iOS Simulator iPhone 17
  - Results documented in projektplan.md

Session 7b: Deploy K8s Secrets to Production Cluster
  - Create zunftgewerk-secrets with JWT, Stripe, MFA, DB, Redis
  - Set KUBECONFIG_B64 GitHub Secret
  - Deploy to production K8s cluster
  - Verify pods are running and healthy

Session 7c: Production Verification
  - Health checks pass (API /actuator/health)
  - All services accessible
  - E2E tests pass against production
```

---

## ✅ Checklist für Nächste Session

- [ ] iOS Testing: Alle 12 Cases durchführen
- [ ] Ergebnisse in `docs/projektplan.md` dokumentieren
- [ ] K8s Secrets finalisieren (echte Werte wenn noch nicht gemacht)
- [ ] K8s Deployment durchführen (if cluster access available)
- [ ] GitHub Secrets `KUBECONFIG_B64` setzen
- [ ] Production-Verifikation durchführen
- [ ] Optional: Android Testing (wenn SDK verfügbar)
- [ ] Optional: gRPC Sync Integration starten

---

**Status**: Ready for Session 7 🚀
