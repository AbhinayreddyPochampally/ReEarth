// =============================================================================
// supabase/seed/data/size-profiles.ts
//
// Realistic monthly value ranges per facility × parameter.
// Values are domain-calibrated for ABFRL facilities, not random faker numbers.
// Ranges represent [min, max] inclusive; the synthetic-values generator picks
// a uniform random value within and applies mild month-on-month drift.
//
// Parameters not listed here fall back to DEFAULT_RANGE per category.
// =============================================================================

// [min, max] for a monthly submission value
export type ValueRange = [number, number];

export interface FacilityProfile {
  // Energy
  grid_electricity_kwh?: ValueRange;
  diesel_dg_own_litres?: ValueRange;
  diesel_dg_mall_shared_litres?: ValueRange;
  lpg_canteen_kg?: ValueRange;
  boiler_briquettes_kg?: ValueRange;
  solar_generation_kwh?: ValueRange;
  petrol_owned_vehicles_litres?: ValueRange;
  cng_owned_vehicles_kg?: ValueRange;
  // Water
  drinking_water_bottled_litres?: ValueRange;
  municipal_water_kl?: ValueRange;
  tanker_water_kl?: ValueRange;
  groundwater_extraction_kl?: ValueRange;
  recycled_water_stp_output_kl?: ValueRange;
  rainwater_harvested_kl?: ValueRange;
  stp_discharge_bod_mgl?: ValueRange;
  stp_discharge_cod_mgl?: ValueRange;
  stp_discharge_tss_mgl?: ValueRange;
  stp_discharge_volume_kl?: ValueRange;
  // Waste — general
  mixed_dry_waste_kg?: ValueRange;
  wet_food_waste_kg?: ValueRange;
  cardboard_paper_waste_kg?: ValueRange;
  plastic_packaging_waste_kg?: ValueRange;
  e_waste_kg?: ValueRange;
  sanitary_waste_kg?: ValueRange;
  // Waste — hazardous (generation per category per month)
  haz_used_oil_kg?: ValueRange;
  haz_chemical_containers_kg?: ValueRange;
  haz_etp_stp_sludge_kg?: ValueRange;
  haz_contaminated_cotton_kg?: ValueRange;
  haz_fluorescent_tubes_kg?: ValueRange;
  haz_batteries_kg?: ValueRange;
  haz_coolant_refrigerant_kg?: ValueRange;
  haz_paint_solvent_kg?: ValueRange;
  haz_e_waste_kg?: ValueRange;
  // Air
  stack_emissions_boiler_mgnm3?: ValueRange;
  stack_emissions_dg_mgnm3?: ValueRange;
  refrigerant_hvac_kg?: ValueRange;
  refrigerant_chiller_kg?: ValueRange;
  ambient_air_quality_ugm3?: ValueRange;
  // Operational
  manhours_worked?: ValueRange;
  garments_produced_units?: ValueRange;
  operating_days_hours?: ValueRange;
}

// Per-facility profiles keyed by SAP code
export const PROFILES: Record<string, FacilityProfile> = {
  // ── Large factory — Bengaluru ──────────────────────────────────────────────
  FAC00001: {
    grid_electricity_kwh:         [62000, 78000],
    diesel_dg_own_litres:         [1800, 2600],   // 4 DGs, infrequent outages
    lpg_canteen_kg:               [280, 380],
    boiler_briquettes_kg:         [8500, 11500],
    solar_generation_kwh:         [4200, 5800],
    drinking_water_bottled_litres:[480, 620],
    municipal_water_kl:           [850, 1150],
    groundwater_extraction_kl:    [220, 360],
    recycled_water_stp_output_kl: [180, 280],
    stp_discharge_bod_mgl:        [16, 26],        // well within 30 limit
    stp_discharge_cod_mgl:        [140, 200],       // well within 250 limit
    stp_discharge_tss_mgl:        [45, 80],         // well within 100 limit
    stp_discharge_volume_kl:      [300, 480],
    mixed_dry_waste_kg:           [1600, 2400],
    wet_food_waste_kg:            [380, 520],
    cardboard_paper_waste_kg:     [600, 900],
    plastic_packaging_waste_kg:   [280, 420],
    e_waste_kg:                   [40, 80],
    sanitary_waste_kg:            [60, 90],
    haz_used_oil_kg:              [85, 125],
    haz_etp_stp_sludge_kg:        [120, 200],
    haz_contaminated_cotton_kg:   [60, 100],
    haz_fluorescent_tubes_kg:     [8, 18],
    haz_batteries_kg:             [20, 40],
    haz_paint_solvent_kg:         [25, 45],
    // stack_emissions_boiler_mgnm3 has special handling in wave1.ts for the
    // compliance breach in Mar 2026; range below is used for all other months
    stack_emissions_boiler_mgnm3: [62, 88],
    stack_emissions_dg_mgnm3:     [48, 72],
    refrigerant_hvac_kg:          [0, 3],           // refilled only if needed
    manhours_worked:              [42000, 52000],
    garments_produced_units:      [46000, 62000],
    operating_days_hours:         [26, 27],         // approx operating days
  },

  // ── Medium factory — Tirupur ───────────────────────────────────────────────
  FAC00002: {
    grid_electricity_kwh:         [34000, 50000],
    diesel_dg_own_litres:         [900, 1400],      // 2 DGs
    lpg_canteen_kg:               [140, 200],
    boiler_briquettes_kg:         [4000, 6200],
    tanker_water_kl:              [80, 160],        // uses_tanker_water=true
    drinking_water_bottled_litres:[220, 320],
    municipal_water_kl:           [380, 560],
    mixed_dry_waste_kg:           [800, 1200],
    wet_food_waste_kg:            [180, 260],
    cardboard_paper_waste_kg:     [300, 480],
    plastic_packaging_waste_kg:   [140, 220],
    e_waste_kg:                   [20, 45],
    sanitary_waste_kg:            [35, 55],
    haz_used_oil_kg:              [40, 65],
    haz_fluorescent_tubes_kg:     [5, 12],
    haz_batteries_kg:             [10, 22],
    haz_e_waste_kg:               [15, 35],
    stack_emissions_boiler_mgnm3: [55, 82],
    stack_emissions_dg_mgnm3:     [40, 64],
    refrigerant_hvac_kg:          [0, 2],
    manhours_worked:              [22000, 30000],
    garments_produced_units:      [22000, 36000],
    operating_days_hours:         [25, 27],
  },

  // ── Warehouse — Bhiwandi ───────────────────────────────────────────────────
  WHG00001: {
    grid_electricity_kwh:         [12000, 18000],
    diesel_dg_own_litres:         [180, 320],       // 1 DG, backup only
    solar_generation_kwh:         [1800, 2600],
    petrol_owned_vehicles_litres: [280, 420],       // internal fleet
    cng_owned_vehicles_kg:        [60, 110],
    drinking_water_bottled_litres:[80, 130],
    municipal_water_kl:           [55, 90],
    mixed_dry_waste_kg:           [220, 380],
    cardboard_paper_waste_kg:     [400, 650],       // lots of packaging
    plastic_packaging_waste_kg:   [160, 280],
    e_waste_kg:                   [10, 22],
    sanitary_waste_kg:            [18, 30],
    stack_emissions_dg_mgnm3:     [38, 58],         // Gate 6: warehouse included
    refrigerant_hvac_kg:          [0, 2],
    manhours_worked:              [8000, 12000],
    operating_days_hours:         [26, 27],
  },

  // ── Large store — 50K sqft, Bengaluru ─────────────────────────────────────
  STR00001: {
    grid_electricity_kwh:         [14000, 20000],
    diesel_dg_mall_shared_litres: [60, 120],        // mall allocation
    drinking_water_bottled_litres:[120, 180],
    municipal_water_kl:           [80, 120],
    mixed_dry_waste_kg:           [280, 460],
    cardboard_paper_waste_kg:     [150, 250],
    plastic_packaging_waste_kg:   [80, 140],
    e_waste_kg:                   [6, 14],
    sanitary_waste_kg:            [22, 38],
    haz_fluorescent_tubes_kg:     [4, 10],
    haz_batteries_kg:             [3, 8],
    refrigerant_hvac_kg:          [0, 2],
    manhours_worked:              [3600, 5200],
    operating_days_hours:         [28, 30],
  },

  // ── Medium stores (3K–4.5K sqft) ──────────────────────────────────────────
  STR00002: {
    grid_electricity_kwh:         [2400, 3600],
    diesel_dg_mall_shared_litres: [8, 20],
    drinking_water_bottled_litres:[20, 35],
    municipal_water_kl:           [12, 20],
    mixed_dry_waste_kg:           [35, 65],
    cardboard_paper_waste_kg:     [18, 35],
    plastic_packaging_waste_kg:   [10, 22],
    e_waste_kg:                   [1, 4],
    sanitary_waste_kg:            [5, 10],
    haz_fluorescent_tubes_kg:     [1, 3],
    haz_batteries_kg:             [1, 3],
    refrigerant_hvac_kg:          [0, 1],
    manhours_worked:              [500, 800],
    operating_days_hours:         [28, 30],
  },
  STR00003: {
    grid_electricity_kwh:         [2800, 4200],
    drinking_water_bottled_litres:[22, 38],
    municipal_water_kl:           [14, 24],
    mixed_dry_waste_kg:           [40, 75],
    cardboard_paper_waste_kg:     [20, 40],
    plastic_packaging_waste_kg:   [12, 26],
    e_waste_kg:                   [1, 4],
    sanitary_waste_kg:            [6, 12],
    haz_fluorescent_tubes_kg:     [1, 4],
    haz_batteries_kg:             [1, 3],
    refrigerant_hvac_kg:          [0, 1],
    manhours_worked:              [600, 900],
    operating_days_hours:         [28, 30],
  },

  // ── Small stores (1.5K–2.8K sqft) ─────────────────────────────────────────
  STR00004: {
    grid_electricity_kwh:         [1800, 2800],
    diesel_dg_mall_shared_litres: [5, 14],
    drinking_water_bottled_litres:[15, 28],
    municipal_water_kl:           [8, 16],
    mixed_dry_waste_kg:           [22, 45],
    cardboard_paper_waste_kg:     [12, 28],
    plastic_packaging_waste_kg:   [7, 16],
    e_waste_kg:                   [0.5, 2.5],
    sanitary_waste_kg:            [3, 8],
    haz_fluorescent_tubes_kg:     [0.5, 2],
    haz_batteries_kg:             [0.5, 2],
    refrigerant_hvac_kg:          [0, 1],
    manhours_worked:              [380, 600],
    operating_days_hours:         [28, 30],
  },
  STR00005: {
    grid_electricity_kwh:         [1400, 2200],
    drinking_water_bottled_litres:[12, 22],
    municipal_water_kl:           [7, 14],
    mixed_dry_waste_kg:           [16, 35],
    cardboard_paper_waste_kg:     [9, 20],
    plastic_packaging_waste_kg:   [5, 13],
    e_waste_kg:                   [0.5, 2],
    sanitary_waste_kg:            [2, 6],
    haz_fluorescent_tubes_kg:     [0.5, 1.5],
    haz_batteries_kg:             [0.5, 1.5],
    refrigerant_hvac_kg:          [0, 1],
    manhours_worked:              [300, 480],
    operating_days_hours:         [28, 30],
  },
  STR00006: {
    grid_electricity_kwh:         [1600, 2600],
    drinking_water_bottled_litres:[14, 26],
    municipal_water_kl:           [8, 15],
    mixed_dry_waste_kg:           [18, 40],
    cardboard_paper_waste_kg:     [10, 24],
    plastic_packaging_waste_kg:   [6, 15],
    e_waste_kg:                   [0.5, 2],
    sanitary_waste_kg:            [3, 7],
    haz_fluorescent_tubes_kg:     [0.5, 2],
    haz_batteries_kg:             [0.5, 2],
    refrigerant_hvac_kg:          [0, 1],
    manhours_worked:              [340, 540],
    operating_days_hours:         [28, 30],
  },
  STR00007: {
    grid_electricity_kwh:         [1200, 2000],
    diesel_dg_mall_shared_litres: [4, 12],
    drinking_water_bottled_litres:[10, 18],
    municipal_water_kl:           [6, 12],
    mixed_dry_waste_kg:           [14, 30],
    cardboard_paper_waste_kg:     [8, 18],
    plastic_packaging_waste_kg:   [4, 11],
    e_waste_kg:                   [0.5, 2],
    sanitary_waste_kg:            [2, 5],
    haz_fluorescent_tubes_kg:     [0.5, 1.5],
    haz_batteries_kg:             [0.5, 1.5],
    refrigerant_hvac_kg:          [0, 1],
    manhours_worked:              [280, 440],
    operating_days_hours:         [28, 30],
  },
};

// Category-level defaults for parameters not in the facility's profile
export const CATEGORY_DEFAULTS: Record<string, ValueRange> = {
  energy:          [50, 200],
  water:           [10, 80],
  waste_general:   [20, 100],
  waste_haz:       [5, 30],
  air:             [30, 90],
  operational:     [100, 500],
  master_data:     [0, 0],
};
