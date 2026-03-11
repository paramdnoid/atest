# Data Architecture

## Kernmodell

Zentraler fachlicher Kern:

- `users`, `tenants`, `memberships`, `roles` bilden Identitaet, Mandant und Berechtigungszuordnung.
- `subscriptions`, `seat_licenses`, `entitlements`, `devices` bilden Plan-, Seat- und Device-Lizenzmodell.
- `refresh_tokens`, `mfa_secrets`, `passkey_credentials`, `*_tokens`, `auth_challenges` bilden den Auth-Sicherheitskontext.
- `change_log`, `client_operations`, `entity_sync_state` bilden den Sync-Kern.
- `audit_events` dokumentiert sicherheits- und fachrelevante Aktionen append-only.

## Invarianten

- Tenant-bezogene Tabellen fuehren `tenant_id` und werden tenant-spezifisch gelesen/geschrieben.
- Loeschung eines Tenants raeumt abhaengige tenant-gebundene Daten ueber FK-Kaskaden auf.
- Subscription ist tenant-eindeutig (1:1 pro Tenant).
- Sync-Operationen sind idempotent ueber `client_op_id` und nachvollziehbar ueber `change_log`.

## Migrationsstrategie

- Schema-Aenderungen erfolgen ausschliesslich ueber Flyway.
- Die konkrete Migrationsnummer ist bewusst nicht hart kodiert in dieser Uebersicht, um bei weiteren Releases nicht zu veralten.
- Vor produktiven Releases muessen neue Constraints auf bestehende Daten geprueft werden (Preflight-Queries im jeweiligen Runbook).

## Datenfluesse (Kurz)

- **Write-Path:** Auth-Kontext ermittelt Tenant, Service schreibt tenant-gebunden, Audit wird protokolliert.
- **Sync-Path:** Client pusht Operationen -> Server prueft Idempotenz/Konflikt -> schreibt Changelog -> Client zieht Delta oder streamt.
- **Billing-Path:** Stripe-Events werden verifiziert, dedupliziert, persistent gespeichert und asynchron verarbeitet.
