# Seat-Policy Rollout (Owner-Schutz + Invite-Block)

## Scope

Sichere Einfuehrung der Seat-Policy mit:
- Owner-Sitz nicht entziehbar
- Invite-Erstellung blockiert ohne freie Benutzerlizenzen
- Datenbank-Constraint fuer aktive Seats

## Preflight vor Migration

```sql
-- Doppelte aktive Seats pro Nutzer ermitteln
SELECT tenant_id, user_id, COUNT(*) AS active_count
FROM seat_licenses
WHERE status = 'ACTIVE'
GROUP BY tenant_id, user_id
HAVING COUNT(*) > 1;
```

```sql
-- Unerwartete Seat-Statuswerte ermitteln
SELECT DISTINCT status
FROM seat_licenses;
```

Wenn ein Resultat zurueckkommt, vor Migration bereinigen.

## Durchfuehrung

1. Migration einspielen.
2. API mit Seat-Policy-Logik deployen.
3. Frontend deployen, damit Konfliktfaelle korrekt angezeigt werden.

## Verifikation nach Deployment

1. `POST /v1/licenses/seats/revoke` auf Owner testen:
   - Erwartet: `409`, `code=OWNER_SEAT_PROTECTED`.
2. `POST /v1/team/invite` ohne freie Seats testen:
   - Erwartet: `409`, `code=NO_AVAILABLE_SEAT`.
3. Audit pruefen:
   - `MEMBER_INVITE_BLOCKED` bei Invite-Konflikt
   - `SEAT_ASSIGNED`/`SEAT_REVOKED` bei Seat-Aktionen
4. UI pruefen: klare Fehlermeldungen, keine stillen Leerzustaende.

## Backout

1. Bei UI-Problemen nur Frontend rollbacken.
2. Bei zu strikter Invite-Policy den Invite-Block temporar lockern.
3. Owner-Schutz nur nach expliziter Governance-Entscheidung anfassen.

## Eskalation

- Bei Constraint-/Migrationsproblemen an DBA + API-Owner eskalieren.
- Bei fachlichen Konflikten (Owner-Schutz vs. Prozessanforderung) an Product/Governance eskalieren.
