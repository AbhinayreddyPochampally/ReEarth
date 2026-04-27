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
