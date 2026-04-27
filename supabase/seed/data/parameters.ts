// =============================================================================
// supabase/seed/data/parameters.ts
//
// Parameter catalog — structured extraction from foundation.docx Appendix A
// "Full Parameter Matrix" (sections A.1 through A.6).
//
// Extracted 2026-04-27 by Claude Code for Task 1.4a (architect verification
// required before Task 1.4 main proceeds).
//
// Each entry maps to one row in the `parameters` table (per
// 001_core_schema.sql) plus the data the seed needs to derive
// `parameter_assignments` per facility.
// =============================================================================

// -- Schema enums (must match parameter_frequency / evidence_requirement in 001) --
export type ParameterFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "annual";
export type EvidenceRequirement = "required" | "optional" | "none";

// -- Catalog-only helper enums --
export type FacilityTemplate = "retail" | "office" | "warehouse" | "factory";
export type Applicability = "always" | "conditional" | "not_applicable";

/**
 * Predicate against `facilities.flags` (jsonb). When `applicability` for the
 * template is "conditional", the parameter is assigned to a facility only if
 * this predicate evaluates true against that facility's flags.
 *
 * Conventions handled by the seed:
 *   { has_dg: true }                       — flag equals value
 *   { has_boiler: true, boiler_fuel: 'biomass' }   — all keys must match (AND)
 *   { active_haz_categories_contains: 'used_oil' } — flags.active_haz_categories array includes
 */
export type ConditionalPredicate = Record<string, unknown>;

export interface ParameterCatalogEntry {
  /** parameters.code — snake_case, globally unique */
  code: string;
  /** parameters.name — display string */
  name: string;
  /** parameters.unit — canonical unit for normalization */
  unit: string;
  /** parameters.frequency — schema enum */
  frequency: ParameterFrequency;
  /** parameters.evidence_required — schema enum */
  evidence_required: EvidenceRequirement;
  /** parameters.category — one of: energy, water, waste_general, waste_haz, air, operational, master_data */
  category: string;
  /** Per-template applicability per Appendix A's Y / Cond. / — columns */
  applicability: Record<FacilityTemplate, Applicability>;
  /** When applicability is "conditional", this predicate gates assignment. null means "always assigned where applicability != not_applicable" */
  conditional_predicate: ConditionalPredicate | null;
  /** Free-text evidence/source note copied verbatim from Appendix A's Evidence column */
  evidence_note: string;
  /** Pointer back to the Appendix A subsection so spot-checks are cheap */
  appendix_ref: string;
}

// =============================================================================
// IMPORTANT NOTES FOR ARCHITECT REVIEW
// =============================================================================
//
// (1) Frequency enum gap — "Per refill / event" doesn't map cleanly to the
//     schema enum (daily/weekly/monthly/quarterly/annual). Affected entries:
//     diesel_dg_own_litres, diesel_dg_mall_shared_litres, lpg_canteen_kg,
//     petrol_owned_vehicles_litres, cng_owned_vehicles_kg, refrigerant_*,
//     e_waste_kg. Mapped to 'monthly' in this catalog (intent: aggregated
//     monthly view; per-refill events become monthly-summary submissions).
//     If the architect wants per-event submissions, we extend the enum via
//     migration 003 to include 'per_event'.
//
// (2) Boiler fuel — architect confirmed 2026-04-28: briquettes is the ONLY
//     boiler fuel type across all ABFRL facilities. All multi-fuel variants
//     (biomass, wood, diesel, lpg) removed. Replaced with single
//     `boiler_briquettes_kg` parameter. Both factories updated to
//     `boiler_fuel=briquettes` in facilities.ts.
//
// (3) STP quality split — Appendix A row "STP discharge — quality" lists unit
//     "mg/l (BOD, COD, TSS, etc.)" — multi-value. The schema's
//     submissions.value_normalized is a single numeric, so I split this into
//     three separate parameters: stp_discharge_bod_mgl, ..._cod_mgl, ..._tss_mgl.
//     This also matches the architect's domain example
//     ("factory STP outlet BOD should cluster 18-35 mg/L vs limit 30").
//
// (4) Master-data parameters (Floor area, Staff count) — Appendix A A.5 lists
//     them as parameters but they are master data, not contributor submissions.
//     Tagged here with category='master_data' and frequency='annual'. The seed
//     can choose to skip parameter_assignments for these. Architect: confirm
//     intent — include in catalog but not in submissions, or exclude entirely.
//
// (5) Conditional flags introduced beyond the foundation's A.6 list:
//       - has_mall_shared_dg (mentioned in A.6)
//       - has_rainwater_harvesting (in A.6)
//       - has_hvac (in A.6)
//       - active_haz_categories (NEW — array of category codes per factory,
//         needed because A.3 hazardous parameters are gated on category, not
//         on a boolean. Each factory's list is taken from
//         vertical-slice-spec.md.)
//       - uses_tanker_water (NEW — Appendix A says "Cond." for tanker water at
//         all templates but doesn't name a flag; introducing this for the
//         seed's conditional_predicate to be evaluable.)
//     Architect: confirm or rename.
//
// (6) DG stack emissions — A.4 says "Annual third-party test, Office Cond,
//     Factory Cond." The "Cond." for factory likely means "if dg_count > N or
//     if regulated to test." For the demo, I gate it on `has_dg && type=factory`
//     to keep the dataset realistic without inventing a new flag.
// =============================================================================

const ALL_TEMPLATES_ALWAYS: Record<FacilityTemplate, Applicability> = {
  retail: "always", office: "always", warehouse: "always", factory: "always",
};

export const PARAMETERS: ParameterCatalogEntry[] = [
  // ==========================================================================
  // A.1 Energy domain
  // ==========================================================================
  {
    code: "grid_electricity_kwh",
    name: "Grid electricity (DISCOM)",
    unit: "kWh",
    frequency: "monthly",
    evidence_required: "required",
    category: "energy",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Utility bill (OCR)",
    appendix_ref: "A.1",
  },
  {
    code: "diesel_dg_own_litres",
    name: "Diesel — DG (own)",
    unit: "litres",
    frequency: "monthly", // per-refill aggregated; see note (1)
    evidence_required: "required",
    category: "energy",
    applicability: { retail: "conditional", office: "always", warehouse: "conditional", factory: "always" },
    conditional_predicate: { has_dg: true },
    evidence_note: "Vendor invoice (OCR)",
    appendix_ref: "A.1",
  },
  {
    code: "diesel_dg_mall_shared_litres",
    name: "Diesel — DG (mall-shared)",
    unit: "litres",
    frequency: "monthly",
    evidence_required: "required",
    category: "energy",
    applicability: { retail: "conditional", office: "not_applicable", warehouse: "not_applicable", factory: "not_applicable" },
    conditional_predicate: { has_mall_shared_dg: true },
    evidence_note: "Mall allocation statement",
    appendix_ref: "A.1",
  },
  {
    code: "lpg_canteen_kg",
    name: "LPG — canteen",
    unit: "kg",
    frequency: "monthly", // per-refill aggregated
    evidence_required: "required",
    category: "energy",
    applicability: { retail: "not_applicable", office: "conditional", warehouse: "not_applicable", factory: "always" },
    conditional_predicate: { has_canteen: true },
    evidence_note: "Vendor invoice (OCR)",
    appendix_ref: "A.1",
  },
  {
    // Architect confirmed 2026-04-28: briquettes is the only boiler fuel type.
    // Replaces the former multi-fuel set (biomass, wood, diesel, lpg).
    code: "boiler_briquettes_kg",
    name: "Boiler — briquettes",
    unit: "kg",
    frequency: "monthly", // daily logbook aggregated to monthly submission
    evidence_required: "required",
    category: "energy",
    applicability: { retail: "not_applicable", office: "not_applicable", warehouse: "not_applicable", factory: "conditional" },
    conditional_predicate: { has_boiler: true }, // single fuel type; no fuel-variant gate needed
    evidence_note: "Logbook photos + vendor invoices (OCR)",
    appendix_ref: "A.1 (amended: briquettes only, per architect decision 2026-04-28)",
  },
  {
    code: "solar_generation_kwh",
    name: "Solar — generation",
    unit: "kWh",
    frequency: "monthly",
    evidence_required: "required",
    category: "energy",
    applicability: { retail: "conditional", office: "conditional", warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_solar: true },
    evidence_note: "Inverter export reading (photo)",
    appendix_ref: "A.1",
  },
  {
    code: "petrol_owned_vehicles_litres",
    name: "Petrol — owned vehicles",
    unit: "litres",
    frequency: "monthly",
    evidence_required: "required",
    category: "energy",
    applicability: { retail: "not_applicable", office: "not_applicable", warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_internal_fleet: true },
    evidence_note: "Fuel bill (OCR)",
    appendix_ref: "A.1",
  },
  {
    code: "cng_owned_vehicles_kg",
    name: "CNG — owned vehicles",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "energy",
    applicability: { retail: "not_applicable", office: "not_applicable", warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_internal_fleet: true },
    evidence_note: "Fuel bill (OCR)",
    appendix_ref: "A.1",
  },

  // ==========================================================================
  // A.2 Water domain
  // ==========================================================================
  {
    code: "drinking_water_bottled_litres",
    name: "Drinking water — bottled / dispenser",
    unit: "litres",
    frequency: "monthly",
    evidence_required: "none",
    category: "water",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "None (typed)",
    appendix_ref: "A.2",
  },
  {
    code: "municipal_water_kl",
    name: "Municipal water — supply",
    unit: "kL",
    frequency: "monthly",
    evidence_required: "required",
    category: "water",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Utility bill or tanker invoice (OCR)",
    appendix_ref: "A.2",
  },
  {
    code: "tanker_water_kl",
    name: "Tanker water",
    unit: "kL",
    frequency: "monthly", // per-delivery aggregated
    evidence_required: "required",
    category: "water",
    applicability: { retail: "conditional", office: "conditional", warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { uses_tanker_water: true }, // see note (5)
    evidence_note: "Vendor invoice",
    appendix_ref: "A.2",
  },
  {
    code: "groundwater_extraction_kl",
    name: "Groundwater extraction",
    unit: "kL",
    frequency: "daily",
    evidence_required: "required",
    category: "water",
    applicability: { retail: "not_applicable", office: "conditional", warehouse: "conditional", factory: "always" },
    conditional_predicate: { has_groundwater: true },
    evidence_note: "Meter photos + CGWA permit",
    appendix_ref: "A.2",
  },
  {
    code: "recycled_water_stp_output_kl",
    name: "Recycled water — STP output reused",
    unit: "kL",
    frequency: "monthly",
    evidence_required: "required",
    category: "water",
    applicability: { retail: "not_applicable", office: "conditional", warehouse: "not_applicable", factory: "always" },
    conditional_predicate: { has_stp: true },
    evidence_note: "STP logbook + monthly third-party report",
    appendix_ref: "A.2",
  },
  {
    code: "rainwater_harvested_kl",
    name: "Rainwater harvested",
    unit: "kL",
    frequency: "monthly",
    evidence_required: "optional",
    category: "water",
    applicability: { retail: "not_applicable", office: "conditional", warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_rainwater_harvesting: true },
    evidence_note: "RWH meter or estimation worksheet",
    appendix_ref: "A.2",
  },
  // STP discharge — quality split into BOD/COD/TSS per note (3)
  {
    code: "stp_discharge_bod_mgl",
    name: "STP discharge — BOD",
    unit: "mg/L",
    frequency: "monthly",
    evidence_required: "required",
    category: "water",
    applicability: { retail: "not_applicable", office: "conditional", warehouse: "not_applicable", factory: "always" },
    conditional_predicate: { has_stp: true },
    evidence_note: "Lab report (OCR) — monthly third-party test",
    appendix_ref: "A.2 (BOD split from quality multi-value row)",
  },
  {
    code: "stp_discharge_cod_mgl",
    name: "STP discharge — COD",
    unit: "mg/L",
    frequency: "monthly",
    evidence_required: "required",
    category: "water",
    applicability: { retail: "not_applicable", office: "conditional", warehouse: "not_applicable", factory: "always" },
    conditional_predicate: { has_stp: true },
    evidence_note: "Lab report (OCR) — monthly third-party test",
    appendix_ref: "A.2 (COD split from quality multi-value row)",
  },
  {
    code: "stp_discharge_tss_mgl",
    name: "STP discharge — TSS",
    unit: "mg/L",
    frequency: "monthly",
    evidence_required: "required",
    category: "water",
    applicability: { retail: "not_applicable", office: "conditional", warehouse: "not_applicable", factory: "always" },
    conditional_predicate: { has_stp: true },
    evidence_note: "Lab report (OCR) — monthly third-party test",
    appendix_ref: "A.2 (TSS split from quality multi-value row)",
  },
  {
    code: "stp_discharge_volume_kl",
    name: "STP discharge — volume",
    unit: "kL",
    frequency: "daily",
    evidence_required: "required",
    category: "water",
    applicability: { retail: "not_applicable", office: "conditional", warehouse: "not_applicable", factory: "always" },
    conditional_predicate: { has_stp: true },
    evidence_note: "STP logbook",
    appendix_ref: "A.2",
  },

  // ==========================================================================
  // A.3 Waste domain — general
  // ==========================================================================
  {
    code: "mixed_dry_waste_kg",
    name: "Mixed dry waste",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_general",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Vendor manifest or weighbridge",
    appendix_ref: "A.3",
  },
  {
    code: "wet_food_waste_kg",
    name: "Wet / food waste",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_general",
    applicability: { retail: "conditional", office: "always", warehouse: "conditional", factory: "always" },
    conditional_predicate: { has_canteen: true },
    evidence_note: "Vendor manifest",
    appendix_ref: "A.3",
  },
  {
    code: "cardboard_paper_waste_kg",
    name: "Cardboard / paper",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_general",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Vendor manifest",
    appendix_ref: "A.3",
  },
  {
    code: "plastic_packaging_waste_kg",
    name: "Plastic packaging",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_general",
    applicability: { retail: "always", office: "conditional", warehouse: "always", factory: "always" },
    conditional_predicate: null, // unconditional where applicable; office's "Cond." is dropped for our seed (no office facilities)
    evidence_note: "Vendor manifest",
    appendix_ref: "A.3",
  },
  {
    code: "e_waste_kg",
    name: "E-waste",
    unit: "kg",
    frequency: "monthly", // per-pickup aggregated
    evidence_required: "required",
    category: "waste_general",
    applicability: { retail: "conditional", office: "always", warehouse: "always", factory: "always" },
    conditional_predicate: null, // retail's "Cond." treated as always for our 7 stores; architect can refine
    evidence_note: "Authorized recycler manifest",
    appendix_ref: "A.3",
  },
  {
    code: "sanitary_waste_kg",
    name: "Sanitary waste",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_general",
    applicability: { retail: "conditional", office: "always", warehouse: "conditional", factory: "always" },
    conditional_predicate: null,
    evidence_note: "Vendor manifest",
    appendix_ref: "A.3",
  },

  // ==========================================================================
  // A.3 Waste domain — hazardous (multi-event: generation + disposal)
  // Gated by facilities.flags.active_haz_categories array (see note 5).
  // Frequency = monthly aggregate; per-event detail lives in hazardous_events.
  // ==========================================================================
  {
    code: "haz_used_oil_kg",
    name: "Hazardous — used oil",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { retail: "not_applicable", office: "not_applicable", warehouse: "conditional", factory: "always" },
    conditional_predicate: { active_haz_categories_contains: "used_oil" },
    evidence_note: "HWM register photo (generation, weekly batch); authorized handler manifest (disposal)",
    appendix_ref: "A.3",
  },
  {
    code: "haz_chemical_containers_kg",
    name: "Hazardous — chemical containers",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { retail: "not_applicable", office: "not_applicable", warehouse: "not_applicable", factory: "always" },
    conditional_predicate: { active_haz_categories_contains: "chemical_containers" },
    evidence_note: "HWM register photo (generation); HWM manifest (disposal)",
    appendix_ref: "A.3",
  },
  {
    code: "haz_etp_stp_sludge_kg",
    name: "Hazardous — ETP / STP sludge",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { retail: "not_applicable", office: "not_applicable", warehouse: "not_applicable", factory: "always" },
    conditional_predicate: { active_haz_categories_contains: "etp_sludge" },
    evidence_note: "HWM register photo (generation); HWM manifest (disposal)",
    appendix_ref: "A.3",
  },
  {
    code: "haz_contaminated_cotton_kg",
    name: "Hazardous — contaminated cotton / cloth",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { retail: "not_applicable", office: "not_applicable", warehouse: "not_applicable", factory: "always" },
    conditional_predicate: { active_haz_categories_contains: "contaminated_cotton" },
    evidence_note: "HWM register photo (generation); HWM manifest (disposal)",
    appendix_ref: "A.3",
  },
  {
    code: "haz_fluorescent_tubes_kg",
    name: "Hazardous — fluorescent tubes / lamps",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { retail: "conditional", office: "always", warehouse: "conditional", factory: "always" },
    conditional_predicate: { active_haz_categories_contains: "fluorescent_tubes" },
    evidence_note: "HWM register photo (generation); HWM manifest (disposal)",
    appendix_ref: "A.3",
  },
  {
    code: "haz_batteries_kg",
    name: "Hazardous — batteries",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { retail: "conditional", office: "always", warehouse: "always", factory: "always" },
    conditional_predicate: { active_haz_categories_contains: "batteries" },
    evidence_note: "HWM register photo (generation); HWM manifest (disposal)",
    appendix_ref: "A.3",
  },
  {
    code: "haz_coolant_refrigerant_kg",
    name: "Hazardous — coolant / refrigerant containers",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { retail: "not_applicable", office: "conditional", warehouse: "not_applicable", factory: "always" },
    conditional_predicate: { active_haz_categories_contains: "coolant_refrigerant" },
    evidence_note: "HWM register photo (generation); HWM manifest (disposal)",
    appendix_ref: "A.3",
  },
  {
    code: "haz_paint_solvent_kg",
    name: "Hazardous — paint / solvent",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { retail: "not_applicable", office: "not_applicable", warehouse: "not_applicable", factory: "conditional" },
    conditional_predicate: { active_haz_categories_contains: "paint_solvent" },
    evidence_note: "HWM register photo (generation); HWM manifest (disposal)",
    appendix_ref: "A.3",
  },
  {
    // Demo amendment — Factory-002 spec lists 'e_waste' as an active haz
    // category. Standard A.3 treats e-waste as general (recycler manifest, not
    // HWM). Adding a haz variant for the demo's spec consistency.
    code: "haz_e_waste_kg",
    name: "Hazardous — e-waste (regulated)",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { retail: "not_applicable", office: "not_applicable", warehouse: "not_applicable", factory: "conditional" },
    conditional_predicate: { active_haz_categories_contains: "e_waste" },
    evidence_note: "HWM register photo (generation); authorized recycler manifest (disposal)",
    appendix_ref: "A.3 (amendment for demo)",
  },

  // ==========================================================================
  // A.4 Air emissions domain
  // ==========================================================================
  {
    code: "stack_emissions_boiler_mgnm3",
    name: "Stack emissions — boiler (PM, SOx, NOx, CO)",
    unit: "mg/Nm³",
    frequency: "quarterly",
    evidence_required: "required",
    category: "air",
    applicability: { retail: "not_applicable", office: "not_applicable", warehouse: "not_applicable", factory: "always" },
    conditional_predicate: { has_boiler: true },
    evidence_note: "Lab report (OCR) — quarterly third-party test",
    appendix_ref: "A.4",
  },
  {
    code: "stack_emissions_dg_mgnm3",
    name: "Stack emissions — DG (PM, SOx, NOx, CO)",
    unit: "mg/Nm³",
    frequency: "annual",
    evidence_required: "required",
    category: "air",
    // Gate 6 revised 2026-04-28: architect confirmed warehouse also gets DG
    // stack monitoring (any facility with has_dg=true, not factory-only).
    applicability: { retail: "not_applicable", office: "conditional", warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_dg: true },
    evidence_note: "Lab report (OCR) — annual third-party test",
    appendix_ref: "A.4",
  },
  {
    code: "refrigerant_hvac_kg",
    name: "Refrigerant — HVAC refill",
    unit: "kg",
    frequency: "monthly", // per-event aggregated
    evidence_required: "required",
    category: "air",
    applicability: { retail: "conditional", office: "always", warehouse: "conditional", factory: "always" },
    conditional_predicate: { has_hvac: true },
    evidence_note: "Vendor invoice + gas type",
    appendix_ref: "A.4",
  },
  {
    code: "refrigerant_chiller_kg",
    name: "Refrigerant — chiller refill",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "air",
    applicability: { retail: "not_applicable", office: "conditional", warehouse: "not_applicable", factory: "always" },
    conditional_predicate: { has_chiller: true }, // new flag — architect: confirm or fold into has_hvac
    evidence_note: "Vendor invoice + gas type",
    appendix_ref: "A.4",
  },
  {
    code: "ambient_air_quality_ugm3",
    name: "Ambient air quality",
    unit: "µg/m³",
    frequency: "quarterly",
    evidence_required: "required",
    category: "air",
    applicability: { retail: "not_applicable", office: "not_applicable", warehouse: "not_applicable", factory: "conditional" },
    conditional_predicate: { has_ambient_air_monitoring: true }, // new flag — architect: confirm
    evidence_note: "Lab report (OCR)",
    appendix_ref: "A.4",
  },

  // ==========================================================================
  // A.5 Operational and contextual parameters
  // ==========================================================================
  {
    code: "manhours_worked",
    name: "Manhours worked",
    unit: "hours",
    frequency: "monthly",
    evidence_required: "none",
    category: "operational",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "None (typed) or HRMS extract",
    appendix_ref: "A.5",
  },
  {
    code: "garments_produced_units",
    name: "Garments produced",
    unit: "units",
    frequency: "daily",
    evidence_required: "required",
    category: "operational",
    applicability: { retail: "not_applicable", office: "not_applicable", warehouse: "not_applicable", factory: "always" },
    conditional_predicate: null,
    evidence_note: "Production logbook",
    appendix_ref: "A.5",
  },
  {
    code: "operating_days_hours",
    name: "Operating days / hours",
    unit: "days,hours",
    frequency: "monthly",
    evidence_required: "none",
    category: "operational",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "None (typed)",
    appendix_ref: "A.5",
  },
  // Master data items — see note (4). Included for catalog completeness;
  // seed should NOT create parameter_assignments for these (master_data is
  // edited via the master data UI, not via the contributor submission flow).
  {
    code: "floor_area_sqft",
    name: "Floor area (master)",
    unit: "sq ft",
    frequency: "annual",
    evidence_required: "none",
    category: "master_data",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Master data record",
    appendix_ref: "A.5",
  },
  {
    code: "staff_headcount",
    name: "Number of staff (master)",
    unit: "headcount",
    frequency: "annual",
    evidence_required: "none",
    category: "master_data",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Master data record",
    appendix_ref: "A.5",
  },
];

/**
 * Quick stats for sanity:
 *   Total parameters: 43  (was 46; -4 boiler fuel variants +1 boiler_briquettes_kg)
 *     A.1 Energy:       8  (was 11; 4 fuel variants removed, briquettes added)
 *     A.2 Water:        10 (STP quality split into 3 → BOD/COD/TSS)
 *     A.3 Waste:        15 (6 general + 9 hazardous incl. haz_e_waste amendment)
 *     A.4 Air:          5  (stack_emissions_dg now includes warehouse per Gate 6)
 *     A.5 Operational:  3 + 2 master_data
 */
