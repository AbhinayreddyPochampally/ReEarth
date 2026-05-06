// =============================================================================
// supabase/seed/data/regulatory-limits.ts
//
// Regulatory limits seeded for the demo.  Covers parameters that have
// measurable breach thresholds at factory sites.
//
// facility_sap_code = null → limit applies globally (any facility with this
// parameter).  The seed resolves sap_code → facility UUID at insert time.
//
// Compliance breach demo: Factory-001 stack_emissions_boiler_mgnm3 in Mar 2026
// is seeded at 145 mg/Nm³ (above the 100 limit below) — triggers the breach row.
// =============================================================================

export interface RegulatoryLimitSeedData {
  parameter_code: string;
  facility_sap_code: string | null;
  state_code: string | null;
  regulatory_limit: number;
  limit_unit: string;
  limit_type: 'max' | 'min' | 'range';
  regulatory_source: string;
  effective_from: string;
  effective_to: string | null;
}

export const REGULATORY_LIMITS: RegulatoryLimitSeedData[] = [
  // ── Stack emissions — boiler (global CPCB limit) ──────────────────────────
  {
    parameter_code: 'stack_emissions_boiler_mgnm3',
    facility_sap_code: null,
    state_code: null,
    regulatory_limit: 100,
    limit_unit: 'mg/Nm³',
    limit_type: 'max',
    regulatory_source: 'CPCB GSR 612(E) 2010 — Particulate Matter limit for biomass/briquette boilers',
    effective_from: '2010-06-30',
    effective_to: null,
  },

  // ── STP discharge — BOD / COD / TSS (MoEFCC global limit) ─────────────────
  {
    parameter_code: 'stp_discharge_bod_mgl',
    facility_sap_code: null,
    state_code: null,
    regulatory_limit: 30,
    limit_unit: 'mg/L',
    limit_type: 'max',
    regulatory_source: 'MoEFCC ETP/STP Discharge Standards 2017 — BOD',
    effective_from: '2017-01-01',
    effective_to: null,
  },
  {
    parameter_code: 'stp_discharge_cod_mgl',
    facility_sap_code: null,
    state_code: null,
    regulatory_limit: 250,
    limit_unit: 'mg/L',
    limit_type: 'max',
    regulatory_source: 'MoEFCC ETP/STP Discharge Standards 2017 — COD',
    effective_from: '2017-01-01',
    effective_to: null,
  },
  {
    parameter_code: 'stp_discharge_tss_mgl',
    facility_sap_code: null,
    state_code: null,
    regulatory_limit: 100,
    limit_unit: 'mg/L',
    limit_type: 'max',
    regulatory_source: 'MoEFCC ETP/STP Discharge Standards 2017 — TSS',
    effective_from: '2017-01-01',
    effective_to: null,
  },
];
