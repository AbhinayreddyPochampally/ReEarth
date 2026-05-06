-- =============================================================================
-- 004_personnel_ho_corporate.sql
-- (renamed from 003 — that number was already taken by 003_v1_schema_extensions.sql)
--
-- HO users are corporate (not facility-bound) per the 2026-05-06 rescope.
-- Inconsistency-I resolution in docs/decisions.md.
--
-- Changes:
--   - personnel.facility_id becomes NULLABLE. HO users have facility_id = NULL.
--   - Add personnel.email (NULL for contributors; required for HO users via CHECK).
--   - Add personnel.password_hash (NULL for contributors; required for HO users).
--   - Add personnel.is_super_user boolean (only meaningful for HO; default false).
--   - Add CHECK constraint enforcing the role/facility/email correlation.
--
-- The previous unique index `(facility_id, name) WHERE active_to IS NULL` is
-- preserved — it now only applies to rows where facility_id IS NOT NULL,
-- because partial indexes on a nullable column don't apply when it is null.
-- A separate unique index pins HO email uniqueness.
--
-- The FAC00001 = HO sentinel pattern from the prior seed is no longer used.
-- The seed script seeds HO users directly via the new HO_USERS export in
-- supabase/seed/data/facilities.ts.
-- =============================================================================

ALTER TABLE personnel
  ALTER COLUMN facility_id DROP NOT NULL;

ALTER TABLE personnel
  ADD COLUMN email          text,
  ADD COLUMN password_hash  text,
  ADD COLUMN is_super_user  boolean NOT NULL DEFAULT false;

-- A contributor must have a facility and no email/password.
-- A HO user must have an email and password and no facility.
ALTER TABLE personnel
  ADD CONSTRAINT personnel_role_consistency CHECK (
    (role = 'contributor' AND facility_id IS NOT NULL AND email IS NULL AND password_hash IS NULL AND is_super_user = false)
    OR
    (role = 'ho' AND facility_id IS NULL AND email IS NOT NULL AND password_hash IS NOT NULL)
  );

-- HO email uniqueness — case-insensitive.
CREATE UNIQUE INDEX idx_personnel_ho_email
  ON personnel (lower(email))
  WHERE role = 'ho' AND active_to IS NULL;
