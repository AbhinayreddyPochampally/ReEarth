// TypeScript types mirroring the database schema (001_core_schema.sql + 003).
// Keep these in sync with any schema migrations.

// Post-2026-05-06 rescope: only factory and warehouse. Retail stores out of scope.
export type FacilityType = 'factory' | 'warehouse';
export type PersonnelRole = 'contributor' | 'ho';
export type SubmissionStatus = 'pending' | 'approved' | 'sent_back' | 'resubmitted';
export type ParameterFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
export type EvidenceRequirement = 'required' | 'optional' | 'none';
export type EventType = 'standard' | 'hazardous_generation' | 'hazardous_disposal';

export interface Facility {
  id: string;
  sap_code: string;
  name: string;
  type: FacilityType;
  brand: string | null;
  city: string;
  state: string;
  pincode: string;
  address: string;
  // size_sqft removed in 2026-05-06 rescope; floor area is now a master_data
  // parameter, edited via the Master Data UI rather than carried on facilities.
  flags: Record<string, unknown>;
  pin_hash: string;
  pin_failed_attempts: number;
  pin_lockout_until: string | null;
  active_from: string;
  active_to: string | null;
}

export interface Personnel {
  id: string;
  // Nullable post-migration 003: HO users are corporate (facility_id = null).
  facility_id: string | null;
  name: string;
  designation: string;
  // Email + password_hash + is_super_user are HO-only (CHECK constraint enforced).
  email: string | null;
  password_hash: string | null;
  is_super_user: boolean;
  role: PersonnelRole;
  active_to: string | null;
}

export interface Parameter {
  id: string;
  code: string;
  name: string;
  unit: string;
  frequency: ParameterFrequency;
  evidence_required: EvidenceRequirement;
  category: string;
  active_to: string | null;
}

export interface Submission {
  id: string;
  facility_id: string;
  parameter_id: string;
  submitted_by: string;
  submitted_by_name: string;
  event_at: string;
  submitted_at: string;
  period_start: string;
  period_end: string;
  value_raw: string;
  unit_used: string;
  value_normalized: number;
  event_type: EventType;
  status: SubmissionStatus;
  created_at: string;
}

// Joined type used in the contributor home screen
export interface ParameterWithStatus extends Parameter {
  latest_submission: Pick<Submission, 'id' | 'status' | 'period_start' | 'submitted_at'> | null;
}
