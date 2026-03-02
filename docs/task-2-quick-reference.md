# Task 2 — Quick Reference Card

> Schnelle Befehle und Checklisten für K8s Secrets Setup

---

## 🚀 5-Minuten Übersicht

```bash
# 1. Secrets sammeln (siehe task-2-k8s-secrets-checklist.md Schritt 1)
cat > /tmp/k8s-secrets.env << 'EOF'
JWT_PRIVATE_KEY_PEM="..."
JWT_PUBLIC_KEY_PEM="..."
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
MFA_ENCRYPTION_KEY="a1b2c3d4..."
DATABASE_URL="jdbc:postgresql://..."
DATABASE_USERNAME="..."
DATABASE_PASSWORD="..."
REDIS_HOST="..."
REDIS_PORT="6379"
EOF

# 2. Secret in Cluster erstellen
source /tmp/k8s-secrets.env
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
  --from-literal=REDIS_PORT="$REDIS_PORT"

# 3. Verify
kubectl describe secret zunftgewerk-secrets -n zunftgewerk

# 4. GitHub Secret
echo "$(cat ~/.kube/config | base64 -w 0)" | pbcopy
# Paste in GitHub → Settings → Secrets → KUBECONFIG_B64

# 5. Deploy
git push origin main  # Triggers CI automatically

# 6. Cleanup
rm /tmp/k8s-secrets.env
```

---

## 📋 Secrets-Werte generieren

### JWT Keys (RSA 2048)
```bash
# Generiere neues Keypair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Zeige Keys
cat private.pem  # → JWT_PRIVATE_KEY_PEM
cat public.pem   # → JWT_PUBLIC_KEY_PEM

# Verify (optional)
openssl rsa -in private.pem -text -noout | head -10
```

### MFA Encryption Key (AES-128)
```bash
# 16 bytes = 32 hex chars
openssl rand -hex 16
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Verify: muss 32 chars sein
openssl rand -hex 16 | wc -c  # Expected: 33 (inkl. newline)
```

### Strong Database Password
```bash
# 32-char random password
openssl rand -base64 32
# Output: Ab3Cd+5Ef=7Gh...

# Oder: openssl
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Stripe Keys
```
Dashboard: https://dashboard.stripe.com/apikeys
- Secret Key: Unter "Secret key" (mit Eye-Icon) → sk_live_...

Webhooks: https://dashboard.stripe.com/webhooks
- Signing Secret: Unter Webhook endpoint → whsec_...
```

---

## ✅ Verification Checklisten

### Vor Secret-Erstellung
```bash
# ✓ kubectl funktioniert
kubectl config current-context

# ✓ Namespace existiert
kubectl get namespace zunftgewerk

# ✓ Zugang zum Cluster
kubectl auth can-i create secrets --namespace=zunftgewerk
```

### Nach Secret-Erstellung
```bash
# ✓ Secret existiert
kubectl get secret zunftgewerk-secrets -n zunftgewerk

# ✓ Alle Keys vorhanden
kubectl describe secret zunftgewerk-secrets -n zunftgewerk

# ✓ Deployment referenziert Secret
kubectl get deployment api -n zunftgewerk -o yaml | grep -A 3 envFrom

# ✓ Pods laufen
kubectl get pods -n zunftgewerk | grep api

# ✓ API health
curl https://api.zunftgewerk.com/actuator/health
```

### Nach GitHub Secret
```bash
# ✓ GitHub Secret gesetzt
# Verifiziere in: https://github.com/org/atest/settings/secrets/actions

# ✓ Base64 dekodierbar
KUBECONFIG_B64="[value from GitHub]"
echo "$KUBECONFIG_B64" | base64 -d | head -5  # Should show apiVersion, clusters, etc.
```

### Nach Deploy
```bash
# ✓ CI Job erfolgreich
# Prüfe: https://github.com/org/atest/actions

# ✓ Pods starten
kubectl get pods -n zunftgewerk -w

# ✓ Logs ohne Fehler
kubectl logs -f deployment/api -n zunftgewerk | head -20

# ✓ Health endpoints
curl https://api.zunftgewerk.com/actuator/health      # API
curl https://app.zunftgewerk.com                       # Web App
curl https://zunftgewerk.com                           # Landing
```

---

## 🔴 Häufige Fehler & Fixes

| Fehler | Ursache | Fix |
|--------|--------|-----|
| `secret/zunftgewerk-secrets created` nicht | Secret-Befehl falsch | Siehe Schritt 2.1 |
| `Invalid database password` Logs | DB-Passwort falsch | Prüfe DATABASE_PASSWORD in Secret |
| `JWT key is invalid` Logs | JWT-Keys falsch Format | Keys müssen `-----BEGIN/END-----` enthalten |
| `Cannot connect to Redis` | REDIS_HOST/PORT falsch | Prüfe REDIS_HOST und REDIS_PORT |
| `Pod pending` Status | Secret nicht mounted | Prüfe `envFrom.secretRef.name` |
| CI deploy fails | KUBECONFIG_B64 falsch | Muss base64 sein, nicht plaintext |
| `kubectl: command not found` | kubectl nicht installed | `brew install kubernetes-cli` |
| `error: current-context is not set` | kubeconfig nicht gesetzt | `export KUBECONFIG=/path/to/config` |

---

## 🔐 Security Reminders

✅ **DO**:
- Nutze starke Passwörter (min 20 chars)
- Rotiere Secrets jeden 90 Tage
- Logge allen Zugang zu Secrets
- Nutze encrypted channels (SSH, nicht Email)
- Speichere Backups verschlüsselt

❌ **DON'T**:
- Committe Secrets in Git
- Teile Secrets in Chat/Email
- Nutze hardcoded Passwords im Code
- Zeige Secrets in Screenshots
- Lasse `/tmp/k8s-secrets.env` herumliegen

---

## 📞 Debugging Befehle

```bash
# Full Secret-YAML (VORSICHT: zeigt echte Werte!)
kubectl get secret zunftgewerk-secrets -n zunftgewerk -o yaml

# Einzelner Secret-Wert (base64-decoded)
kubectl get secret zunftgewerk-secrets -n zunftgewerk \
  -o jsonpath='{.data.JWT_PUBLIC_KEY_PEM}' | base64 -d | head -c 50

# Secret-Details ohne Werte
kubectl describe secret zunftgewerk-secrets -n zunftgewerk

# Events in namespace
kubectl get events -n zunftgewerk --sort-by='.lastTimestamp' | tail -20

# Pod Logs mit Tail
kubectl logs -f -n zunftgewerk deployment/api --tail=100

# Pod Shell (falls Image das erlaubt)
kubectl exec -it -n zunftgewerk deployment/api -- sh
# Dann: env | grep STRIPE_SECRET_KEY (zeigt ob Secret injected)

# Describe Pod (zeigt envFrom details)
kubectl describe pod -n zunftgewerk <pod-name>
```

---

## 📅 Nach Completion

```bash
# 1. Temp-Datei sicher löschen
shred -vfz /tmp/k8s-secrets.env

# 2. Shell-History überprüfen (keine Secrets!)
history | grep -i password || echo "Good, no passwords in history"

# 3. Secrets-Rotation dokumentieren
echo "Created zunftgewerk-secrets on $(date)" >> infra/k8s/SECRETS.md

# 4. Team informieren
# Slack message: "K8s secrets deployed to production. No action needed."

# 5. Backup erstellen
kubectl get secret zunftgewerk-secrets -n zunftgewerk -o yaml > \
  /secure/backups/k8s-secrets-$(date +%Y%m%d).yaml.enc
# Encrypt & store offline

# 6. Nächste Rotation: 90 Tage
# Reminder in Kalender: [date + 90 days]
```

---

## 🎯 Full Workflow

```
[Schritt 1] Secrets sammeln
   ↓
[Schritt 2] Secret in K8s erstellen
   ↓
[Schritt 3] Deployment manifestieren prüfen
   ↓
[Schritt 4] KUBECONFIG_B64 in GitHub setzen
   ↓
[Schritt 5] Deploy triggern (git push)
   ↓
[Schritt 6] Health checks
   ↓
[Schritt 7] Cleanup & Dokumentation
   ↓
✅ COMPLETE
```

---

## 📚 Referenzen

- **Full Checklist**: `docs/task-2-k8s-secrets-checklist.md`
- **Template**: `infra/k8s/base/secrets-template.yaml`
- **Secrets Mgmt**: `infra/k8s/SECRETS.md` (nach creation)
- **Architecture**: `docs/architecture/`
- **CI/CD**: `.github/workflows/ci.yml`

