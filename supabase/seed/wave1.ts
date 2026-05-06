// =============================================================================
// supabase/seed/wave1.ts — seed script (renamed scope, file kept for npm-script
// compatibility; rebuilt 2026-05-06 for the rescoped 15-facility footprint).
//
// Populates the demo Supabase database with:
//   15 facilities (11 factories + 4 warehouses, no retail), the parameter
//   catalog, ~30 contributor personnel + 2 HO super-users, parameter
//   assignments, regulatory limits, 3 months of synthetic submissions,
//   hazardous event chains, and 1 compliance breach.
//
// Run from supabase/seed/:
//   npm install && npm run seed:wave1
//
// Prerequisites:
//   1. Migrations 001 + 002 + 003 + 004 applied (004 makes personnel.facility_id
//      nullable so HO users can be corporate).
//   2. supabase/seed/.env contains:
//        SUPABASE_URL=https://<project-ref>.supabase.co
//        SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
//
// On re-run: truncates all seed-managed tables in FK-safe order, then
// re-inserts everything fresh. If the app has been used and audit_log has
// entries, you must first run `TRUNCATE audit_log CASCADE;` in the Supabase
// SQL Editor (audit_log blocks personnel deletion via FK).
//
// Outputs (both git-ignored):
//   supabase/seed/output/pins.csv          — plaintext facility PINs
//   supabase/seed/output/ho-passwords.csv  — plaintext HO super-user passwords
// =============================================================================

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { FACILITIES, HO_USERS } from './data/facilities';
import { PARAMETERS } from './data/parameters';
import { REGULATORY_LIMITS } from './data/regulatory-limits';
import { hashPin } from './lib/hash-pin';
import { shouldAssign, facilityTypeToTemplate } from './lib/predicate-eval';
import { syntheticValue, valueRaw } from './lib/synthetic-values';

// ── Env validation ─────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  console.error('Create supabase/seed/.env with those values from the Supabase dashboard.');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Helpers ────────────────────────────────────────────────────────────────

// Deterministic pseudo-random [0,1) for a given seed integer.
// Using Math.random() would produce different values on every run; this keeps
// synthetic data stable across re-seeds so the demo looks the same.
function pr(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function backdatedTs(start: string, end: string, seed: number): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + pr(seed) * (e - s)).toISOString();
}

function submissionStatus(monthIdx: number, seed: number): 'approved' | 'pending' | 'sent_back' {
  const r = pr(seed);
  if (monthIdx === 0) return 'approved';                                // Feb: all approved
  if (monthIdx === 1) return r < 0.80 ? 'approved' : 'sent_back';       // Mar: mostly approved, some sent back
  if (monthIdx === 2) return r < 0.55 ? 'approved' : 'pending';         // Apr: half approved, half waiting
  return r < 0.35 ? 'approved' : 'pending';                             // May tail: mostly pending (in-flight)
}

async function clearTable(table: string, filterCol = 'created_at'): Promise<void> {
  const { error } = await db
    .from(table)
    .delete()
    .gte(filterCol, '1900-01-01T00:00:00.000Z');
  if (error) {
    const msg = error.message ?? String(error);
    if (msg.match(/audit_log|foreign key/i)) {
      console.error(`\n⚠️  FK constraint when clearing "${table}".`);
      console.error('If the app has been used, run this in the Supabase SQL Editor first:');
      console.error('  TRUNCATE audit_log CASCADE;\n');
    }
    throw new Error(`clearTable(${table}): ${msg}`);
  }
}

async function insertBatch<T extends Record<string, unknown>>(
  table: string,
  rows: T[],
  batchSize = 500,
): Promise<T[]> {
  if (rows.length === 0) return [];
  const result: T[] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const { data, error } = await db
      .from(table)
      .insert(rows.slice(i, i + batchSize))
      .select();
    if (error) throw new Error(`insert(${table}): ${error.message}`);
    result.push(...((data as T[]) ?? []));
  }
  return result;
}

// ── Static config ──────────────────────────────────────────────────────────

// Submission periods seeded — Feb through current month (May 2026).
// Adding May 1-6 as a partial-month tail so the demo's "today's daily log"
// surface lands in the in-progress state on a fresh login. Storage impact:
// ~30 facilities × ~10 params × ~6 days = ~1,800 extra rows × ~250 B = ~450 KB.
// Well within the Supabase free tier 500 MB cap.
const PERIODS = [
  { idx: 0, start: '2026-02-01', end: '2026-02-28' },
  { idx: 1, start: '2026-03-01', end: '2026-03-31' },
  { idx: 2, start: '2026-04-01', end: '2026-04-30' },
  { idx: 3, start: '2026-05-01', end: '2026-05-06' }, // current-month tail
] as const;

// Maps haz parameter code → category short-name (derived from the code).
// Used only to build manifest numbers and synthetic disposal links. Post-2026-
// 05-06 rescope: hazardous parameters are no longer gated by an
// active_haz_categories list; all factories see all categories. The "category"
// here is just the parameter's identity for the disposal-batch link.
function hazCategoryFromCode(code: string): string {
  // 'haz_used_oil_kg' -> 'used_oil' ; 'haz_e_waste_regulated_kg' -> 'e_waste_regulated'
  return code.replace(/^haz_/, '').replace(/_kg$/, '');
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('=== ReEarth seed (15-facility post-rescope footprint) ===\n');

  // ─────────────────────────────────────────────────────────────────────────
  // [1/9] Clear existing data (children before parents, reverse FK order)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[1/10] Clearing existing seed data...');
  await clearTable('compliance_breaches', 'detected_at');
  await clearTable('hazardous_events');
  await clearTable('discussion_messages');
  await clearTable('discussion_threads');
  await clearTable('submissions');
  await clearTable('parameter_assignments');
  await clearTable('regulatory_limits');
  await clearTable('personnel');
  await clearTable('parameters');
  await clearTable('facilities');
  console.log('      ✓\n');

  // ─────────────────────────────────────────────────────────────────────────
  // [2/9] Facilities — bcrypt PINs hashed here
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[2/9] Inserting facilities (hashing PINs)...');
  const now = new Date().toISOString();
  const pinsLines: string[] = ['facility_name,sap_code,pin,personnel'];

  const facilityInsertRows = await Promise.all(
    FACILITIES.map(async (f) => {
      const pinHash = await hashPin(f.pin);
      const roster = f.personnel.map(p => `${p.name} [${p.role}]`).join(' / ');
      pinsLines.push(`"${f.name}",${f.sap_code},${f.pin},"${roster}"`);
      return {
        sap_code: f.sap_code,
        name: f.name,
        type: f.type,
        brand: f.brand ?? null,
        city: f.city,
        state: f.state,
        pincode: f.pincode,
        address: f.address,
        // size_sqft removed in 2026-05-06 rescope; floor area is a master_data
        // parameter now (see parameters.ts), edited via Master Data UI.
        flags: f.flags,
        pin_hash: pinHash,
        pin_active_from: now,
        pin_last_rotated: now,
      };
    }),
  );

  const dbFacilities = await insertBatch('facilities', facilityInsertRows);
  const facilityIdBySap = new Map<string, string>(
    dbFacilities.map((r: Record<string, unknown>) => [r.sap_code as string, r.id as string]),
  );
  console.log(`      ✓ ${dbFacilities.length} facilities\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // [3/9] Parameters
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[3/9] Inserting parameters...');
  const dbParams = await insertBatch(
    'parameters',
    PARAMETERS.map(p => ({
      code: p.code,
      name: p.name,
      unit: p.unit,
      frequency: p.frequency,
      evidence_required: p.evidence_required,
      category: p.category,
    })),
  );
  const paramIdByCode = new Map<string, string>(
    dbParams.map((r: Record<string, unknown>) => [r.code as string, r.id as string]),
  );
  const paramCodeById = new Map<string, string>(
    dbParams.map((r: Record<string, unknown>) => [r.id as string, r.code as string]),
  );
  const paramByCode = new Map(PARAMETERS.map(p => [p.code, p]));
  console.log(`      ✓ ${dbParams.length} parameters\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // [4/10] Contributor personnel (per-facility, role='contributor')
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[4/10] Inserting contributor personnel...');
  const personnelRows = FACILITIES.flatMap(f => {
    const facilityId = facilityIdBySap.get(f.sap_code)!;
    return f.personnel.map(p => ({
      facility_id: facilityId,
      name: p.name,
      designation: p.designation,
      role: p.role,
    }));
  });
  const dbPersonnel = await insertBatch('personnel', personnelRows);

  // facilityId → personName → personId (contributors only)
  const personnelMap = new Map<string, Map<string, string>>();
  for (const row of dbPersonnel as Record<string, unknown>[]) {
    const fid = row.facility_id as string;
    if (!personnelMap.has(fid)) personnelMap.set(fid, new Map());
    personnelMap.get(fid)!.set(row.name as string, row.id as string);
  }
  console.log(`      ✓ ${dbPersonnel.length} contributors\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // [4b/10] HO super-users — facility_id is NULL (corporate role).
  // Per inconsistency-E resolution: at least 2 super-users so each can reset
  // the other's password. Plaintext passwords written to ho-passwords.csv.
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[4b/10] Inserting HO super-users...');
  const hoPasswordsLines: string[] = ['name,email,password,is_super_user'];
  const hoRows = await Promise.all(
    HO_USERS.map(async (u) => {
      const passwordHash = await hashPin(u.password); // bcryptjs is suitable for both PINs and passwords
      hoPasswordsLines.push(`"${u.name}",${u.email},"${u.password}",${u.is_super_user}`);
      return {
        facility_id: null,
        name: u.name,
        designation: u.designation,
        email: u.email,
        password_hash: passwordHash,
        is_super_user: u.is_super_user,
        role: 'ho',
      };
    }),
  );
  const dbHO = await insertBatch('personnel', hoRows);
  console.log(`      ✓ ${dbHO.length} HO users\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // [5/9] Parameter assignments
  //   Evaluates each parameter's conditional predicate against each facility's
  //   flags to determine which parameters apply.  master_data parameters are
  //   included in the catalog but never assigned (Wave 2 master-data UI will
  //   manage them separately).
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[5/9] Computing and inserting parameter assignments...');
  const assignmentRows: Record<string, unknown>[] = [];
  const assignedParamsByFacility = new Map<string, Set<string>>(); // facilityId → Set<paramId>

  for (const facility of FACILITIES) {
    const facilityId = facilityIdBySap.get(facility.sap_code)!;
    const template = facilityTypeToTemplate(facility.type);
    const assigned = new Set<string>();

    for (const param of PARAMETERS) {
      if (param.category === 'master_data') continue;
      const app = param.applicability[template];
      if (!shouldAssign(app, param.conditional_predicate, facility.flags as Record<string, unknown>)) continue;
      const pid = paramIdByCode.get(param.code)!;
      assigned.add(pid);
      assignmentRows.push({ facility_id: facilityId, parameter_id: pid });
    }
    assignedParamsByFacility.set(facilityId, assigned);
  }

  await insertBatch('parameter_assignments', assignmentRows);
  console.log(`      ✓ ${assignmentRows.length} assignments\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // [6/9] Regulatory limits
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[6/9] Inserting regulatory limits...');
  const limitRows = REGULATORY_LIMITS.map(lim => ({
    parameter_id: paramIdByCode.get(lim.parameter_code)!,
    facility_id: lim.facility_sap_code
      ? facilityIdBySap.get(lim.facility_sap_code) ?? null
      : null,
    state_code: lim.state_code,
    regulatory_limit: lim.regulatory_limit,
    limit_unit: lim.limit_unit,
    limit_type: lim.limit_type,
    regulatory_source: lim.regulatory_source,
    effective_from: lim.effective_from,
    effective_to: lim.effective_to,
  }));
  const dbLimits = await insertBatch('regulatory_limits', limitRows);
  const limitIdByParamCode = new Map<string, string>(
    dbLimits.map((row: Record<string, unknown>, i) => [
      REGULATORY_LIMITS[i].parameter_code,
      row.id as string,
    ]),
  );
  console.log(`      ✓ ${dbLimits.length} regulatory limits\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // [7/9] Submissions
  //   One submission per facility × parameter × period.
  //   ~20% of April submissions skipped (not all submitted in current month).
  //   Hazardous disposal submissions added separately per factory × haz category.
  //   Special case: FAC00001 stack_emissions_boiler_mgnm3 in March is seeded
  //   at 145 mg/Nm³ (above the 100 limit) to produce the compliance breach.
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[7/9] Generating submissions...');

  type SubMeta = {
    facilityId: string;
    paramCode: string;
    periodStart: string;
    monthIdx: number;
    eventType: 'standard' | 'hazardous_generation' | 'hazardous_disposal';
    hazCategory?: string;
    value: number;
  };

  const submissionRows: Record<string, unknown>[] = [];
  const subMetas: SubMeta[] = [];
  let seed = 1;

  for (const facility of FACILITIES) {
    const facilityId = facilityIdBySap.get(facility.sap_code)!;
    const contributors = facility.personnel.filter(p => p.role === 'contributor');
    if (contributors.length === 0) continue;

    const contributorIds = contributors.map(p => personnelMap.get(facilityId)!.get(p.name)!);
    const assigned = assignedParamsByFacility.get(facilityId) ?? new Set<string>();
    let ci = 0;

    for (const paramId of assigned) {
      const paramCode = paramCodeById.get(paramId)!;
      const param = paramByCode.get(paramCode)!;
      const isHazGen = param.category === 'waste_haz';

      for (const period of PERIODS) {
        // Simulate some April submissions not yet filed
        if (period.idx === 2 && pr(seed + 3333) < 0.20) { seed++; continue; }

        const isBreachSub =
          facility.sap_code === 'FAC00001' &&
          paramCode === 'stack_emissions_boiler_mgnm3' &&
          period.idx === 1;

        const value = isBreachSub
          ? 145
          : syntheticValue(facility.sap_code, paramCode, param.category, period.idx);

        const status = isBreachSub
          ? 'approved'
          : submissionStatus(period.idx, seed);

        const submittedById = contributorIds[ci % contributorIds.length];
        const submittedByName = contributors[ci % contributors.length].name;
        const eventType: SubMeta['eventType'] = isHazGen ? 'hazardous_generation' : 'standard';

        // Post-2026-05-06: hazardous parameters no longer carry an
        // active_haz_categories_contains predicate. Derive the category short-name
        // directly from the parameter code for FIFO ledger linking.
        const hazCategory = isHazGen ? hazCategoryFromCode(paramCode) : undefined;

        submissionRows.push({
          facility_id: facilityId,
          parameter_id: paramId,
          submitted_by: submittedById,
          submitted_by_name: submittedByName,
          event_at: backdatedTs(period.start, period.end, seed),
          submitted_at: backdatedTs(period.start, period.end, seed + 500),
          period_start: period.start,
          period_end: period.end,
          value_raw: valueRaw(value),
          unit_used: param.unit,
          value_normalized: value,
          event_type: eventType,
          status,
          ocr_run: false,
        });

        subMetas.push({ facilityId, paramCode, periodStart: period.start, monthIdx: period.idx, eventType, hazCategory, value });
        ci++;
        seed++;
      }
    }

    // Hazardous disposal: March 2026 — dispose ~82% of February generation.
    // Post-2026-05-06: iterate over the haz parameters that are actually
    // assigned to this factory rather than relying on a per-facility
    // active_haz_categories list (which no longer exists).
    if (facility.type === 'factory') {
      const assignedHazParams = PARAMETERS.filter(
        p => p.category === 'waste_haz' && assigned.has(paramIdByCode.get(p.code) ?? '__'),
      );
      for (const param of assignedHazParams) {
        const hazParamCode = param.code;
        const hazParamId = paramIdByCode.get(hazParamCode);
        if (!hazParamId) continue;
        const hazCat = hazCategoryFromCode(hazParamCode);

        const febQty = syntheticValue(facility.sap_code, hazParamCode, 'waste_haz', 0);
        const disposalQty = Math.max(0.1, Math.round(febQty * 0.82 * 10) / 10);

        submissionRows.push({
          facility_id: facilityId,
          parameter_id: hazParamId,
          submitted_by: contributorIds[0],
          submitted_by_name: contributors[0].name,
          event_at: '2026-03-12T10:00:00.000Z',
          submitted_at: '2026-03-12T10:45:00.000Z',
          period_start: '2026-03-01',
          period_end: '2026-03-31',
          value_raw: valueRaw(disposalQty),
          unit_used: param.unit,
          value_normalized: disposalQty,
          event_type: 'hazardous_disposal',
          status: 'approved',
          ocr_run: false,
        });
        subMetas.push({
          facilityId,
          paramCode: hazParamCode,
          periodStart: '2026-03-01',
          monthIdx: 1,
          eventType: 'hazardous_disposal',
          hazCategory: hazCat,
          value: disposalQty,
        });
      }
    }
  }

  const dbSubmissions = await insertBatch('submissions', submissionRows);
  console.log(`      ✓ ${dbSubmissions.length} submissions\n`);

  // Build lookup: facilityId|paramCode|periodStart|eventType → inserted row
  type DbSub = { id: string; facility_id: string; parameter_id: string; period_start: string; event_type: string };
  const subLookup = new Map<string, DbSub>();
  for (const row of dbSubmissions as DbSub[]) {
    const pCode = paramCodeById.get(row.parameter_id);
    if (!pCode) continue;
    const key = `${row.facility_id}|${pCode}|${row.period_start}|${row.event_type}`;
    subLookup.set(key, row);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // [8/9] Hazardous events
  //   One hazardous_events row per haz submission.
  //   Generation events: batch_id left null (trigger sets it to own id).
  //   Disposal events: batch_id → the corresponding February generation submission,
  //   creating the FIFO ledger link.
  //   running_balance is set to 0; the AFTER INSERT trigger recomputes the
  //   entire ledger for (facility, category) and updates it correctly.
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[8/9] Inserting hazardous events...');
  const hazEventRows: Record<string, unknown>[] = [];
  // facilityId|hazCategory|periodStart → submission id  (used to link disposal batch_id)
  const genSubIdMap = new Map<string, string>();

  for (const meta of subMetas) {
    if (!meta.hazCategory) continue;
    const key = `${meta.facilityId}|${meta.paramCode}|${meta.periodStart}|${meta.eventType}`;
    const sub = subLookup.get(key);
    if (!sub) continue;

    if (meta.eventType === 'hazardous_generation') {
      const genKey = `${meta.facilityId}|${meta.hazCategory}|${meta.periodStart}`;
      genSubIdMap.set(genKey, sub.id);

      hazEventRows.push({
        submission_id: sub.id,
        batch_id: null,          // trigger fills this in for generation events
        generation_date: meta.periodStart,
        category: meta.hazCategory,
        quantity: meta.value,
        running_balance: 0,      // trigger recomputes
      });
    } else if (meta.eventType === 'hazardous_disposal') {
      // Link to Feb generation batch so the FIFO ledger is connected
      const febKey = `${meta.facilityId}|${meta.hazCategory}|2026-02-01`;
      const batchId = genSubIdMap.get(febKey) ?? null;

      hazEventRows.push({
        submission_id: sub.id,
        batch_id: batchId,
        generation_date: '2026-02-01',
        category: meta.hazCategory,
        quantity: meta.value,
        running_balance: 0,
        manifest_number: `DM-${meta.hazCategory.slice(0, 4).toUpperCase()}-MAR26`,
        handler_authorization_id: `AUTH-${meta.hazCategory.slice(0, 4).toUpperCase()}-DEMO`,
      });
    }
  }

  await insertBatch('hazardous_events', hazEventRows);
  console.log(`      ✓ ${hazEventRows.length} hazardous events\n`);

  // ─────────────────────────────────────────────────────────────────────────
  // [9/10] Compliance breach
  //   Factory-Bengaluru (FAC00001), boiler emissions, March 2026:
  //   145 mg/Nm³ vs CPCB limit of 100. Seeded as approved (historical record)
  //   with severity=critical.
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[9/10] Inserting compliance breach...');
  const fac001Id = facilityIdBySap.get('FAC00001')!;
  const breachSub = subLookup.get(`${fac001Id}|stack_emissions_boiler_mgnm3|2026-03-01|standard`);
  const boilerLimitId = limitIdByParamCode.get('stack_emissions_boiler_mgnm3');

  if (breachSub && boilerLimitId) {
    await insertBatch('compliance_breaches', [{
      submission_id: breachSub.id,
      regulatory_limit_id: boilerLimitId,
      observed_value: 145,
      limit_value_at_event: 100,
      severity: 'critical',
      detected_at: '2026-03-29T09:00:00.000Z',
      resolved_at: null,
      resolved_by: null,
      resolution_notes: null,
    }]);
    console.log('      ✓ 1 breach — FAC00001 boiler emissions 145 vs 100 mg/Nm³ (critical)\n');
  } else {
    console.warn('      ⚠️  Breach submission or limit not found — breach skipped\n');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // [10/10] Write credential CSVs (both git-ignored)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('[10/10] Writing credential CSVs...');
  const outputDir = join(__dirname, 'output');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'pins.csv'), pinsLines.join('\n') + '\n', 'utf8');
  writeFileSync(join(outputDir, 'ho-passwords.csv'), hoPasswordsLines.join('\n') + '\n', 'utf8');
  console.log('      ✓ pins.csv + ho-passwords.csv\n');

  // ─────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────
  console.log('=== Done ===');
  console.log(`Facilities:    ${dbFacilities.length}`);
  console.log(`Parameters:    ${dbParams.length}`);
  console.log(`Contributors:  ${dbPersonnel.length}`);
  console.log(`HO super-users:${dbHO.length}`);
  console.log(`Assignments:   ${assignmentRows.length}`);
  console.log(`Reg limits:    ${dbLimits.length}`);
  console.log(`Submissions:   ${dbSubmissions.length}`);
  console.log(`Haz events:    ${hazEventRows.length}`);
  console.log(`Breaches:      1`);
  console.log('\nNext: open supabase/seed/output/pins.csv (contributors)');
  console.log('      and supabase/seed/output/ho-passwords.csv (HO).');
}

main().catch(err => {
  console.error('\nSeed failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
