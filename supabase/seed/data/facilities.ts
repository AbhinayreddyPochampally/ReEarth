// =============================================================================
// supabase/seed/data/facilities.ts
//
// 15 facilities — 11 factories + 4 warehouses. No retail stores.
// Source of truth: docs/design-doc.docx (§7 Scope) + docs/ui-sketch.pdf
// (canonical facility names visible on dashboard p26, completeness heatmap p27,
// bulk regulatory-limit update p45).
//
// Per the 2026-05-06 rescope ADR in docs/decisions.md:
//   - retail stores are deferred to future flow (Appendix C.1)
//   - no `mall_based`, `has_mall_shared_dg`, `has_chiller`,
//     `has_ambient_air_monitoring`, or `active_haz_categories`
//   - all factories see all hazardous-waste categories (resolution J)
//   - HO users live in personnel.HO_USERS with facility_id=NULL (resolution I)
//   - require ≥2 super-users to avoid the password-reset deadlock (resolution E)
//
// PIN format: 4-digit string. The seed script bcrypt-hashes these before
// inserting and writes the plaintext mapping to supabase/seed/output/pins.csv.
// DO NOT commit that CSV — it is in .gitignore.
// =============================================================================

export interface PersonnelSeedEntry {
  name: string;
  designation: string;
  role: 'contributor' | 'ho';
}

export interface FacilitySeedData {
  sap_code: string;
  name: string;
  type: 'factory' | 'warehouse';
  brand?: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  flags: Record<string, unknown>;
  pin: string;
  personnel: PersonnelSeedEntry[];
}

// HO super-users — facility_id is NULL for these in the personnel table.
// Seeded with their own short-id login codes; UI shows them with no facility.
export interface HOUserSeedEntry {
  name: string;
  email: string;
  designation: string;
  is_super_user: boolean;
  password: string; // bcrypt-hashed by the seeder; written to output/ho-passwords.csv
}

export const HO_USERS: HOUserSeedEntry[] = [
  // Single HO super-user per architect override 2026-05-06 (resolution E).
  // Catastrophic password loss is handled via the SQL break-glass procedure
  // documented in docs/playbooks/break-glass.md. Phase 2 may revisit if a
  // second user is needed for backup approvals.
  {
    name: 'Neha Sharma',
    email: 'neha.sharma@abfrl.com',
    designation: 'Head of Sustainability',
    is_super_user: true,
    password: 'ChangeMeNeha!2026',
  },
];

export const FACILITIES: FacilitySeedData[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Factories (11) — names canonicalized from UI sketch p27 + p45.
  // ─────────────────────────────────────────────────────────────────────────
  {
    sap_code: 'FAC00001',
    name: 'Factory-Bengaluru',
    type: 'factory',
    brand: 'Pantaloons',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560058',
    address: 'Peenya Industrial Area, Phase II, Bengaluru, Karnataka 560058',
    flags: {
      has_dg: true,
      dg_count: 4,
      has_boiler: true,
      has_solar: true,
      has_stp: true,
      has_groundwater: true,
      has_canteen: true,
      has_first_aid: true,
      has_internal_fleet: false,
      has_municipal_water: true,
      has_tanker_water: false,
      has_rainwater_harvesting: true,
    },
    pin: '7421',
    personnel: [
      { name: 'Asha M.',  designation: 'EHS Executive',          role: 'contributor' },
      { name: 'Ravi K.',  designation: 'Plant Manager',          role: 'contributor' },
      { name: 'Priya S.', designation: 'Sustainability Officer', role: 'contributor' },
    ],
  },
  {
    sap_code: 'FAC00002',
    name: 'Factory-Tirupur',
    type: 'factory',
    brand: 'Allen Solly',
    city: 'Tirupur',
    state: 'Tamil Nadu',
    pincode: '641604',
    address: 'SIPCOT Industrial Complex, Tirupur, Tamil Nadu 641604',
    flags: {
      has_dg: true,
      dg_count: 2,
      has_boiler: true,
      has_solar: false,
      has_stp: false,
      has_groundwater: false,
      has_canteen: true,
      has_first_aid: true,
      has_internal_fleet: false,
      has_municipal_water: true,
      has_tanker_water: true,
      has_rainwater_harvesting: false,
    },
    pin: '3865',
    personnel: [
      { name: 'Deepa R.',  designation: 'EHS Executive',         role: 'contributor' },
      { name: 'Kiran T.',  designation: 'Plant Manager',          role: 'contributor' },
      { name: 'Suresh B.', designation: 'Sustainability Officer', role: 'contributor' },
    ],
  },
  {
    sap_code: 'FAC00003',
    name: 'Factory-Hosur',
    type: 'factory',
    brand: 'Van Heusen',
    city: 'Hosur',
    state: 'Tamil Nadu',
    pincode: '635109',
    address: 'SIPCOT Industrial Complex, Hosur, Tamil Nadu 635109',
    flags: {
      has_dg: true,
      dg_count: 3,
      has_boiler: true,
      has_solar: true,
      has_stp: true,
      has_groundwater: true,
      has_canteen: true,
      has_first_aid: true,
      has_internal_fleet: false,
      has_municipal_water: true,
      has_tanker_water: false,
      has_rainwater_harvesting: true,
    },
    pin: '5104',
    personnel: [
      { name: 'Lakshmi V.', designation: 'EHS Executive',         role: 'contributor' },
      { name: 'Mahesh A.',  designation: 'Plant Manager',          role: 'contributor' },
      { name: 'Karthik P.', designation: 'Sustainability Officer', role: 'contributor' },
    ],
  },
  {
    sap_code: 'FAC00004',
    name: 'Factory-Mysuru',
    type: 'factory',
    brand: 'Louis Philippe',
    city: 'Mysuru',
    state: 'Karnataka',
    pincode: '570016',
    address: 'KIADB Hebbal Industrial Area, Mysuru, Karnataka 570016',
    flags: {
      has_dg: true,
      dg_count: 2,
      has_boiler: true,
      has_solar: true,
      has_stp: true,
      has_groundwater: true,
      has_canteen: true,
      has_first_aid: true,
      has_internal_fleet: false,
      has_municipal_water: true,
      has_tanker_water: false,
      has_rainwater_harvesting: false,
    },
    pin: '8276',
    personnel: [
      { name: 'Vidya N.', designation: 'EHS Executive',         role: 'contributor' },
      { name: 'Sanjay K.', designation: 'Plant Manager',         role: 'contributor' },
      { name: 'Pavan H.',  designation: 'Sustainability Officer', role: 'contributor' },
    ],
  },
  {
    sap_code: 'FAC00005',
    name: 'Factory-Doddaballapura',
    type: 'factory',
    brand: 'Peter England',
    city: 'Doddaballapura',
    state: 'Karnataka',
    pincode: '561203',
    address: 'KIADB Apparel Park, Doddaballapura, Karnataka 561203',
    flags: {
      has_dg: true,
      dg_count: 2,
      has_boiler: true,
      has_solar: true,
      has_stp: true,
      has_groundwater: true,
      has_canteen: true,
      has_first_aid: true,
      has_internal_fleet: false,
      has_municipal_water: false,
      has_tanker_water: true,
      has_rainwater_harvesting: true,
    },
    pin: '4691',
    personnel: [
      { name: 'Geeta L.', designation: 'EHS Executive',         role: 'contributor' },
      { name: 'Naveen B.', designation: 'Plant Manager',         role: 'contributor' },
    ],
  },
  {
    sap_code: 'FAC00006',
    name: 'Factory-Coimbatore',
    type: 'factory',
    brand: 'Allen Solly',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641021',
    address: 'KINFRA Apparel Park, Coimbatore, Tamil Nadu 641021',
    flags: {
      has_dg: true,
      dg_count: 2,
      has_boiler: true,
      has_solar: false,
      has_stp: true,
      has_groundwater: true,
      has_canteen: true,
      has_first_aid: true,
      has_internal_fleet: false,
      has_municipal_water: true,
      has_tanker_water: true,
      has_rainwater_harvesting: false,
    },
    pin: '2538',
    personnel: [
      { name: 'Bhavani G.', designation: 'EHS Executive',         role: 'contributor' },
      { name: 'Ramesh S.',  designation: 'Plant Manager',          role: 'contributor' },
      { name: 'Divya A.',   designation: 'Sustainability Officer', role: 'contributor' },
    ],
  },
  {
    sap_code: 'FAC00007',
    name: 'Factory-Kanchipuram',
    type: 'factory',
    brand: 'Van Heusen',
    city: 'Kanchipuram',
    state: 'Tamil Nadu',
    pincode: '631502',
    address: 'SIPCOT Industrial Park, Kanchipuram, Tamil Nadu 631502',
    flags: {
      has_dg: true,
      dg_count: 2,
      has_boiler: true,
      has_solar: false,
      has_stp: false,
      has_groundwater: false,
      has_canteen: true,
      has_first_aid: true,
      has_internal_fleet: false,
      has_municipal_water: true,
      has_tanker_water: true,
      has_rainwater_harvesting: false,
    },
    pin: '6914',
    personnel: [
      { name: 'Saraswati V.', designation: 'EHS Executive',  role: 'contributor' },
      { name: 'Ganesh R.',     designation: 'Plant Manager',  role: 'contributor' },
    ],
  },
  {
    sap_code: 'FAC00008',
    name: 'Factory-Belgaum',
    type: 'factory',
    brand: 'Pantaloons',
    city: 'Belgaum',
    state: 'Karnataka',
    pincode: '590010',
    address: 'KIADB Industrial Area, Belgaum, Karnataka 590010',
    flags: {
      has_dg: true,
      dg_count: 2,
      has_boiler: true,
      has_solar: true,
      has_stp: true,
      has_groundwater: true,
      has_canteen: true,
      has_first_aid: true,
      has_internal_fleet: false,
      has_municipal_water: true,
      has_tanker_water: false,
      has_rainwater_harvesting: true,
    },
    pin: '3027',
    personnel: [
      { name: 'Vinaya M.', designation: 'EHS Executive',         role: 'contributor' },
      { name: 'Prakash D.', designation: 'Plant Manager',         role: 'contributor' },
      { name: 'Anil F.',    designation: 'Sustainability Officer', role: 'contributor' },
    ],
  },
  {
    sap_code: 'FAC00009',
    name: 'Factory-Bommasandra',
    type: 'factory',
    brand: 'Louis Philippe',
    city: 'Bommasandra',
    state: 'Karnataka',
    pincode: '560099',
    address: 'Bommasandra Industrial Area, Bengaluru, Karnataka 560099',
    flags: {
      has_dg: true,
      dg_count: 3,
      has_boiler: true,
      has_solar: true,
      has_stp: true,
      has_groundwater: true,
      has_canteen: true,
      has_first_aid: true,
      has_internal_fleet: false,
      has_municipal_water: true,
      has_tanker_water: false,
      has_rainwater_harvesting: true,
    },
    pin: '5483',
    personnel: [
      { name: 'Nandini E.', designation: 'EHS Executive',         role: 'contributor' },
      { name: 'Vivek O.',   designation: 'Plant Manager',          role: 'contributor' },
      { name: 'Sunita J.',  designation: 'Sustainability Officer', role: 'contributor' },
    ],
  },
  {
    sap_code: 'FAC00010',
    name: 'Factory-Madhavaram',
    type: 'factory',
    brand: 'Allen Solly',
    city: 'Madhavaram',
    state: 'Tamil Nadu',
    pincode: '600060',
    address: 'Madhavaram Industrial Area, Chennai, Tamil Nadu 600060',
    flags: {
      has_dg: true,
      dg_count: 2,
      has_boiler: true,
      has_solar: false,
      has_stp: true,
      has_groundwater: false,
      has_canteen: true,
      has_first_aid: true,
      has_internal_fleet: false,
      has_municipal_water: true,
      has_tanker_water: true,
      has_rainwater_harvesting: false,
    },
    pin: '8159',
    personnel: [
      { name: 'Yamini U.', designation: 'EHS Executive',         role: 'contributor' },
      { name: 'Bharat I.', designation: 'Plant Manager',          role: 'contributor' },
    ],
  },
  {
    sap_code: 'FAC00011',
    name: 'Factory-Tumkur',
    type: 'factory',
    brand: 'Peter England',
    city: 'Tumkur',
    state: 'Karnataka',
    pincode: '572106',
    address: 'KIADB Vasanthanarasapura Industrial Area, Tumkur, Karnataka 572106',
    flags: {
      has_dg: true,
      dg_count: 2,
      has_boiler: true,
      has_solar: true,
      has_stp: true,
      has_groundwater: true,
      has_canteen: true,
      has_first_aid: true,
      has_internal_fleet: false,
      has_municipal_water: false,
      has_tanker_water: true,
      has_rainwater_harvesting: true,
    },
    pin: '4730',
    personnel: [
      { name: 'Roopa W.',   designation: 'EHS Executive',         role: 'contributor' },
      { name: 'Surya C.',    designation: 'Plant Manager',          role: 'contributor' },
      { name: 'Shalini Z.',  designation: 'Sustainability Officer', role: 'contributor' },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Warehouses (4) — distribution hubs. Profile per design doc §7.1:
  // borewell, STP, ≥1 DG, internal vehicle fleet, partial solar PPA. No boiler,
  // no canteen unless flagged. Hazardous waste profile narrower (forklift batt.)
  // ─────────────────────────────────────────────────────────────────────────
  {
    sap_code: 'WHG00001',
    name: 'Warehouse-Bhiwandi',
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
      has_stp: true,
      has_groundwater: true,
      has_canteen: false,
      has_first_aid: true,
      has_internal_fleet: true,
      has_municipal_water: false,
      has_tanker_water: false,
      has_rainwater_harvesting: false,
    },
    pin: '5290',
    personnel: [
      { name: 'Anjali P.', designation: 'Warehouse Supervisor', role: 'contributor' },
      { name: 'Mohan D.',  designation: 'Operations Manager',   role: 'contributor' },
    ],
  },
  {
    sap_code: 'WHG00002',
    name: 'Warehouse-Tauru',
    type: 'warehouse',
    city: 'Tauru',
    state: 'Haryana',
    pincode: '122105',
    address: 'NH-248A, Tauru, Nuh, Haryana 122105',
    flags: {
      has_dg: true,
      dg_count: 1,
      has_boiler: false,
      has_solar: false,
      has_stp: true,
      has_groundwater: true,
      has_canteen: false,
      has_first_aid: true,
      has_internal_fleet: true,
      has_municipal_water: false,
      has_tanker_water: true,
      has_rainwater_harvesting: false,
    },
    pin: '8064',
    personnel: [
      { name: 'Rohit K.', designation: 'Warehouse Supervisor', role: 'contributor' },
      { name: 'Vikas S.', designation: 'Operations Manager',   role: 'contributor' },
    ],
  },
  {
    sap_code: 'WHG00003',
    name: 'Warehouse-Hindupur',
    type: 'warehouse',
    city: 'Hindupur',
    state: 'Andhra Pradesh',
    pincode: '515201',
    address: 'APIIC Industrial Park, Hindupur, Andhra Pradesh 515201',
    flags: {
      has_dg: true,
      dg_count: 1,
      has_boiler: false,
      has_solar: true,
      has_stp: true,
      has_groundwater: true,
      has_canteen: false,
      has_first_aid: true,
      has_internal_fleet: true,
      has_municipal_water: false,
      has_tanker_water: false,
      has_rainwater_harvesting: false,
    },
    pin: '2916',
    personnel: [
      { name: 'Manjula V.', designation: 'Warehouse Supervisor', role: 'contributor' },
      { name: 'Suman G.',   designation: 'Operations Manager',   role: 'contributor' },
    ],
  },
  {
    sap_code: 'WHG00004',
    name: 'Warehouse-Howrah',
    type: 'warehouse',
    city: 'Howrah',
    state: 'West Bengal',
    pincode: '711113',
    address: 'Bauria Industrial Area, Howrah, West Bengal 711113',
    flags: {
      has_dg: true,
      dg_count: 1,
      has_boiler: false,
      has_solar: false,
      has_stp: true,
      has_groundwater: false,
      has_canteen: false,
      has_first_aid: true,
      has_internal_fleet: true,
      has_municipal_water: true,
      has_tanker_water: false,
      has_rainwater_harvesting: false,
    },
    pin: '7340',
    personnel: [
      { name: 'Sourav B.', designation: 'Warehouse Supervisor', role: 'contributor' },
      { name: 'Tarun M.',  designation: 'Operations Manager',   role: 'contributor' },
    ],
  },
];
