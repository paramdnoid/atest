-- ARB-001: Auftragsabwicklung data model foundations
-- Scope: Kunden, Angebote, Aufmass, Abnahmen
-- Standards:
--  - tenant-scoped entities
--  - UUID primary keys
--  - TIMESTAMPTZ timestamps
--  - soft-delete columns where applicable

-- =========================================================
-- Kunden
-- =========================================================

CREATE TABLE IF NOT EXISTS ops_kunden (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    name TEXT NOT NULL,
    branche TEXT NOT NULL,
    segment TEXT NOT NULL,
    status TEXT NOT NULL,
    owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    score INTEGER NOT NULL DEFAULT 0,
    consent_state TEXT NOT NULL DEFAULT 'UNBEKANNT',
    retention_class TEXT NOT NULL DEFAULT 'STANDARD',
    region TEXT NOT NULL,
    next_follow_up_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT,
    CONSTRAINT ops_kunden_number_unique UNIQUE (tenant_id, number)
);

CREATE INDEX IF NOT EXISTS ops_kunden_tenant_status_idx
    ON ops_kunden (tenant_id, status);
CREATE INDEX IF NOT EXISTS ops_kunden_tenant_updated_idx
    ON ops_kunden (tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS ops_kunden_tenant_follow_up_idx
    ON ops_kunden (tenant_id, next_follow_up_at);
CREATE INDEX IF NOT EXISTS ops_kunden_name_region_idx
    ON ops_kunden (tenant_id, lower(name), lower(region));

CREATE TABLE IF NOT EXISTS ops_kunden_objekte (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    kunden_id UUID NOT NULL REFERENCES ops_kunden(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    objekt_typ TEXT NOT NULL,
    adresse TEXT NOT NULL,
    region TEXT NOT NULL,
    service_interval_days INTEGER NOT NULL,
    zugangshinweise TEXT,
    risk_class TEXT NOT NULL DEFAULT 'LOW',
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS ops_kunden_objekte_tenant_kunden_idx
    ON ops_kunden_objekte (tenant_id, kunden_id);

CREATE TABLE IF NOT EXISTS ops_kunden_ansprechpartner (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    kunden_id UUID NOT NULL REFERENCES ops_kunden(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    rolle TEXT NOT NULL,
    email TEXT NOT NULL,
    telefon TEXT NOT NULL,
    bevorzugter_kanal TEXT NOT NULL DEFAULT 'email',
    dsgvo_consent TEXT NOT NULL DEFAULT 'UNBEKANNT',
    status TEXT NOT NULL DEFAULT 'NEU',
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    last_contact_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS ops_kunden_ansprechpartner_tenant_kunden_idx
    ON ops_kunden_ansprechpartner (tenant_id, kunden_id);

CREATE TABLE IF NOT EXISTS ops_kunden_reminder (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    kunden_id UUID NOT NULL REFERENCES ops_kunden(id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    target_id UUID,
    title TEXT NOT NULL,
    priority TEXT NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    breach_state TEXT NOT NULL DEFAULT 'ON_TRACK',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS ops_kunden_reminder_tenant_due_idx
    ON ops_kunden_reminder (tenant_id, due_at);

CREATE TABLE IF NOT EXISTS ops_kunden_duplicate_candidate (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    kunden_id UUID NOT NULL REFERENCES ops_kunden(id) ON DELETE CASCADE,
    left_entity_id UUID NOT NULL,
    right_entity_id UUID NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    reasons_json TEXT NOT NULL DEFAULT '[]',
    resolution TEXT NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ops_kunden_duplicate_tenant_resolution_idx
    ON ops_kunden_duplicate_candidate (tenant_id, resolution);

CREATE TABLE IF NOT EXISTS ops_kunden_activity (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    kunden_id UUID NOT NULL REFERENCES ops_kunden(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    payload_json TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    visibility TEXT NOT NULL DEFAULT 'internal'
);

CREATE INDEX IF NOT EXISTS ops_kunden_activity_tenant_kunden_time_idx
    ON ops_kunden_activity (tenant_id, kunden_id, created_at DESC);

-- =========================================================
-- Angebote
-- =========================================================

CREATE TABLE IF NOT EXISTS ops_angebote (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    project_name TEXT NOT NULL,
    trade_label TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    note TEXT,
    selected_option_id UUID,
    converted_order_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT,
    CONSTRAINT ops_angebote_number_unique UNIQUE (tenant_id, number)
);

CREATE INDEX IF NOT EXISTS ops_angebote_tenant_status_idx
    ON ops_angebote (tenant_id, status);
CREATE INDEX IF NOT EXISTS ops_angebote_tenant_valid_until_idx
    ON ops_angebote (tenant_id, valid_until);
CREATE INDEX IF NOT EXISTS ops_angebote_tenant_updated_idx
    ON ops_angebote (tenant_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS ops_angebote_position (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    quote_id UUID NOT NULL REFERENCES ops_angebote(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL,
    quantity NUMERIC(14, 3) NOT NULL,
    unit_price_net NUMERIC(14, 2) NOT NULL,
    material_cost_net NUMERIC(14, 2) NOT NULL,
    labor_cost_net NUMERIC(14, 2) NOT NULL,
    discount_percent NUMERIC(5, 2),
    is_optional BOOLEAN NOT NULL DEFAULT FALSE,
    template_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS ops_angebote_position_tenant_quote_idx
    ON ops_angebote_position (tenant_id, quote_id);

CREATE TABLE IF NOT EXISTS ops_angebote_option (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    quote_id UUID NOT NULL REFERENCES ops_angebote(id) ON DELETE CASCADE,
    tier TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT NOT NULL,
    included_position_ids_json TEXT NOT NULL DEFAULT '[]',
    is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS ops_angebote_option_tenant_quote_idx
    ON ops_angebote_option (tenant_id, quote_id);

CREATE TABLE IF NOT EXISTS ops_angebote_approval_step (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    quote_id UUID NOT NULL REFERENCES ops_angebote(id) ON DELETE CASCADE,
    role_key TEXT NOT NULL,
    assignee TEXT NOT NULL,
    approved_at TIMESTAMPTZ,
    comment TEXT
);

CREATE INDEX IF NOT EXISTS ops_angebote_approval_step_tenant_quote_idx
    ON ops_angebote_approval_step (tenant_id, quote_id);

CREATE TABLE IF NOT EXISTS ops_angebote_audit_event (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    quote_id UUID NOT NULL REFERENCES ops_angebote(id) ON DELETE CASCADE,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ops_angebote_audit_tenant_quote_time_idx
    ON ops_angebote_audit_event (tenant_id, quote_id, created_at DESC);

-- =========================================================
-- Aufmass
-- =========================================================

CREATE TABLE IF NOT EXISTS ops_aufmass_record (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    project_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    site_name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    due_date TIMESTAMPTZ,
    status TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    revision_of_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT,
    CONSTRAINT ops_aufmass_number_unique UNIQUE (tenant_id, number)
);

CREATE INDEX IF NOT EXISTS ops_aufmass_tenant_status_updated_idx
    ON ops_aufmass_record (tenant_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS ops_aufmass_room (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    record_id UUID NOT NULL REFERENCES ops_aufmass_record(id) ON DELETE CASCADE,
    building TEXT NOT NULL,
    level_label TEXT NOT NULL,
    name TEXT NOT NULL,
    area_m2 NUMERIC(14, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS ops_aufmass_room_tenant_record_idx
    ON ops_aufmass_room (tenant_id, record_id);

CREATE TABLE IF NOT EXISTS ops_aufmass_position (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    record_id UUID NOT NULL REFERENCES ops_aufmass_record(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS ops_aufmass_position_tenant_record_idx
    ON ops_aufmass_position (tenant_id, record_id);

CREATE TABLE IF NOT EXISTS ops_aufmass_measurement (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    record_id UUID NOT NULL REFERENCES ops_aufmass_record(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES ops_aufmass_room(id) ON DELETE CASCADE,
    position_id UUID NOT NULL REFERENCES ops_aufmass_position(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    formula TEXT NOT NULL,
    formula_ast_json TEXT,
    formula_source TEXT,
    formula_migration_status TEXT,
    quantity NUMERIC(14, 3) NOT NULL,
    unit TEXT NOT NULL,
    note TEXT,
    photo_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS ops_aufmass_measurement_tenant_record_room_idx
    ON ops_aufmass_measurement (tenant_id, record_id, room_id);

CREATE TABLE IF NOT EXISTS ops_aufmass_mapping (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    record_id UUID NOT NULL REFERENCES ops_aufmass_record(id) ON DELETE CASCADE,
    position_id UUID NOT NULL REFERENCES ops_aufmass_position(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES ops_aufmass_room(id) ON DELETE CASCADE,
    mapped_by TEXT NOT NULL,
    mapped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS ops_aufmass_mapping_tenant_record_idx
    ON ops_aufmass_mapping (tenant_id, record_id);

CREATE TABLE IF NOT EXISTS ops_aufmass_review_issue (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    record_id UUID NOT NULL REFERENCES ops_aufmass_record(id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL,
    position_id UUID,
    room_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ops_aufmass_issue_tenant_record_severity_idx
    ON ops_aufmass_review_issue (tenant_id, record_id, severity);

CREATE TABLE IF NOT EXISTS ops_aufmass_audit_event (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    record_id UUID NOT NULL REFERENCES ops_aufmass_record(id) ON DELETE CASCADE,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ops_aufmass_audit_tenant_record_time_idx
    ON ops_aufmass_audit_event (tenant_id, record_id, created_at DESC);

-- =========================================================
-- Abnahmen
-- =========================================================

CREATE TABLE IF NOT EXISTS ops_abnahmen_record (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    project_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    site_name TEXT NOT NULL,
    trade_label TEXT NOT NULL,
    created_by TEXT NOT NULL,
    status TEXT NOT NULL,
    next_inspection_date TIMESTAMPTZ,
    is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT,
    CONSTRAINT ops_abnahmen_number_unique UNIQUE (tenant_id, number)
);

CREATE INDEX IF NOT EXISTS ops_abnahmen_tenant_status_updated_idx
    ON ops_abnahmen_record (tenant_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS ops_abnahmen_protocol (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    abnahme_id UUID NOT NULL UNIQUE REFERENCES ops_abnahmen_record(id) ON DELETE CASCADE,
    acceptance_type TEXT NOT NULL,
    inspection_date TIMESTAMPTZ,
    appointment_date TIMESTAMPTZ,
    place TEXT,
    reservation_text TEXT,
    signoff_status TEXT NOT NULL DEFAULT 'unsigned',
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ops_abnahmen_participant (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    abnahme_id UUID NOT NULL REFERENCES ops_abnahmen_record(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role_label TEXT NOT NULL,
    company TEXT,
    present BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ops_abnahmen_participant_tenant_abnahme_idx
    ON ops_abnahmen_participant (tenant_id, abnahme_id);

CREATE TABLE IF NOT EXISTS ops_abnahmen_defect (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    abnahme_id UUID NOT NULL REFERENCES ops_abnahmen_record(id) ON DELETE CASCADE,
    ref TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL,
    location_text TEXT NOT NULL,
    room_label TEXT,
    assigned_to TEXT,
    due_date TIMESTAMPTZ,
    reopen_count INTEGER NOT NULL DEFAULT 0,
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS ops_abnahmen_defect_tenant_abnahme_status_idx
    ON ops_abnahmen_defect (tenant_id, abnahme_id, status);

CREATE TABLE IF NOT EXISTS ops_abnahmen_rework (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    abnahme_id UUID NOT NULL REFERENCES ops_abnahmen_record(id) ON DELETE CASCADE,
    defect_id UUID NOT NULL REFERENCES ops_abnahmen_defect(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    owner TEXT NOT NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    notes_json TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS ops_abnahmen_rework_tenant_abnahme_status_idx
    ON ops_abnahmen_rework (tenant_id, abnahme_id, status);

CREATE TABLE IF NOT EXISTS ops_abnahmen_evidence (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    abnahme_id UUID NOT NULL REFERENCES ops_abnahmen_record(id) ON DELETE CASCADE,
    defect_id UUID REFERENCES ops_abnahmen_defect(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    created_by TEXT NOT NULL,
    has_people BOOLEAN NOT NULL DEFAULT FALSE,
    has_license_plate BOOLEAN NOT NULL DEFAULT FALSE,
    redacted BOOLEAN NOT NULL DEFAULT FALSE,
    legal_basis TEXT,
    geo_lat DOUBLE PRECISION,
    geo_lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS ops_abnahmen_evidence_tenant_abnahme_idx
    ON ops_abnahmen_evidence (tenant_id, abnahme_id);

CREATE TABLE IF NOT EXISTS ops_abnahmen_audit_event (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    abnahme_id UUID NOT NULL REFERENCES ops_abnahmen_record(id) ON DELETE CASCADE,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ops_abnahmen_audit_tenant_abnahme_time_idx
    ON ops_abnahmen_audit_event (tenant_id, abnahme_id, created_at DESC);
