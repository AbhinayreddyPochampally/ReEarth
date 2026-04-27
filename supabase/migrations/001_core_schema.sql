-- =============================================================================
-- 001_core_schema.sql — ReEarth 2.0 demo, Wave 1 core schema
--
-- See:
--   docs/foundation.docx Section 8 + Appendix B (column-level)
--   docs/decisions.md (every deviation logged)
--   docs/playbooks/current-wave.md Task 1.3
--
-- Tables created (12):
--   facilities, personnel, parameters, parameter_assignments,
--   submissions, evidence, hazardous_events,
--   regulatory_limits, compliance_breaches,
--   audit_log,
--   discussion_threads, discussion_messages
--
-- Key design decisions encoded here:
--   - Soft delete via active_from/active_to on master tables
--   - All FKs use ON DELETE RESTRICT (decision #5)
--   - PIN: bcrypt only, no separate pin_salt (decision #8)
--   - Conditional flags: single jsonb on facilities (decision B revert)
--   - Discussions: normalized two-table design (decision D)
--   - Hazardous: hybrid submissions + hazardous_events with FIFO running_balance
--     maintained by AFTER INSERT trigger (decision #4)
--   - Audit log: trigger-blocked UPDATE/DELETE + REVOKE (decision #1)
--   - RLS enabled on all tables, permissive (decision #6)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
CREATE TYPE facility_type AS ENUM ('factory', 'warehouse', 'store');
CREATE TYPE personnel_role AS ENUM ('contributor', 'ho');
CREATE TYPE parameter_frequency AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'annual');
CREATE TYPE evidence_requirement AS ENUM ('required', 'optional', 'none');
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'sent_back', 'resubmitted');
CREATE TYPE submission_event_type AS ENUM ('standard', 'hazardous_generation', 'hazardous_disposal');
CREATE TYPE review_queue AS ENUM ('express', 'standard', 'deep', 'compliance');
CREATE TYPE evidence_kind AS ENUM ('utility_bill', 'lab_report', 'photo', 'manifest', 'other');
CREATE TYPE thread_status AS ENUM ('open', 'resolved');
CREATE TYPE limit_kind AS ENUM ('max', 'min', 'range');
CREATE TYPE breach_severity AS ENUM ('warning', 'critical');

-- -----------------------------------------------------------------------------
-- Shared updated_at trigger function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. facilities
-- =============================================================================
CREATE TABLE facilities (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sap_code             text NOT NULL UNIQUE,
  name                 text NOT NULL,
  type                 facility_type NOT NULL,
  brand                text,
  city                 text NOT NULL,
  state                text NOT NULL,
  pincode              text NOT NULL,
  address              text NOT NULL,
  size_sqft            numeric,
  flags                jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- PIN auth (bcrypt; salt embedded in hash, no pin_salt column per decision #8)
  pin_hash             text NOT NULL,
  pin_active_from      timestamptz NOT NULL DEFAULT now(),
  pin_last_rotated     timestamptz NOT NULL DEFAULT now(),
  pin_lockout_until    timestamptz,
  pin_failed_attempts  smallint NOT NULL DEFAULT 0,
  -- soft delete (decision #5)
  active_from          timestamptz NOT NULL DEFAULT now(),
  active_to            timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER facilities_set_updated_at BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 2. personnel
-- =============================================================================
CREATE TABLE personnel (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id          uuid NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  name                 text NOT NULL,
  designation          text NOT NULL,
  contact_phone_number text,                            -- Section 28.1
  role                 personnel_role NOT NULL,
  active_from          timestamptz NOT NULL DEFAULT now(),
  active_to            timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER personnel_set_updated_at BEFORE UPDATE ON personnel
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 3. parameters (catalog)
-- =============================================================================
CREATE TABLE parameters (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                 text NOT NULL UNIQUE,            -- e.g. 'ELEC_KWH'
  name                 text NOT NULL,
  unit                 text NOT NULL,                   -- canonical unit
  frequency            parameter_frequency NOT NULL,
  evidence_required    evidence_requirement NOT NULL DEFAULT 'optional',
  category             text NOT NULL,                   -- e.g. 'energy', 'water', 'waste_haz'
  active_from          timestamptz NOT NULL DEFAULT now(),
  active_to            timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER parameters_set_updated_at BEFORE UPDATE ON parameters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 4. parameter_assignments (which parameters apply to which facility)
-- =============================================================================
CREATE TABLE parameter_assignments (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id          uuid NOT NULL REFERENCES facilities(id)  ON DELETE RESTRICT,
  parameter_id         uuid NOT NULL REFERENCES parameters(id) ON DELETE RESTRICT,
  active_from          timestamptz NOT NULL DEFAULT now(),
  active_to            timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  -- One active assignment per (facility, parameter) at a time. Historical rows
  -- with non-null active_to coexist; the partial index enforces the rule.
  CONSTRAINT parameter_assignments_unique_active_pair
    EXCLUDE USING btree (facility_id WITH =, parameter_id WITH =)
    WHERE (active_to IS NULL)
);

-- =============================================================================
-- 5. submissions (universal review/audit anchor)
-- =============================================================================
CREATE TABLE submissions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id              uuid NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  parameter_id             uuid NOT NULL REFERENCES parameters(id) ON DELETE RESTRICT,
  submitted_by             uuid NOT NULL REFERENCES personnel(id) ON DELETE RESTRICT,
  submitted_by_name        text NOT NULL,                          -- snapshot for attribution
  -- Three timestamps per Section 20.1
  event_at                 timestamptz NOT NULL,                   -- when the bill/measurement occurred
  submitted_at             timestamptz NOT NULL,                   -- when contributor pressed Submit (client clock)
  synced_at                timestamptz NOT NULL DEFAULT now(),     -- when server persisted
  -- Period
  period_start             date NOT NULL,
  period_end               date NOT NULL,
  -- Value + OCR (Section 20)
  value_raw                text NOT NULL,                          -- as the user entered
  unit_used                text NOT NULL,                          -- as the user entered
  value_normalized         numeric NOT NULL,                       -- normalized to parameter.unit
  ocr_run                  boolean NOT NULL DEFAULT false,
  ocr_value                numeric,
  ocr_confidence           numeric,                                -- 0.0–1.0
  -- Hazardous discriminator (Section 29.4)
  event_type               submission_event_type NOT NULL DEFAULT 'standard',
  -- Routing + status (Sections 33–39)
  routed_queue             review_queue,                           -- nullable until Wave 2 routing logic runs
  status                   submission_status NOT NULL DEFAULT 'pending',
  evidence_quality_score   numeric,                                -- nullable; Wave 2
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT submissions_period_check CHECK (period_end >= period_start),
  CONSTRAINT submissions_ocr_confidence_range CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 1))
);
CREATE TRIGGER submissions_set_updated_at BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- 6. evidence
-- =============================================================================
CREATE TABLE evidence (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id        uuid NOT NULL REFERENCES submissions(id) ON DELETE RESTRICT,
  storage_path         text NOT NULL,                              -- Supabase Storage path
  evidence_type        evidence_kind NOT NULL DEFAULT 'other',
  mime_type            text,
  file_size_bytes      bigint,
  ocr_extracted_text   text,                                       -- Wave 3 fills this in
  ocr_confidence       numeric,
  uploaded_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evidence_ocr_confidence_range CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 1))
);

-- =============================================================================
-- 7. hazardous_events (FIFO ledger child of submissions)
-- =============================================================================
CREATE TABLE hazardous_events (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id                 uuid NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE RESTRICT,
  -- For generation events: batch_id = id (self-reference, set in trigger).
  -- For disposal events: batch_id = the generation event being depleted.
  batch_id                      uuid,
  generation_date               date NOT NULL,                     -- date of the originating generation
  category                      text NOT NULL,                     -- 'used_oil', 'batteries', etc.
  quantity                      numeric NOT NULL CHECK (quantity > 0),
  running_balance               numeric NOT NULL DEFAULT 0,        -- maintained by trigger
  manifest_number               text,                              -- disposal events
  handler_authorization_id      text,                              -- disposal events
  created_at                    timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 8. regulatory_limits (master, effective-dated)
-- =============================================================================
CREATE TABLE regulatory_limits (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter_id         uuid NOT NULL REFERENCES parameters(id) ON DELETE RESTRICT,
  facility_id          uuid REFERENCES facilities(id) ON DELETE RESTRICT,  -- null = global default
  state_code           text,                                       -- null = applies to any state
  regulatory_limit     numeric NOT NULL,
  limit_unit           text NOT NULL,
  limit_type           limit_kind NOT NULL,                        -- max / min / range
  regulatory_source    text NOT NULL,                              -- e.g. 'CPCB GSR 612(E) 2010, Consent No. KSPCB/2024/XYZ'
  effective_from       date NOT NULL,
  effective_to         date,                                       -- null = currently in force
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 9. compliance_breaches (per-submission, immutable record)
-- =============================================================================
CREATE TABLE compliance_breaches (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id            uuid NOT NULL REFERENCES submissions(id) ON DELETE RESTRICT,
  regulatory_limit_id      uuid NOT NULL REFERENCES regulatory_limits(id) ON DELETE RESTRICT,
  observed_value           numeric NOT NULL,
  limit_value_at_event     numeric NOT NULL,                       -- denormalized snapshot of the limit at detection time
  severity                 breach_severity NOT NULL,
  detected_at              timestamptz NOT NULL DEFAULT now(),
  resolved_at              timestamptz,
  resolved_by              uuid REFERENCES personnel(id) ON DELETE RESTRICT,
  resolution_notes         text
);

-- =============================================================================
-- 10. audit_log (append-only)
-- =============================================================================
CREATE TABLE audit_log (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type           text NOT NULL,                              -- 'submission_approved', 'pin_login_failed', etc.
  actor_id             uuid REFERENCES personnel(id) ON DELETE RESTRICT,
  entity_type          text NOT NULL,                              -- 'submission', 'facility', 'pin', etc.
  entity_id            uuid NOT NULL,
  "timestamp"          timestamptz NOT NULL DEFAULT now(),
  metadata             jsonb
);

-- Append-only enforcement: trigger blocks UPDATE/DELETE for everyone (decision #1).
-- The trigger fires for the service role too; only TRUNCATE bypasses it.
CREATE OR REPLACE FUNCTION audit_log_block_mutations()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only; % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutations();
CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutations();

-- Belt-and-braces: revoke UPDATE/DELETE on the SQL grant level too.
-- (anon/authenticated never had these, but service_role does by default.)
REVOKE UPDATE, DELETE ON audit_log FROM anon, authenticated, service_role;

-- =============================================================================
-- 11. discussion_threads
-- 12. discussion_messages
-- (normalized two-table design — decision D, deviation from Appendix B)
-- =============================================================================
CREATE TABLE discussion_threads (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id        uuid NOT NULL REFERENCES submissions(id) ON DELETE RESTRICT,
  status               thread_status NOT NULL DEFAULT 'open',
  created_at           timestamptz NOT NULL DEFAULT now(),
  resolved_at          timestamptz
);

CREATE TABLE discussion_messages (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id            uuid NOT NULL REFERENCES discussion_threads(id) ON DELETE RESTRICT,
  author_id            uuid NOT NULL REFERENCES personnel(id) ON DELETE RESTRICT,
  author_role          personnel_role NOT NULL,                    -- denormalized for queryability
  message_text         text NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- Hazardous FIFO running_balance trigger
--
-- Recomputes running_balance for every hazardous_event in the same
-- (facility_id, category) ledger after each insert. A backdated insert
-- correctly updates all later events' balances because the recompute
-- iterates the entire ledger ordered by submissions.event_at.
--
-- The trigger is INSERT-only on hazardous_events; the UPDATE it issues to
-- maintain running_balance does not re-fire the trigger.
--
-- For generation events the batch_id is set to the row's own id.
-- For disposal events the batch_id is whatever the caller provided (link
-- to the generation event being depleted).
-- =============================================================================
CREATE OR REPLACE FUNCTION recompute_hazardous_running_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_facility_id uuid;
BEGIN
  -- Look up the facility from the parent submission
  SELECT s.facility_id INTO v_facility_id
  FROM submissions s
  WHERE s.id = NEW.submission_id;

  -- For generation events, ensure batch_id self-references (caller may have
  -- left it null; we set it here so the FIFO link is consistent).
  IF NEW.batch_id IS NULL THEN
    UPDATE hazardous_events SET batch_id = NEW.id WHERE id = NEW.id;
  END IF;

  -- Recompute the entire ledger for this (facility, category).
  -- Generation events add to the running balance; disposal events subtract.
  WITH ordered AS (
    SELECT
      he.id,
      SUM(
        CASE s.event_type
          WHEN 'hazardous_generation' THEN he.quantity
          WHEN 'hazardous_disposal'   THEN -he.quantity
          ELSE 0
        END
      ) OVER (ORDER BY s.event_at, he.created_at, he.id) AS new_balance
    FROM hazardous_events he
    JOIN submissions s ON s.id = he.submission_id
    WHERE s.facility_id = v_facility_id
      AND he.category = NEW.category
  )
  UPDATE hazardous_events he
  SET running_balance = ordered.new_balance
  FROM ordered
  WHERE he.id = ordered.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hazardous_events_recompute_after_insert
AFTER INSERT ON hazardous_events
FOR EACH ROW EXECUTE FUNCTION recompute_hazardous_running_balance();

-- =============================================================================
-- Indexes (per plan section 8 — supports Wave 2 hot queries)
-- =============================================================================
-- Auth lookup by SAP code
-- (UNIQUE on facilities.sap_code already creates an index)

-- HO review queue: pending submissions, optionally filtered by queue
CREATE INDEX idx_submissions_status_queue_submitted
  ON submissions (status, routed_queue, submitted_at DESC);

-- Data explorer: filter by facility + parameter + time
CREATE INDEX idx_submissions_facility_parameter_event
  ON submissions (facility_id, parameter_id, event_at DESC);

-- Data explorer secondary: filter by parameter across all facilities
CREATE INDEX idx_submissions_parameter_event
  ON submissions (parameter_id, event_at DESC);

-- Audit search: recent entries on a given entity
CREATE INDEX idx_audit_log_entity
  ON audit_log (entity_type, entity_id, "timestamp" DESC);

-- Personnel name dropdown at login
CREATE INDEX idx_personnel_facility_name
  ON personnel (facility_id, name)
  WHERE active_to IS NULL;

-- Hazardous FIFO ledger lookup
CREATE INDEX idx_hazardous_events_category_submission
  ON hazardous_events (category, submission_id);

-- Discussions on a submission
CREATE INDEX idx_discussion_threads_submission
  ON discussion_threads (submission_id, created_at DESC);
CREATE INDEX idx_discussion_messages_thread
  ON discussion_messages (thread_id, created_at);

-- Regulatory limit resolution
CREATE INDEX idx_regulatory_limits_lookup
  ON regulatory_limits (parameter_id, facility_id, effective_from, effective_to);

-- Compliance breaches feed
CREATE INDEX idx_compliance_breaches_detected
  ON compliance_breaches (severity, detected_at DESC)
  WHERE resolved_at IS NULL;

-- Evidence by submission
CREATE INDEX idx_evidence_submission
  ON evidence (submission_id);

-- =============================================================================
-- Row-Level Security (decision #6 — cosmetic backstop)
-- All access from web/lib/db/ uses the service role and bypasses RLS.
-- These policies exist to silence Supabase warnings and to be a safety net
-- if anon/authenticated calls ever leak in by mistake.
-- =============================================================================
ALTER TABLE facilities             ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel              ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters             ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameter_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence               ENABLE ROW LEVEL SECURITY;
ALTER TABLE hazardous_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_limits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_breaches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log              ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_threads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_messages    ENABLE ROW LEVEL SECURITY;

-- Deny-by-default: no policies = no access for anon/authenticated.
-- Service role bypasses RLS, so application access still works.
-- If we later need anon/authenticated reads, add specific policies then.
