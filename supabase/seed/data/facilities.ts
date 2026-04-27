// =============================================================================
// supabase/seed/data/facilities.ts
//
// All 10 demo facilities with their conditional flags and personnel rosters.
// Source of truth: docs/vertical-slice-spec.md (facility list + flag table).
//
// PIN format: 4-digit string.  The seed script bcrypt-hashes these before
// inserting and writes the plaintext mapping to supabase/seed/output/pins.csv.
// DO NOT commit that CSV — it is in .gitignore.
//
// HO user note: the single HO reviewer is a personnel record inside Factory-001.
// Auth flow: login with FAC00001 SAP code + 7421 PIN → select "Anita HO" → /ho.
// =============================================================================

export interface PersonnelSeedEntry {
  name: string;
  designation: string;
  role: 'contributor' | 'ho';
}

export interface FacilitySeedData {
  sap_code: string;
  name: string;
  type: 'factory' | 'warehouse' | 'store';
  brand?: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  size_sqft?: number;
  flags: Record<string, unknown>;
  pin: string;
  personnel: PersonnelSeedEntry[];
}

export const FACILITIES: FacilitySeedData[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Factories
  // ─────────────────────────────────────────────────────────────────────────
  {
    sap_code: 'FAC00001',
    name: 'Factory-001 — Bengaluru',
    type: 'factory',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560058',
    address: 'Peenya Industrial Area, Phase II, Bengaluru, Karnataka 560058',
    flags: {
      has_dg: true,
      dg_count: 4,
      has_boiler: true,
      boiler_fuel: 'briquettes',
      has_solar: true,
      has_stp: true,
      has_groundwater: true,
      has_canteen: true,
      mall_based: false,
      has_internal_fleet: false,
      has_mall_shared_dg: false,
      has_rainwater_harvesting: false,
      has_hvac: true,
      has_chiller: false,
      has_ambient_air_monitoring: false,
      uses_tanker_water: false,
      active_haz_categories: [
        'used_oil',
        'batteries',
        'etp_sludge',
        'contaminated_cotton',
        'fluorescent_tubes',
        'paint_solvent',
      ],
    },
    pin: '7421',
    personnel: [
      { name: 'Asha K.',  designation: 'EHS Executive',          role: 'contributor' },
      { name: 'Ravi M.',  designation: 'Plant Manager',           role: 'contributor' },
      { name: 'Priya S.', designation: 'Sustainability Officer',  role: 'contributor' },
      // HO reviewer logs in through Factory-001 SAP code + same PIN
      { name: 'Anita HO', designation: 'Head of Sustainability (HO)', role: 'ho' },
    ],
  },
  {
    sap_code: 'FAC00002',
    name: 'Factory-002 — Tirupur',
    type: 'factory',
    city: 'Tirupur',
    state: 'Tamil Nadu',
    pincode: '641604',
    address: 'SIPCOT Industrial Complex, Tirupur, Tamil Nadu 641604',
    flags: {
      has_dg: true,
      dg_count: 2,
      has_boiler: true,
      boiler_fuel: 'briquettes',
      has_solar: false,
      has_stp: false,
      has_groundwater: false,
      has_canteen: true,
      mall_based: false,
      has_internal_fleet: false,
      has_mall_shared_dg: false,
      has_rainwater_harvesting: false,
      has_hvac: true,
      has_chiller: false,
      has_ambient_air_monitoring: false,
      uses_tanker_water: true,
      active_haz_categories: [
        'used_oil',
        'batteries',
        'fluorescent_tubes',
        'e_waste',
      ],
    },
    pin: '3865',
    personnel: [
      { name: 'Deepa R.',  designation: 'EHS Executive',         role: 'contributor' },
      { name: 'Kiran T.',  designation: 'Plant Manager',          role: 'contributor' },
      { name: 'Suresh B.', designation: 'Sustainability Officer', role: 'contributor' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Warehouse
  // ─────────────────────────────────────────────────────────────────────────
  {
    sap_code: 'WHG00001',
    name: 'Warehouse-001 — Bhiwandi',
    type: 'warehouse',
    city: 'Bhiwandi',
    state: 'Maharashtra',
    pincode: '421302',
    address: 'Purna Industrial Estate, NH-61, Bhiwandi, Maharashtra 421302',
    flags: {
      has_dg: true,
      dg_count: 1,
      has_boiler: false,
      has_solar: true,
      has_canteen: false,
      mall_based: false,
      has_internal_fleet: true,
      has_mall_shared_dg: false,
      has_rainwater_harvesting: false,
      has_hvac: true,
      has_chiller: false,
      has_ambient_air_monitoring: false,
      uses_tanker_water: false,
      active_haz_categories: [],
    },
    pin: '5290',
    personnel: [
      { name: 'Anjali P.', designation: 'Warehouse Supervisor', role: 'contributor' },
      { name: 'Mohan D.',  designation: 'Operations Manager',   role: 'contributor' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Retail stores — Store flags default per architect Gate 5 approval
  // mall_based stores get has_mall_shared_dg=true; all stores get has_hvac=true
  // active_haz_categories defaults to ['fluorescent_tubes', 'e_waste'] for all stores
  // ─────────────────────────────────────────────────────────────────────────
  {
    sap_code: 'STR00001',
    name: 'Pantaloons — Phoenix MarketCity Bengaluru',
    type: 'store',
    brand: 'Pantaloons',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560048',
    address: 'Phoenix MarketCity, Whitefield Road, Bengaluru, Karnataka 560048',
    size_sqft: 50000,
    flags: {
      mall_based: true,
      has_dg: false,
      has_boiler: false,
      has_solar: false,
      has_canteen: false,
      has_internal_fleet: false,
      has_mall_shared_dg: true,
      has_rainwater_harvesting: false,
      has_hvac: true,
      has_chiller: false,
      has_ambient_air_monitoring: false,
      uses_tanker_water: false,
      active_haz_categories: ['fluorescent_tubes', 'e_waste'],
    },
    pin: '4173',
    personnel: [
      { name: 'Lavanya G.', designation: 'Store Manager',             role: 'contributor' },
      { name: 'Vikram N.',  designation: 'Sustainability Coordinator', role: 'contributor' },
    ],
  },
  {
    sap_code: 'STR00002',
    name: 'Allen Solly — Forum Mall Chennai',
    type: 'store',
    brand: 'Allen Solly',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600028',
    address: 'Forum Vijaya Mall, Vadapalani, Chennai, Tamil Nadu 600028',
    size_sqft: 3200,
    flags: {
      mall_based: true,
      has_dg: false,
      has_boiler: false,
      has_solar: false,
      has_canteen: false,
      has_internal_fleet: false,
      has_mall_shared_dg: true,
      has_rainwater_harvesting: false,
      has_hvac: true,
      has_chiller: false,
      has_ambient_air_monitoring: false,
      uses_tanker_water: false,
      active_haz_categories: ['fluorescent_tubes', 'e_waste'],
    },
    pin: '8634',
    personnel: [
      { name: 'Meena C.', designation: 'Store Manager',             role: 'contributor' },
      { name: 'Arun J.',  designation: 'Sustainability Coordinator', role: 'contributor' },
    ],
  },
  {
    sap_code: 'STR00003',
    name: 'Van Heusen — Park Street Kolkata',
    type: 'store',
    brand: 'Van Heusen',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700016',
    address: '17 Park Street, Kolkata, West Bengal 700016',
    size_sqft: 4500,
    flags: {
      mall_based: false,
      has_dg: false,
      has_boiler: false,
      has_solar: false,
      has_canteen: false,
      has_internal_fleet: false,
      has_mall_shared_dg: false,
      has_rainwater_harvesting: false,
      has_hvac: true,
      has_chiller: false,
      has_ambient_air_monitoring: false,
      uses_tanker_water: false,
      active_haz_categories: ['fluorescent_tubes', 'e_waste'],
    },
    pin: '2957',
    personnel: [
      { name: 'Rekha F.',   designation: 'Store Manager',             role: 'contributor' },
      { name: 'Sandeep L.', designation: 'Sustainability Coordinator', role: 'contributor' },
    ],
  },
  {
    sap_code: 'STR00004',
    name: 'Louis Philippe — DLF Mall Noida',
    type: 'store',
    brand: 'Louis Philippe',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    address: 'DLF Mall of India, Sector 18, Noida, Uttar Pradesh 201301',
    size_sqft: 2800,
    flags: {
      mall_based: true,
      has_dg: false,
      has_boiler: false,
      has_solar: false,
      has_canteen: false,
      has_internal_fleet: false,
      has_mall_shared_dg: true,
      has_rainwater_harvesting: false,
      has_hvac: true,
      has_chiller: false,
      has_ambient_air_monitoring: false,
      uses_tanker_water: false,
      active_haz_categories: ['fluorescent_tubes', 'e_waste'],
    },
    pin: '6318',
    personnel: [
      { name: 'Kavitha H.', designation: 'Store Manager',             role: 'contributor' },
      { name: 'Rajesh Q.',  designation: 'Sustainability Coordinator', role: 'contributor' },
    ],
  },
  {
    sap_code: 'STR00005',
    name: 'Peter England — MG Road Bengaluru',
    type: 'store',
    brand: 'Peter England',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    address: 'MG Road, Bengaluru, Karnataka 560001',
    size_sqft: 1800,
    flags: {
      mall_based: false,
      has_dg: false,
      has_boiler: false,
      has_solar: false,
      has_canteen: false,
      has_internal_fleet: false,
      has_mall_shared_dg: false,
      has_rainwater_harvesting: false,
      has_hvac: true,
      has_chiller: false,
      has_ambient_air_monitoring: false,
      uses_tanker_water: false,
      active_haz_categories: ['fluorescent_tubes', 'e_waste'],
    },
    pin: '9042',
    personnel: [
      { name: 'Nisha W.',  designation: 'Store Manager',             role: 'contributor' },
      { name: 'Pramod X.', designation: 'Sustainability Coordinator', role: 'contributor' },
    ],
  },
  {
    sap_code: 'STR00006',
    name: 'Pantaloons — Bandra Linking Road Mumbai',
    type: 'store',
    brand: 'Pantaloons',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    address: 'Linking Road, Bandra West, Mumbai, Maharashtra 400050',
    size_sqft: 2200,
    flags: {
      mall_based: false,
      has_dg: false,
      has_boiler: false,
      has_solar: false,
      has_canteen: false,
      has_internal_fleet: false,
      has_mall_shared_dg: false,
      has_rainwater_harvesting: false,
      has_hvac: true,
      has_chiller: false,
      has_ambient_air_monitoring: false,
      uses_tanker_water: false,
      active_haz_categories: ['fluorescent_tubes', 'e_waste'],
    },
    pin: '1725',
    personnel: [
      { name: 'Sunita Y.', designation: 'Store Manager',             role: 'contributor' },
      { name: 'Gopal Z.',  designation: 'Sustainability Coordinator', role: 'contributor' },
    ],
  },
  {
    sap_code: 'STR00007',
    name: 'Allen Solly — Ambience Mall Gurugram',
    type: 'store',
    brand: 'Allen Solly',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    address: 'Ambience Mall, National Highway 48, Gurugram, Haryana 122002',
    size_sqft: 1500,
    flags: {
      mall_based: true,
      has_dg: false,
      has_boiler: false,
      has_solar: false,
      has_canteen: false,
      has_internal_fleet: false,
      has_mall_shared_dg: true,
      has_rainwater_harvesting: false,
      has_hvac: true,
      has_chiller: false,
      has_ambient_air_monitoring: false,
      uses_tanker_water: false,
      active_haz_categories: ['fluorescent_tubes', 'e_waste'],
    },
    pin: '3481',
    personnel: [
      { name: 'Uma A.',   designation: 'Store Manager',             role: 'contributor' },
      { name: 'Harish V.', designation: 'Sustainability Coordinator', role: 'contributor' },
    ],
  },
];
