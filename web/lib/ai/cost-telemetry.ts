// AI cost telemetry per Phase 3 task 3.6 + design doc §36.2 / §38.4.
//
// Tracks per-call token counts and rolls them up to a cumulative spend
// estimate. In demo mode (no Azure keys) the estimates are stubbed to make
// the dashboard show plausible numbers; in production the real per-call
// usage from the Azure response is recorded.
//
// Numbers are in-memory and reset on server restart. Phase 3 mirrors them
// to the audit_log so a long-tail history is queryable.

interface CallRecord {
  feature: 'nl_query' | 'nl_master_diff' | 'nl_audit' | 'ocr';
  inputTokens: number;
  outputTokens: number;
  costInr: number;
  occurredAt: string;
}

const records: CallRecord[] = [];

// Approximate Azure pricing (May 2026, GPT-4o-mini): $0.15 / 1M input,
// $0.60 / 1M output. ₹/$ conversion ≈ 84.
const INR_PER_USD = 84;
const COST_PER_INPUT_TOKEN_USD = 0.15 / 1_000_000;
const COST_PER_OUTPUT_TOKEN_USD = 0.60 / 1_000_000;

// Document Intelligence: $1.50 / 1000 pages prebuilt model.
const COST_PER_PAGE_USD = 1.50 / 1000;

export function recordNlCall(
  feature: CallRecord['feature'],
  inputTokens: number,
  outputTokens: number,
): void {
  const costUsd =
    inputTokens * COST_PER_INPUT_TOKEN_USD + outputTokens * COST_PER_OUTPUT_TOKEN_USD;
  records.push({
    feature,
    inputTokens,
    outputTokens,
    costInr: costUsd * INR_PER_USD,
    occurredAt: new Date().toISOString(),
  });
}

export function recordOcrCall(pageCount: number): void {
  const costUsd = pageCount * COST_PER_PAGE_USD;
  records.push({
    feature: 'ocr',
    inputTokens: 0,
    outputTokens: 0,
    costInr: costUsd * INR_PER_USD,
    occurredAt: new Date().toISOString(),
  });
}

export interface CostSummary {
  totalCostInrThisMonth: number;
  callsByFeature: Record<CallRecord['feature'], { count: number; costInr: number }>;
  recentCalls: CallRecord[];
}

export function getCostSummary(): CostSummary {
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = records.filter(r => r.occurredAt.startsWith(month));
  const callsByFeature = {
    nl_query: { count: 0, costInr: 0 },
    nl_master_diff: { count: 0, costInr: 0 },
    nl_audit: { count: 0, costInr: 0 },
    ocr: { count: 0, costInr: 0 },
  };
  for (const r of thisMonth) {
    callsByFeature[r.feature].count += 1;
    callsByFeature[r.feature].costInr += r.costInr;
  }
  return {
    totalCostInrThisMonth: thisMonth.reduce((sum, r) => sum + r.costInr, 0),
    callsByFeature,
    recentCalls: records.slice(-20),
  };
}
