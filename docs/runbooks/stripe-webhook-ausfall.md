# Runbook: Stripe Webhook Ausfall

## Scope

- Betrifft Billing-Events aus Stripe, die nicht oder fehlerhaft verarbeitet werden.
- Fokus auf Wiederherstellung der korrekten Subscription-/Seat-Sicht im System.

## Symptome

- Planwechsel nicht sichtbar
- Seat Limits inkonsistent
- Erhoehte failed webhook events

## Auswirkung

- Abrechnung und Entitlements laufen zeitweise auseinander.
- Support-Faelle zu falschen Plan-/Seat-Zustaenden nehmen zu.

## Sofortmassnahmen

1. Stripe Event-Lieferung und Signaturvalidierung pruefen.
2. Lokale Event-Queue auf haengende/nicht verarbeitete Events pruefen.
3. Fehlerkontext (letzte Deployments, DB/Redis, Secrets) erfassen.

## Diagnose

1. In Stripe Dashboard/Logs fehlgeschlagene Zustellungen und Wiederholungen pruefen.
2. In API-Logs Signatur- und Payload-Fehler fuer betroffene Eventtypen eingrenzen.
3. Queue/Worker-Zustand validieren (Rueckstau, Exceptions, Dead-Letter-Anteil).

## Statusmodell

- `RECEIVED`: Event persistiert, noch nicht erfolgreich verarbeitet.
- `PROCESSED`: Erfolgreich verarbeitet.
- `RETRY` oder aequivalenter Fehlerstatus: fuer erneute Verarbeitung vorgemerkt.
- `DEAD_LETTER`: nach definierten Versuchen nicht verarbeitet.

## Recovery Schritte

1. Dead-Letter Events ueber internen Recovery-Endpunkt erneut einreihen.
2. Fuer betroffene Tenants Subscription-/Billing-Status fachlich validieren.
3. Fehlende (nie empfangene) Events aus Stripe-Historie manuell nachziehen.
4. Reconciliation als Audit-relevanten Vorgang dokumentieren.

## Manueller Recovery-Trigger

- Endpoint: `POST /internal/billing/stripe-webhooks/dead-letter/recover`
- Authentifizierung: erforderlich.
- Typische Aufrufe:

```json
{"eventId":"evt_123"}
```

```json
{"limit":25}
```

## Verifikation

1. Fehlerrate fuer Webhook-Verarbeitung sinkt auf Normalniveau.
2. Dead-Letter-Backlog ist abgearbeitet oder kontrolliert ruecklaeufig.
3. Stichprobe betroffener Tenants: Plan-/Seat-Zustand fachlich korrekt.

## Eskalation

- Bei anhaltender Signatur-/Authentifizierungsproblematik an Platform/Security eskalieren.
- Bei Datenabweichungen trotz Recovery an Billing-Owner + DBA eskalieren.
