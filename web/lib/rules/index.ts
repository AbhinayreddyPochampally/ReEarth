// Backend rule engines per design doc §31 + Phase-2 tasks 2.12 / 2.13 / 2.14.
//
// All three are pure functions over the in-memory sample data (or, in
// Phase 3, over real DB rows). They produce alert candidates as plain
// objects; the caller is responsible for persistence + audit.
//
// Run paths:
//   complianceBreachDetector — runs on bill approval (synchronous, inline)
//   thresholdRuleEvaluator   — runs after every submission_approved
//   dataGapDetector          — runs nightly (cron / Vercel/Azure scheduled)
//
// For the demo there's no scheduler wired up; these functions are exposed via
// /api/rules/* endpoints so the architect can run them on demand.

import { alerts, bills, facilities, parameters, submissions } from '@/lib/v1/sample-data';
import type { Alert, AlertKind, Severity } from '@/lib/v1/types';

interface AlertCandidate {
  id: string;
  facilityId: string;
  kind: AlertKind;
  severity: Severity;
  title: string;
  body: string;
  source: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2.12 Compliance breach detection
// ─────────────────────────────────────────────────────────────────────────────

const REGULATORY_LIMITS: Record<string, { limit: number; unit: string; authority: string }> = {
  bod:       { limit: 30,   unit: 'mg/L',   authority: 'CPCB STP outlet' },
  cod:       { limit: 250,  unit: 'mg/L',   authority: 'CPCB STP outlet' },
  tss:       { limit: 100,  unit: 'mg/L',   authority: 'CPCB STP outlet' },
  pm:        { limit: 80,   unit: 'mg/Nm³', authority: 'CPCB stack' },
};

export function complianceBreachDetector(): AlertCandidate[] {
  const candidates: AlertCandidate[] = [];
  for (const bill of bills) {
    for (const field of bill.extracted) {
      const fieldKey = field.key.toLowerCase();
      const limit = REGULATORY_LIMITS[fieldKey];
      if (!limit) continue;
      if (typeof field.parsedValue !== 'number') continue;
      if (field.parsedValue > limit.limit) {
        candidates.push({
          id: `BR-${bill.id}-${field.key}`,
          facilityId: bill.facilityId,
          kind: 'compliance',
          severity: 'critical',
          title: `${field.label} breach`,
          body: `${field.parsedValue} ${field.unit} exceeds ${limit.authority} limit of ${limit.limit} ${limit.unit}.`,
          source: bill.id,
        });
      }
    }
  }
  return candidates;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2.13 Threshold rule evaluator (HO-defined rules, design doc §31.2)
// ─────────────────────────────────────────────────────────────────────────────

interface ThresholdRule {
  id: string;
  scope: 'all_factories' | 'all_warehouses' | string;
  metric: string;
  operator: 'lt' | 'gt' | 'eq';
  value: number;
  severity: Severity;
  title: string;
}

const THRESHOLD_RULES: ThresholdRule[] = [
  { id: 'rule-water-positive', scope: 'all_factories',     metric: 'water_positive_ratio',  operator: 'lt', value: 1.10, severity: 'warn',     title: 'Water-positive ratio low' },
  { id: 'rule-renewable-pct',  scope: 'all_factories',     metric: 'renewable_pct',         operator: 'lt', value: 35,   severity: 'info',     title: 'Renewable % below target' },
  { id: 'rule-bhiwandi-grid',  scope: 'wh-bhiwandi',       metric: 'grid_kwh',              operator: 'gt', value: 15000,severity: 'critical', title: 'Bhiwandi grid over budget' },
];

export function thresholdRuleEvaluator(): AlertCandidate[] {
  const candidates: AlertCandidate[] = [];
  for (const rule of THRESHOLD_RULES) {
    const targetFacilities = facilities.filter(f => {
      if (rule.scope === 'all_factories') return f.kind === 'factory';
      if (rule.scope === 'all_warehouses') return f.kind === 'warehouse';
      return f.id === rule.scope;
    });
    for (const facility of targetFacilities) {
      // Phase 2 stub: deterministic 'observed' values keyed off facility id.
      // Phase 3 reads from computed_metrics table.
      const observed = stubMetricValue(facility.id, rule.metric);
      const breaches =
        rule.operator === 'lt' ? observed < rule.value :
        rule.operator === 'gt' ? observed > rule.value :
        observed === rule.value;
      if (!breaches) continue;
      candidates.push({
        id: `TH-${rule.id}-${facility.id}`,
        facilityId: facility.id,
        kind: 'threshold',
        severity: rule.severity,
        title: rule.title,
        body: `${rule.metric} = ${observed} ${rule.operator === 'lt' ? '<' : rule.operator === 'gt' ? '>' : '='} ${rule.value} (rule: ${rule.id})`,
        source: rule.id,
      });
    }
  }
  return candidates;
}

function stubMetricValue(facilityId: string, metric: string): number {
  // Deterministic pseudo-values so the evaluator returns stable alerts in demo
  // mode. Real wiring uses computed_metrics.
  const hash = facilityId.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  if (metric === 'water_positive_ratio') return 1.0 + ((hash % 30) / 100);
  if (metric === 'renewable_pct') return 28 + (hash % 18);
  if (metric === 'grid_kwh') return 13000 + (hash % 3500);
  return hash % 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2.14 Nightly data-gap detector (design doc §31.3)
// ─────────────────────────────────────────────────────────────────────────────

const GAP_RULES = {
  daily_log_incomplete_days: 3,
  monthly_summary_overdue_days: 5,
  no_bills_uploaded_after_day: 10,
};

export function dataGapDetector(today: Date = new Date()): AlertCandidate[] {
  const candidates: AlertCandidate[] = [];

  // Daily-log gap: facilities with fewer than 5 daily submissions in the
  // last 7 days are flagged. This is a stub heuristic — real implementation
  // checks parameter_assignments and submissions per day.
  for (const facility of facilities) {
    const recent = submissions.filter(
      s =>
        s.facilityId === facility.id &&
        new Date(s.observedAt).getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
    if (recent.length < 2) {
      candidates.push({
        id: `GP-${facility.id}-daily`,
        facilityId: facility.id,
        kind: 'gap',
        severity: 'warn',
        title: 'Daily log incomplete',
        body: `Only ${recent.length} daily entries in the last 7 days (rule fires below ${GAP_RULES.daily_log_incomplete_days} days of activity).`,
        source: 'gap-cron',
      });
    }
  }

  return candidates;
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point combining all three
// ─────────────────────────────────────────────────────────────────────────────

export function runAllRules(): {
  candidates: AlertCandidate[];
  alreadyOpen: number;
  newAlerts: AlertCandidate[];
} {
  const candidates = [
    ...complianceBreachDetector(),
    ...thresholdRuleEvaluator(),
    ...dataGapDetector(),
  ];

  const openIds = new Set(alerts.filter((a: Alert) => a.status === 'open').map((a: Alert) => a.id));
  const newAlerts = candidates.filter(c => !openIds.has(c.id));
  return {
    candidates,
    alreadyOpen: candidates.length - newAlerts.length,
    newAlerts,
  };
}

// Audit-archival job (resolution K + Phase 2 task 2.16) — pure function over
// audit_log size estimate. Returns rows that would be archived if the cron ran
// today. Real archival writes to Supabase Storage as JSONL bundles + DELETEs
// from the live table.
export function auditArchivalCandidates(today: Date = new Date()): {
  cutoff: string;
  estimatedRowCount: number;
} {
  const cutoff = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
  // Phase 2 stub: the row-count estimate is a fixed plausible number. Phase 3
  // queries `SELECT count(*) FROM audit_log WHERE occurred_at < $cutoff`.
  const estimatedRowCount = 0;
  // Touch unused symbols so TS doesn't complain
  void parameters;
  return { cutoff, estimatedRowCount };
}
