# Current Phase — Phase 1 Reconciliation → Phase 2 Core Experiences

This is the live working playbook. Update it as tasks complete. The phase structure follows Section 48 of the canonical design doc.

## Goal of the current work

The 2026-05-06 rescope (see `docs/decisions.md`) collapsed the prior wave-1 / wave-2 / wave-3 plan into the four-phase build that the new design doc specifies. Most of Phase 1 was already shipped under wave-1 vocabulary; the remaining work is reconciliation — re-shaping that foundation to the new 15-facility / no-retail / single-Bill-Inbox / four-rhythm spec.

When this playbook's reconciliation tasks are all checked, the codebase is at the boundary between Phase 1 and Phase 2.

## How phases relate to what's already in the repo

| Phase | Status | Notes |
|---|---|---|
| **Phase 1 — Foundation** | ~80% shipped under wave-1; reconciliation pending | What survives: scaffold, Azure App Service deploy, CI/CD, contributor home, daily logger, basic HO list. What needs redo: facilities seed (15 not 10), parameter catalog (no retail), auth screens (facility-picker not SAP-code), conditional flags (jsonb already aligned), schema migration for nullable HO `personnel.facility_id`. |
| **Phase 2 — Core experiences** | Not started | Routes for HO master / alerts / explorer / inbox / facilities are scaffolded under wave-1, but the internals are wave-shaped. Bill Inbox needs the single confidence-sorted model (not four queues). Events surface needs full event-picker per UI sketch p13. |
| **Phase 3 — AI integration** | Not started | `web/lib/ai/` exists as a stub. OCR + NL query + NL master + NL audit are all Phase 3 work. |
| **Phase 4 — Polish** | Not started | Scale testing, PWA install on iOS/Android, push reliability, accessibility audit, security review, demo prep. |

## Phase 1 — Reconciliation task list (in order)

These tasks must complete before Phase 2 starts. Each follows the standard plan → approve → execute → handoff loop.

### Cleanup tasks (in progress under the 2026-05-06 rescope work)

- [x] **R-0** — Archive `docs/foundation.docx`, `docs/vertical-slice-spec.md`, `docs/playbooks/current-wave.md` to `docs/_archive/`. Place new `design-doc.docx` and `ui-sketch.pdf` at `docs/`.
- [x] **R-1** — Append rescope ADR + 12-inconsistency resolution ADR to `docs/decisions.md`.
- [x] **R-2** — Rewrite `CLAUDE.md` and `README.md` with phase-language and 15-facility scope.
- [x] **R-3** — Write this `current-phase.md`, replacing `current-wave.md`.
- [x] **R-4** — Add two new subagent files (`schema-architect`, `wireframe-fidelity`) to `.claude/agents/`.
- [x] **R-5** — Rebuild `supabase/seed/data/facilities.ts` for 15 facilities (11 factories + 4 warehouses).
- [x] **R-6** — Audit `supabase/seed/data/parameters.ts` and remove retail-only flags + predicates.
- [x] **R-7** — Migration **004** (renumbered from 003 due to collision): alter `personnel.facility_id` nullable; HO users get `facility_id IS NULL`.
- [x] **R-8** — Audit `web/app/contributor/*` and `web/app/ho/*` for retail-shape UX. Clean.
- [x] **R-9** — Removed `web/app/ho/logs/` (daily logs are trust signals, not HO-reviewed). Sidebar now shows Bill Inbox in that slot per design doc §28.1.
- [x] **R-10** — Auth rebuilt: three-step facility picker → PIN pad → name picker; HO email login at `/login/ho`. `personnel_id` is the canonical session "logged in" check.
- [x] **R-11** — Verification grep pass green; remaining matches only in `_archive/`, `decisions.md`, `current-phase.md` transitional language, and migrations 001 / 003 (already-applied schema, comments only).
- [ ] **R-12** — Architect's run: apply migration 004 + reseed. Confirms 15 facilities × ~46 parameters × 1 HO super-user.
- [ ] **R-13** — Architect's run: end-to-end smoke (login as Asha M. at Factory-Bengaluru, complete a daily log, log out, log in as HO super-user via `/login/ho`, see the entries reflected).

### Reconciliation phase done = R-5 through R-13 all checked. R-12/R-13 are architect-driven manual steps.

When the boxes turn green, copy this file to `docs/_archive/phase-1-reconciliation.md`, then replace it with the Phase 2 playbook.

## Phase 2 — Core experiences

- [ ] **2.1** — Service-worker + push spike. **Deferred** (per architect resolution L: in-app banners are the always-available fallback; iOS PWA push needs real-device testing that's blocked here). Revisit when devices are available.
- [x] **2.2** — Event Logger: 10-event picker (UI sketch p13) + per-event form with photo-first capture, sub-category picker for waste pickup, `logEventAction` server action that creates a Bill row in the HO inbox at amber confidence.
- [x] **2.3** — Bill Upload: drag-and-drop or photo, multi-file, confidence-tagged cards. Manual review at HO end (no OCR yet). Done 2026-05-06: `/contributor/bills/` rebuilt as the tabbed status list (UI sketch p17, MyBillsTabs client component); `/contributor/bills/new` is the upload form (UI sketch p15, kind picker + drop zone with multi-file `<input type="file">` + vendor/period inputs); `/contributor/bills/[billId]` is the re-upload prompt for sent-back bills (UI sketch p18, ReuploadForm with HO-comment surface). Server actions `uploadBillAction` + `reuploadBillAction` write through the bill-state-store overlay; new uploads land in `/ho/inbox` immediately at NO_OCR_CONFIDENCE=0.65 (amber) until Phase 3 wires Document Intelligence. Filename is captured for audit; the file body itself is discarded in Phase 2.
- [x] **2.4** — Monthly Summary: card-based form (UI sketch p19) with `submitMonthlySummaryAction`. Day-1 push trigger pending the service-worker spike (2.1).
- [x] **2.5** — Universal filter bar on Dashboards (8 filter pills per design doc §29.1) — `FilterBar` client component. State currently UI-only; Phase 3 wires the filters to the live data layer.
- [x] **2.6** — 8 metric cards (UI sketch p26 grid) + emissions trend chart + energy-mix donut + 15-tile compliance status grid color-coded by open-alert count.
- [x] **2.7** — Single confidence-sorted Bill Inbox with bulk-approve modal. Done 2026-05-06: 10 synthetic bills seeded across mixed confidence levels + one breach; `web/app/ho/inbox/actions.ts` with approve/send-back/bulk-approve server actions backed by a module-level overlay store (`web/lib/v1/bill-state-store.ts`); `BulkApproveModal` client component matching UI sketch p27/p29; detail page `BillActions` panel with Send-back-with-comment flow per UI sketch p28; sidebar "Log Review" replaced with "Bill Inbox" per design doc §28.1. Phase 3 swaps the overlay store for a real `bills_inbox` table + Document Intelligence-derived confidence.
- [x] **2.8** — Three-tab Alerts surface (Compliance / Thresholds / Data gaps) per UI sketch p30/31/32. `AlertsTabs` client component, 10 synthetic alerts spread across tabs, severity chips, source-link routing.
- [x] **2.9** — Facility drill-down per UI sketch p35. (Existing Phase-1 page kept; reasonable layout — identity card, KPIs, recent activity. Phase 3 will deepen the metric breakdown.)
- [x] **2.10** — Data Explorer with NL query + chips per UI sketch p34/p36/p37. Built with the AI gateway (`web/lib/ai/gateway.ts` + `structured-filter.ts`); deterministic mocks when Azure isn't configured.
- [x] **2.11** — Alert rule list view in Master Data (read-only). Full rule-editor slide-over per UI sketch p41 deferred to a Phase 3 polish pass; the NL master-update panel handles rule edits via natural language for now.
- [x] **2.12** — Compliance breach detector — `complianceBreachDetector()` in `web/lib/rules/index.ts`. Pure function over bill extracted fields vs. CPCB/IS-10500 limits. Exposed via `POST /api/rules/run`.
- [x] **2.13** — Threshold rule evaluator — `thresholdRuleEvaluator()` over HO-defined rules. Same module + endpoint.
- [x] **2.14** — Data-gap detector — `dataGapDetector()` over recent submission counts. Same module + endpoint. Real cron-scheduling pending Phase 4 (Vercel Crons / Azure Functions).
- [x] **2.15** — Late-entry HO override surface. Done 2026-05-06: `/ho/master/late-entry` page with mandatory reason field (≥8 chars), date constraint to ≥3 days old (rule fires for >2-day-old entries that the contributor PWA's daily logger can't backdate), facility/contributor/parameter pickers narrowed by selection. `submitLateEntryAction` writes a `ho_late_entry_submitted` audit row with `actor_type=ho_override` in metadata. Linked from Master Data top-actions row.
- **2.16** — Audit-log archival job (free-tier discipline). Nightly job that compresses `audit_log` rows older than 90 days into JSONL bundles, writes them to a Supabase Storage `audit-archive/` prefix, then deletes the originals from the live table. Rolling-90-day live retention. Resolution to inconsistency K (free tier mandated, no Pro upgrade). NL audit search in Phase 3 must transparently union live + archived.

## Phase 3 — AI integration

- [x] **3.1** — OCR pipeline. `web/lib/ai/ocr.ts` wraps Azure Document Intelligence with a deterministic mock fallback. Wired into `uploadBillAction` so freshly uploaded bills get realistic extracted fields + confidence. Real Azure call activates when `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` + `_KEY` are set.
- [x] **3.2** — Bill Inbox bulk-approve flow. Done in Phase 2 (task 2.7) — `BulkApproveModal` excludes breaches per design doc §30.2.
- [x] **3.3** — NL query in Data Explorer. Structured-filter pattern with `validateStructuredFilter` rejecting unknown keys. Three failure modes (out-of-scope, why-causal, partial-parse) all handled per design doc §38.4 + UI sketch p37.
- [x] **3.4** — NL master updates. `NLMasterPanel` slide-over with structured diff preview, side-effects panel, explicit Approve/Discard. Single-row diff (DG add) + bulk diff (regulatory limit across 11 factories) both implemented per UI sketch p44/p45.
- [x] **3.5** — NL audit search via the global header bar. `AuditSearchBar` client component in HOShell + `POST /api/audit-search` route + `nlAuditSearch` in the gateway. Slide-over panel with narrative + timeline + clickable action links per UI sketch p38.
- [x] **3.6** — AI cost telemetry. `web/lib/ai/cost-telemetry.ts` records every NL/OCR call with input/output tokens and ₹ estimate. Dashboard surface added at `/ho/master/ai-spend` showing month-to-date total against the design-doc §6.1 envelope (₹15K-40K/year), per-feature breakdown, and the recent-call table. Linked from Master Data top-actions row.

## Phase 4 — Polish

- [ ] **4.1** — Scale-test at 18-month synthetic-data volume. Architect-driven; needs the seed run + a deployed URL.
- [ ] **4.2** — PWA install on iOS / Android. Needs real devices.
- [ ] **4.3** — Push notification testing. Needs real devices (paired with 2.1 spike).
- [x] **4.4** — AI graceful degradation. Done 2026-05-06: every Azure call in `web/lib/ai/gateway.ts` + `ocr.ts` wrapped in try/catch, returns a typed degraded result. NL query degrades to filter chips with a "service unavailable" panel + suggestions; NL master falls back to a mock diff with a warning prepended to side-effects; NL audit returns a clean error; OCR failure leaves the bill at NO_OCR_CONFIDENCE so the contributor isn't blocked.
- [x] **4.5** — Accessibility audit (WCAG 2.1 AA basics). Done 2026-05-06: `docs/a11y-review.md` with findings split into "fixed in this pass" (skip-to-content link, `<h1>` semantics on contributor home, ARIA label + 44px size on the bell button, `aria-live`/`role="alert"` on login PIN error + bill approve/send-back error + NL query result region) and "pending" (touch-target sweep across remaining icon buttons, contrast verification via Lighthouse on a deployed URL, `aria-describedby` form-error association, `prefers-reduced-motion`, page title on `/contributor/daily/[paramCode]`). Pending items are bounded follow-up tickets in the doc.
- [x] **4.6** — Security review of auth, session, audit paths. Done 2026-05-06: `docs/security-review.md` with 9 findings (1 critical, 2 medium, 2 low, 4 info). Critical (hardcoded SESSION_SECRET fallback) and the two medium findings (missing audit row on PIN failure; personnel-mismatch error leak) fixed. The two low findings (no HO password lockout; no API rate limiting) tracked as Phase-4 follow-ups in the review doc.
- [x] **4.7** — Documentation for HO admins. Done 2026-05-06: `docs/playbooks/ho-admin-guide.md` covering daily / weekly / monthly routines, NL query patterns, master-data update patterns, late-entry override, AI spend monitoring, edge cases, troubleshooting. Linked from CLAUDE.md (next).
- [ ] **4.8** — Demo prep: architect walks the demo three times, documents any flake. Architect-driven.

## Notes from the architect

2026-05-06 — Rescope session: replaced the foundation document with the new design doc; replaced waves with phases; collapsed retail-stores out of scope; collapsed the four-queue review model to a single confidence-sorted Bill Inbox. See `docs/decisions.md` for the full ADR with 12 inconsistency resolutions.
