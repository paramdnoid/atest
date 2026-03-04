CREATE TABLE team_invite_tokens (
    id            UUID PRIMARY KEY,
    tenant_id     UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invited_email TEXT         NOT NULL,
    role_key      TEXT         NOT NULL,
    token_hash    TEXT         NOT NULL UNIQUE,
    invited_by    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at    TIMESTAMPTZ  NOT NULL,
    accepted_at   TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX team_invite_tokens_tenant_idx ON team_invite_tokens(tenant_id);
CREATE INDEX team_invite_tokens_hash_idx   ON team_invite_tokens(token_hash);
