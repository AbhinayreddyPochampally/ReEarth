import type { AlertKind, BillKind, SubmissionStatus } from './types';

export interface TodaySummaryInput {
  facilityId: string;
}

export interface SubmissionUpsertInput {
  facilityId: string;
  parameterCode: string;
  observedAt: string;
  value: number;
  unit: string;
  photoAttachmentIds?: string[];
}

export interface BillSignedUploadUrlInput {
  facilityId: string;
  kind: BillKind;
  mime: string;
  bytes: number;
}

export interface BillListInput {
  confidence?: 'high' | 'mid' | 'lo';
  facilityId?: string;
  status?: 'queued' | 'ready_for_review' | 'approved' | 'sent_back';
  cursor?: string;
  limit?: number;
}

export interface AlertListInput {
  tab: AlertKind;
  status?: 'open' | 'acknowledged' | 'resolved' | 'all';
  facilityIds?: string[];
  cursor?: string;
  limit?: number;
}

export interface ExplorerInterpretation {
  template: 'compare_metric_by_facility' | 'metric_over_time' | 'metric_breakdown' | 'facility_kpis_for_window' | 'events_by_type_window';
  params: Record<string, string | number | string[]>;
  confidence: number;
  interpretation: { label: string; value: string }[];
}

export interface DiffProposal {
  // Widened 2026-05-06 to support the broader set of master-data tables that
  // NL master updates can target (design doc §39.2). 'unknown' is the explicit
  // unparseable-request shape; the UI surfaces a "couldn't interpret" panel.
  table: 'regulatory_limits' | 'alert_rules' | 'facility_configs' | 'vendors' | 'personnel' | 'unknown';
  affected: { id: string; label: string }[];
  close: { effectiveTo: string };
  insert: Record<string, string | number>;
  sideEffects: string[];
}

export interface SubmissionRow {
  id: string;
  facilityId: string;
  parameterCode: string;
  value: number;
  unit: string;
  status: SubmissionStatus;
}
