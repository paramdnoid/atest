CREATE TABLE IF NOT EXISTS entity_sync_state (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  server_version BIGINT NOT NULL DEFAULT 0,
  vector_clock_json TEXT NOT NULL DEFAULT '{}',
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  tombstoned_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, entity_type, entity_id)
);

ALTER TABLE client_operations
  ADD COLUMN IF NOT EXISTS operation_vector_json TEXT NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS server_vector_json TEXT NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS conflict_type TEXT,
  ADD COLUMN IF NOT EXISTS resolved_payload_json TEXT;

ALTER TABLE change_log
  ADD COLUMN IF NOT EXISTS device_id TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS operation_vector_json TEXT NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS result_vector_json TEXT NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS conflict BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS entity_sync_state_tenant_idx ON entity_sync_state(tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS change_log_entity_idx ON change_log(tenant_id, entity_type, entity_id, id DESC);
