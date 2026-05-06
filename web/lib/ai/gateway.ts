// AI gateway — the single seam between application code and external AI
// services (Azure OpenAI, Azure Document Intelligence). Phase 3 production
// wires this to real APIs; demo / Phase-2-without-keys uses deterministic
// mocks keyed on patterns in the input.
//
// CRITICAL: nlQuery returns a StructuredFilter object, never raw SQL. The
// translator at @/lib/db/query-builder.ts (Phase 3) is responsible for
// turning the filter into parameterized Postgres queries.

import { facilities } from '@/lib/v1/sample-data';
import type { DiffProposal, ExplorerInterpretation } from '@/lib/v1/contracts';
import {
  type StructuredFilter,
  validateStructuredFilter,
} from './structured-filter';

// Cost budget per call — design doc §36.2 + §38.1
const MAX_TOKENS_QUERY = 500;
const MAX_TOKENS_DIFF = 600;
const MAX_TOKENS_AUDIT = 500;

export interface NLQueryResult {
  ok: true;
  filter: StructuredFilter;
  partial: boolean;        // true if some chips are uncertain (yellow)
  notes?: string;          // human-readable note shown above the chips
}
export interface NLQueryError {
  ok: false;
  error: string;
  suggestions?: string[];  // alternative queries the user can try
}

export interface AuditSearchResult {
  ok: true;
  summary: string;
  timeline: { actor: string; action: string; whenLabel: string; href?: string }[];
}
export interface AuditSearchError { ok: false; error: string }

function isAzureConfigured(): boolean {
  return Boolean(
    process.env['AZURE_OPENAI_ENDPOINT'] &&
    process.env['AZURE_OPENAI_API_KEY'] &&
    process.env['AZURE_OPENAI_DEPLOYMENT_NAME'],
  );
}

// =============================================================================
// NL query → StructuredFilter (Data Explorer + design doc §38)
// =============================================================================

export async function nlQuery(text: string): Promise<NLQueryResult | NLQueryError> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Type a question first.' };

  // Out-of-scope queries — graceful explicit failure per §38.4
  const lower = trimmed.toLowerCase();
  if (lower.includes('predict') || lower.includes('forecast') || lower.includes('next quarter')) {
    return {
      ok: false,
      error: "Predictive forecasting isn't available in v1. ReEarth shows historical and current data, not projections.",
      suggestions: [
        '"Emissions trend over the last 6 months"',
        '"Last 4 quarters of Scope 1 + 2 by facility"',
        '"Energy mix change: this quarter vs last quarter"',
      ],
    };
  }
  if (lower.startsWith('why ') || lower.includes('cause')) {
    return {
      ok: false,
      error: "I can show you the data, but I can't determine cause. Try a comparison instead.",
      suggestions: ['"Compare water by source for the two facilities you have in mind"'],
    };
  }

  if (!isAzureConfigured()) {
    return mockNlQuery(trimmed);
  }
  // Phase-3 production path (Azure-backed). Wrapped in try/catch so a
  // rate-limit / timeout / auth failure degrades to the manual-filter
  // experience instead of crashing the page (per Phase 4 task 4.4).
  try {
    return await callAzureNlQuery(trimmed);
  } catch (err) {
    return {
      ok: false,
      error: degradedAIMessage('NL query', err),
      suggestions: [
        'Use the filter chips below to build the query manually.',
        'Try the question again in a minute — Azure rate limits reset quickly.',
      ],
    };
  }
}

function mockNlQuery(text: string): NLQueryResult {
  const lower = text.toLowerCase();
  const filter: StructuredFilter = { status: ['approved'] };
  const notes: string[] = [];
  let partial = false;

  // Facility-set
  if (lower.includes('all factories') || lower.includes('every factory')) {
    filter.facility_types = ['factory'];
  } else if (lower.includes('all warehouses')) {
    filter.facility_types = ['warehouse'];
  } else if (lower.includes('all 15') || lower.includes('every facility')) {
    // no filter — implicit all
  } else {
    // Try matching a single facility name
    const match = facilities.find(f => lower.includes(f.city.toLowerCase()));
    if (match) {
      filter.facility_ids = [match.id];
      notes.push(`Resolved "${match.city}" → ${match.name}.`);
    }
  }

  // Brand
  for (const brand of ['Pantaloons', 'Allen Solly', 'Van Heusen', 'Louis Philippe', 'Peter England']) {
    if (lower.includes(brand.toLowerCase())) {
      filter.brands = [brand];
      break;
    }
  }

  // Date range
  if (lower.includes('q1 2026') || lower.includes('q1 26')) {
    filter.date_range = { start: '2026-01-01', end: '2026-03-31' };
  } else if (lower.includes('last 3 months') || lower.includes('last quarter')) {
    filter.date_range = { start: '2026-02-01', end: '2026-04-30' };
  } else if (lower.includes('last 6 months')) {
    filter.date_range = { start: '2025-11-01', end: '2026-04-30' };
  } else if (lower.includes('last month')) {
    filter.date_range = { start: '2026-04-01', end: '2026-04-30' };
  } else if (lower.includes('this month')) {
    filter.date_range = { start: '2026-05-01', end: '2026-05-31' };
  } else {
    notes.push('No period specified — defaulting to current month.');
    filter.date_range = { start: '2026-05-01', end: '2026-05-31' };
    partial = true;
  }

  // Parameter category
  if (lower.includes('water') && (lower.includes('source') || lower.includes('withdraw'))) {
    filter.parameter_ids = ['groundwater_extraction_kl', 'municipal_water_kl', 'tanker_water_kl', 'drinking_water_bottled_litres'];
  } else if (lower.includes('water')) {
    filter.parameter_ids = ['groundwater_extraction_kl', 'recycled_water_stp_output_kl'];
  } else if (lower.includes('emission') || lower.includes('co2') || lower.includes('scope')) {
    filter.parameter_ids = ['stack_emissions_boiler_mgnm3', 'stack_emissions_dg_mgnm3'];
  } else if (lower.includes('diesel')) {
    filter.parameter_ids = ['diesel_dg_own_litres'];
  } else if (lower.includes('biomass') || lower.includes('briquette')) {
    filter.parameter_ids = ['boiler_briquettes_kg'];
  } else if (lower.includes('grid') || lower.includes('electricity')) {
    filter.parameter_ids = ['grid_electricity_kwh'];
  } else if (lower.includes('stp') || lower.includes('bod') || lower.includes('cod') || lower.includes('tss')) {
    filter.parameter_ids = ['stp_discharge_bod_mgl', 'stp_discharge_cod_mgl', 'stp_discharge_tss_mgl'];
  }

  // Aggregation
  if (lower.includes('by facility')) {
    filter.aggregation = { rows: 'facility' };
  } else if (lower.includes('by month')) {
    filter.aggregation = { rows: 'month' };
  } else if (lower.includes('by category')) {
    filter.aggregation = { rows: 'category' };
  }

  // Sort
  if (lower.includes('sorted by') || lower.includes('ranked')) {
    filter.sort = { field: 'value', direction: 'desc' };
  }

  const out: NLQueryResult = { ok: true, filter, partial };
  if (notes.length > 0) out.notes = notes.join(' ');
  return out;
}

async function callAzureNlQuery(_text: string): Promise<NLQueryResult | NLQueryError> {
  // Phase 3 production code: build prompt from filter schema + facility/parameter
  // catalogues + today's date + user query, call Azure OpenAI, validate response
  // through validateStructuredFilter, return.
  //
  // Stub for now — same shape as mock so callers don't branch.
  void MAX_TOKENS_QUERY;
  void validateStructuredFilter;
  return mockNlQuery(_text);
}

// =============================================================================
// NL master update → DiffProposal (Master Data slide-over + design doc §39)
// =============================================================================

export async function nlMasterUpdate(text: string): Promise<DiffProposal> {
  // Phase 2/3 unified stub: keyword-match common patterns and return a shaped
  // DiffProposal. Architect approves explicitly via the slide-over diff UI;
  // there is no auto-apply.
  if (!isAzureConfigured()) {
    return mockMasterDiff(text);
  }
  // Phase 4 task 4.4: degrade gracefully on Azure errors. Falls back to the
  // mock so the architect can at least see what shape the proposal would
  // take, with a clear flag in sideEffects that the AI service was down.
  try {
    return await callAzureMasterDiff(text);
  } catch (err) {
    const fallback = mockMasterDiff(text);
    return {
      ...fallback,
      sideEffects: [
        `⚠ AI service unavailable (${describeError(err)}). Diff below was computed offline from a mock.`,
        ...fallback.sideEffects,
      ],
    };
  }
}

function mockMasterDiff(text: string): DiffProposal {
  const lower = text.toLowerCase();

  // Single-row diff: "Add a 5th DG to Factory-Bengaluru, 250 kVA, diesel"
  if (lower.match(/add\s+a?\s*(\d+)?(st|nd|rd|th)?\s*dg\s+to\s+factory[- ](\w+)/i)) {
    const facilityName = lower.match(/factory[- ](\w+)/)?.[1] ?? 'bengaluru';
    const facility = facilities.find(f => f.city.toLowerCase() === facilityName);
    return {
      table: 'facility_configs',
      affected: facility ? [{ id: facility.id, label: facility.name }] : [],
      close: { effectiveTo: 'n/a — additive change' },
      insert: {
        parameterCode: 'dg_count',
        limitValue: 5,
        unit: 'count',
        authority: 'master_data',
        effectiveFrom: new Date().toISOString().slice(0, 10),
      },
      sideEffects: [
        'Tomorrow\'s daily logs at this facility gain 3 new cards (DG-5 diesel / runtime / power).',
        'Push notification fires to facility contributors: "Master data updated: DG-5 added."',
      ],
    };
  }

  // Bulk diff: "Update CPCB STP outlet BOD limit to 25 mg/L for all factories effective 1 May 2026"
  if (lower.includes('bod limit') || lower.includes('stp outlet bod')) {
    const limitMatch = lower.match(/(\d{2})\s*mg\/?l/);
    const limitValue = limitMatch ? Number(limitMatch[1]) : 25;
    return {
      table: 'regulatory_limits',
      affected: facilities.filter(f => f.kind === 'factory').map(f => ({ id: f.id, label: f.name })),
      close: { effectiveTo: '2026-04-30' },
      insert: {
        parameterCode: 'stp_discharge_bod_mgl',
        limitValue,
        unit: 'mg/L',
        authority: 'CPCB',
        effectiveFrom: '2026-05-01',
      },
      sideEffects: [
        `Submissions dated on/after 1 May 2026 will be evaluated against ${limitValue} mg/L.`,
        'Historical breach decisions remain stable.',
        'No push notifications fire (this is HO-internal master data).',
      ],
    };
  }

  // Vendor add
  if (lower.includes('add vendor') || lower.includes('new vendor')) {
    return {
      table: 'vendors',
      affected: [{ id: 'new', label: 'New vendor (TBD)' }],
      close: { effectiveTo: 'n/a — new row' },
      insert: {
        parameterCode: 'vendor',
        limitValue: 0,
        unit: '—',
        authority: 'HWM',
        effectiveFrom: new Date().toISOString().slice(0, 10),
      },
      sideEffects: ['New vendor becomes selectable on event-logger waste-pickup forms.'],
    };
  }

  // Fallback — return an empty-ish proposal with an explicit note. The UI
  // should display this as "I couldn't interpret this request" with a
  // suggestion to rephrase.
  return {
    table: 'unknown',
    affected: [],
    close: { effectiveTo: '' },
    insert: {
      parameterCode: '',
      limitValue: 0,
      unit: '',
      authority: '',
      effectiveFrom: '',
    },
    sideEffects: [
      "I couldn't parse this request. Try patterns like:",
      '"Add a 5th DG to Factory-Bengaluru, 250 kVA diesel"',
      '"Update CPCB STP outlet BOD limit to 25 mg/L for all factories effective 1 May 2026"',
    ],
  };
}

async function callAzureMasterDiff(text: string): Promise<DiffProposal> {
  void MAX_TOKENS_DIFF;
  return mockMasterDiff(text);
}

// =============================================================================
// NL audit search (global header bar + design doc §40)
// =============================================================================

export async function nlAuditSearch(text: string): Promise<AuditSearchResult | AuditSearchError> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Type a question first.' };
  if (!isAzureConfigured()) return mockAuditSearch(trimmed);
  try {
    return await callAzureAuditSearch(trimmed);
  } catch (err) {
    return {
      ok: false,
      error: degradedAIMessage('Audit search', err),
    };
  }
}

// =============================================================================
// Helpers — graceful degradation messaging (Phase 4 task 4.4)
// =============================================================================

function describeError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    // Surface the most-useful prefix without leaking stack/request IDs to UI
    const msg = err.message;
    if (msg.includes('429') || msg.toLowerCase().includes('rate')) return 'rate limit';
    if (msg.includes('401') || msg.includes('403')) return 'auth';
    if (msg.toLowerCase().includes('timeout')) return 'timeout';
    if (msg.toLowerCase().includes('network')) return 'network';
    return 'service error';
  }
  return 'unknown error';
}

function degradedAIMessage(feature: string, err: unknown): string {
  const kind = describeError(err);
  return `${feature} is temporarily unavailable (${kind}). Use manual filters / try again in a minute.`;
}

function mockAuditSearch(text: string): AuditSearchResult {
  const lower = text.toLowerCase();
  if (lower.includes('march') && lower.includes('stp') && lower.includes('tirupur')) {
    return {
      ok: true,
      summary:
        'Ravi at Factory-Tirupur uploaded the March STP outlet test on 4 Apr · OCR extracted BOD 38 mg/L · system flagged a CPCB limit breach (30 mg/L). Neha sent it back at 5 Apr asking for a clearer photo of page 2. Ravi re-uploaded on 6 Apr at 2:18 PM. OCR confirmed the same value. Neha approved the breach which now sits as Compliance alert #A-040.',
      timeline: [
        { actor: 'Ravi K.',  action: 'uploaded · stp_outlet_test · Mar 2026', whenLabel: '4 Apr · 9:14 AM', href: '/ho/inbox/bill-008' },
        { actor: 'system',   action: 'OCR complete · BOD 38, COD 142 · confidence high', whenLabel: '4 Apr · 9:14 AM' },
        { actor: 'system',   action: 'breach detected vs CPCB BOD 30', whenLabel: '4 Apr · 9:14 AM', href: '/ho/alerts' },
        { actor: 'Neha S.',  action: 'sent back · "image is blurry on the BOD line"', whenLabel: '5 Apr · 11:04 AM' },
        { actor: 'Ravi K.',  action: 're-uploaded · clearer photo', whenLabel: '6 Apr · 2:18 PM', href: '/ho/inbox/bill-008' },
        { actor: 'Neha S.',  action: 'approved · accepted breach', whenLabel: '6 Apr · 3:02 PM' },
      ],
    };
  }
  if (lower.includes('master data') && lower.includes('changed')) {
    return {
      ok: true,
      summary:
        'No master-data edits in the last 30 days affect the question you asked. The most recent master-data change was Neha updating the CPCB STP outlet BOD limit to 25 mg/L for all 11 factories on 1 May 2026 (audit row #ML-024).',
      timeline: [
        { actor: 'Neha S.', action: 'NL master update · CPCB BOD 30 → 25 mg/L · 11 factories', whenLabel: '1 May · 10:42 AM', href: '/ho/master' },
      ],
    };
  }

  // Fallback — explicit "I don't have this in audit log"
  return {
    ok: true,
    summary: `I scanned the last 30 days of audit log and didn't find anything matching that. Try a more specific question — name a facility, a parameter, or a date.`,
    timeline: [],
  };
}

async function callAzureAuditSearch(text: string): Promise<AuditSearchResult | AuditSearchError> {
  void MAX_TOKENS_AUDIT;
  return mockAuditSearch(text);
}

// =============================================================================
// Legacy stubs kept for the existing /ho/explorer + /ho/master Phase-1 pages.
// The new gateway functions above are what the Phase-2 surfaces should call.
// =============================================================================

export function interpretExplorerQuery(text: string): ExplorerInterpretation {
  const lower = text.toLowerCase();
  const metric = lower.includes('diesel') ? 'dg_diesel_l' : lower.includes('water') ? 'groundwater_m3' : 'grid_kwh';
  return {
    template: lower.includes('over time') ? 'metric_over_time' : 'compare_metric_by_facility',
    params: {
      metric,
      window: lower.includes('quarter') ? 'Q4 FY25-26' : 'this_month',
      groupBy: 'facility',
    },
    confidence: 0.86,
    interpretation: [
      { label: 'Metric', value: metric },
      { label: 'Group by', value: 'facility' },
      { label: 'Window', value: lower.includes('quarter') ? 'Q4 FY25-26' : 'this month' },
    ],
  };
}

export function proposeMasterEdit(text: string): DiffProposal {
  // Now delegates to the unified mockMasterDiff so the legacy callers see
  // the same shape the new flow produces.
  return mockMasterDiff(text);
}

export function containsRawSql(output: string): boolean {
  return /\b(select|insert|update|delete|drop|truncate|alter)\b/i.test(output);
}
