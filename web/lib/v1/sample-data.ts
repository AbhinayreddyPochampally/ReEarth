import type {
  Alert,
  Bill,
  Facility,
  LogActivity,
  MonthlySummary,
  Parameter,
  ParameterTrend,
  Personnel,
  Submission,
} from './types';

export const facilities: Facility[] = [
  { id: 'fac-bengaluru', sapCode: 'FAC00001', name: 'Factory Bengaluru', kind: 'factory', city: 'Bengaluru', state: 'Karnataka', areaSqft: 92400, contributors: 4, live: true, flags: { hasDg: true, hasBoiler: true, hasSolar: true, hasStp: true, hasGroundwater: true, hasCanteen: true } },
  { id: 'fac-tirupur', sapCode: 'FAC00002', name: 'Factory Tirupur', kind: 'factory', city: 'Tirupur', state: 'Tamil Nadu', areaSqft: 81200, contributors: 3, live: true, flags: { hasDg: true, hasBoiler: true, hasSolar: false, hasStp: true, hasGroundwater: true, hasCanteen: true } },
  { id: 'fac-hosur', sapCode: 'FAC00003', name: 'Factory Hosur', kind: 'factory', city: 'Hosur', state: 'Tamil Nadu', areaSqft: 88400, contributors: 4, live: true, flags: { hasDg: true, hasBoiler: false, hasSolar: true, hasStp: true, hasGroundwater: true, hasCanteen: true } },
  { id: 'fac-mysuru', sapCode: 'FAC00004', name: 'Factory Mysuru', kind: 'factory', city: 'Mysuru', state: 'Karnataka', areaSqft: 74500, contributors: 3, live: true, flags: { hasDg: true, hasBoiler: true, hasSolar: true, hasStp: true, hasGroundwater: false, hasCanteen: true } },
  { id: 'fac-doddaballapura', sapCode: 'FAC00005', name: 'Factory Doddaballapura', kind: 'factory', city: 'Doddaballapura', state: 'Karnataka', areaSqft: 67800, contributors: 3, live: true, flags: { hasDg: true, hasBoiler: true, hasSolar: false, hasStp: true, hasGroundwater: true, hasCanteen: false } },
  { id: 'fac-bommasandra', sapCode: 'FAC00006', name: 'Factory Bommasandra', kind: 'factory', city: 'Bommasandra', state: 'Karnataka', areaSqft: 70200, contributors: 3, live: true, flags: { hasDg: true, hasBoiler: false, hasSolar: true, hasStp: true, hasGroundwater: true, hasCanteen: true } },
  { id: 'fac-madhavaram', sapCode: 'FAC00007', name: 'Factory Madhavaram', kind: 'factory', city: 'Chennai', state: 'Tamil Nadu', areaSqft: 63800, contributors: 2, live: true, flags: { hasDg: true, hasBoiler: true, hasSolar: false, hasStp: true, hasGroundwater: false, hasCanteen: true } },
  { id: 'fac-tumkur', sapCode: 'FAC00008', name: 'Factory Tumkur', kind: 'factory', city: 'Tumkur', state: 'Karnataka', areaSqft: 59800, contributors: 2, live: true, flags: { hasDg: true, hasBoiler: true, hasSolar: true, hasStp: false, hasGroundwater: true, hasCanteen: true } },
  { id: 'fac-kanchipuram', sapCode: 'FAC00009', name: 'Factory Kanchipuram', kind: 'factory', city: 'Kanchipuram', state: 'Tamil Nadu', areaSqft: 61500, contributors: 2, live: true, flags: { hasDg: true, hasBoiler: false, hasSolar: false, hasStp: true, hasGroundwater: true, hasCanteen: false } },
  { id: 'fac-coimbatore', sapCode: 'FAC00010', name: 'Factory Coimbatore', kind: 'factory', city: 'Coimbatore', state: 'Tamil Nadu', areaSqft: 83200, contributors: 3, live: true, flags: { hasDg: true, hasBoiler: true, hasSolar: true, hasStp: true, hasGroundwater: true, hasCanteen: true } },
  { id: 'fac-belgaum', sapCode: 'FAC00011', name: 'Factory Belgaum', kind: 'factory', city: 'Belgaum', state: 'Karnataka', areaSqft: 55200, contributors: 2, live: true, flags: { hasDg: true, hasBoiler: true, hasSolar: false, hasStp: false, hasGroundwater: true, hasCanteen: true } },
  { id: 'wh-bhiwandi', sapCode: 'FAC00012', name: 'Warehouse Bhiwandi', kind: 'warehouse', city: 'Bhiwandi', state: 'Maharashtra', areaSqft: 124000, contributors: 2, live: true, flags: { hasDg: true, hasBoiler: false, hasSolar: true, hasStp: false, hasGroundwater: false, hasCanteen: false } },
  { id: 'wh-hosur', sapCode: 'FAC00013', name: 'Warehouse Hosur', kind: 'warehouse', city: 'Hosur', state: 'Tamil Nadu', areaSqft: 102000, contributors: 2, live: true, flags: { hasDg: true, hasBoiler: false, hasSolar: false, hasStp: false, hasGroundwater: false, hasCanteen: false } },
  { id: 'wh-kolkata', sapCode: 'FAC00014', name: 'Warehouse Kolkata', kind: 'warehouse', city: 'Kolkata', state: 'West Bengal', areaSqft: 88000, contributors: 2, live: true, flags: { hasDg: true, hasBoiler: false, hasSolar: true, hasStp: false, hasGroundwater: false, hasCanteen: false } },
  { id: 'wh-gurugram', sapCode: 'FAC00015', name: 'Warehouse Gurugram', kind: 'warehouse', city: 'Gurugram', state: 'Haryana', areaSqft: 94500, contributors: 2, live: true, flags: { hasDg: true, hasBoiler: false, hasSolar: false, hasStp: false, hasGroundwater: false, hasCanteen: false } },
];

export const personnel: Personnel[] = [
  { id: 'asha', name: 'Asha M.', role: 'contributor', facilityIds: ['fac-bengaluru'] },
  { id: 'ravi', name: 'Ravi K.', role: 'contributor', facilityIds: ['fac-tirupur'] },
  { id: 'sita', name: 'Sita R.', role: 'contributor', facilityIds: ['fac-hosur'] },
  { id: 'neha', name: 'Neha Sharma', role: 'ho', facilityIds: facilities.map(facility => facility.id) },
];

export const parameters: Parameter[] = [
  { code: 'grid_kwh', label: 'Grid electricity', category: 'energy', unit: 'kWh', cadence: 'daily', min: 0, max: 50000, softMin: 1200, softMax: 15000, decimals: 0 },
  { code: 'dg_diesel_l', label: 'DG diesel', category: 'energy', unit: 'L', cadence: 'daily', min: 0, max: 5000, softMin: 0, softMax: 700, decimals: 1 },
  { code: 'boiler_biomass_kg', label: 'Boiler biomass', category: 'energy', unit: 'kg', cadence: 'daily', min: 0, max: 20000, softMin: 0, softMax: 6500, decimals: 0 },
  { code: 'groundwater_m3', label: 'Groundwater withdrawal', category: 'water', unit: 'm3', cadence: 'daily', min: 0, max: 1200, softMin: 40, softMax: 320, decimals: 1 },
  { code: 'stp_outlet_m3', label: 'STP outlet flow', category: 'water', unit: 'm3', cadence: 'daily', min: 0, max: 1000, softMin: 30, softMax: 260, decimals: 1 },
  { code: 'stp_bod', label: 'STP outlet BOD', category: 'compliance', unit: 'mg/L', cadence: 'monthly_bill', min: 0, max: 500, softMin: 0, softMax: 30, decimals: 1 },
  { code: 'stp_cod', label: 'STP outlet COD', category: 'compliance', unit: 'mg/L', cadence: 'monthly_bill', min: 0, max: 1000, softMin: 0, softMax: 250, decimals: 1 },
  { code: 'haz_waste_kg', label: 'Hazardous waste shipped', category: 'waste', unit: 'kg', cadence: 'event', min: 0, max: 10000, softMin: 0, softMax: 1200, decimals: 1 },
  { code: 'scope12_tco2e', label: 'Scope 1+2 emissions', category: 'emissions', unit: 'tCO2e', cadence: 'monthly_summary', min: 0, max: 5000, softMin: 20, softMax: 500, decimals: 2 },
  { code: 'renewable_pct', label: 'Renewable electricity', category: 'energy', unit: '%', cadence: 'monthly_summary', min: 0, max: 100, softMin: 15, softMax: 80, decimals: 1 },
  { code: 'water_positive_ratio', label: 'Water-positive ratio', category: 'water', unit: 'ratio', cadence: 'monthly_summary', min: 0, max: 5, softMin: 0.9, softMax: 2, decimals: 2 },
  // `daily_completion` was here as a daily-cadence "reading" but it's actually a
  // backend-computed metric per design doc §17 (% of expected daily params with a
  // submission today). Removed 2026-05-06 — circular self-report contradicts §8.5
  // "data, not opinions". The completion ratio is now derived live on the
  // contributor home from `done / total` of dailyParams; no contributor entry needed.
];

// Synthetic submission set sized for the demo's home-screen experience.
// Each facility has 3-7 distinct parameter codes already logged across the
// last few days, so the daily-log card lands in the "in-progress" state on
// any contributor login. The seed script (supabase/seed/wave1.ts) generates
// a much larger set in the live DB; this in-memory copy is only for the
// demo-mode fallback path.
//
// Total ~70 rows; bundle impact ~12 KB.
export const submissions: Submission[] = [
  // Factory-Bengaluru (Asha M., Ravi K., Priya S.)
  { id: 'sub-1', facilityId: 'fac-bengaluru', parameterCode: 'grid_kwh',         observedAt: '2026-05-06T06:15:00+05:30', value: 8420,  unit: 'kWh', status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-2', facilityId: 'fac-bengaluru', parameterCode: 'dg_diesel_l',      observedAt: '2026-05-06T06:18:00+05:30', value: 85,    unit: 'L',   status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-3', facilityId: 'fac-bengaluru', parameterCode: 'boiler_biomass_kg', observedAt: '2026-05-06T07:02:00+05:30', value: 9120,  unit: 'kg',  status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-4', facilityId: 'fac-bengaluru', parameterCode: 'groundwater_m3',   observedAt: '2026-05-06T07:08:00+05:30', value: 245,   unit: 'm3',  status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-5', facilityId: 'fac-bengaluru', parameterCode: 'stp_outlet_m3',    observedAt: '2026-05-05T18:42:00+05:30', value: 198,   unit: 'm3',  status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-6', facilityId: 'fac-bengaluru', parameterCode: 'stp_bod',          observedAt: '2026-05-04T14:30:00+05:30', value: 22,    unit: 'mg/L', status: 'approved', enteredBy: 'asha', source: 'manual' },

  // Factory-Tirupur (Ravi K. for the in-flight demo)
  { id: 'sub-7',  facilityId: 'fac-tirupur', parameterCode: 'grid_kwh',         observedAt: '2026-05-06T06:42:00+05:30', value: 4280, unit: 'kWh', status: 'approved', enteredBy: 'ravi', source: 'manual' },
  { id: 'sub-8',  facilityId: 'fac-tirupur', parameterCode: 'dg_diesel_l',      observedAt: '2026-05-06T06:45:00+05:30', value: 64,   unit: 'L',   status: 'pending',  enteredBy: 'ravi', source: 'manual' },
  { id: 'sub-9',  facilityId: 'fac-tirupur', parameterCode: 'boiler_biomass_kg', observedAt: '2026-05-06T07:12:00+05:30', value: 4640, unit: 'kg',  status: 'approved', enteredBy: 'ravi', source: 'manual' },
  { id: 'sub-10', facilityId: 'fac-tirupur', parameterCode: 'stp_outlet_m3',    observedAt: '2026-05-05T19:18:00+05:30', value: 102,  unit: 'm3',  status: 'approved', enteredBy: 'ravi', source: 'manual' },

  // Factory-Hosur (Sita R.)
  { id: 'sub-11', facilityId: 'fac-hosur', parameterCode: 'grid_kwh',           observedAt: '2026-05-06T08:10:00+05:30', value: 11840, unit: 'kWh', status: 'approved', enteredBy: 'sita', source: 'manual' },
  { id: 'sub-12', facilityId: 'fac-hosur', parameterCode: 'dg_diesel_l',        observedAt: '2026-05-06T08:12:00+05:30', value: 62,    unit: 'L',   status: 'pending',  enteredBy: 'sita', source: 'manual' },
  { id: 'sub-13', facilityId: 'fac-hosur', parameterCode: 'stp_bod',            observedAt: '2026-05-05T09:40:00+05:30', value: 28,    unit: 'mg/L', status: 'pending', enteredBy: 'sita', source: 'manual' },
  { id: 'sub-14', facilityId: 'fac-hosur', parameterCode: 'boiler_biomass_kg', observedAt: '2026-05-06T07:24:00+05:30', value: 7820, unit: 'kg',  status: 'approved', enteredBy: 'sita', source: 'manual' },

  // Factory-Mysuru
  { id: 'sub-15', facilityId: 'fac-mysuru', parameterCode: 'grid_kwh',          observedAt: '2026-05-06T07:00:00+05:30', value: 5240, unit: 'kWh', status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-16', facilityId: 'fac-mysuru', parameterCode: 'dg_diesel_l',       observedAt: '2026-05-06T07:04:00+05:30', value: 38,   unit: 'L',   status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-17', facilityId: 'fac-mysuru', parameterCode: 'groundwater_m3',    observedAt: '2026-05-06T07:30:00+05:30', value: 168,  unit: 'm3',  status: 'approved', enteredBy: 'asha', source: 'manual' },

  // Factory-Doddaballapura
  { id: 'sub-18', facilityId: 'fac-doddaballapura', parameterCode: 'grid_kwh',     observedAt: '2026-05-06T06:55:00+05:30', value: 4120, unit: 'kWh', status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-19', facilityId: 'fac-doddaballapura', parameterCode: 'dg_diesel_l',  observedAt: '2026-05-06T06:58:00+05:30', value: 32,   unit: 'L',   status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-20', facilityId: 'fac-doddaballapura', parameterCode: 'boiler_biomass_kg', observedAt: '2026-05-06T07:18:00+05:30', value: 3920, unit: 'kg', status: 'approved', enteredBy: 'asha', source: 'manual' },

  // Factory-Bommasandra
  { id: 'sub-21', facilityId: 'fac-bommasandra', parameterCode: 'grid_kwh',         observedAt: '2026-05-06T07:08:00+05:30', value: 6840, unit: 'kWh', status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-22', facilityId: 'fac-bommasandra', parameterCode: 'dg_diesel_l',      observedAt: '2026-05-06T07:10:00+05:30', value: 56,   unit: 'L',   status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-23', facilityId: 'fac-bommasandra', parameterCode: 'stp_outlet_m3',    observedAt: '2026-05-05T18:30:00+05:30', value: 84,   unit: 'm3',  status: 'approved', enteredBy: 'asha', source: 'manual' },

  // Factory-Madhavaram
  { id: 'sub-24', facilityId: 'fac-madhavaram', parameterCode: 'grid_kwh',          observedAt: '2026-05-06T07:00:00+05:30', value: 3220, unit: 'kWh', status: 'approved', enteredBy: 'ravi', source: 'manual' },
  { id: 'sub-25', facilityId: 'fac-madhavaram', parameterCode: 'dg_diesel_l',       observedAt: '2026-05-06T07:03:00+05:30', value: 28,   unit: 'L',   status: 'approved', enteredBy: 'ravi', source: 'manual' },
  { id: 'sub-26', facilityId: 'fac-madhavaram', parameterCode: 'boiler_biomass_kg', observedAt: '2026-05-06T07:20:00+05:30', value: 2840, unit: 'kg', status: 'approved', enteredBy: 'ravi', source: 'manual' },

  // Factory-Tumkur
  { id: 'sub-27', facilityId: 'fac-tumkur', parameterCode: 'grid_kwh',          observedAt: '2026-05-06T07:25:00+05:30', value: 4640, unit: 'kWh', status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-28', facilityId: 'fac-tumkur', parameterCode: 'dg_diesel_l',       observedAt: '2026-05-06T07:28:00+05:30', value: 42,   unit: 'L',   status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-29', facilityId: 'fac-tumkur', parameterCode: 'groundwater_m3',    observedAt: '2026-05-06T07:32:00+05:30', value: 124,  unit: 'm3',  status: 'approved', enteredBy: 'asha', source: 'manual' },

  // Factory-Kanchipuram
  { id: 'sub-30', facilityId: 'fac-kanchipuram', parameterCode: 'grid_kwh',     observedAt: '2026-05-06T07:15:00+05:30', value: 3840, unit: 'kWh', status: 'approved', enteredBy: 'ravi', source: 'manual' },
  { id: 'sub-31', facilityId: 'fac-kanchipuram', parameterCode: 'dg_diesel_l',  observedAt: '2026-05-06T07:18:00+05:30', value: 36,   unit: 'L',   status: 'approved', enteredBy: 'ravi', source: 'manual' },

  // Factory-Coimbatore
  { id: 'sub-32', facilityId: 'fac-coimbatore', parameterCode: 'grid_kwh',          observedAt: '2026-05-06T06:50:00+05:30', value: 7240, unit: 'kWh', status: 'approved', enteredBy: 'sita', source: 'manual' },
  { id: 'sub-33', facilityId: 'fac-coimbatore', parameterCode: 'dg_diesel_l',       observedAt: '2026-05-06T06:54:00+05:30', value: 48,   unit: 'L',   status: 'approved', enteredBy: 'sita', source: 'manual' },
  { id: 'sub-34', facilityId: 'fac-coimbatore', parameterCode: 'boiler_biomass_kg', observedAt: '2026-05-06T07:14:00+05:30', value: 5240, unit: 'kg', status: 'approved', enteredBy: 'sita', source: 'manual' },
  { id: 'sub-35', facilityId: 'fac-coimbatore', parameterCode: 'stp_outlet_m3',     observedAt: '2026-05-05T19:00:00+05:30', value: 142,  unit: 'm3',  status: 'approved', enteredBy: 'sita', source: 'manual' },

  // Factory-Belgaum
  { id: 'sub-36', facilityId: 'fac-belgaum', parameterCode: 'grid_kwh',         observedAt: '2026-05-06T07:38:00+05:30', value: 3420, unit: 'kWh', status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-37', facilityId: 'fac-belgaum', parameterCode: 'dg_diesel_l',      observedAt: '2026-05-06T07:40:00+05:30', value: 30,   unit: 'L',   status: 'approved', enteredBy: 'asha', source: 'manual' },
  { id: 'sub-38', facilityId: 'fac-belgaum', parameterCode: 'boiler_biomass_kg', observedAt: '2026-05-06T07:55:00+05:30', value: 2840, unit: 'kg', status: 'approved', enteredBy: 'asha', source: 'manual' },

  // Warehouse-Bhiwandi (no boiler, no STP, internal fleet)
  { id: 'sub-39', facilityId: 'wh-bhiwandi', parameterCode: 'grid_kwh',     observedAt: '2026-05-06T08:00:00+05:30', value: 14820, unit: 'kWh', status: 'pending',  enteredBy: 'asha', source: 'manual' },
  { id: 'sub-40', facilityId: 'wh-bhiwandi', parameterCode: 'dg_diesel_l',  observedAt: '2026-05-06T08:04:00+05:30', value: 12,    unit: 'L',   status: 'approved', enteredBy: 'asha', source: 'manual' },

  // Warehouse-Hosur
  { id: 'sub-41', facilityId: 'wh-hosur', parameterCode: 'grid_kwh',         observedAt: '2026-05-06T08:10:00+05:30', value: 12640, unit: 'kWh', status: 'approved', enteredBy: 'ravi', source: 'manual' },
  { id: 'sub-42', facilityId: 'wh-hosur', parameterCode: 'dg_diesel_l',      observedAt: '2026-05-06T08:14:00+05:30', value: 18,    unit: 'L',   status: 'approved', enteredBy: 'ravi', source: 'manual' },

  // Warehouse-Kolkata
  { id: 'sub-43', facilityId: 'wh-kolkata', parameterCode: 'grid_kwh',         observedAt: '2026-05-06T08:00:00+05:30', value: 10240, unit: 'kWh', status: 'approved', enteredBy: 'sita', source: 'manual' },
  { id: 'sub-44', facilityId: 'wh-kolkata', parameterCode: 'dg_diesel_l',      observedAt: '2026-05-06T08:03:00+05:30', value: 22,    unit: 'L',   status: 'approved', enteredBy: 'sita', source: 'manual' },

  // Warehouse-Gurugram
  { id: 'sub-45', facilityId: 'wh-gurugram', parameterCode: 'grid_kwh',         observedAt: '2026-05-06T08:18:00+05:30', value: 11820, unit: 'kWh', status: 'approved', enteredBy: 'sita', source: 'manual' },
  { id: 'sub-46', facilityId: 'wh-gurugram', parameterCode: 'dg_diesel_l',      observedAt: '2026-05-06T08:20:00+05:30', value: 16,    unit: 'L',   status: 'approved', enteredBy: 'sita', source: 'manual' },
];

// Synthetic Bill Inbox data — populated 2026-05-06 for Phase 2. Mix of
// confidence levels (green ≥90%, amber 70-90%, red <70%), bill kinds, and one
// breach to exercise the breach-flagging path. Phase 3 replaces the static
// `confidence` and `extracted` fields with values from Azure Document Intelligence.
export const bills: Bill[] = [
  // Green (high-confidence) — bulk-approvable
  { id: 'bill-001', facilityId: 'fac-bengaluru',     kind: 'electricity', vendor: 'BESCOM',                 period: 'Mar 2026',    uploadedBy: 'asha', ageHours: 2,  status: 'ready_for_review', confidence: 0.97, breach: false, imageUrl: '/sample-bills/electricity-bescom.svg',
    extracted: [
      { key: 'units_kwh',  label: 'Units consumed', rawText: '12,847',   parsedValue: 12847,  unit: 'kWh', confidence: 0.99, page: 1, bbox: { x: 0.55, y: 0.20, w: 0.20, h: 0.05 } },
      { key: 'amount_inr', label: 'Amount payable', rawText: '1,38,432', parsedValue: 138432, unit: 'INR', confidence: 0.96, page: 1, bbox: { x: 0.55, y: 0.30, w: 0.20, h: 0.05 } },
    ] },
  { id: 'bill-002', facilityId: 'fac-tirupur',       kind: 'solar_ppa',   vendor: 'Tata Power Renewables',  period: 'Mar 2026',    uploadedBy: 'ravi', ageHours: 5,  status: 'ready_for_review', confidence: 0.94, breach: false, imageUrl: '/sample-bills/solar-ppa-tata.svg',
    extracted: [
      { key: 'units_kwh', label: 'Solar units exported', rawText: '8,420', parsedValue: 8420, unit: 'kWh', confidence: 0.95, page: 1, bbox: { x: 0.50, y: 0.25, w: 0.18, h: 0.05 } },
    ] },
  { id: 'bill-003', facilityId: 'fac-bengaluru',     kind: 'diesel',      vendor: 'Bharat Petroleum',       period: '22 Apr 2026', uploadedBy: 'asha', ageHours: 7,  status: 'ready_for_review', confidence: 0.92, breach: false, imageUrl: '/sample-bills/diesel-bharat-petroleum.svg',
    extracted: [
      { key: 'qty_l',  label: 'Quantity', rawText: '500 L',  parsedValue: 500,   unit: 'L',   confidence: 0.95, page: 1, bbox: { x: 0.45, y: 0.32, w: 0.15, h: 0.05 } },
      { key: 'amount', label: 'Amount',   rawText: '46,250', parsedValue: 46250, unit: 'INR', confidence: 0.91, page: 1, bbox: { x: 0.45, y: 0.42, w: 0.15, h: 0.05 } },
    ] },
  { id: 'bill-004', facilityId: 'fac-mysuru',        kind: 'electricity', vendor: 'CESC Mysuru',            period: 'Mar 2026',    uploadedBy: 'asha', ageHours: 12, status: 'ready_for_review', confidence: 0.95, breach: false, imageUrl: '/sample-bills/electricity-cesc.svg',
    extracted: [
      { key: 'units_kwh', label: 'Units consumed', rawText: '9,420', parsedValue: 9420, unit: 'kWh', confidence: 0.97, page: 1, bbox: { x: 0.55, y: 0.20, w: 0.20, h: 0.05 } },
    ] },
  { id: 'bill-009', facilityId: 'fac-bengaluru',     kind: 'diesel',      vendor: 'Indian Oil',             period: '15 Apr 2026', uploadedBy: 'asha', ageHours: 1,  status: 'ready_for_review', confidence: 0.93, breach: false, imageUrl: '/sample-bills/diesel-iocl.svg',
    extracted: [
      { key: 'qty_l',  label: 'Quantity', rawText: '320 L',  parsedValue: 320,   unit: 'L',   confidence: 0.96, page: 1, bbox: { x: 0.45, y: 0.32, w: 0.15, h: 0.05 } },
      { key: 'amount', label: 'Amount',   rawText: '29,440', parsedValue: 29440, unit: 'INR', confidence: 0.92, page: 1, bbox: { x: 0.45, y: 0.42, w: 0.15, h: 0.05 } },
    ] },
  { id: 'bill-010', facilityId: 'fac-doddaballapura', kind: 'solar_ppa',  vendor: 'CleanMax Solar',         period: 'Mar 2026',    uploadedBy: 'asha', ageHours: 8,  status: 'ready_for_review', confidence: 0.96, breach: false, imageUrl: '/sample-bills/solar-cleanmax.svg',
    extracted: [
      { key: 'units_kwh', label: 'Solar units exported', rawText: '6,180', parsedValue: 6180, unit: 'kWh', confidence: 0.98, page: 1, bbox: { x: 0.50, y: 0.25, w: 0.18, h: 0.05 } },
    ] },

  // Amber (medium-confidence) — individual review
  { id: 'bill-005', facilityId: 'fac-hosur',         kind: 'lab_report',  vendor: 'GreenTech Labs',         period: 'Apr 2026',    uploadedBy: 'sita', ageHours: 18, status: 'ready_for_review', confidence: 0.78, breach: false, imageUrl: '/sample-bills/lab-borewell-greentech.svg',
    extracted: [
      { key: 'bod', label: 'STP outlet — BOD', rawText: '28',  parsedValue: 28,  unit: 'mg/L', confidence: 0.82, page: 1, bbox: { x: 0.30, y: 0.40, w: 0.10, h: 0.04 } },
      { key: 'cod', label: 'STP outlet — COD', rawText: '142', parsedValue: 142, unit: 'mg/L', confidence: 0.80, page: 1, bbox: { x: 0.30, y: 0.48, w: 0.10, h: 0.04 } },
      { key: 'tss', label: 'STP outlet — TSS', rawText: '78',  parsedValue: 78,  unit: 'mg/L', confidence: 0.74, page: 1, bbox: { x: 0.30, y: 0.56, w: 0.10, h: 0.04 } },
    ] },
  { id: 'bill-006', facilityId: 'fac-coimbatore',    kind: 'water',       vendor: 'Coimbatore Municipal',   period: 'Mar 2026',    uploadedBy: 'sita', ageHours: 22, status: 'ready_for_review', confidence: 0.81, breach: false, imageUrl: '/sample-bills/water-coimbatore.svg',
    extracted: [
      { key: 'volume_kl', label: 'Volume billed', rawText: '142 kL', parsedValue: 142, unit: 'kL', confidence: 0.83, page: 1, bbox: { x: 0.50, y: 0.30, w: 0.15, h: 0.05 } },
    ] },

  // Red (low-confidence) — individual review, possibly send back
  { id: 'bill-007', facilityId: 'fac-belgaum',       kind: 'electricity', vendor: 'HESCOM',                 period: 'Mar 2026',    uploadedBy: 'ravi', ageHours: 30, status: 'ready_for_review', confidence: 0.62, breach: false, imageUrl: '/sample-bills/electricity-hescom.svg',
    extracted: [
      { key: 'units_kwh', label: 'Units consumed', rawText: '7,?40', parsedValue: 7840, unit: 'kWh', confidence: 0.55, page: 1, bbox: { x: 0.55, y: 0.20, w: 0.20, h: 0.05 } },
    ] },

  // Compliance breach — needs attention
  { id: 'bill-008', facilityId: 'fac-tirupur',       kind: 'lab_report',  vendor: 'GreenTech Labs',         period: 'Apr 2026',    uploadedBy: 'ravi', ageHours: 4,  status: 'ready_for_review', confidence: 0.91, breach: true, imageUrl: '/sample-bills/lab-stp-greentech.svg',
    extracted: [
      { key: 'bod', label: 'STP outlet — BOD', rawText: '38',  parsedValue: 38,  unit: 'mg/L', confidence: 0.93, page: 1, bbox: { x: 0.30, y: 0.40, w: 0.10, h: 0.04 } },
      { key: 'cod', label: 'STP outlet — COD', rawText: '142', parsedValue: 142, unit: 'mg/L', confidence: 0.92, page: 1, bbox: { x: 0.30, y: 0.48, w: 0.10, h: 0.04 } },
      { key: 'tss', label: 'STP outlet — TSS', rawText: '65',  parsedValue: 65,  unit: 'mg/L', confidence: 0.89, page: 1, bbox: { x: 0.30, y: 0.56, w: 0.10, h: 0.04 } },
    ] },
];

export const parameterTrends: ParameterTrend[] = [
  { parameterCode: 'grid_kwh', facilityId: 'fac-hosur', label: 'Electric units', unit: 'kWh', values: [10820, 11140, 10960, 11520, 11780, 11840] },
  { parameterCode: 'stp_bod', facilityId: 'fac-hosur', label: 'STP BOD', unit: 'mg/L', values: [24, 27, 22, 28, 29, 28], threshold: 30 },
  { parameterCode: 'grid_kwh', facilityId: 'fac-bengaluru', label: 'Electric units', unit: 'kWh', values: [7920, 8040, 8290, 8180, 8360, 8420] },
];

export const logActivities: LogActivity[] = [
  { id: 'act-1', facilityId: 'fac-hosur', actor: 'Sita R.', title: 'Electric units logged', detail: '11,840 kWh captured from main meter', atLabel: '8:10 AM', tone: 'good' },
  { id: 'act-2', facilityId: 'fac-hosur', actor: 'Sita R.', title: 'DG diesel logged', detail: '62 L entered, awaiting HO review', atLabel: '8:12 AM', tone: 'warn' },
  { id: 'act-3', facilityId: 'fac-hosur', actor: 'Sita R.', title: 'STP BOD logged', detail: '28 mg/L, below CPCB threshold', atLabel: '9:40 AM', tone: 'good' },
  { id: 'act-4', facilityId: 'fac-bengaluru', actor: 'Asha M.', title: 'Grid electricity logged', detail: '8,420 kWh captured from main meter', atLabel: '6:15 AM', tone: 'good' },
  { id: 'act-5', facilityId: 'fac-bengaluru', actor: 'Asha M.', title: 'Diesel use logged', detail: '85 L saved as pending review', atLabel: '6:20 AM', tone: 'warn' },
];

export const alerts: Alert[] = [
  // Compliance breaches — design doc §31.1
  { id: 'A-040', facilityId: 'fac-tirupur',  kind: 'compliance', status: 'open', severity: 'critical', title: 'STP outlet BOD breach', body: '38 mg/L exceeds CPCB limit of 30 mg/L. Lab report uploaded 22 Apr.', source: 'bill-008', ageHours: 4 },
  { id: 'A-037', facilityId: 'fac-tirupur',  kind: 'compliance', status: 'open', severity: 'critical', title: 'Boiler stack PM over limit', body: '92 mg/Nm³ exceeds configured 80 mg/Nm³ limit (Mar 2026).', source: 'sub-stack-tirupur', ageHours: 24 },
  { id: 'A-035', facilityId: 'fac-bengaluru',kind: 'compliance', status: 'open', severity: 'critical', title: 'Used oil 90-day clock approaching', body: 'Oldest undisposed batch is 80 days old. CPCB limit 90 days.', source: 'haz-bengaluru-used-oil', ageHours: 12 },

  // HO-defined threshold rules — design doc §31.2
  { id: 'A-061', facilityId: 'fac-hosur',     kind: 'threshold', status: 'open', severity: 'warn', title: 'Water-positive ratio low', body: 'Ratio 1.08 below configured threshold of 1.1.', source: 'rule-water-positive', ageHours: 6 },
  { id: 'A-058', facilityId: 'wh-bhiwandi',   kind: 'threshold', status: 'open', severity: 'warn', title: 'Grid electricity over budget', body: '14,820 kWh exceeds 15,000 monthly cap (~99%, watch).', source: 'rule-bhiwandi-grid', ageHours: 8 },
  { id: 'A-053', facilityId: 'fac-tirupur',   kind: 'threshold', status: 'open', severity: 'warn', title: 'DG specific fuel consumption high', body: '0.42 L/kWh vs 0.40 alarm threshold (DG-2).', source: 'rule-dg-sfc', ageHours: 14 },

  // Data gaps — design doc §31.3
  { id: 'A-038', facilityId: 'fac-hosur',     kind: 'gap', status: 'open', severity: 'warn', title: 'Daily log incomplete', body: 'Groundwater and STP outlet flow unsubmitted for 4 days.', source: 'log-gap-hosur', ageHours: 2 },
  { id: 'A-031', facilityId: 'fac-hosur',     kind: 'gap', status: 'open', severity: 'warn', title: 'April monthly summary late', body: '6 days past day-1; push fired to 3 contributors.', source: 'gap-cron', ageHours: 144 },
  { id: 'A-024', facilityId: 'fac-mysuru',    kind: 'gap', status: 'open', severity: 'warn', title: 'No bills uploaded this month', body: 'Day 12 with no electricity / water / lab uploads.', source: 'gap-cron', ageHours: 18 },
  { id: 'A-020', facilityId: 'fac-doddaballapura', kind: 'gap', status: 'open', severity: 'warn', title: 'STP outlet test late', body: '7 days past expected date. Vendor: GreenTech Labs.', source: 'gap-cron', ageHours: 10 },
];

export const monthlySummaries: MonthlySummary[] = [
  {
    id: 'ms-apr-bengaluru',
    facilityId: 'fac-bengaluru',
    yearMonth: '2026-04',
    draftText: 'April closed with stable grid electricity, improved solar contribution, and one water-reuse dip that needs attention in the first week of May.',
    signedOffAt: null,
  },
];

export function getFacility(facilityId: string): Facility {
  return facilities.find(facility => facility.id === facilityId) ?? facilities[0]!;
}

// Bridge between live Supabase sessions (UUID facility_id, SAP code carried as
// session.sap_code) and the in-memory v1 sample-data (string id like
// 'fac-bengaluru', sap_code like 'FAC00001').
//
// On live deploy, session.facility_id is a UUID that won't match any v1 id, so
// every `submissions.filter(s => s.facilityId === session.facility_id)` returned
// empty and the contributor screens looked broken. Lookups by sap_code first,
// then by v1 id, then fall back to the first facility so the screens still
// render *something* instead of crashing.
export function resolveV1Facility({
  sapCode,
  facilityId,
}: {
  sapCode?: string | null;
  facilityId?: string | null;
}): Facility {
  if (sapCode) {
    const bySap = facilities.find(facility => facility.sapCode === sapCode);
    if (bySap) return bySap;
  }
  if (facilityId) {
    const byId = facilities.find(facility => facility.id === facilityId);
    if (byId) return byId;
  }
  return facilities[0]!;
}

// Convenience: returns the v1 facility id (string) for use as a filter key
// against v1 in-memory arrays. Always pass session.sap_code first.
export function resolveV1FacilityId(args: {
  sapCode?: string | null;
  facilityId?: string | null;
}): string {
  return resolveV1Facility(args).id;
}

export function getPersonName(personId: string): string {
  return personnel.find(person => person.id === personId)?.name ?? 'System';
}

export function getParameter(code: string): Parameter {
  return parameters.find(parameter => parameter.code === code) ?? parameters[0]!;
}
