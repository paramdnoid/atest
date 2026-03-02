# Runbook: Stripe Webhook Ausfall

## Symptome

- Planwechsel nicht sichtbar
- Seat Limits inkonsistent
- Erhoehte failed webhook events

## Sofortmassnahmen

1. Stripe Dashboard Event Queue pruefen.
2. Signaturvalidierung und Secret-Rotation pruefen.
3. Webhook Retry aktivieren und Dead-Letter protokollieren.

## Recovery

1. Fehlende Events per Stripe API nachziehen.
2. Subscription-State fuer betroffene Tenants re-konsolidieren.
3. Audit Event mit manual reconciliation markieren.

## Worker und Statusmodell

- `RECEIVED`: Event gespeichert, noch nicht verarbeitet.
- `PROCESSED`: Event erfolgreich verarbeitet.
- `FAILED`: Verarbeitungsfehler, geplanter Retry ueber `next_retry_at`.
- `DEAD_LETTER`: Retry-Limit erreicht oder nicht-retrybarer Fehler.

## Auto-Recovery

- Der Retry-Worker scannt `FAILED` Events (Default: alle 30 Sekunden).
- Backoff ist exponentiell mit Cap (`base-delay-seconds`, `max-delay-seconds`).
- Der Dead-Letter-Recovery-Worker scannt `DEAD_LETTER` Events nach Cooldown (Default: 1 Stunde, Scan alle 5 Minuten).
- Pro Event ist die Anzahl der Recovery-Zyklen begrenzt (`max-recovery-attempts`, Default: 3).

## Manueller Recovery Trigger

- Endpoint: `POST /internal/billing/stripe-webhooks/dead-letter/recover`
- Authentifizierung erforderlich (`/internal/**` ist nicht `permitAll`).
- Request-Beispiele:

```json
{"eventId":"evt_123"}
```

```json
{"limit":25}
```

- Antwort:
  - `requeuedCount`
  - `skippedCount`
  - `eventIds`

## Wann Stripe API Backfill noetig bleibt

- Wenn Events im Stripe-Dashboard nie zugestellt wurden (also nicht im lokalen Event-Store liegen), kann der Worker sie nicht replayen.
- In diesem Fall weiterhin manuell per Stripe API/Event-Historie nachziehen.
