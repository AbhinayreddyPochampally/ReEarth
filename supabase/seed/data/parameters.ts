// =============================================================================
// supabase/seed/data/parameters.ts
//
// Parameter catalog. Originally derived from foundation.docx Appendix A;
// rebased 2026-05-06 onto the new design doc (docs/design-doc.docx, §12-18)
// after the rescope ADR collapsed retail and office out of scope.
//
// CHANGES IN THE 2026-05-06 RESCOPE PASS:
//   - FacilityTemplate is now ("warehouse" | "factory") — retail and office
//     are out of scope per the new design doc §7.
//   - All `applicability.retail` and `.office` keys removed.
//   - Removed retail-only parameters: diesel_dg_mall_shared_litres (mall flag),
//     refrigerant_chiller_kg (retail chiller — out of scope), and
//     ambient_air_quality_ugm3 (explicitly NOT in scope per §14.1: "ABFRL
//     factories are high-end tailoring operations, not industrial textile
//     processing facilities; ambient air monitoring is not a regulatory
//     requirement at this scale").
//   - Hazardous parameters drop the `active_haz_categories_contains` predicate
//     per the inconsistency-J resolution. All factories see all hazardous
//     categories. Biomedical is gated by `has_first_aid: true` (the only
//     narrow exception in §15.1).
//   - Conditional flags `has_mall_shared_dg`, `has_chiller`,
//     `has_ambient_air_monitoring` dropped (no parameters use them anymore).
//
// The full parameter rebuild against the new design doc (§12-18 has subtle
// differences from the prior Appendix A — e.g., per-DG daily cards, separate
// boiler-process-water, daily rainfall) is a Phase 2 task. This file is the
// bridging set: enough to seed sensibly, and structurally aligned with the
// rescope.
//
// Each entry maps to one row in the `parameters` table (per
// 001_core_schema.sql) plus the data the seed needs to derive
// `parameter_assignments` per facility.
// =============================================================================

// -- Schema enums (must match parameter_frequency / evidence_requirement in 001) --
export type ParameterFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "annual";
export type EvidenceRequirement = "required" | "optional" | "none";

// -- Catalog-only helper enums --
export type FacilityTemplate = "warehouse" | "factory";
export type Applicability = "always" | "conditional" | "not_applicable";

/**
 * Predicate against `facilities.flags` (jsonb). When `applicability` for the
 * template is "conditional", the parameter is assigned to a facility only if
 * this predicate evaluates true against that facility's flags.
 *
 * Conventions handled by the seed (predicate-eval.ts):
 *   { has_dg: true }                       — flag equals value
 *   { has_boiler: true }                   — single key, boolean equality
 *   { has_first_aid: true }                — gates biomedical only
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
  /** parameters.category — energy, water, waste_general, waste_haz, air, operational, master_data */
  category: string;
  /** Per-template applicability — every entry must specify both */
  applicability: Record<FacilityTemplate, Applicability>;
  /** When applicability is "conditional", this predicate gates assignment. null = always assigned where applicable */
  conditional_predicate: ConditionalPredicate | null;
  /** Free-text evidence/source note */
  evidence_note: string;
  /** Pointer back to the design-doc section so spot-checks are cheap */
  design_ref: string;
}

const ALL_TEMPLATES_ALWAYS: Record<FacilityTemplate, Applicability> = {
  warehouse: "always", factory: "always",
};

export const PARAMETERS: ParameterCatalogEntry[] = [
  // ==========================================================================
  // Energy domain (design doc §13)
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
    design_ref: "§13.1",
  },
  {
    code: "diesel_dg_own_litres",
    name: "Diesel — DG (own)",
    unit: "litres",
    frequency: "monthly", // per-event aggregated; phase-2 may move to per-event
    evidence_required: "required",
    category: "energy",
    applicability: { warehouse: "conditional", factory: "always" },
    conditional_predicate: { has_dg: true },
    evidence_note: "Vendor invoice (OCR)",
    design_ref: "§13.1",
  },
  {
    code: "lpg_canteen_kg",
    name: "LPG — canteen",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "energy",
    applicability: { warehouse: "conditional", factory: "always" },
    conditional_predicate: { has_canteen: true },
    evidence_note: "Vendor invoice (OCR)",
    design_ref: "§13.1",
  },
  {
    // Architect 2026-04-28: briquettes is the only boiler fuel type. Single
    // parameter, no fuel-variant gate.
    code: "boiler_briquettes_kg",
    name: "Boiler — briquettes",
    unit: "kg",
    frequency: "monthly", // daily logbook aggregated to monthly submission
    evidence_required: "required",
    category: "energy",
    applicability: { warehouse: "not_applicable", factory: "conditional" },
    conditional_predicate: { has_boiler: true },
    evidence_note: "Logbook photos + vendor invoices (OCR)",
    design_ref: "§13.1 (briquettes-only per 2026-04-28 decision)",
  },
  {
    code: "solar_generation_kwh",
    name: "Solar — generation",
    unit: "kWh",
    frequency: "monthly",
    evidence_required: "required",
    category: "energy",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_solar: true },
    evidence_note: "Solar PPA bill (OCR)",
    design_ref: "§13.1",
  },
  {
    code: "petrol_owned_vehicles_litres",
    name: "Petrol — owned vehicles",
    unit: "litres",
    frequency: "monthly",
    evidence_required: "required",
    category: "energy",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_internal_fleet: true },
    evidence_note: "Fuel bill (OCR)",
    design_ref: "§13.1",
  },
  {
    code: "cng_owned_vehicles_kg",
    name: "CNG — owned vehicles",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "energy",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_internal_fleet: true },
    evidence_note: "Fuel bill (OCR)",
    design_ref: "§13.1",
  },

  // ==========================================================================
  // Water domain (design doc §12)
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
    evidence_note: "Vendor invoice; natural-unit picker per UI sketch p16",
    design_ref: "§12.1",
  },
  {
    code: "municipal_water_kl",
    name: "Municipal water — supply",
    unit: "kL",
    frequency: "monthly",
    evidence_required: "required",
    category: "water",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_municipal_water: true },
    evidence_note: "Utility bill (OCR)",
    design_ref: "§12.1",
  },
  {
    code: "tanker_water_kl",
    name: "Tanker water",
    unit: "kL",
    frequency: "monthly",
    evidence_required: "required",
    category: "water",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_tanker_water: true },
    evidence_note: "Vendor invoice / delivery slip",
    design_ref: "§12.1",
  },
  {
    code: "groundwater_extraction_kl",
    name: "Groundwater extraction",
    unit: "kL",
    frequency: "daily",
    evidence_required: "required",
    category: "water",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_groundwater: true },
    evidence_note: "Meter photos + CGWA permit",
    design_ref: "§12.1",
  },
  {
    code: "recycled_water_stp_output_kl",
    name: "Recycled water — STP output reused",
    unit: "kL",
    frequency: "monthly",
    evidence_required: "required",
    category: "water",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_stp: true },
    evidence_note: "STP logbook + monthly third-party report",
    design_ref: "§12.1",
  },
  {
    code: "rainwater_harvested_kl",
    name: "Rainwater harvested",
    unit: "kL",
    frequency: "monthly",
    evidence_required: "optional",
    category: "water",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_rainwater_harvesting: true },
    evidence_note: "RWH meter or CGWB-2007 estimation worksheet",
    design_ref: "§12.2 (CGWB-2007 methodology)",
  },
  {
    code: "rainfall_mm",
    name: "Rainfall (rain gauge)",
    unit: "mm",
    frequency: "daily",
    evidence_required: "none",
    category: "water",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_rainwater_harvesting: true },
    evidence_note: "Rain gauge reading (typed)",
    design_ref: "§12.1",
  },
  // STP discharge — quality split into BOD/COD/TSS (single-numeric storage)
  {
    code: "stp_discharge_bod_mgl",
    name: "STP outlet — BOD",
    unit: "mg/L",
    frequency: "monthly",
    evidence_required: "required",
    category: "water",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_stp: true },
    evidence_note: "Lab report (OCR) — monthly third-party test",
    design_ref: "§12.1 (BOD split from quality multi-value row)",
  },
  {
    code: "stp_discharge_cod_mgl",
    name: "STP outlet — COD",
    unit: "mg/L",
    frequency: "monthly",
    evidence_required: "required",
    category: "water",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_stp: true },
    evidence_note: "Lab report (OCR) — monthly third-party test",
    design_ref: "§12.1 (COD split)",
  },
  {
    code: "stp_discharge_tss_mgl",
    name: "STP outlet — TSS",
    unit: "mg/L",
    frequency: "monthly",
    evidence_required: "required",
    category: "water",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_stp: true },
    evidence_note: "Lab report (OCR) — monthly third-party test",
    design_ref: "§12.1 (TSS split)",
  },
  {
    code: "stp_discharge_volume_kl",
    name: "STP discharge — volume",
    unit: "kL",
    frequency: "daily",
    evidence_required: "required",
    category: "water",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_stp: true },
    evidence_note: "STP logbook",
    design_ref: "§12.1",
  },
  {
    code: "borewell_water_test_mgl",
    name: "Borewell water test (TDS)",
    unit: "mg/L",
    frequency: "monthly",
    evidence_required: "required",
    category: "water",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_groundwater: true },
    evidence_note: "Lab report (OCR)",
    design_ref: "§12.1",
  },
  {
    code: "boiler_process_water_litres",
    name: "Boiler process water",
    unit: "litres",
    frequency: "daily",
    evidence_required: "none",
    category: "water",
    applicability: { warehouse: "not_applicable", factory: "conditional" },
    conditional_predicate: { has_boiler: true },
    evidence_note: "Logbook (typed)",
    design_ref: "§12.1",
  },

  // ==========================================================================
  // Waste — general (design doc §16)
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
    design_ref: "§16.1",
  },
  {
    code: "wet_food_waste_kg",
    name: "Wet / food waste",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_general",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_canteen: true },
    evidence_note: "Vendor manifest (compost vendor)",
    design_ref: "§16.1",
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
    design_ref: "§16.1",
  },
  {
    code: "plastic_packaging_waste_kg",
    name: "Plastic packaging",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_general",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Vendor manifest",
    design_ref: "§16.1",
  },
  {
    code: "fabric_waste_kg",
    name: "Fabric scrap",
    unit: "kg",
    frequency: "daily",
    evidence_required: "required",
    category: "waste_general",
    applicability: { warehouse: "not_applicable", factory: "always" },
    conditional_predicate: null,
    evidence_note: "Vendor invoice on disposal",
    design_ref: "§16.1",
  },
  {
    code: "metal_scrap_kg",
    name: "Metal scrap",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_general",
    applicability: { warehouse: "not_applicable", factory: "always" },
    conditional_predicate: null,
    evidence_note: "Vendor manifest",
    design_ref: "§16.1",
  },
  {
    code: "wood_scrap_kg",
    name: "Wood scrap",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_general",
    applicability: { warehouse: "not_applicable", factory: "always" },
    conditional_predicate: null,
    evidence_note: "Vendor manifest",
    design_ref: "§16.1",
  },
  {
    code: "boiler_ash_kg",
    name: "Boiler ash (onsite composted)",
    unit: "kg",
    frequency: "daily",
    evidence_required: "none",
    category: "waste_general",
    applicability: { warehouse: "not_applicable", factory: "conditional" },
    conditional_predicate: { has_boiler: true },
    evidence_note: "None — onsite composting per §16.1",
    design_ref: "§16.1",
  },
  {
    code: "e_waste_kg",
    name: "E-waste (electrical & electronic)",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_general",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Authorized recycler manifest",
    design_ref: "§15.1 / §16.1",
  },
  {
    code: "sanitary_waste_kg",
    name: "Sanitary waste",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_general",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Vendor manifest",
    design_ref: "§16.1",
  },

  // ==========================================================================
  // Waste — hazardous (design doc §15)
  // Per inconsistency-J resolution: all factories see all hazardous categories
  // (no per-facility active_haz_categories list). Biomedical gates on first_aid.
  // Two-event model (generation + disposal) per §15 lives in `hazardous_events`.
  // ==========================================================================
  {
    code: "haz_used_oil_kg",
    name: "Hazardous — used oil",
    unit: "kg",
    frequency: "daily",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { warehouse: "not_applicable", factory: "always" },
    conditional_predicate: null,
    evidence_note: "Generation: HWM register (daily). Disposal: vendor manifest (event).",
    design_ref: "§15.1",
  },
  {
    code: "haz_oil_soaked_cotton_kg",
    name: "Hazardous — oil-soaked cotton / cloth",
    unit: "kg",
    frequency: "daily",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { warehouse: "not_applicable", factory: "always" },
    conditional_predicate: null,
    evidence_note: "Generation: HWM register. Disposal: vendor manifest.",
    design_ref: "§15.1",
  },
  {
    code: "haz_batteries_kg",
    name: "Hazardous — batteries (lead-acid, lithium)",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Buy-back receipt (event)",
    design_ref: "§15.1",
  },
  {
    code: "haz_e_waste_regulated_kg",
    name: "Hazardous — e-waste (regulated)",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Vendor manifest (regulated e-waste handler)",
    design_ref: "§15.1",
  },
  {
    code: "haz_biomedical_kg",
    name: "Hazardous — biomedical waste",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_first_aid: true },
    evidence_note: "Authorized incinerator vendor invoice",
    design_ref: "§15.1 (gates on first-aid presence — only narrow exception)",
  },
  {
    code: "haz_etp_stp_sludge_kg",
    name: "Hazardous — ETP / STP sludge",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_stp: true },
    evidence_note: "HWM register + manifest (only generated where STP exists)",
    design_ref: "§15.1",
  },
  {
    code: "haz_other_kg",
    name: "Hazardous — any other (manual category)",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "waste_haz",
    applicability: { warehouse: "always", factory: "always" },
    conditional_predicate: null,
    evidence_note: "Vendor manifest. Free-text category description in submission.",
    design_ref: "§15.1 (catch-all)",
  },

  // ==========================================================================
  // Air emissions (design doc §14)
  // Ambient air monitoring is explicitly OUT of scope per §14.1.
  // ==========================================================================
  {
    code: "stack_emissions_boiler_mgnm3",
    name: "Stack emissions — boiler (PM, SOx, NOx, CO)",
    unit: "mg/Nm³",
    frequency: "monthly",
    evidence_required: "required",
    category: "air",
    applicability: { warehouse: "not_applicable", factory: "conditional" },
    conditional_predicate: { has_boiler: true },
    evidence_note: "Lab report (OCR) — monthly third-party test (one report per stack)",
    design_ref: "§14.1",
  },
  {
    code: "stack_emissions_dg_mgnm3",
    name: "Stack emissions — DG (PM, SOx, NOx, CO)",
    unit: "mg/Nm³",
    frequency: "monthly",
    evidence_required: "required",
    category: "air",
    applicability: { warehouse: "conditional", factory: "conditional" },
    conditional_predicate: { has_dg: true },
    evidence_note: "Lab report (OCR) — monthly third-party test (per DG stack)",
    design_ref: "§14.1",
  },
  {
    code: "refrigerant_hvac_kg",
    name: "Refrigerant — HVAC refill",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "air",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Service invoice (gas type R-22 / R-32 / R-407A / R-410A captured separately)",
    design_ref: "§14.2 (refrigerant fugitive scope-1)",
  },
  {
    code: "co2_fire_suppression_kg",
    name: "CO₂ refill — fire suppression",
    unit: "kg",
    frequency: "monthly",
    evidence_required: "required",
    category: "air",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Vendor invoice",
    design_ref: "§14.2",
  },

  // ==========================================================================
  // Operational and contextual parameters (design doc §17, §18)
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
    evidence_note: "HRMS extract or typed monthly summary",
    design_ref: "§13.1 / §17",
  },
  {
    code: "garments_produced_units",
    name: "Garments produced",
    unit: "units",
    frequency: "monthly",
    evidence_required: "required",
    category: "operational",
    applicability: { warehouse: "not_applicable", factory: "always" },
    conditional_predicate: null,
    evidence_note: "Production report (monthly summary surface)",
    design_ref: "§17 / §25",
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
    evidence_note: "Typed monthly summary",
    design_ref: "§17",
  },

  // Master data items — included for catalog completeness; seed should NOT
  // create parameter_assignments for these (master data is edited via the HO
  // Master Data UI, not through contributor submissions).
  {
    code: "floor_area_sqft",
    name: "Floor / built-up area (master)",
    unit: "sq ft",
    frequency: "annual",
    evidence_required: "none",
    category: "master_data",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Master data record",
    design_ref: "§13.1 / §18",
  },
  {
    code: "staff_headcount",
    name: "Staff headcount (master)",
    unit: "headcount",
    frequency: "annual",
    evidence_required: "none",
    category: "master_data",
    applicability: ALL_TEMPLATES_ALWAYS,
    conditional_predicate: null,
    evidence_note: "Master data record",
    design_ref: "§18",
  },
];

/**
 * Quick stats for sanity (post-rescope):
 *   Total parameters:  ~46  (tracking; reseed prints exact count)
 *     Energy:          7  (grid, dg-own, lpg, briquettes, solar, petrol, cng)
 *     Water:           13 (incl. rainfall daily, boiler process water, BOD/COD/TSS split)
 *     Waste-general:   10
 *     Waste-haz:       7  (used oil, oil cotton, batteries, e-waste, biomedical, sludge, other)
 *     Air:             4  (boiler stack, DG stack, refrigerant HVAC, CO2 fire)
 *     Operational:     3
 *     Master data:     2
 *
 * Fuller alignment with design doc §12-18 (per-DG daily cards, NCV test report,
 * separate stack reports per stack instance) is a Phase 2 task.
 */
