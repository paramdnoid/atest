# Deployment & Infrastructure

## Lokale Entwicklungsumgebung

Minimaler Laufzeit-Stack:

- PostgreSQL
- Redis
- Mailpit (nur lokal fuer E-Mail-Tests)
- API (`services/api`)
- Frontends (`apps/landing`, `apps/web`, optional `apps/mobile`)

### Quick Start

```bash
docker compose -f infra/docker-compose.yml up -d
pnpm install
cd services/api && gradle bootRun
# in separaten Terminals:
pnpm dev:landing
pnpm dev:web
```

## Deployment-Grundsaetze

- API ist zentraler Deployable (modularer Monolith).
- Persistente Daten liegen in PostgreSQL.
- Redis wird fuer technische Querschnittsfunktionen genutzt (z. B. Rate Limits/Cache).
- Schema-Aenderungen laufen ueber Flyway-Migrationen.

## Kubernetes (wenn genutzt)

- API als Deployment hinter Service/Gateway.
- Konfiguration und Secrets werden umgebungsabhaengig injiziert.
- Replikas und Ressourcenlimits sind betriebsseitig zu setzen.

## CI/CD (Kern)

- Frontend-Builds und API-Tests laufen in getrennten Jobs.
- Merge-Relevanz: Build gruen + API-Tests gruen.
- E2E-Tests sind optional/ergenzend fuer Release-Sicherheit.

## Betriebsrelevante Konfiguration

- DB-Zugang, JWT-Schluessel, MFA-Schluessel und Stripe-Secrets muessen pro Umgebung gesetzt sein.
- Frontend-API-URLs muessen zum jeweiligen API-Endpoint passen.
- Bei Auth/Passkey-Szenarien muessen Origin/RP-Settings konsistent zur Zielumgebung sein.
