-- 003_v1_schema_extensions.sql
-- ReEarth 2.0 V1 schema extension for the 15-facility ABFRL design document.
-- This migration is additive so the existing Wave 1 demo data remains inspectable.

DO $$
BEGIN
  CREATE TYPE bill_status AS ENUM ('queued', 'ready_for_review', 'approved', 'sent_back');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE bill_kind AS ENUM ('electricity', 'diesel', 'water', 'lab_report', 'solar_ppa');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE alert_kind AS ENUM ('compliance', 'threshold', 'gap');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE alert_status AS ENUM ('open', 'acknowledged', 'resolved');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE alert_severity AS ENUM ('info', 'warn', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  kind bill_kind NOT NULL,
  vendor text NOT NULL,
  period_label text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES personnel(id) ON DELETE RESTRICT,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  status bill_status NOT NULL DEFAULT 'queued',
  ocr_confidence numeric CHECK (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 1)),
  approved_by uuid REFERENCES personnel(id) ON DELETE RESTRICT,
  approved_at timestamptz,
  sent_back_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bill_extracted_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE RESTRICT,
  field_key text NOT NULL,
  label text NOT NULL,
  raw_text text NOT NULL,
  parsed_value numeric,
  parsed_text text,
  unit text,
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  page integer NOT NULL DEFAULT 1,
  bbox jsonb NOT NULL DEFAULT '{"x":0,"y":0,"w":0,"h":0}'::jsonb,
  edited_by uuid REFERENCES personnel(id) ON DELETE RESTRICT,
  edited_at timestamptz
);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  logged_by uuid NOT NULL REFERENCES personnel(id) ON DELETE RESTRICT,
  status submission_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind alert_kind NOT NULL,
  name text NOT NULL,
  parameter_id uuid REFERENCES parameters(id) ON DELETE RESTRICT,
  comparator text,
  threshold numeric,
  facility_scope jsonb NOT NULL DEFAULT '{"kind":"all"}'::jsonb,
  severity alert_severity NOT NULL DEFAULT 'warn',
  effective_from date NOT NULL,
  effective_to date,
  created_by uuid NOT NULL REFERENCES personnel(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) ON DELETE RESTRICT,
  rule_id uuid REFERENCES alert_rules(id) ON DELETE RESTRICT,
  kind alert_kind NOT NULL,
  severity alert_severity NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  triggered_by uuid,
  triggered_by_kind text,
  status alert_status NOT NULL DEFAULT 'open',
  acknowledged_by uuid REFERENCES personnel(id) ON DELETE RESTRICT,
  acknowledged_at timestamptz,
  resolved_by uuid REFERENCES personnel(id) ON DELETE RESTRICT,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_kind text NOT NULL,
  owner_id uuid NOT NULL,
  author_id uuid NOT NULL REFERENCES personnel(id) ON DELETE RESTRICT,
  body text NOT NULL,
  mentioned_ids uuid[],
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS monthly_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE RESTRICT,
  year_month date NOT NULL,
  draft_text text NOT NULL,
  kpi_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  signed_off_by uuid REFERENCES personnel(id) ON DELETE RESTRICT,
  signed_off_at timestamptz,
  sent_back_reason text,
  UNIQUE (facility_id, year_month)
);

CREATE TABLE IF NOT EXISTS ai_call_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES personnel(id) ON DELETE RESTRICT,
  prompt_name text NOT NULL,
  provider text NOT NULL,
  model text NOT NULL,
  input_hash text NOT NULL,
  output_summary text,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer NOT NULL,
  cached boolean NOT NULL DEFAULT false,
  error_code text,
  at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_extracted_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_call_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_bills_status_uploaded ON bills (status, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_bill_fields_bill ON bill_extracted_fields (bill_id);
CREATE INDEX IF NOT EXISTS idx_alerts_kind_status ON alerts (kind, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_owner ON comments (owner_kind, owner_id, created_at);
CREATE INDEX IF NOT EXISTS idx_monthly_summaries_facility_month ON monthly_summaries (facility_id, year_month DESC);
