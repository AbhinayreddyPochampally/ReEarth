export type FacilityKind = 'factory' | 'warehouse';
export type PersonnelRole = 'contributor' | 'ho';
export type ParameterCadence = 'daily' | 'event' | 'monthly_bill' | 'monthly_summary';
export type ParameterCategory = 'energy' | 'water' | 'waste' | 'emissions' | 'compliance';
export type SubmissionStatus = 'draft' | 'pending' | 'approved' | 'sent_back';
export type BillStatus = 'queued' | 'ready_for_review' | 'approved' | 'sent_back';
export type BillKind = 'electricity' | 'diesel' | 'water' | 'lab_report' | 'solar_ppa';
export type AlertKind = 'compliance' | 'threshold' | 'gap';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved';
export type Severity = 'info' | 'warn' | 'critical';

export interface Facility {
  id: string;
  sapCode: string;
  name: string;
  kind: FacilityKind;
  city: string;
  state: string;
  areaSqft: number;
  contributors: number;
  live: boolean;
  flags: {
    hasDg: boolean;
    hasBoiler: boolean;
    hasSolar: boolean;
    hasStp: boolean;
    hasGroundwater: boolean;
    hasCanteen: boolean;
  };
}

export interface Personnel {
  id: string;
  name: string;
  role: PersonnelRole;
  facilityIds: string[];
}

export interface Parameter {
  code: string;
  label: string;
  category: ParameterCategory;
  unit: string;
  cadence: ParameterCadence;
  min: number;
  max: number;
  softMin: number;
  softMax: number;
  decimals: number;
}

export interface Submission {
  id: string;
  facilityId: string;
  parameterCode: string;
  observedAt: string;
  value: number;
  unit: string;
  status: SubmissionStatus;
  enteredBy: string;
  source: 'manual' | 'bill_ocr' | 'event';
}

export interface LogActivity {
  id: string;
  facilityId: string;
  actor: string;
  title: string;
  detail: string;
  atLabel: string;
  tone: 'good' | 'warn' | 'info';
}

export interface ParameterTrend {
  parameterCode: string;
  facilityId: string;
  label: string;
  unit: string;
  values: number[];
  threshold?: number;
}

export interface BillExtractedField {
  key: string;
  label: string;
  rawText: string;
  parsedValue: number | string;
  unit: string;
  confidence: number;
  page: number;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface Bill {
  id: string;
  facilityId: string;
  kind: BillKind;
  vendor: string;
  period: string;
  uploadedBy: string;
  ageHours: number;
  status: BillStatus;
  confidence: number;
  extracted: BillExtractedField[];
  breach: boolean;
  /**
   * Optional path to a sample image (relative to /public, e.g.
   * `/sample-bills/electricity-bescom.svg`). Phase 3 swaps this for a real
   * Supabase Storage URL. When omitted, the bill detail page renders a
   * plain "no preview" fallback.
   */
  imageUrl?: string;
}

export interface Alert {
  id: string;
  facilityId: string;
  kind: AlertKind;
  status: AlertStatus;
  severity: Severity;
  title: string;
  body: string;
  source: string;
  ageHours: number;
}

export interface Comment {
  id: string;
  ownerKind: 'bill' | 'alert' | 'event' | 'submission';
  ownerId: string;
  author: string;
  body: string;
  at: string;
}

export interface MonthlySummary {
  id: string;
  facilityId: string;
  yearMonth: string;
  draftText: string;
  signedOffAt: string | null;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  entityKind: string;
  entityId: string;
  at: string;
}

export interface AiCallLog {
  id: string;
  promptName: string;
  provider: 'mock' | 'azure_openai';
  model: string;
  latencyMs: number;
  cached: boolean;
  at: string;
}
