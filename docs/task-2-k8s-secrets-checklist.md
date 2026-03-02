# Task 2: K8s Secrets Setup — Ausführungs-Checklist

> **Erstellt**: 2026-03-02
> **Status**: Vorlage für manuelle Ausführung
> **Blockers**: MUSS vor Production-Deployment durchgeführt werden
> **Duration**: ~1 Stunde
> **Owner**: DevOps / Administrator

---

## 🚨 WICHTIG: Security-Regeln

- ❌ **NIEMALS** Secrets in Git committen
- ❌ **NIEMALS** Secrets in Slack/Email teilen
- ✅ Nur über verschlüsselte Kanäle übertragen
- ✅ Nach Completion alle Temp-Dateien löschen
- ✅ Zugang loggen (wer, wann, was geändert)

---

## Schritt 0: Vorbereitung

### 0.1: kubectl Zugang verifizieren

```bash
# Prüfe ob kubectl existiert
which kubectl
# Expected: /usr/local/bin/kubectl oder ähnlich

# Prüfe ob du mit Cluster verbunden bist
kubectl config current-context
# Expected: Dein Cluster-Name (z.B. "production-cluster", "gke_project_zone_cluster")

# Falls nicht konfiguriert: Kubeconfig setzen
export KUBECONFIG=/path/to/your/kubeconfig.yaml
kubectl config current-context
# Sollte jetzt Cluster-Name zeigen
```

**Checklist**:
- [ ] `kubectl` ist installiert
- [ ] `kubectl config current-context` zeigt deinen Production-Cluster
- [ ] `kubectl get nodes` zeigt mindestens 1 Node

### 0.2: Namespace überprüfen

```bash
# Prüfe ob zunftgewerk namespace existiert
kubectl get namespace zunftgewerk
# Wenn Fehler "Not Found": Erstelle namespace
kubectl create namespace zunftgewerk

# Verify
kubectl get namespace zunftgewerk
# Expected: NAME          STATUS   AGE
#           zunftgewerk   Active   <some-age>
```

**Checklist**:
- [ ] `zunftgewerk` Namespace existiert

---

## Schritt 1: Secret-Werte sammeln

### 1.1: JWT RS256 Key Pair

**Woher**: Backend-Konfiguration oder neu generieren

**Wenn du einen bestehenden Key hast**:
```bash
# Privater Key (muss mit "-----BEGIN RSA PRIVATE KEY-----" starten)
cat /path/to/your/private-key.pem

# Öffentlicher Key (muss mit "-----BEGIN PUBLIC KEY-----" starten)
cat /path/to/your/public-key.pem
```

**Wenn du einen neuen Key generieren musst**:
```bash
# Generiere neues RSA 2048 Keypair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Keys anzeigen
cat private.pem
cat public.pem
```

**In Checklist eintragen**:
```
JWT_PRIVATE_KEY_PEM=
-----BEGIN RSA PRIVATE KEY-----
[PASTE ENTIRE PRIVATE KEY HERE, INCLUDING HEADERS]
-----END RSA PRIVATE KEY-----

JWT_PUBLIC_KEY_PEM=
-----BEGIN PUBLIC KEY-----
[PASTE ENTIRE PUBLIC KEY HERE, INCLUDING HEADERS]
-----END PUBLIC KEY-----
```

**Checklist**:
- [ ] Private Key kopiert (mit `-----BEGIN/END-----`)
- [ ] Public Key kopiert (mit `-----BEGIN/END-----`)
- [ ] Keys sind gültig (openssl kann sie parsen)

### 1.2: Stripe API Keys

**Woher**: [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

```bash
# Gehe zu: https://dashboard.stripe.com/apikeys
# Under "Secret key" (mit Eye-Icon), kopiere: sk_live_...
# Unter Webhooks, kopiere den "Signing secret": whsec_...
```

**In Checklist eintragen**:
```
STRIPE_SECRET_KEY=sk_live_[DEIN_KEY_HIER]
STRIPE_WEBHOOK_SECRET=whsec_[DEIN_SECRET_HIER]
```

**Validation**:
```bash
# Secret Key sollte mit sk_live_ oder sk_test_ starten
echo "STRIPE_SECRET_KEY=sk_live_xyz" | grep "^STRIPE_SECRET_KEY=sk_"
# Expected: (matches)

# Webhook Secret sollte mit whsec_ starten
echo "STRIPE_WEBHOOK_SECRET=whsec_xyz" | grep "^STRIPE_WEBHOOK_SECRET=whsec_"
# Expected: (matches)
```

**Checklist**:
- [ ] Stripe Secret Key kopiert (`sk_live_*`)
- [ ] Stripe Webhook Secret kopiert (`whsec_*`)

### 1.3: MFA Encryption Key (AES-128-GCM)

**Woher**: Neu generieren (16 bytes hexadecimal)

```bash
# Generiere neuen 16-byte (128-bit) hex string
openssl rand -hex 16
# Output: z.B. "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

# ODER: Mit Python
python3 -c "import secrets; print(secrets.token_hex(16))"

# ODER: Mit /dev/urandom
head -c 16 /dev/urandom | xxd -p
```

**In Checklist eintragen**:
```
MFA_ENCRYPTION_KEY=[16-BYTE HEX STRING HIER]
# Beispiel: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Validation**:
```bash
# Sollte genau 32 Zeichen lang sein (16 bytes = 32 hex chars)
echo -n "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" | wc -c
# Expected: 32
```

**Checklist**:
- [ ] MFA Encryption Key generiert
- [ ] Exakt 32 Zeichen (16 bytes hex)
- [ ] Notiert und sicher gespeichert

### 1.4: Database Credentials

**Woher**: Production PostgreSQL Instance

```bash
# Falls du bereits einen DB-Admin hast:
DATABASE_URL=jdbc:postgresql://YOUR_POSTGRES_HOST:5432/zunftgewerk
DATABASE_USERNAME=zunftgewerk_prod
DATABASE_PASSWORD=[VERY_STRONG_PASSWORD_HERE]

# Password-Anforderungen:
# - Mindestens 20 Zeichen
# - Großbuchstaben, Kleinbuchstaben, Zahlen, Sonderzeichen
# - Keine Anführungszeichen, Backslashes, oder Zeilenumbrüche
```

**In Checklist eintragen**:
```
DATABASE_URL=jdbc:postgresql://YOUR_HOST:5432/zunftgewerk
DATABASE_USERNAME=zunftgewerk_prod
DATABASE_PASSWORD=[STRONG_PASSWORD]
```

**Checklist**:
- [ ] PostgreSQL Host-Adresse notiert
- [ ] Database Username erstellt/notiert
- [ ] Strong Password generiert (min 20 chars)
- [ ] Zugriff von API-Pod zum DB getestet

### 1.5: Redis Credentials

**Woher**: Production Redis Instance

```bash
# Falls Redis ohne Auth (standard bei managed services):
REDIS_HOST=your-redis.example.com
REDIS_PORT=6379

# Falls Redis mit Auth:
REDIS_HOST=your-redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=[AUTH_PASSWORD]
```

**In Checklist eintragen**:
```
REDIS_HOST=[YOUR_REDIS_HOST]
REDIS_PORT=6379
REDIS_PASSWORD=[IF_NEEDED]
```

**Validation**:
```bash
# Teste Verbindung (wenn Redis-CLI installiert)
redis-cli -h YOUR_REDIS_HOST -p 6379 ping
# Expected: PONG
```

**Checklist**:
- [ ] Redis Host-Adresse notiert
- [ ] Redis Port notiert
- [ ] (Optional) Auth Password notiert
- [ ] Verbindung getestet

### 1.6: Optional: OpenRouteService API Key

**Woher**: [OpenRouteService Dashboard](https://openrouteservice.org/)

```bash
# Nur wenn du Address-Autocomplete nutzt
OPENROUTESERVICE_API_KEY=or_[YOUR_KEY]
```

**Checklist**:
- [ ] OpenRouteService Key (optional, nur wenn verwendet)

### 1.7: Alle Werte in Temp-Datei sammeln

**WICHTIG**: Diese Datei NIEMALS committen, NICHT mit anderen teilen!

```bash
# Erstelle temporary secrets file (nur lokal!)
cat > /tmp/k8s-secrets.env << 'EOF'
# === K8s Secrets für zunftgewerk (NICHT COMMITTEN!) ===
# Created: [TODAY'S DATE]
# DO NOT SHARE OR COMMIT THIS FILE

# JWT Keys
JWT_PRIVATE_KEY_PEM=-----BEGIN RSA PRIVATE KEY-----
[PASTE YOUR ENTIRE PRIVATE KEY HERE]
-----END RSA PRIVATE KEY-----

JWT_PUBLIC_KEY_PEM=-----BEGIN PUBLIC KEY-----
[PASTE YOUR ENTIRE PUBLIC KEY HERE]
-----END PUBLIC KEY-----

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MFA Encryption (16 bytes hex)
MFA_ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Database
DATABASE_URL=jdbc:postgresql://host:5432/zunftgewerk
DATABASE_USERNAME=zunftgewerk_prod
DATABASE_PASSWORD=...

# Redis
REDIS_HOST=redis.example.com
REDIS_PORT=6379

# Optional
OPENROUTESERVICE_API_KEY=or_...
EOF

# Verify (nur Keys zeigen, nicht Werte!)
grep "^[A-Z_]*=" /tmp/k8s-secrets.env | cut -d= -f1
```

**Checklist**:
- [ ] Alle Werte in `/tmp/k8s-secrets.env` gesammelt
- [ ] Datei ist lokal (NICHT im Repository)
- [ ] Alle Keys haben Werte (keine leeren Einträge)

---

## Schritt 2: Kubernetes Secret erstellen

### 2.1: Secret mit allen Werten erstellen

```bash
# Source die Werte aus temp-Datei
source /tmp/k8s-secrets.env

# Erstelle K8s Secret mit ALLEN Werten
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
  --from-literal=OPENROUTESERVICE_API_KEY="$OPENROUTESERVICE_API_KEY"

# Expected: secret/zunftgewerk-secrets created
```

**Troubleshooting**:
```bash
# Wenn Secret bereits existiert:
kubectl delete secret zunftgewerk-secrets -n zunftgewerk
# Dann nochmal create command

# Wenn Fehler "invalid secret value":
# Prüfe dass keine Anführungszeichen innerhalb der Values sind
# Prüfe dass PEM Keys vollständig sind (mit BEGIN/END)
```

**Checklist**:
- [ ] Secret erfolgreich erstellt
- [ ] Output: "secret/zunftgewerk-secrets created"

### 2.2: Secret-Struktur verifizieren

```bash
# Liste alle Secrets im Namespace
kubectl get secrets -n zunftgewerk
# Expected: zunftgewerk-secrets listed

# Zeige Secret-Details (OHNE Werte anzuzeigen!)
kubectl describe secret zunftgewerk-secrets -n zunftgewerk
# Expected: Alle Keys mit Byte-Längen:
#   JWT_PRIVATE_KEY_PEM:    XXXX bytes
#   JWT_PUBLIC_KEY_PEM:     XXXX bytes
#   STRIPE_SECRET_KEY:      XX bytes
#   ... etc

# Prüfe ob ein spezifischer Key korrekt decoded werden kann
# (ACHTUNG: Zeigt echten Secret-Wert an!)
# kubectl get secret zunftgewerk-secrets -n zunftgewerk \
#   -o jsonpath='{.data.JWT_PUBLIC_KEY_PEM}' | base64 -d | head -c 50
```

**Checklist**:
- [ ] Secret taucht in `kubectl get secrets` auf
- [ ] Alle Keys sind im `describe` output vorhanden
- [ ] Byte-Längen sind reasonable (PEM Keys > 1000 bytes)

---

## Schritt 3: Deployment Manifeste aktualisieren

### 3.1: API Deployment überprüfen

```bash
# Prüfe dass api-deployment.yaml die Secrets referenziert
kubectl get deployment api -n zunftgewerk -o yaml | grep -A 5 "envFrom"

# Expected:
# envFrom:
# - secretRef:
#     name: zunftgewerk-secrets
```

**Falls nicht vorhanden, editieren**:
```bash
kubectl edit deployment api -n zunftgewerk

# Unter spec.template.spec.containers[0], ergänze:
# envFrom:
# - secretRef:
#     name: zunftgewerk-secrets

# Save (Ctrl+X in vi editor)
```

**Checklist**:
- [ ] API Deployment hat `envFrom.secretRef.name: zunftgewerk-secrets`

### 3.2: Manifeste validieren

```bash
# Prüfe dass alle Deployments Secrets lesen können
for deployment in api landing web; do
  echo "=== $deployment ==="
  kubectl get deployment $deployment -n zunftgewerk -o yaml | grep -A 2 "envFrom" || echo "MISSING envFrom!"
done
```

**Checklist**:
- [ ] Alle 3 Deployments haben envFrom konfiguriert
- [ ] secretRef.name ist "zunftgewerk-secrets"

---

## Schritt 4: GitHub Secrets für CI/CD

### 4.1: KUBECONFIG als GitHub Secret setzen

```bash
# Encode deine kubeconfig als base64
cat ~/.kube/config | base64 -w 0
# Output: long base64 string

# Kopiere den OUTPUT (aber NICHT den "===" Teil!)
```

**In GitHub setzen**:
```
1. Gehe zu: https://github.com/deine-org/atest
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: KUBECONFIG_B64
5. Value: [paste the base64 string from above]
6. Click "Add secret"
```

**Checklist**:
- [ ] GitHub Secret `KUBECONFIG_B64` erstellt
- [ ] Wert ist base64-encoded kubeconfig (lang, mit ==)

### 4.2: Verify GitHub Secret

```bash
# Test ob kubeconfig dekodierbar ist
KUBECONFIG_B64="[paste the value you set in GitHub]"
echo "$KUBECONFIG_B64" | base64 -d | head -10
# Expected: kubeconfig YAML (apiVersion, clusters, contexts, etc.)
```

**Checklist**:
- [ ] Base64-dekodierung funktioniert
- [ ] Dekodierter Output ist valid YAML

---

## Schritt 5: Deployment Pipeline testen

### 5.1: CI Deploy Job triggern

```bash
# Option A: Push zu main branch (triggert CI automatisch)
git push origin main

# Option B: Manual trigger in GitHub Actions
# Gehe zu: https://github.com/deine-org/atest/actions
# Wähle Workflow: "CI"
# Click "Run workflow" → Choose branch → "Run workflow"

# Warte auf deploy job:
# - Sollte KUBECONFIG_B64 dekodieren
# - Sollte kubectl apply durchführen
# - Sollte Image-Hashes setzen
# - Sollte Rollout awarten
```

**Expected Output**:
```
deployment.apps/api patched
deployment.apps/landing patched
deployment.apps/web patched
Waiting for deployment "api" rollout to finish: 1/3 updated, 2 old replicas...
Waiting for deployment "api" rollout to finish: 3/3 updated, waiting...
Waiting for deployment "api" rollout to finish: 2 of 3 updated replicas are available; 1 old replicas...
Waiting for deployment "api" rollout to finish: 3 of 3 updated replicas are available
deployment "api" successfully rolled out
[repeat für landing + web]
```

**Checklist**:
- [ ] CI deploy job startet
- [ ] KUBECONFIG_B64 wird dekodiert (kein Secret-Fehler)
- [ ] Alle 3 Deployments patched
- [ ] Alle 3 Rollouts successful

### 5.2: Pod-Status überprüfen

```bash
# Nach erfolgreichem Deploy, prüfe ob Pods laufen
kubectl get pods -n zunftgewerk -w
# Expected: api, landing, web pods sind Running und Ready

# Warte bis alle Ready sind (könnte 2-5 Minuten dauern)
# CTRL+C um watch zu beenden
```

**Checklist**:
- [ ] Alle Pods sind Running
- [ ] Alle Pods sind Ready (1/1)
- [ ] Keine Pods sind CrashLoopBackOff

### 5.3: Pod-Logs prüfen (keine Secrets anzeigen!)

```bash
# API Logs (erste 50 Zeilen)
kubectl logs -n zunftgewerk deployment/api --tail=50

# Expected:
# - Keine ERROR oder FATAL logs
# - "Started ZunftgewerkApplication in X seconds"
# - Database migrations erfolgreich
# - Flyway migrations applied
```

**Troubleshooting**:
```bash
# Wenn Fehler: "Invalid database password"
# → Prüfe DATABASE_PASSWORD im Secret
kubectl get secret zunftgewerk-secrets -n zunftgewerk -o yaml | grep DATABASE_PASSWORD

# Wenn Fehler: "JWT key is invalid"
# → Prüfe JWT_PRIVATE_KEY_PEM Format (muss mit BEGIN/END starten)

# Wenn Fehler: "Cannot connect to Redis"
# → Prüfe REDIS_HOST und Port
```

**Checklist**:
- [ ] API Logs zeigen keine Errors
- [ ] "Started ZunftgewerkApplication" erscheint
- [ ] Database migrations erfolgreich

---

## Schritt 6: Produktion verifizieren

### 6.1: Services überprüfen

```bash
# Liste alle Services
kubectl get svc -n zunftgewerk
# Expected: api, landing, web services mit externen IPs/LoadBalancers

# Prüfe Service Details
kubectl describe svc api -n zunftgewerk
# Expected: Selector zeigt auf Pods, Endpoints zeigen IPs
```

**Checklist**:
- [ ] Alle 3 Services sind vorhanden
- [ ] Services haben externe IPs oder LoadBalancer-Adressen

### 6.2: Ingress überprüfen

```bash
# Prüfe Ingress-Konfiguration
kubectl get ingress -n zunftgewerk
# Expected: Ingress mit Hosts für api.zunftgewerk.com, app.zunftgewerk.com, etc.

# Detailsanzeige
kubectl describe ingress -n zunftgewerk
```

**Checklist**:
- [ ] Ingress ist vorhanden
- [ ] Alle Hosts sind konfiguriert
- [ ] TLS Certificat Status prüfen

### 6.3: API Health-Check

```bash
# Prüfe API Health über Ingress
curl https://api.zunftgewerk.com/actuator/health
# Expected: {"status":"UP"}

# Mit Debug-Output
curl -v https://api.zunftgewerk.com/actuator/health
# Expected: HTTP 200, valid JSON
```

**Checklist**:
- [ ] API antwortet auf Health-Endpoint
- [ ] HTTP Status ist 200
- [ ] Response ist {"status":"UP"}

### 6.4: Web App überprüfen

```bash
# Prüfe dass Web App loaded
curl -s https://app.zunftgewerk.com | head -20
# Expected: HTML mit Next.js content

# Prüfe Landing Page
curl -s https://zunftgewerk.com | head -20
# Expected: HTML mit Landing-Page content
```

**Checklist**:
- [ ] Web App responds mit HTML
- [ ] Landing Page responds mit HTML
- [ ] Keine 503 Service Unavailable Fehler

### 6.5: Resource Usage überwachen

```bash
# Prüfe CPU + Memory Usage
kubectl top pods -n zunftgewerk
# Expected: Pods haben reasonable CPU/Memory (nicht 0, nicht 100%)

# Prüfe auf OOMKilled events
kubectl get events -n zunftgewerk --sort-by='.lastTimestamp' | tail -20
# Expected: Keine OOMKilled, ImagePullBackOff, oder CrashLoopBackOff
```

**Checklist**:
- [ ] Pods verwenden reasonable Ressourcen
- [ ] Keine OOMKilled events
- [ ] Keine ImagePullBackOff events

---

## Schritt 7: Cleanup & Dokumentation

### 7.1: Temp-Secrets-Datei löschen

```bash
# WICHTIG: Temp-Secrets-Datei SICHER löschen
rm /tmp/k8s-secrets.env

# Verify
ls /tmp/k8s-secrets.env 2>&1
# Expected: No such file or directory

# Extra-sicher: shred (überschreibt Datei)
shred -vfz /tmp/k8s-secrets.env 2>&1 || echo "Already deleted"
```

**Checklist**:
- [ ] `/tmp/k8s-secrets.env` gelöscht
- [ ] Keine Secrets in Shell-History
  ```bash
  history | grep -i password || echo "Not in history (good)"
  ```

### 7.2: Secrets-Management dokumentieren

**Erstelle `infra/k8s/SECRETS.md`**:

```markdown
# K8s Secrets Management

## Production Secrets

### zunftgewerk-secrets
Created: [YYYY-MM-DD]
Last Rotated: [YYYY-MM-DD]
Rotation Schedule: Every 90 days

**Keys**:
- JWT_PRIVATE_KEY_PEM (RSA Private Key)
- JWT_PUBLIC_KEY_PEM (RSA Public Key)
- STRIPE_SECRET_KEY (Stripe API)
- STRIPE_WEBHOOK_SECRET (Stripe Webhooks)
- MFA_ENCRYPTION_KEY (AES-128-GCM)
- DATABASE_URL (PostgreSQL Connection)
- DATABASE_USERNAME (DB User)
- DATABASE_PASSWORD (DB Password)
- REDIS_HOST (Redis Host)
- REDIS_PORT (Redis Port)
- OPENROUTESERVICE_API_KEY (Optional)

## Rotation Procedure

1. Generate new secret values
2. Create temporary new secret: `zunftgewerk-secrets-v2`
3. Update deployment: `kubectl set env deployment/api ... --from-secret=zunftgewerk-secrets-v2`
4. Monitor logs for 5 minutes
5. Delete old secret: `kubectl delete secret zunftgewerk-secrets`
6. Rename new secret: `kubectl patch secret zunftgewerk-secrets-v2 -p '{"metadata":{"name":"zunftgewerk-secrets"}}'`
7. Update deployment back to `zunftgewerk-secrets`
8. Document rotation date

## Emergency Access

Contact DevOps Lead. All access must be logged.

```bash
# View secret (shows values - only in emergency!)
kubectl get secret zunftgewerk-secrets -n zunftgewerk -o yaml
# Or single key:
kubectl get secret zunftgewerk-secrets -n zunftgewerk \
  -o jsonpath='{.data.JWT_PUBLIC_KEY_PEM}' | base64 -d
```

## Audit Log

| Date | Action | User | Notes |
|------|--------|------|-------|
| 2026-03-02 | Created | DevOps | Initial setup |
|      |       |      |       |
```

**Checklist**:
- [ ] `infra/k8s/SECRETS.md` erstellt
- [ ] Dokumentiert was in welchem Secret ist
- [ ] Rotation-Anleitung ist klar
- [ ] Emergency-Access erklärt

### 7.3: Commit das Deployment

```bash
# Falls du changes an Deployment-Manifesten gemacht hast
git add infra/k8s/base/
git add infra/k8s/SECRETS.md
git commit -m "Setup K8s secrets and production deployment (P2.2)

- Created zunftgewerk-secrets with JWT, Stripe, MFA, DB, Redis keys
- Updated deployments to reference secrets
- Set KUBECONFIG_B64 in GitHub Actions
- Deployed to production cluster
- All health checks passing
- Documented secret rotation procedure

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

git push origin main
```

**Checklist**:
- [ ] Deployment changes committed
- [ ] Commit message clear und informativ
- [ ] Pushed to main

---

## Final Checklist — Task 2 Komplett

### Secrets erstellet
- [ ] JWT Private Key (RSA PEM)
- [ ] JWT Public Key (RSA PEM)
- [ ] Stripe Secret Key (sk_live_*)
- [ ] Stripe Webhook Secret (whsec_*)
- [ ] MFA Encryption Key (16 bytes hex)
- [ ] Database URL
- [ ] Database Username
- [ ] Database Password
- [ ] Redis Host
- [ ] Redis Port
- [ ] (Optional) OpenRouteService API Key

### K8s Secret erstellt
- [ ] `kubectl create secret generic` erfolgreich
- [ ] `kubectl describe secret` zeigt alle Keys
- [ ] Secrets im namespace vorhanden

### Deployment konfiguriert
- [ ] API Deployment referenziert secrets
- [ ] Landing Deployment referenziert secrets
- [ ] Web Deployment referenziert secrets
- [ ] Alle Manifeste valide YAML

### CI/CD konfiguriert
- [ ] KUBECONFIG_B64 in GitHub Secrets gesetzt
- [ ] Deploy Job triggert automatisch
- [ ] Deployment rollout erfolgreich
- [ ] Alle Pods sind Running + Ready

### Produktion verified
- [ ] API antwortet auf /actuator/health
- [ ] Web App loaded
- [ ] Landing Page loaded
- [ ] Logs haben keine Errors
- [ ] Resource-Usage ist normal

### Cleanup & Docs
- [ ] Temp secrets-Datei gelöscht
- [ ] SECRETS.md dokumentiert
- [ ] Changes committed
- [ ] Rotation-Procedure dokumentiert

---

## 🎯 Nach Completion

**Du kannst jetzt**:
- Production-Deployments durchführen
- Secrets rotieren (jeden 90 Tage)
- Emergency-Zugang zu Secrets haben (mit Audit-Trail)
- CI/CD Pipeline läuft vollständig

**Nächste Schritte**:
1. **Monitoring** → Prometheus + Grafana Dashboard für Production
2. **Alerting** → PagerDuty/Slack für Production-Issues
3. **Backups** → Database + Redis regelmäßig sichern
4. **Log-Aggregation** → Loki/CloudWatch für Production-Logs

---

## 📞 Hilfe & Support

Wenn etwas fehlschlägt:

```bash
# Debug Secrets
kubectl describe secret zunftgewerk-secrets -n zunftgewerk

# Debug Pods
kubectl logs -f deployment/api -n zunftgewerk

# Debug Deployment
kubectl describe deployment api -n zunftgewerk

# Scale Pods (falls Probleme)
kubectl scale deployment api --replicas=3 -n zunftgewerk

# Rollback zu vorheriger Version
kubectl rollout undo deployment/api -n zunftgewerk

# Detailierter Events-Log
kubectl get events -n zunftgewerk --sort-by='.lastTimestamp'
```

