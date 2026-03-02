ALTER TABLE stripe_webhook_events
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS last_failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dead_lettered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recovery_attempts INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS stripe_webhook_events_dead_letter_idx
  ON stripe_webhook_events(status, dead_lettered_at);
