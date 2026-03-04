# Offene Aufgaben — Schritt-für-Schritt-Anleitung

> Stand: 2026-03-04 | 8 Aufgaben, davon 5 Production-kritisch

---

## Aufgabe 1: KUBECONFIG_B64 GitHub Secret setzen

**Ziel:** CI/CD-Pipeline kann automatisch auf den k3s-Cluster deployen.

**Voraussetzungen:**
- Zugriff auf https://github.com/paramdnoid/atest/settings/secrets/actions
- `kubectl` lokal konfiguriert und funktionsfähig

**Schritte:**

1. Terminal öffnen und die kubeconfig als Base64 kodieren:
   ```bash
   cat ~/.kube/config | base64 | tr -d '\n'
   ```
   Der Output ist ein langer Base64-String — alles kopieren (Cmd+A, Cmd+C).

2. GitHub im Browser öffnen:
   ```
   https://github.com/paramdnoid/atest/settings/secrets/actions
   ```

3. Auf **"New repository secret"** klicken.

4. Folgende Werte eintragen:
   - **Name:** `KUBECONFIG_B64`
   - **Secret:** Den kopierten Base64-String einfügen

5. Auf **"Add secret"** klicken.

6. Überprüfen: Das Secret sollte in der Liste als `KUBECONFIG_B64` erscheinen (Wert ist nicht sichtbar, nur der Name).

**Ergebnis prüfen:**

Einen leeren Commit pushen oder auf den nächsten Push warten. Im Tab **Actions** des Repos sollte der `deploy`-Job jetzt grün durchlaufen:
```
Actions → letzter Workflow-Run → deploy-Job → "Apply manifests" Step
```

Falls der Job fehlschlägt mit `error: You must be logged in to the server`: Die kubeconfig enthält vermutlich `127.0.0.1` als Server-Adresse. In dem Fall muss die kubeconfig so angepasst werden, dass die **externe IP oder Domain** des k3s-Servers eingetragen ist, bevor sie Base64-kodiert wird.

---

## Aufgabe 2: OPENROUTESERVICE_API_KEY in K8s Secret patchen

**Ziel:** Address-Autocomplete (Adresssuche im Onboarding) funktioniert in Produktion.

**Voraussetzungen:**
- Ein gültiger API-Key von https://openrouteservice.org/dev/#/signup
- `kubectl` mit Zugriff auf den Cluster

**Schritte:**

1. Falls noch kein Account besteht: Bei OpenRouteService registrieren:
   ```
   https://openrouteservice.org/dev/#/signup
   ```
   Kostenloser Plan: 2.000 Requests/Tag.

2. API-Key aus dem Dashboard kopieren.

3. In das K8s-Secret patchen:
   ```bash
   kubectl -n zunftgewerk patch secret zunftgewerk-secrets \
     -p '{"stringData":{"OPENROUTESERVICE_API_KEY":"DEIN_API_KEY_HIER"}}'
   ```
   `DEIN_API_KEY_HIER` durch den tatsächlichen Key ersetzen.

4. API-Pod neustarten, damit er den neuen Key aufnimmt:
   ```bash
   kubectl -n zunftgewerk rollout restart deployment/zunftgewerk-api
   ```

5. Warten, bis der Pod wieder läuft:
   ```bash
   kubectl -n zunftgewerk rollout status deployment/zunftgewerk-api --timeout=2m
   ```

**Ergebnis prüfen:**

Im Browser https://zunftgewerk.de/onboarding öffnen, einen Account anlegen, und im Adressfeld eine Adresse eingeben. Nach 300ms sollten Vorschläge erscheinen.

Falls keine Vorschläge kommen: API-Logs prüfen:
```bash
kubectl -n zunftgewerk logs deployment/zunftgewerk-api | grep -i "openroute\|address\|nominatim"
```

---

## Aufgabe 3: Stripe-Webhook lokal testen

**Ziel:** Sicherstellen, dass Stripe-Events (Checkout abgeschlossen, Abo gekündigt, etc.) korrekt verarbeitet werden.

**Voraussetzungen:**
- Stripe CLI installiert (bereits vorhanden unter `/opt/homebrew/bin/stripe`)
- Stripe-Account mit Test-API-Keys
- Lokale Infrastruktur läuft (Docker Compose)

**Schritte:**

1. Lokale Infrastruktur starten (falls nicht bereits aktiv):
   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```

2. API-Server starten:
   ```bash
   cd services/api && gradle bootRun
   ```
   Warten bis `Started ApiApplication` in der Konsole erscheint.

3. In einem **neuen Terminal** die Stripe CLI einloggen (einmalig):
   ```bash
   stripe login
   ```
   Der Browser öffnet sich — Stripe-Konto autorisieren.

4. Webhook-Forwarding starten:
   ```bash
   stripe listen --forward-to localhost:8080/webhooks/stripe
   ```
   Die CLI gibt ein **Webhook-Signing-Secret** aus, z.B.:
   ```
   > Ready! Your webhook signing secret is whsec_abc123...
   ```
   Dieses Secret in `services/api/.env` oder als Umgebungsvariable setzen:
   ```bash
   export STRIPE_WEBHOOK_SECRET=whsec_abc123...
   ```
   Dann den API-Server mit diesem Secret neustarten (Schritt 2 wiederholen).

5. In einem **dritten Terminal** Test-Events senden:
   ```bash
   # Checkout-Session abgeschlossen
   stripe trigger checkout.session.completed

   # Abo aktualisiert
   stripe trigger customer.subscription.updated

   # Abo gekündigt
   stripe trigger customer.subscription.deleted

   # Zahlung fehlgeschlagen
   stripe trigger invoice.payment_failed
   ```

6. In der Stripe-CLI-Konsole prüfen, ob die Events mit `200 OK` beantwortet werden:
   ```
   2026-03-04 12:00:00   --> checkout.session.completed [evt_xxx]
   2026-03-04 12:00:00  <--  [200] POST http://localhost:8080/webhooks/stripe
   ```

7. API-Logs auf Verarbeitung prüfen:
   ```bash
   # Im API-Terminal nach Stripe-Meldungen suchen
   # Oder in Mailpit (http://localhost:8025) nach E-Mails schauen
   ```

**Häufige Fehler:**

| Problem | Lösung |
|---|---|
| `400 invalid signature` | STRIPE_WEBHOOK_SECRET stimmt nicht — das von `stripe listen` angezeigte Secret verwenden |
| `Connection refused` | API-Server läuft nicht auf Port 8080 |
| `No webhook endpoints` | `stripe listen` muss laufen, bevor Events gesendet werden |

**Ergebnis prüfen:**

Alle 4 Trigger-Events sollten `200 OK` zurückgeben. In der Datenbank:
```bash
docker exec zunftgewerk-postgres psql -U zunftgewerk -d zunftgewerk \
  -c "SELECT event_type, status, created_at FROM stripe_webhook_events ORDER BY created_at DESC LIMIT 10;"
```

---

## Aufgabe 4: MFA Enforcement manuell verifizieren

**Ziel:** Bestätigen, dass Admin/Owner-Accounts nach dem Login MFA durchlaufen müssen.

**Voraussetzungen:**
- Lokale Infrastruktur + API laufen (siehe Aufgabe 3, Schritte 1-2)
- Ein Testbenutzer mit Admin- oder Owner-Rolle existiert

**Schritte:**

1. Falls der Seed-User noch nicht existiert:
   ```bash
   ./scripts/e2e-seed-web-user.sh
   ```
   Dieser User hat die Rolle `owner` und MFA ist aktiviert.

2. Landing-App starten:
   ```bash
   pnpm dev:landing
   ```

3. Im Browser http://localhost:3000/login öffnen.

4. Mit den Seed-Credentials einloggen:
   - **E-Mail:** `andrzimmermann@gmx.de`
   - **Passwort:** `Admin1234!`

5. **Erwartetes Verhalten:**
   - Nach dem Passwort erscheint ein MFA-Eingabefeld (TOTP-Code)
   - Ohne MFA-Code ist **kein Zugriff** auf das Dashboard möglich
   - Die API gibt `MFA_REQUIRED` zurück (nicht `AUTHENTICATED`)

6. MFA-Code eingeben (TOTP-App oder Test-Secret `LX2KIE`):
   - Falls du eine TOTP-App nutzt: Code aus der App eingeben
   - Falls du den Test-Secret nutzen willst: Einen TOTP-Generator verwenden, z.B.:
     ```
     https://totp.danhersam.com/?secret=LX2KIE
     ```

7. Nach erfolgreichem MFA → Dashboard wird angezeigt.

**Was prüfen:**

| Schritt | Erwartung | Status |
|---|---|---|
| Login ohne MFA-Code | `MFA_REQUIRED` Response, kein Dashboard-Zugriff | [ ] OK |
| Login mit gültigem MFA-Code | Dashboard wird geladen | [ ] OK |
| Login mit falschem MFA-Code | Fehlermeldung, kein Zugriff | [ ] OK |

**Ergebnis:**

Wenn alle drei Checks bestehen, ist MFA Enforcement korrekt aktiv. Der Flag `FEATURE_MFA_ENFORCEMENT_ADMIN` steht in `application.yml` bereits auf `true` — es ist keine weitere Konfiguration nötig.

---

## Aufgabe 5: Loki + Promtail deployen

**Ziel:** Zentralisierte Log-Aggregation für alle Pods im Cluster.

**Voraussetzungen:**
- `kubectl` mit Zugriff auf den Cluster

**Schritte:**

1. Alle K8s-Manifeste anwenden (Loki + Promtail sind bereits enthalten):
   ```bash
   kubectl apply -k infra/k8s/base/
   ```

2. Warten, bis Loki läuft:
   ```bash
   kubectl -n zunftgewerk rollout status deployment/zunftgewerk-loki --timeout=3m
   ```

3. Prüfen, ob Promtail auf jedem Node läuft:
   ```bash
   kubectl -n zunftgewerk get pods -l app=zunftgewerk-promtail
   ```
   Für jeden Node im Cluster sollte ein Pod mit Status `Running` erscheinen.

4. Prüfen, ob Loki erreichbar ist:
   ```bash
   kubectl -n zunftgewerk exec deployment/zunftgewerk-loki -- \
     wget -qO- http://localhost:3100/ready
   ```
   Erwartete Ausgabe: `ready`

5. Test-Abfrage — die letzten API-Logs abrufen:
   ```bash
   kubectl -n zunftgewerk exec deployment/zunftgewerk-loki -- \
     wget -qO- 'http://localhost:3100/loki/api/v1/query_range?query={app="zunftgewerk-api"}&limit=5'
   ```
   Sollte JSON mit Log-Einträgen zurückgeben.

**Log-Abfragen (Beispiele für später):**

```logql
# Alle API-Fehler
{app="zunftgewerk-api", level="ERROR"}

# Logs mit bestimmter Trace-ID
{app="zunftgewerk-api"} | trace_id="abc123def456"

# Landing-App-Logs
{app="zunftgewerk-landing"}

# Alle Logs eines bestimmten Pods
{pod="zunftgewerk-api-5d8f9c7b6-x2j4k"}
```

**Ressourcenverbrauch:**

| Komponente | CPU Request | CPU Limit | RAM Request | RAM Limit | Speicher |
|---|---|---|---|---|---|
| Loki | 50m | 500m | 128Mi | 512Mi | 2Gi PVC |
| Promtail (pro Node) | 25m | 200m | 64Mi | 128Mi | — |

**Optional — Grafana hinzufügen (Aufgabe 8):** Siehe unten.

---

## Aufgabe 6: Mobile Android Acceptance Testing

**Ziel:** Alle 12 Acceptance-Cases auf einem Android-Gerät/Emulator bestehen.

**Voraussetzungen:**
- Android Studio installiert (https://developer.android.com/studio)
- Android SDK mit einem Emulator-Image (API 34+)
- Lokale Infrastruktur + API + Seed-User (siehe Aufgabe 4)

**Schritte:**

1. Android Studio installieren (falls nicht vorhanden):
   ```
   https://developer.android.com/studio
   ```
   Bei der Installation **Android SDK** und **Android Virtual Device** auswählen.

2. Einen Emulator erstellen:
   - Android Studio → **Device Manager** → **Create Virtual Device**
   - **Pixel 7** oder ähnlich wählen
   - **API 34 (Android 14)** Image herunterladen und auswählen
   - Emulator starten

3. Prüfen, ob `adb` verfügbar ist:
   ```bash
   adb devices
   ```
   Der Emulator sollte als `emulator-5554  device` erscheinen.

4. Lokale Infrastruktur starten:
   ```bash
   docker compose -f infra/docker-compose.yml up -d
   cd services/api && gradle bootRun &
   ```

5. Seed-User anlegen:
   ```bash
   ./scripts/e2e-seed-web-user.sh
   ```

6. Expo-Dev-Server starten:
   ```bash
   pnpm dev:mobile
   ```
   Im Expo-Menü **"a"** drücken, um auf dem Android-Emulator zu öffnen.

7. **Jeden Test-Case manuell durchführen:**

| # | Case | Aktion | Erwartung |
|---|---|---|---|
| 1 | `AUTH-01` | App kalt starten (kein Login) | Login-Screen sichtbar |
| 2 | `AUTH-02` | Korrekte Credentials eingeben | MFA-Screen erscheint |
| 3 | `AUTH-03` | Gültigen MFA-Code eingeben | App-Tabs sichtbar (Dashboard, Sync, Settings) |
| 4 | `AUTH-04` | Falsches Passwort eingeben | Fehlermeldung erscheint |
| 5 | `AUTH-05` | Falschen MFA-Code eingeben | Fehlermeldung erscheint |
| 6 | `DASH-01` | Dashboard öffnen | Workspace-Name und Details geladen |
| 7 | `DASH-02` | Dashboard prüfen | Plan-Code angezeigt (z.B. "free") |
| 8 | `SYNC-01` | Sync-Button drücken | Ladeindikator → Erfolgsmeldung → Zeitstempel |
| 9 | `SET-01` | Settings öffnen | E-Mail und App-Version sichtbar |
| 10 | `SET-02` | Abmelden drücken | Zurück zum Login-Screen |
| 11 | `SESS-01` | App schließen und neu öffnen | Session wird wiederhergestellt (kein Login nötig) |
| 12 | `GUARD-01` | Deep-Link zu geschützter Route ohne Login | Redirect zum Login-Screen |

8. Ergebnisse dokumentieren — alle 12 Cases müssen `PASS` sein.

**Testdaten:**
- **E-Mail:** `andrzimmermann@gmx.de`
- **Passwort:** `Admin1234!`
- **TOTP-Secret:** `LX2KIE`
- **API-URL:** `http://10.0.2.2:8080` (Android-Emulator → localhost des Host-Rechners)

**Hinweis:** Im Android-Emulator ist `localhost` der Emulator selbst. Um den Host-Rechner zu erreichen, muss `10.0.2.2` verwendet werden. Prüfe, ob `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` auf `http://10.0.2.2:8080` steht.

---

## Aufgabe 7: Legal-Seiten Inhalte finalisieren

**Ziel:** Impressum, Datenschutzerklärung und AGB mit echten Firmendaten befüllen.

**Voraussetzungen:**
- Echte Firmendaten (Adresse, Handelsregister, USt-IdNr.)
- Optional: Juristischer Beistand für AGB und Datenschutzerklärung

**Dateien:**

| Seite | Datei | URL |
|---|---|---|
| Impressum | `apps/landing/app/legal/imprint/page.tsx` | `/legal/imprint` |
| Datenschutz | `apps/landing/app/legal/privacy/page.tsx` | `/legal/privacy` |
| AGB | `apps/landing/app/legal/terms/page.tsx` | `/legal/terms` |

**Was zu ändern ist:**

### Impressum (`/legal/imprint`)
Aktuell Platzhalter-Daten. Ersetze:
- `ZunftGewerk GmbH` → Tatsächlicher Firmenname
- `Musterstraße 1, 12345 Musterstadt` → Echte Adresse
- `hallo@zunftgewerk.de` → Echte Kontakt-E-Mail
- `HRB 000000` → Echte Handelsregisternummer
- `DE000000000` → Echte USt-IdNr.
- Geschäftsführer-Name hinzufügen

### Datenschutzerklärung (`/legal/privacy`)
- `datenschutz@zunftgewerk.de` → Echte DSB-E-Mail oder Kontakt
- Hosting-Anbieter mit Adresse eintragen
- Ggf. Auftragsverarbeitungs-Verzeichnis verlinken
- Stripe als Zahlungsdienstleister explizit benennen
- Cookie-Arten spezifizieren (technisch notwendig vs. Analyse)

### AGB (`/legal/terms`)
- Gültigkeitsdatum setzen
- Preise und Zahlungsbedingungen konkretisieren
- Widerrufsbelehrung (bei B2C) ergänzen
- Haftungsbeschränkung prüfen lassen
- Gerichtsstand und anwendbares Recht (deutsches Recht) bestätigen

**Empfehlung:** Texte von einem auf IT-Recht spezialisierten Anwalt prüfen lassen. Dienste wie eRecht24 oder IT-Recht Kanzlei bieten Generatoren und Prüfungen an.

---

## Aufgabe 8: Grafana Dashboard für Loki-Logs (optional)

**Ziel:** Web-UI zum Durchsuchen und Visualisieren der Logs aus Loki.

**Voraussetzungen:**
- Aufgabe 5 (Loki + Promtail) muss erledigt sein

**Schritte:**

1. Grafana-Deployment erstellen:
   ```bash
   cat <<'EOF' | kubectl apply -n zunftgewerk -f -
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: zunftgewerk-grafana
     namespace: zunftgewerk
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: zunftgewerk-grafana
     template:
       metadata:
         labels:
           app: zunftgewerk-grafana
       spec:
         containers:
           - name: grafana
             image: grafana/grafana:11.5.2
             ports:
               - containerPort: 3000
             env:
               - name: GF_SECURITY_ADMIN_PASSWORD
                 value: "zunftgewerk-admin"
               - name: GF_AUTH_ANONYMOUS_ENABLED
                 value: "false"
             resources:
               requests:
                 cpu: "50m"
                 memory: "128Mi"
               limits:
                 cpu: "500m"
                 memory: "256Mi"
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: zunftgewerk-grafana
     namespace: zunftgewerk
   spec:
     type: ClusterIP
     selector:
       app: zunftgewerk-grafana
     ports:
       - port: 3000
         targetPort: 3000
   EOF
   ```

2. Port-Forward für lokalen Zugriff:
   ```bash
   kubectl -n zunftgewerk port-forward svc/zunftgewerk-grafana 3333:3000
   ```

3. Im Browser öffnen: http://localhost:3333
   - **Benutzer:** `admin`
   - **Passwort:** `zunftgewerk-admin`

4. Loki als Datenquelle hinzufügen:
   - Links → **Connections** → **Data sources** → **Add data source**
   - **Loki** auswählen
   - **URL:** `http://zunftgewerk-loki:3100`
   - **Save & test** — sollte "Data source successfully connected" zeigen

5. Logs erkunden:
   - Links → **Explore**
   - Oben Loki als Datenquelle wählen
   - Label-Filter: `app = zunftgewerk-api`
   - **Run query** klicken

**Passwort ändern:** Nach dem ersten Login unbedingt das Admin-Passwort ändern (Profil → Change password).

---

## Zusammenfassung

| # | Aufgabe | Priorität | Dauer | Abhängigkeiten |
|---|---|---|---|---|
| 1 | KUBECONFIG_B64 GitHub Secret | Hoch | 15 min | GitHub-Zugang |
| 2 | OPENROUTESERVICE_API_KEY | Hoch | 5 min | API-Key + kubectl |
| 3 | Stripe-Webhook testen | Hoch | 1 Std | Stripe-Account + lokale Infra |
| 4 | MFA Enforcement prüfen | Hoch | 30 min | Lokale Infra + Seed-User |
| 5 | Loki + Promtail deployen | Hoch | 5 min | kubectl |
| 6 | Android Acceptance Testing | Niedrig | 2 Std | Android Studio + SDK |
| 7 | Legal-Seiten finalisieren | Niedrig | 1 Std | Firmendaten + Anwalt |
| 8 | Grafana Dashboard | Optional | 30 min | Aufgabe 5 erledigt |

**Empfohlene Reihenfolge:** 5 → 1 → 2 → 4 → 3 → 7 → 6 → 8
