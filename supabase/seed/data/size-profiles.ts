// =============================================================================
// supabase/seed/data/size-profiles.ts
//
// Realistic monthly value ranges per facility × parameter.
// Domain-calibrated for ABFRL factories and warehouses, not random faker numbers.
// Ranges are [min, max] inclusive; the synthetic-values generator picks a
// uniform random value within and applies mild month-on-month drift.
//
// Parameters not listed here fall back to DEFAULT_RANGE per category.
//
// REBUILT 2026-05-06 for the rescoped 15-facility footprint:
//   - All 7 retail-store profiles (STR00001-STR00007) removed.
//   - Retail-only fields removed from FacilityProfile interface
//     (diesel_dg_mall_shared_litres, refrigerant_chiller_kg,
//     ambient_air_quality_ugm3).
//   - Hazardous fields renamed to match the new parameter codes
//     (haz_oil_soaked_cotton_kg, haz_e_waste_regulated_kg, haz_biomedical_kg,
//     haz_other_kg).
//   - FAC00001 + FAC00002 + WHG00001 retain detailed profiles. The 9 new
//     factories and 3 new warehouses use defaults until Phase 2 calibrates them
//     individually (low-priority — synthetic data still looks reasonable on
//     defaults at the demo's volumes).
// =============================================================================

// [min, max] for a monthly submission value
export type ValueRange = [number, number];

export interface FacilityProfile {
  // Energy
  grid_electricity_kwh?: ValueRange;
  diesel_dg_own_litres?: ValueRange;
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
  rainfall_mm?: ValueRange;
  stp_discharge_bod_mgl?: ValueRange;
  stp_discharge_cod_mgl?: ValueRange;
  stp_discharge_tss_mgl?: ValueRange;
  stp_discharge_volume_kl?: ValueRange;
  borewell_water_test_mgl?: ValueRange;
  boiler_process_water_litres?: ValueRange;
  // Waste — general
  mixed_dry_waste_kg?: ValueRange;
  wet_food_waste_kg?: ValueRange;
  cardboard_paper_waste_kg?: ValueRange;
  plastic_packaging_waste_kg?: ValueRange;
  fabric_waste_kg?: ValueRange;
  metal_scrap_kg?: ValueRange;
  wood_scrap_kg?: ValueRange;
  boiler_ash_kg?: ValueRange;
  e_waste_kg?: ValueRange;
  sanitary_waste_kg?: ValueRange;
  // Waste — hazardous (generation per category per month)
  haz_used_oil_kg?: ValueRange;
  haz_oil_soaked_cotton_kg?: ValueRange;
  haz_batteries_kg?: ValueRange;
  haz_e_waste_regulated_kg?: ValueRange;
  haz_biomedical_kg?: ValueRange;
  haz_etp_stp_sludge_kg?: ValueRange;
  haz_other_kg?: ValueRange;
  // Air
  stack_emissions_boiler_mgnm3?: ValueRange;
  stack_emissions_dg_mgnm3?: ValueRange;
  refrigerant_hvac_kg?: ValueRange;
  co2_fire_suppression_kg?: ValueRange;
  // Operational
  manhours_worked?: ValueRange;
  garments_produced_units?: ValueRange;
  operating_days_hours?: ValueRange;
}

// Per-facility profiles keyed by SAP code. Facilities not listed here fall
// back to DEFAULT_RANGE per category in synthetic-values.ts.
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
    rainwater_harvested_kl:       [40, 220],
    stp_discharge_bod_mgl:        [16, 26],        // well within 30 limit
    stp_discharge_cod_mgl:        [140, 200],       // well within 250 limit
    stp_discharge_tss_mgl:        [45, 80],         // well within 100 limit
    stp_discharge_volume_kl:      [300, 480],
    borewell_water_test_mgl:      [400, 1100],
    boiler_process_water_litres:  [3000, 5500],
    mixed_dry_waste_kg:           [1600, 2400],
    wet_food_waste_kg:            [380, 520],
    cardboard_paper_waste_kg:     [600, 900],
    plastic_packaging_waste_kg:   [280, 420],
    fabric_waste_kg:              [800, 1200],
    metal_scrap_kg:               [40, 80],
    wood_scrap_kg:                [50, 110],
    boiler_ash_kg:                [400, 650],
    e_waste_kg:                   [40, 80],
    sanitary_waste_kg:            [60, 90],
    haz_used_oil_kg:              [85, 125],
    haz_oil_soaked_cotton_kg:     [60, 100],
    haz_batteries_kg:             [20, 40],
    haz_e_waste_regulated_kg:     [10, 25],
    haz_biomedical_kg:            [3, 8],
    haz_etp_stp_sludge_kg:        [120, 200],
    haz_other_kg:                 [5, 25],
    // stack_emissions_boiler_mgnm3 has special handling in wave1.ts for the
    // compliance breach in Mar 2026; range below is used for all other months
    stack_emissions_boiler_mgnm3: [62, 88],
    stack_emissions_dg_mgnm3:     [48, 72],
    refrigerant_hvac_kg:          [0, 3],           // refilled only if needed
    co2_fire_suppression_kg:      [0, 4],
    manhours_worked:              [42000, 52000],
    garments_produced_units:      [46000, 62000],
    operating_days_hours:         [26, 27],
  },

  // ── Medium factory — Tirupur ───────────────────────────────────────────────
  FAC00002: {
    grid_electricity_kwh:         [34000, 50000],
    diesel_dg_own_litres:         [900, 1400],      // 2 DGs
    lpg_canteen_kg:               [140, 200],
    boiler_briquettes_kg:         [4000, 6200],
    tanker_water_kl:              [80, 160],        // has_tanker_water=true
    drinking_water_bottled_litres:[220, 320],
    municipal_water_kl:           [380, 560],
    boiler_process_water_litres:  [1800, 3200],
    mixed_dry_waste_kg:           [800, 1200],
    wet_food_waste_kg:            [180, 260],
    cardboard_paper_waste_kg:     [300, 480],
    plastic_packaging_waste_kg:   [140, 220],
    fabric_waste_kg:              [400, 700],
    metal_scrap_kg:               [20, 45],
    wood_scrap_kg:                [25, 60],
    boiler_ash_kg:                [200, 380],
    e_waste_kg:                   [20, 45],
    sanitary_waste_kg:            [35, 55],
    haz_used_oil_kg:              [40, 65],
    haz_oil_soaked_cotton_kg:     [25, 50],
    haz_batteries_kg:             [10, 22],
    haz_e_waste_regulated_kg:     [8, 18],
    haz_biomedical_kg:            [1, 4],
    haz_other_kg:                 [3, 12],
    stack_emissions_boiler_mgnm3: [55, 82],
    stack_emissions_dg_mgnm3:     [40, 64],
    refrigerant_hvac_kg:          [0, 2],
    co2_fire_suppression_kg:      [0, 2],
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
    groundwater_extraction_kl:    [40, 75],
    stp_discharge_volume_kl:      [30, 60],
    stp_discharge_bod_mgl:        [12, 24],
    stp_discharge_cod_mgl:        [110, 190],
    stp_discharge_tss_mgl:        [30, 70],
    mixed_dry_waste_kg:           [220, 380],
    cardboard_paper_waste_kg:     [400, 650],       // lots of packaging
    plastic_packaging_waste_kg:   [160, 280],
    e_waste_kg:                   [10, 22],
    sanitary_waste_kg:            [18, 30],
    haz_batteries_kg:             [12, 30],         // forklift batteries
    haz_e_waste_regulated_kg:     [3, 10],
    haz_other_kg:                 [1, 5],
    stack_emissions_dg_mgnm3:     [38, 58],
    refrigerant_hvac_kg:          [0, 2],
    co2_fire_suppression_kg:      [0, 2],
    manhours_worked:              [8000, 12000],
    operating_days_hours:         [26, 27],
  },

  // The remaining 9 factories (FAC00003–FAC00011) and 3 warehouses
  // (WHG00002–WHG00004) use DEFAULT_RANGE fallbacks from synthetic-values.ts.
  // Phase 2 task: add per-facility profiles when calibration matters.
};
