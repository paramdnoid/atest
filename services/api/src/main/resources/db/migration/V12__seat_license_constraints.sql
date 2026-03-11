-- Preflight recommendation (run manually before applying in production):
-- 1) Detect duplicate active seats:
--    SELECT tenant_id, user_id, COUNT(*) FROM seat_licenses
--    WHERE status = 'ACTIVE'
--    GROUP BY tenant_id, user_id
--    HAVING COUNT(*) > 1;
--
-- 2) Detect unexpected status values:
--    SELECT DISTINCT status FROM seat_licenses;

UPDATE seat_licenses
SET status = UPPER(status)
WHERE status IS NOT NULL;

ALTER TABLE seat_licenses
    DROP CONSTRAINT IF EXISTS seat_licenses_status_check;

ALTER TABLE seat_licenses
    ADD CONSTRAINT seat_licenses_status_check
    CHECK (status IN ('ACTIVE', 'REVOKED'));

CREATE UNIQUE INDEX IF NOT EXISTS seat_licenses_active_user_unique_idx
    ON seat_licenses (tenant_id, user_id)
    WHERE status = 'ACTIVE';
