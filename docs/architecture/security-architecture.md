# Security Architecture

## Sicherheitskern

- Authentifizierung unterstuetzt Passwort-Login und Passkeys.
- MFA (TOTP) wird rollenbasiert erzwungen.
- Zugriff erfolgt ueber kurzlebige Access Tokens und rotierende Refresh-Sessions.
- Sicherheitsrelevante Aktionen werden auditiert.

## Token-Modell

| Token | Typische TTL | Zweck |
|---|---|---|
| Access Token | kurzlebig (z. B. Minutenbereich) | Autorisierung von API-Aufrufen |
| Refresh Token | langlebiger (z. B. Tage/Wochen) | Session-Fortsetzung mit Rotation |
| MFA Token | sehr kurzlebig | Zwischenzustand bis MFA abgeschlossen ist |

### JWT Claims (Kern)

- `sub`: Benutzer-ID
- `tid`: Tenant-ID
- `roles`: Rollenliste
- `mfa`: MFA-Status
- `amr`: Authentifizierungsmethoden

Schluesselbereitstellung erfolgt ueber `/.well-known/jwks.json`.

## Auth-Flows (Kurz)

- **Login:** Credentials pruefen -> optional `MFA_REQUIRED` -> Token ausstellen.
- **Passkey:** Begin/Verify-Challenge -> bei Erfolg Token ausstellen.
- **Refresh:** Refresh Token validieren, rotieren, altes Token ungueltig machen.
- **Reuse Detection:** Wiederverwendung eines bereits rotierten Tokens fuehrt zur Sperre der Token-Familie.

## Kryptographie und Schutzmechanismen

- JWT-Signatur: RS256.
- Passwort-Hashing: Argon2id.
- Token-Hashing: SHA-256 (serverseitige Speicherung).
- MFA-Secrets: verschluesselt gespeichert.
- Webhook-Eingang (Stripe): Signaturpruefung.

## Zugriffsschutz

- Rate Limiting fuer sensible Auth-Endpunkte.
- Rollenbasierte Autorisierung fuer Admin-/Owner-Aktionen.
- CORS/Cookie-Policies werden zentral in Security-Konfigurationen gesteuert.

## Audit-relevante Ereignisse (Beispiele)

- Erfolgreiche und fehlgeschlagene Logins
- MFA-Aktivierung und Passkey-Registrierung
- Session-Revoke/Logout
- Refresh-Reuse-Erkennung
