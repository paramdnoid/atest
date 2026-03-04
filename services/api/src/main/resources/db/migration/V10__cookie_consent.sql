CREATE TABLE cookie_consents (
    id UUID PRIMARY KEY,
    visitor_id TEXT NOT NULL,
    consent_value TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX cookie_consents_visitor_idx ON cookie_consents(visitor_id);
