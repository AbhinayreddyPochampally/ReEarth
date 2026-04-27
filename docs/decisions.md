# Architecture Decisions Log

This file records architectural decisions, particularly any deviations from `foundation.docx`.

Format for each decision:

```
## YYYY-MM-DD — Short title

**Context:** What was the situation that forced a decision?
**Decision:** What did we decide?
**Why:** What are the reasons?
**Alternatives considered:** What else was on the table and why did we reject it?
**Foundation doc reference:** Which section(s) does this affect?
**Reversibility:** How hard would it be to undo this later? (Easy / Medium / Hard)
```

---

## 2026-04-27 — Deviate from Azure-native data layer; use Supabase for the demo

**Context:** Foundation Section 10 specifies Azure SQL + Azure Blob. The demo budget is $100 (Azure for Students). Azure SQL alone burns the budget in weeks.

**Decision:** Use Supabase Postgres (free tier) + Supabase Storage (free tier) + Supabase Auth (customized) for the demo. Keep the rest of the stack Azure-native (App Service, OpenAI, Document Intelligence).

**Why:**
- Supabase Postgres is real Postgres, scales easily to demo size
- Frees the $100 to fund the AI features (the wow factor of the demo)
- Demo is single-tenant; Supabase free tier covers it indefinitely
- "We deployed on Azure with managed Postgres backend" is a fine story to tell the manager

**Alternatives considered:**
- Stay fully Azure-native: rejected — burns budget before AI features can be built
- Use SQLite locally: rejected — defeats "deployed Azure demo" goal
- Use Vercel for frontend hosting: rejected — defeats "deployed on Azure" goal

**Foundation doc reference:** Section 10 (Azure stack), Section 12-15 (Auth)
**Reversibility:** Medium. Schema is portable; auth would need reimplementation; storage migration is straightforward. The data access layer in `web/lib/db/` will encapsulate Supabase specifics so the rest of the app doesn't depend on it.

---

## 2026-04-27 — NL query implemented as structured filter, not raw SQL

**Context:** Wave 3 includes NL query for HO data explorer. The naive implementation is "let the AI write SQL." That's a security hole and reliability hole.

**Decision:** AI converts natural language to a structured filter object (parameter list, date range, facility filters, sort, aggregation). A deterministic translator function in `web/lib/db/query-builder.ts` converts the structured filter to parameterized Postgres queries.

**Why:**
- Eliminates SQL injection risk entirely
- Makes the AI's interpretation visible to the HO user (renders as filter chips, editable)
- Bounds what queries are possible — AI can't accidentally run a destructive query
- Testable with deterministic outputs
- Works for the demo and for Phase 2 production with no rewrite

**Alternatives considered:**
- Raw SQL generation with read-only DB role: rejected — still fails the "interpretation visibility" test
- Pre-defined query templates: rejected — too restrictive; manager would notice the canned feel

**Foundation doc reference:** Section 54 (Data explorer), Section 63 (Investigation assistant guardrails — same principle)
**Reversibility:** Easy. The AI prompt can later return SQL if the constraints change.

---

## 2026-04-27 — Demo footprint reduced from 13 to 10 facilities

**Context:** Original full-pilot scope (foundation Section 82) is 24 facilities. The pilot was scoped at 13. For the demo, exhaustive coverage matters less than diverse coverage.

**Decision:** 10 facilities — 2 factories + 1 warehouse + 7 stores. The 7 stores cover all brands, sizes, formats, and the mall_based / high-street split.

**Why:**
- Manager demo doesn't need volume; it needs diversity
- 10 facilities × 3 months of synthetic history = realistic seed data without absurd volume
- Smaller seed = faster startup time = better demo experience
- Every conditional flag is exercised by at least one facility

**Alternatives considered:**
- Full 24: rejected — too much synthetic data to maintain
- Just 4: rejected — doesn't cover all conditional flags
- Random 13: rejected — diversity isn't guaranteed

**Foundation doc reference:** Section 82 (Pilot footprint)
**Reversibility:** Easy. Add more facilities to the seed file.

---

## 2026-04-27 — Inspection module deferred to Wave 4

**Context:** Sections 45–51 specify the inspection module. It's the most architecturally distinctive feature but also the most build-effort-heavy.

**Decision:** Build Waves 1–3 first (skeleton, breadth, NL I/O). Add inspection only after Wave 3 is rock solid.

**Why:**
- Wave 3 is the demo's headline (NL I/O is what makes the manager say "wow")
- Inspection without working core is meaningless
- Better to ship 3/4 features rock-solid than 4/4 half-working

**Alternatives considered:**
- Build inspection in parallel: rejected — splits attention, both end up half-done
- Skip inspection entirely: deferred — this is "later optional," not "never"

**Foundation doc reference:** Sections 45–51
**Reversibility:** Easy. Wave 4 plan exists in vertical-slice-spec.md.

---

## 2026-04-27 — Conditional flags: hybrid storage (typed columns + extras jsonb)

**Context:** Each facility carries a set of conditional flags (`has_dg`, `dg_count`, `has_boiler`, `boiler_fuel`, `has_solar`, `has_stp`, `has_groundwater`, `has_canteen`, `mall_based`, `has_internal_fleet`, etc.) that gate which parameters apply. Wave 2 review queue routing and Wave 3 NL query both filter on these flags.

**Decision:** Store the known flag set as separate, properly-typed columns on `facilities` (boolean, smallint, or text/enum as appropriate). Add a single nullable `flags_extras jsonb` column for flags discovered after Wave 1 that don't justify a schema migration on their own.

**Why:**
- Native columns give type safety end-to-end (Supabase-generated TypeScript types catch flag-name typos at compile time)
- Native columns are queryable without `jsonb` operators and indexable with standard btree
- Wave 2 routing and Wave 3 NL filter generation are simpler with native columns
- The `flags_extras` escape hatch covers edge cases without forcing a migration for every new flag

**Alternatives considered:**
- All-jsonb: rejected — gives up type safety; every TypeScript caller must know the JSON shape
- All-typed-columns (no escape hatch): rejected — every new flag requires a migration even when discovered late in development
- Separate `facility_flags` key-value table: rejected — every flag query becomes a join; values lose their native types

**Foundation doc reference:** Appendix B.1 (facilities columns)
**Reversibility:** Medium. Adding more typed columns later is cheap. Migrating data out of `flags_extras` into typed columns is a one-time per-flag migration. Going the other direction (typed → jsonb) is a destructive rewrite of dependent queries.

---

## 2026-04-27 — PIN hashing: bcrypt only, no separate salt column

**Context:** Foundation Appendix B.1 (as inferred from CLAUDE.md and the planner's analysis) lists `pin_salt` as a column on `facilities`. bcrypt embeds the salt inside the hash output by design.

**Decision:** Use bcrypt for PIN hashing. Columns on `facilities` are `pin_hash`, `pin_active_from`, `pin_last_rotated`, `pin_lockout_until` (plus `pin_failed_attempts`). **No `pin_salt` column.**

**Why:**
- bcrypt's output format already contains the salt (`$2b$12$<22-char-salt><31-char-hash>`)
- Storing salt separately is redundant and creates a class of bug where `pin_salt` and the hash drift apart
- The architect treats this as a correction to Appendix B.1 — Appendix B.1 was written assuming a hash family that needs separate salt management; bcrypt obviates that

**Alternatives considered:**
- Argon2id: rejected for the demo — equivalent security, but bcrypt is universal in Node.js (`bcrypt` npm package is mature) and we don't need argon2's memory-hardness for 4-digit PINs
- Keep `pin_salt` and ignore it: rejected — dead columns rot

**Foundation doc reference:** Appendix B.1 (correction). Section 14.2 (PIN lockout: 5 fails → 15 min) is unaffected.
**Reversibility:** Easy. Adding the column back later is one ALTER TABLE; bcrypt-hashed values can coexist with future argon2 hashes by using a discriminator prefix in `pin_hash`.

---

## 2026-04-27 — RLS as cosmetic backstop, not primary authorization

**Context:** Supabase has Row-Level Security built in. The standard guidance is "enable RLS with tight per-role policies." Our access pattern: all reads/writes go through `web/lib/db/` running server-side with the Supabase service role key, which bypasses RLS by design.

**Decision:** Enable RLS on every table with permissive defense-in-depth policies. Do NOT invest effort in tight contributor-scoped policies (e.g., "contributor can only see their own facility's submissions"). Authorization lives in `web/lib/db/`, not in the database.

**Why:**
- Real authorization is server-side, where the application knows the current user's facility and role and constructs queries accordingly
- The service role bypasses RLS, so contributor-scoped policies don't actually fire on our access path
- Enabling RLS at all silences Supabase dashboard warnings and gives us "yes, RLS is on" as a credible answer if asked
- Tight RLS policies would need their own test surface and would catch zero real bugs given our access pattern
- If we later add anon/authenticated client-side calls (e.g., realtime subscriptions), we can tighten policies then — at which point they'd actually do something

**Alternatives considered:**
- Disable RLS entirely: rejected — Supabase warns, and "we deliberately disabled RLS" is harder to justify than "we have RLS on"
- Tight contributor-scoped policies now: rejected — pure ceremony given service-role access; cost in test/maintenance effort outweighs benefit
- Use anon/authenticated PostgREST calls and rely on RLS: rejected — `web/lib/db/` is the architectural seam; client-side Supabase imports are forbidden by CLAUDE.md

**Foundation doc reference:** Sections 12–15 (auth flow). Foundation doc does not specify RLS posture; this is a Supabase-specific decision.
**Reversibility:** Easy. Tightening policies later is additive. Loosening is also additive (drop policy, add looser).

---

## 2026-04-27 — Conditional flags: revert hybrid → pure jsonb (supersedes earlier hybrid decision)

**Context:** Earlier today (entry above) we approved a hybrid: typed columns for known flags + `flags_extras jsonb`. After the architect read Appendix B.1 directly, Appendix B.1 specifies a single `flags` jsonb column on `facilities` — no typed columns.

**Decision:** Supersede the hybrid. Use a single `flags jsonb NOT NULL DEFAULT '{}'` column on `facilities`, matching Appendix B.1 verbatim. The earlier hybrid entry stays in this file for trail; this entry is the current truth.

**Why:**
- Appendix B.1 is the authoritative column spec; we deviate only when justified
- The reasoning behind the hybrid (type safety, indexability) was sound, but Appendix B.1 had already weighed those tradeoffs and chose jsonb
- TypeScript types for the JSON shape will be hand-maintained in `web/lib/db/types/facility-flags.ts` — same outcome as a typed column, just one indirection
- Reverting now (before any seed data exists) is free; reverting in Wave 2 would require data migration

**Alternatives considered:**
- Keep the hybrid and document it as a justified deviation: rejected — the original justification was based on inferred Appendix B contents; with the actual contents read, the deviation lacks merit
- Pure typed columns: rejected — same reason

**Foundation doc reference:** Appendix B.1 (definitive)
**Reversibility:** Easy. If we ever need typed columns for a specific flag, we add a generated column or a typed column populated from `flags`.

---

## 2026-04-27 — Discussions: normalize despite Appendix B's flat jsonb design

**Context:** Appendix B.1 specifies discussions as a single table with `thread_id`, `subject_id`, and `messages` as a JSON array. The conventional database design — one row per message — is more queryable.

**Decision:** Deviate from Appendix B.1. Create two tables: `discussion_threads` (one row per thread) and `discussion_messages` (one row per message), linked by FK.

`discussion_threads`: `id`, `submission_id` (FK RESTRICT), `status` (enum: open/resolved), `created_at`, `resolved_at` (nullable).
`discussion_messages`: `id`, `thread_id` (FK RESTRICT), `author_id` (FK personnel RESTRICT), `author_role` (enum: contributor/ho, denormalized for queryability), `message_text`, `created_at`.

**Why:**
- Per-message audit log granularity — each message is an INSERT we can audit, not a parent-row UPDATE that loses prior message versions
- Foreign-key enforcement on `author_id` is impossible inside jsonb arrays
- Wave 3 NL audit search ("why was this submission sent back?") needs to JOIN messages to authors and filter by date — trivial with rows, awkward with jsonb
- Cost is one extra table — negligible at demo scale

**Alternatives considered:**
- Follow Appendix B.1 literally: rejected — sacrifices FK enforcement, audit granularity, and Wave 3 query simplicity for one fewer table
- Hybrid (jsonb messages + denormalized message rows for indexing): rejected — two sources of truth that can drift

**Foundation doc reference:** Appendix B.1 (deviation)
**Reversibility:** Medium. Collapsing two tables back into one with a jsonb column is straightforward; data migration would aggregate messages by thread.

---

## 2026-04-27 — Audit log batch hashing deferred to Wave 2 / production hardening

**Context:** Section 15.3 mandates cryptographic hashes for audit log batches as a tamper-evidence mechanism. Implementing it requires either a Postgres extension (`pgcrypto` is fine) plus a batching scheme (every N events get a Merkle-style chained hash) or an off-database log shipper.

**Decision:** Defer batch hashing to Wave 2 or production hardening. Wave 1 `audit_log` is INSERT-only enforced by trigger + REVOKE on UPDATE/DELETE — that is the demo-grade tamper resistance. No cryptographic chain.

**Why:**
- Batch hashing is overkill for a single-tenant demo with no real data
- The demo runs on Supabase, where the service role can already bypass row-level controls; cryptographic chain would not actually block a malicious service-role caller, only detect tampering after the fact
- Wave 3's NL audit search and Wave 2's review queue both work the same with or without the hash chain
- Implementing it well requires coordination with whatever the production log destination will be (Datadog? Splunk? CloudWatch?) — premature

**Alternatives considered:**
- Implement now: rejected — premature, no real data to protect
- Skip permanently: rejected — Section 15.3 is part of the spec; defer is the right framing

**Foundation doc reference:** Section 15.3 (deferred)
**Reversibility:** Easy. Adding `audit_log_batches` table and a periodic-job hashing function is additive. `audit_log` rows themselves are unchanged.

---

## 2026-04-27 — geo_location dropped (Appendix B amendment)

**Context:** Appendix B.1 was inferred to include a `geo_location` field on `facilities`. The architect re-read the foundation document and confirmed this was added without justification.

**Decision:** Drop `geo_location` (and the previously-discussed `latitude`/`longitude` split) entirely. Facility location is captured as text address fields only: `city`, `state`, `pincode`, `address`. No coordinates.

**Why:**
- Section 9 specifies HO-entered metadata only; coordinates are not in scope
- Sections 45–51 (inspection module) explicitly exclude geo-tagging
- The demo never needs distance queries or maps — every screen renders address text
- Dropping a column we never need is cheaper than carrying it as nullable

**Alternatives considered:**
- Keep as `text`: rejected — dead column
- Keep as `numeric(9,6)` lat/lng: rejected — same, with overhead of CHECK constraints

**Foundation doc reference:** Appendix B.1 amendment, Section 9, Sections 45–51
**Reversibility:** Easy. If a future feature needs coordinates, add columns then.

---

## 2026-04-27 — Migration 001 applied via dashboard SQL Editor (CLI auth deferred)

**Context:** The Supabase CLI was approved as the migration tool (entry above). On this Windows machine, `npm i -g supabase` is no longer supported by Supabase, scoop is not installed, and `supabase login` requires a TTY (Claude's bash is non-TTY). Direct binary download to `.tools/supabase.exe` works for command discovery but auth is blocked.

**Decision:** Wave 1's first migration (`001_core_schema.sql`) was applied by pasting the file contents into the Supabase dashboard SQL Editor. Subsequent migrations (Wave 2+) will use the CLI once `SUPABASE_ACCESS_TOKEN` is set up.

**Why:**
- One-time cost of setting up CLI auth (generating an access token, storing it as an env var) is real but small
- For the first migration specifically, the dashboard paste is faster than the CLI auth setup for a single-tenant demo
- Smoke tests use `@supabase/supabase-js` with the service role key, which works regardless of CLI auth state — so the validation path is unaffected

**Alternatives considered:**
- Block on CLI setup for migration 001: rejected — friction for no functional benefit at Wave 1
- Permanently rely on dashboard pastes: rejected — doesn't scale to multiple migrations and breaks the Wave 2/3 muscle memory

**Foundation doc reference:** N/A (tooling decision)
**Reversibility:** Easy. CLI workflow works fine once auth is set up; future migrations follow the README without amendment.

---

## 2026-04-27 — Model tiering for subagents (reverted from all-Opus)

**Context:** The user-level `~/.claude/settings.json` had `"model": "claude-opus-4-7"` set globally, which routed every subagent invocation (planner, reviewer, cost-checker) and the main thread to Opus 4.7. Pro usage was burning fast and the cost-checker (mechanical az CLI parsing) was slower than necessary. The starter-kit intent was tiered: opus only where reasoning leverage justifies it.

**Decision:** Restore tiered model assignment by removing the global override. Effective configuration:
- `planner` subagent → `model: opus` (in `.claude/agents/planner.md` frontmatter, already set)
- `reviewer` subagent → `model: sonnet` (in `.claude/agents/reviewer.md` frontmatter, already set)
- `cost-checker` subagent → `model: haiku` (in `.claude/agents/cost-checker.md` frontmatter, already set)
- Main thread → no override (uses Claude Code default)

The agent frontmatter was already correct from the starter kit; the bug was the user-level `"model"` override at `~/.claude/settings.json`. That single line was deleted; agent frontmatter is now authoritative.

**Why:**
1. **Opus on planner is justified** — planning is the highest-leverage step in our architect-developer protocol. The architect reads plans, not code. Plan quality is the constraint on whole-project quality. Opus's stronger reasoning earns its cost here.
2. **Sonnet on reviewer is sufficient** — code review against conventions in CLAUDE.md is pattern matching. Sonnet handles it well. Opus would be overkill.
3. **Haiku on cost-checker is the right call** — it runs az consumption commands, parses tabular output, returns structured reports. Mechanical work. Haiku is 25× cheaper and meaningfully faster than Opus for this.
4. **Defaulting all subagents to Opus 4.7 burned through Claude Pro usage limits unnecessarily** and slowed the cost-checker for no benefit.

**Alternatives considered:**
- Keep the global override and live with cost: rejected — it was the symptom and removing it costs nothing
- Add per-project override that beats the user-level: rejected — fixes the symptom in this project only; the user-level override would still affect other projects on the same machine
- Set explicit `claude-opus-4-7` (vs the alias `opus`) in agent frontmatter: rejected — alias is more durable across version bumps

**Foundation doc reference:** N/A (tooling decision)
**Reversibility:** Trivial. Re-add `"model": "claude-opus-4-7"` to `~/.claude/settings.json` to restore the all-Opus behavior.

---

## 2026-04-28 — Task 1.4 seed design gates — architect answers recorded

**Context:** Six design questions were surfaced during Task 1.4a and required architect sign-off before the seed script could be written.

**Decisions:**

*Gate 1 — Frequency for "per refill" parameters:* **Option A — monthly aggregate.** Diesel, LPG, refrigerant, e-waste are aggregated and submitted monthly. No `per_event` enum addition; no migration 002 needed.

*Gate 2 — Boiler fuel:* **Briquettes only.** All boiler fuel parameter variants removed (biomass, wood, diesel, LPG). Single `boiler_briquettes_kg` parameter added. Both Factory-001 and Factory-002 have `boiler_fuel=briquettes`. Conditional predicate is simply `{ has_boiler: true }` with no fuel-type gate.

*Gate 3 — STP quality split:* **Three separate parameters confirmed** (BOD, COD, TSS). Matches the existing catalog split and the single-numeric `submissions.value_normalized` column.

*Gate 4 — Master data parameters:* **Confirmed.** `floor_area_sqft` and `staff_headcount` are inserted into the `parameters` table for catalog completeness but no `parameter_assignments` are created. They are edited via the Wave 2 master-data UI.

*Gate 5 — New conditional flags for stores:* **Confirmed with proposed defaults.** Stores not explicitly documented in the spec receive: `has_mall_shared_dg=mall_based`, `has_rainwater_harvesting=false`, `has_hvac=true`, `has_chiller=false`, `has_ambient_air_monitoring=false`, `uses_tanker_water=false`, `active_haz_categories=['fluorescent_tubes','e_waste']`.

*Gate 6 — DG stack emissions gating:* **Warehouse included.** Revised from factory-only to any facility with `has_dg=true`. Warehouse-001 (dg_count=1) now gets stack emissions monitoring.

**Foundation doc reference:** Appendix A (parameter catalog), vertical-slice-spec.md (facility flags)
**Reversibility:** Medium. Changing boiler fuel back to multi-fuel requires adding parameters and updating facilities.ts. Other gates are low-friction to revisit.

---

## 2026-04-28 — bcryptjs over bcrypt for demo tooling

**Context:** Task 1.4 seed script needs PIN hashing. CLAUDE.md specifies bcrypt. The `bcrypt` npm package requires native compilation (node-gyp) which is unreliable on Windows without build tools.

**Decision:** Use `bcryptjs` in the seed script (`supabase/seed/`) and plan to use it in the auth layer (Task 1.6). `bcryptjs` is the pure-JS port of bcrypt — identical algorithm, identical hash format, interoperable hashes, no native compilation.

**Why:** The hash output of `bcryptjs` and `bcrypt` is identical and interchangeable. Using `bcryptjs` everywhere avoids the native compilation fragility on Windows with zero security or performance downside at demo scale.

**Foundation doc reference:** Section 14.2 (PIN auth), decisions.md "PIN hashing: bcrypt only" entry (that entry's "bcrypt is mature" claim extends to bcryptjs, which is the same algorithm).
**Reversibility:** Trivial. Swap `bcryptjs` for `bcrypt` in package.json; existing hashes continue to work.
