-- =============================================================================
-- 002_audit_log_fk_set_null.sql
--
-- Changes audit_log.actor_id FK from ON DELETE RESTRICT to ON DELETE SET NULL.
--
-- Why: RESTRICT blocks seed re-runs when audit_log has entries from smoke tests
-- or prior app usage.  SET NULL is the correct semantic: if a personnel record
-- is deleted (e.g. staff turnover, demo reset), the audit trail entry is
-- preserved but the attribution becomes null ("person since removed").
-- This is better than refusing the deletion or cascading the delete into the
-- audit log (which would destroy the history).
--
-- Apply via: Supabase SQL Editor → paste and run.
-- =============================================================================

ALTER TABLE audit_log
  DROP CONSTRAINT IF EXISTS audit_log_actor_id_fkey;

ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_actor_id_fkey
    FOREIGN KEY (actor_id)
    REFERENCES personnel(id)
    ON DELETE SET NULL;
