# Demo Build Specification

This document defines what we're building. It supersedes the broader plans in the foundation document for the duration of the demo build.

## Demo goal

A deployed Azure URL where, in 30 minutes, the architect can walk a manager through:

1. Logging in as a contributor at a fake retail store, submitting an electricity bill via natural language
2. Logging in as an HO reviewer, querying the data via natural language, approving submissions
3. Updating master data via natural language with diff-and-approve
4. Demonstrating the OCR loop: contributor uploads a bill image, AI extracts the value, contributor confirms

No real users, no real ABFRL data, no production hardening. **It just needs to work in front of one manager for 30 minutes.**

## Demo footprint (10 facilities, all seeded)

### Factories (2)
- **Factory-001** — Bengaluru, Karnataka. Large tailoring unit. Conditional flags: `has_dg=true`, `dg_count=4`, `has_boiler=true`, `boiler_fuel=biomass`, `has_solar=true`, `has_stp=true`, `has_groundwater=true`, `has_canteen=true`, `mall_based=false`. Active hazardous categories: used oil, batteries, ETP sludge, contaminated cotton, fluorescent tubes, paint solvent.
- **Factory-002** — Tirupur, Tamil Nadu. Medium unit. Flags: `has_dg=true`, `dg_count=2`, `has_boiler=true`, `boiler_fuel=lpg`, `has_solar=false`, `has_stp=false`, `has_groundwater=false`, `has_canteen=true`, `mall_based=false`. Active hazardous categories: used oil, batteries, fluorescent tubes, e-waste.

### Warehouse (1)
- **Warehouse-001** — Bhiwandi, Maharashtra. Distribution hub. Flags: `has_dg=true`, `dg_count=1`, `has_solar=true`, `has_canteen=false`, `mall_based=false`, `has_internal_fleet=true`.

### Retail stores (7)
- **Store-001** — Pantaloons flagship, Phoenix MarketCity Bengaluru. 50,000 sq ft. `mall_based=true`.
- **Store-002** — Allen Solly, Forum Mall Chennai. 3,200 sq ft. `mall_based=true`.
- **Store-003** — Van Heusen, Park Street Kolkata. 4,500 sq ft. `mall_based=false` (high-street).
- **Store-004** — Louis Philippe, DLF Mall Noida. 2,800 sq ft. `mall_based=true`.
- **Store-005** — Peter England, MG Road Bengaluru. 1,800 sq ft. `mall_based=false` (high-street).
- **Store-006** — Pantaloons small format, Bandra Linking Road Mumbai. 2,200 sq ft. `mall_based=false`.
- **Store-007** — Allen Solly outlet, Ambience Mall Gurugram. 1,500 sq ft. `mall_based=true`.

This footprint covers every conditional flag, every facility size category, every brand category, three states, and the mall-based vs high-street distinction.

## Three waves

Each wave is shippable. If time runs out at a wave boundary, the demo still works.

### Wave 1 — Skeleton (target: 3 working days)

**In scope:**
- Next.js project scaffolded with TypeScript and Tailwind
- Supabase project created, environment variables wired
- Database schema for: `facilities`, `personnel`, `parameters`, `parameter_assignments`, `submissions`, `evidence`, `audit_log`, `discussions`
- Login screen: SAP code (8 digits) + facility PIN (4 digits) + name dropdown
- Routing: login → `/contributor` if contributor, `/ho` if HO user
- One contributor screen: pending list (Home), with at least one tappable item
- One contributor form: numerical input + photo upload + submit (traditional, no NL yet)
- One HO screen: review queue showing all pending submissions with Approve / Send Back buttons
- Audit log entry created on every submission state change
- Deployed to Azure App Service B1 with a real URL
- 2 facilities seeded (one factory, one store), 3 parameters per facility, 5 fake submissions

**Out of scope for Wave 1:**
- AI features
- Multiple review queues
- Discussion threads
- Master data UI
- Inspection module
- All 10 facilities (only 2 seeded for now)

**Wave 1 done = the architect can hit the deployed URL on a phone, log in, submit one form, log in on a laptop as HO, approve it, see audit trail.**

### Wave 2 — Breadth (target: 4 working days)

**Add to Wave 1:**
- All 10 facilities seeded with the conditional flags above
- All parameters from Appendix A of foundation doc, gated by conditional flags
- 3 months of historical synthetic submissions (so NL queries in Wave 3 have data)
- Hazardous waste two-event model implemented (generation + disposal events, FIFO running balance)
- Four review queues: Express, Standard, Deep, Compliance Breach (per Sections 33–36). Routing logic per Section 34 evidence quality scoring.
- Discussion threads on submissions
- Send Back creates a discussion thread automatically
- Resubmit flow when a sent-back submission is re-entered
- Factory month-close ceremony per Section 19.4 (day 8 of M+1, factory backdate rule)
- Compliance breach detection per Section 41 (regulatory limit comparison, separate queue)

**Out of scope for Wave 2:**
- AI features (saved for Wave 3)
- Inspection module
- Master data UI for HO (data is hardcoded in seed; HO cannot edit)

**Wave 2 done = the demo walkthrough works without AI features. The "no AI" version is already a credible product. Wave 3 adds the wow.**

### Wave 3 — Natural Language I/O (target: 3 working days)

**Add to Wave 2:**
- Azure OpenAI service provisioned, API keys secured
- Azure Document Intelligence service provisioned
- **NL input on contributor form**: "Type or speak" toggle. Contributor types `"April electricity bill 12,400 units"` → AI extracts structured fields → confirmation card → submit. Handles ambiguity: if value is missing, AI asks back conversationally instead of guessing.
- **OCR on bill upload**: when contributor uploads a utility bill photo, Document Intelligence extracts the value. If value matches what the contributor typed, both confirm. If not, soft warning shows both values and asks which is correct.
- **NL query on HO data explorer**: big text box at top. HO types `"Show me electricity submissions from Bengaluru stores last month"` → AI converts to structured filter object → filter chips render → results display. HO can edit chips manually.
- **NL master updates**: HO types `"Add a 5th DG to Mysuru factory, 250 kVA, diesel"` → AI generates a diff → HO reviews → approves → master data updates. Audit trail entry created.
- **Bonus: NL audit search**: HO types `"Why was the March electricity for Pantaloons-Bengaluru sent back?"` → AI queries audit_log + discussions → returns natural language summary.

**Out of scope for Wave 3:**
- Inspection module (Wave 4)
- Investigation Assistant sidebar (foundation Section 63 — needs trailing-12-month statistical context; defer until inspection wave or later)
- Voice input (text only per architect's call)

**Wave 3 done = the full demo lands. Walk through all four NL flows with the manager.**

### Wave 4 — Inspection (later, optional)

Real-time inspection logging + aftermath upload + AI-drafted visit summary per Section 45–51. Adds 4–5 working days. Skip until Wave 3 is solid.

## Definition of "demo-ready"

A complete pre-meeting checklist:

- [ ] Deployed URL loads from a fresh device
- [ ] Login as contributor at Factory-001, submit boiler biomass entry via NL, upload bill photo, OCR confirms
- [ ] Login as HO, see the submission in the right queue, approve it
- [ ] Run NL query: `"Show me biomass submissions for Factory-001 last 3 months"` — results render correctly
- [ ] Run NL master update: `"Add a 3rd DG to Factory-002"` — diff shows correctly, approval works
- [ ] Compliance breach demo: trigger a fake breach by submitting a value above the regulatory limit, see it land in Compliance queue with notification chip
- [ ] Discussion thread demo: HO sends a submission back with comment, contributor sees the thread, resubmits
- [ ] No console errors visible when DevTools is open
- [ ] Loading states work — no blank screens during async calls
- [ ] Refresh-resilience: reload mid-form, draft is preserved (Wave 2 nice-to-have)

## Hard constraints

1. **No real ABFRL data, ever.** Synthetic only. Seed file is canonical.
2. **No real personnel names.** Use generic names like `Asha K.`, `Ravi M.`
3. **AI calls cost real money.** Cap per-request token limits aggressively. NL extraction should max out at ~500 output tokens.
4. **Demo URL is single-tenant.** No multi-user concurrency testing required.
5. **Strict TypeScript.** Catches drift early when Claude is generating.
