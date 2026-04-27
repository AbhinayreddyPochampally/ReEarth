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
