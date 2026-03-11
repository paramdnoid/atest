CREATE TABLE mfa_email_codes (
    id          UUID            PRIMARY KEY,
    user_id     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash   TEXT            NOT NULL,
    expires_at  TIMESTAMPTZ     NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_mfa_email_codes_user_id   ON mfa_email_codes(user_id);
CREATE INDEX idx_mfa_email_codes_code_hash ON mfa_email_codes(code_hash);
