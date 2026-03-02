ALTER TABLE users
    ADD COLUMN IF NOT EXISTS full_name         TEXT,
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS trade_slug   TEXT,
    ADD COLUMN IF NOT EXISTS address_json TEXT;

CREATE TABLE IF NOT EXISTS email_verification_tokens
(
    id         UUID PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash TEXT        NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_verification_tokens_user_idx ON email_verification_tokens (user_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens
(
    id         UUID PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash TEXT        NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens (user_id);
