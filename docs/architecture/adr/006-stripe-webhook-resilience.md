# ADR-006: Stripe Webhook Retry with Dead-Letter Queue

## Status
Accepted

## Context
Stripe sends webhooks for subscription lifecycle events (created, updated, cancelled, invoice paid/failed). These events drive subscription state in the application. Webhook processing can fail due to transient errors (database unavailable, application restart) or permanent errors (malformed payload, business logic bug).

Requirements:
- No webhook event should be silently lost
- Transient failures should be retried automatically
- Permanently failed events should be recoverable by operations
- Event deduplication (Stripe may send the same event multiple times)

## Decision
Implement a **webhook processing pipeline** with three stages:

1. **Ingestion**: Verify Stripe signature → deduplicate by `stripe_event_id` → persist with status `RECEIVED`
2. **Processing**: `StripeWebhookRetryWorker` (scheduled) scans for `RECEIVED` and `RETRY` events → process → mark `PROCESSED` or `RETRY`
3. **Dead-letter**: After max attempts (default 5), mark as `DEAD_LETTER` → ops team can recover via internal endpoint

**Retry strategy:**
- Exponential backoff: base delay 30s, max delay 1h
- Configurable: scan interval, batch size, max attempts
- Dead-letter recovery: cooldown 1h, max recovery attempts 3

**Monitoring:**
- `stripe_webhook_ingested_total` counter (by event type)
- `stripe_webhook_dead_letter_events` gauge

## Consequences

**Benefits:**
- No webhook is ever lost — all are persisted on receipt
- Transient failures are handled automatically with backoff
- Ops team can investigate and recover dead-letter events
- Event deduplication prevents duplicate processing
- Metrics provide visibility into webhook health

**Trade-offs:**
- Processing is eventually consistent (not real-time after ingestion)
- Dead-letter recovery endpoint needs operational access control
- Webhook event table grows over time (needs periodic cleanup)
- Retry worker adds a scheduled background task
