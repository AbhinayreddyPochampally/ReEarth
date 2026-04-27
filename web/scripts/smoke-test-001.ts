// Smoke tests for migration 001_core_schema.sql.
// Run with: node --env-file=.env.local --experimental-strip-types scripts/smoke-test-001.ts
//
// Uses the service role key (bypasses RLS). Inserts test rows, makes assertions,
// and cleans up in reverse FK order. audit_log rows cannot be deleted (append-only
// trigger) — those are tagged with metadata.smoke_test=true so the seed in Task 1.4
// can identify and ignore them.

import { createClient } from "@supabase/supabase-js";

const url = process.env["NEXT_PUBLIC_SUPABASE_URL"]!;
const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
const sb = createClient(url, key, { auth: { persistSession: false } });

// Unique per-run identifier so re-runs don't collide. Test data accumulates
// (audit_log rows can't be deleted, so the personnel/facility they reference
// can't be deleted either — by design). Use the supabase dashboard to purge
// TEST_* facilities periodically if accumulation becomes noisy.
const RUN_ID = Math.random().toString(36).slice(2, 10);
const TEST_SAP = `TEST_${RUN_ID}`;

const TABLES = [
  "facilities", "personnel", "parameters", "parameter_assignments",
  "submissions", "evidence", "hazardous_events",
  "regulatory_limits", "compliance_breaches",
  "audit_log", "discussion_threads", "discussion_messages",
] as const;

let pass = 0;
let fail = 0;

function ok(name: string, detail = "") {
  pass++;
  console.log(`  PASS  ${name}${detail ? "  —  " + detail : ""}`);
}
function bad(name: string, err: unknown) {
  fail++;
  const msg = err instanceof Error ? err.message : JSON.stringify(err);
  console.log(`  FAIL  ${name}  —  ${msg}`);
}

// ---------------------------------------------------------------------------
console.log("\n[1/5] Schema integrity — every expected table responds to SELECT");
// ---------------------------------------------------------------------------
for (const t of TABLES) {
  const { error } = await sb.from(t).select("*").limit(0);
  if (error) bad(`table ${t} reachable`, error);
  else ok(`table ${t} reachable`);
}

// ---------------------------------------------------------------------------
console.log("\n[2/5] Insert chain — full FK graph");
// ---------------------------------------------------------------------------
// bcrypt hash of '1234' (cost 10). Real seeds will hash on the fly; this is a
// stable test value so we can verify the insert without bringing in a hashing dep here.
const TEST_PIN = "$2b$10$abcdefghijklmnopqrstuv1234567890ABCDEFGHIJKLMNopqrSTUv";

const { data: fac, error: facErr } = await sb.from("facilities").insert({
  sap_code: TEST_SAP,
  name: `Smoke Test Facility ${RUN_ID}`,
  type: "factory",
  city: "Bengaluru", state: "Karnataka", pincode: "560001", address: "Test Address",
  flags: { has_dg: true, dg_count: 1, has_solar: false },
  pin_hash: TEST_PIN,
}).select().single();
if (facErr || !fac) { bad("insert facility", facErr); throw new Error("aborting"); }
ok("insert facility", `id=${fac.id.slice(0, 8)}…`);

const { data: per, error: perErr } = await sb.from("personnel").insert({
  facility_id: fac.id, name: "Asha K.", designation: "Sustainability Officer", role: "contributor",
}).select().single();
if (perErr || !per) { bad("insert personnel", perErr); throw new Error("aborting"); }
ok("insert personnel", `id=${per.id.slice(0, 8)}…`);

const { data: param, error: paramErr } = await sb.from("parameters").insert({
  code: `TEST_ELEC_${RUN_ID}`, name: "Electricity (test)", unit: "kWh",
  frequency: "monthly", evidence_required: "required", category: "energy",
}).select().single();
if (paramErr || !param) { bad("insert parameter", paramErr); throw new Error("aborting"); }
ok("insert parameter", `id=${param.id.slice(0, 8)}…`);

const { data: assn, error: assnErr } = await sb.from("parameter_assignments").insert({
  facility_id: fac.id, parameter_id: param.id,
}).select().single();
if (assnErr || !assn) { bad("insert assignment", assnErr); throw new Error("aborting"); }
ok("insert parameter_assignment", `id=${assn.id.slice(0, 8)}…`);

const { data: sub, error: subErr } = await sb.from("submissions").insert({
  facility_id: fac.id, parameter_id: param.id, submitted_by: per.id,
  submitted_by_name: per.name,
  event_at: "2026-04-15T00:00:00Z", submitted_at: "2026-04-16T10:00:00Z",
  period_start: "2026-04-01", period_end: "2026-04-30",
  value_raw: "12400", unit_used: "kWh", value_normalized: 12400,
  ocr_run: false, event_type: "standard", status: "pending",
}).select().single();
if (subErr || !sub) { bad("insert submission", subErr); throw new Error("aborting"); }
ok("insert submission", `id=${sub.id.slice(0, 8)}…`);

const { data: ev, error: evErr } = await sb.from("evidence").insert({
  submission_id: sub.id, storage_path: "test/path.jpg", evidence_type: "utility_bill",
  mime_type: "image/jpeg", file_size_bytes: 102400,
}).select().single();
if (evErr || !ev) { bad("insert evidence", evErr); throw new Error("aborting"); }
ok("insert evidence", `id=${ev.id.slice(0, 8)}…`);

const { data: thr, error: thrErr } = await sb.from("discussion_threads").insert({
  submission_id: sub.id, status: "open",
}).select().single();
if (thrErr || !thr) { bad("insert discussion_thread", thrErr); throw new Error("aborting"); }
ok("insert discussion_thread", `id=${thr.id.slice(0, 8)}…`);

const { data: msg, error: msgErr } = await sb.from("discussion_messages").insert({
  thread_id: thr.id, author_id: per.id, author_role: "contributor",
  message_text: "smoke test message",
}).select().single();
if (msgErr || !msg) { bad("insert discussion_message", msgErr); throw new Error("aborting"); }
ok("insert discussion_message", `id=${msg.id.slice(0, 8)}…`);

// ---------------------------------------------------------------------------
console.log("\n[3/5] FK RESTRICT enforcement");
// ---------------------------------------------------------------------------
const { error: facDelErr } = await sb.from("facilities").delete().eq("id", fac.id);
if (facDelErr) ok("delete facility blocked while submissions exist", facDelErr.message.split(":")[0]);
else bad("delete facility blocked while submissions exist", "delete unexpectedly succeeded");

// ---------------------------------------------------------------------------
console.log("\n[4/5] Audit log append-only");
// ---------------------------------------------------------------------------
const { data: aud, error: audErr } = await sb.from("audit_log").insert({
  event_type: "smoke_test_marker",
  actor_id: per.id,
  entity_type: "submission",
  entity_id: sub.id,
  metadata: { smoke_test: true, note: "leave this row; it cannot be deleted" },
}).select().single();
if (audErr || !aud) { bad("insert audit_log", audErr); throw new Error("aborting"); }
ok("insert audit_log", `id=${aud.id.slice(0, 8)}…`);

const { error: audUpdErr } = await sb.from("audit_log").update({ event_type: "tampered" }).eq("id", aud.id);
if (audUpdErr) ok("UPDATE audit_log blocked by trigger", audUpdErr.message.split(":")[0]);
else bad("UPDATE audit_log blocked by trigger", "update unexpectedly succeeded");

const { error: audDelErr } = await sb.from("audit_log").delete().eq("id", aud.id);
if (audDelErr) ok("DELETE audit_log blocked by trigger", audDelErr.message.split(":")[0]);
else bad("DELETE audit_log blocked by trigger", "delete unexpectedly succeeded");

// ---------------------------------------------------------------------------
console.log("\n[5/5] Hazardous FIFO running_balance — the architect's algorithm test");
// ---------------------------------------------------------------------------
// We use a fresh hazardous parameter and a chain of submissions+hazardous_events.
const { data: hazParam } = await sb.from("parameters").insert({
  code: `TEST_HAZ_USED_OIL_${RUN_ID}`, name: "Used oil (test)", unit: "L",
  frequency: "monthly", category: "waste_haz",
}).select().single();
if (!hazParam) { bad("haz: insert parameter", "no parameter"); throw new Error("aborting"); }

await sb.from("parameter_assignments").insert({ facility_id: fac.id, parameter_id: hazParam.id });

async function insertHazEvent(opts: {
  eventAt: string; periodStart: string; periodEnd: string;
  eventType: "hazardous_generation" | "hazardous_disposal";
  qty: number; batchId?: string; generationDate: string;
  manifest?: string;
}) {
  const { data: s, error: se } = await sb.from("submissions").insert({
    facility_id: fac.id, parameter_id: hazParam.id, submitted_by: per.id,
    submitted_by_name: per.name,
    event_at: opts.eventAt, submitted_at: opts.eventAt,
    period_start: opts.periodStart, period_end: opts.periodEnd,
    value_raw: String(opts.qty), unit_used: "L", value_normalized: opts.qty,
    ocr_run: false, event_type: opts.eventType, status: "approved",
  }).select().single();
  if (se || !s) throw new Error("submission insert failed: " + JSON.stringify(se));
  const { data: h, error: he } = await sb.from("hazardous_events").insert({
    submission_id: s.id,
    batch_id: opts.batchId ?? null,
    generation_date: opts.generationDate,
    category: "used_oil",
    quantity: opts.qty,
    manifest_number: opts.manifest ?? null,
  }).select().single();
  if (he || !h) throw new Error("haz event insert failed: " + JSON.stringify(he));
  return { submission: s, event: h };
}

async function fetchLedger() {
  // Order by submissions.event_at (the trigger's computation order), NOT by
  // generation_date — disposal events copy the batch's generation_date, so
  // ordering by it doesn't match the running-balance order.
  const { data, error } = await sb.from("hazardous_events")
    .select("id, quantity, running_balance, generation_date, submission_id, submissions!inner(event_at, event_type)")
    .eq("category", "used_oil");
  if (error) throw error;
  type Row = typeof data[number] & { submissions: { event_at: string } };
  return (data as Row[]).sort((a, b) =>
    new Date(a.submissions.event_at).getTime() - new Date(b.submissions.event_at).getTime()
  );
}

// Step 1: 3 generation events on different dates
const g1 = await insertHazEvent({
  eventAt: "2026-01-15T00:00:00Z", periodStart: "2026-01-01", periodEnd: "2026-01-31",
  eventType: "hazardous_generation", qty: 100, generationDate: "2026-01-15",
});
const g2 = await insertHazEvent({
  eventAt: "2026-02-10T00:00:00Z", periodStart: "2026-02-01", periodEnd: "2026-02-28",
  eventType: "hazardous_generation", qty: 60, generationDate: "2026-02-10",
});
const g3 = await insertHazEvent({
  eventAt: "2026-03-05T00:00:00Z", periodStart: "2026-03-01", periodEnd: "2026-03-31",
  eventType: "hazardous_generation", qty: 40, generationDate: "2026-03-05",
});

let ledger = await fetchLedger();
const balances1 = ledger.map(r => r.running_balance);
const expected1 = [100, 160, 200];
if (JSON.stringify(balances1) === JSON.stringify(expected1)) {
  ok("3 generations: running_balance = [100, 160, 200]");
} else {
  bad("3 generations: running_balance", `expected ${expected1}, got ${balances1}`);
}

// Step 2: 1 disposal of 50, depleting from g1 (FIFO)
const d1 = await insertHazEvent({
  eventAt: "2026-03-20T00:00:00Z", periodStart: "2026-03-01", periodEnd: "2026-03-31",
  eventType: "hazardous_disposal", qty: 50, generationDate: "2026-01-15",
  batchId: g1.event.id, manifest: "MAN-001",
});

ledger = await fetchLedger();
const balances2 = ledger.map(r => r.running_balance);
const expected2 = [100, 160, 200, 150];
if (JSON.stringify(balances2) === JSON.stringify(expected2)) {
  ok("after disposal of 50: running_balance = [100, 160, 200, 150]");
} else {
  bad("after disposal of 50: running_balance", `expected ${expected2}, got ${balances2}`);
}

// Step 3: backdated generation event BEFORE all others
const g0 = await insertHazEvent({
  eventAt: "2025-12-01T00:00:00Z", periodStart: "2025-12-01", periodEnd: "2025-12-31",
  eventType: "hazardous_generation", qty: 25, generationDate: "2025-12-01",
});

ledger = await fetchLedger();
// Now ordered by generation_date: [g0=25, g1=100+25=125, g2=60+125=185, g3=40+185=225, d1=-50+225=175]
const balances3 = ledger.map(r => r.running_balance);
const expected3 = [25, 125, 185, 225, 175];
if (JSON.stringify(balances3) === JSON.stringify(expected3)) {
  ok("after backdated generation of 25: all balances recomputed = [25, 125, 185, 225, 175]");
} else {
  bad("after backdated generation: balances recomputed", `expected ${expected3}, got ${balances3}`);
}

// ---------------------------------------------------------------------------
console.log("\nCleanup — delete leaf-first; audit_log rows persist (append-only)");
// ---------------------------------------------------------------------------
async function delAll(table: string, col: string, val: string) {
  const { error } = await sb.from(table).delete().eq(col, val);
  if (error) console.log(`  cleanup ${table} (${col}=${val.slice(0,8)}): ${error.message}`);
}
await sb.from("discussion_messages").delete().eq("thread_id", thr.id);
await sb.from("discussion_threads").delete().eq("id", thr.id);
await sb.from("evidence").delete().eq("submission_id", sub.id);
await sb.from("hazardous_events").delete().eq("category", "used_oil");
await sb.from("submissions").delete().eq("facility_id", fac.id);
await sb.from("parameter_assignments").delete().eq("facility_id", fac.id);
await sb.from("parameters").delete().in("id", [param.id, hazParam.id]);
await sb.from("personnel").delete().eq("facility_id", fac.id);
await sb.from("facilities").delete().eq("id", fac.id);
console.log("  cleanup complete (audit_log row tagged smoke_test=true is intentionally retained)");

// ---------------------------------------------------------------------------
console.log(`\nResult: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
