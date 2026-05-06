# ReEarth 2.0 — Project Memory

This file is read by Claude Code at the start of every session. Read it before doing anything.

## Critical context: the developer is not writing code

The person you are working with is the **architect** of this system. They wrote the design document. They are not writing the code — **you are**. Their role is to:

- Tell you what to build at each phase
- Review your plans before you execute
- Catch design drift and push back
- Decide tradeoffs when you surface them
- Test the running app and report issues

This means several things must be true of how you work:

1. **Always plan first, then execute.** Even for tasks that seem small. The architect cannot review code line-by-line; they need to review your plans.
2. **Explain your reasoning in plain language.** When you propose something, say why. "I'm using a structured filter object here because Section 38 of the design doc forbids raw AI-generated SQL" is good. "I'm using a structured filter" alone is bad.
3. **Surface tradeoffs, don't decide them silently.** If there are two valid approaches, present both with pros/cons and ask. Don't pick the clever one without permission.
4. **Flag uncertainty loudly.** When you're not sure if something is right, say so. The architect will tell you whether to research, ask, or proceed.
5. **Never assume "they'll catch it in code review."** They might not. Build right the first time.
6. **Treat "looks good" as approval to proceed only on the specific thing reviewed.** Don't treat it as a license to refactor adjacent code.

## What this project is

A deployment of **ReEarth 2.0**, a sustainability data platform for ABFRL (Aditya Birla Fashion & Retail). The system is built and validated against synthetic data, then onboards real facilities in waves. Demo and production share the same codebase; they differ only in environment, data, and onboarding state.

Footprint: **15 facilities — 11 garment factories + 4 distribution warehouses.** No retail stores, no offices in scope (Appendix C.1 of the design doc treats those as future flow). Single-tenant deployment.

## The canonical design document

**`docs/design-doc.docx`** is the canonical design (April 2026, Version 1.0, ~50 pages, 8 parts, 4 appendices). It explicitly supersedes the prior foundation document, which is archived at `docs/_archive/foundation-2026-04.docx` for trail only.

**`docs/ui-sketch.pdf`** is the canonical lo-fi wireframe set (03 May 2026, 46 pages, 22 contributor screens + 22 HO screens + cover/contents). When the wireframe and the design doc disagree, the wireframe is the more recent decision unless `docs/decisions.md` records otherwise.

Most-referenced sections of the design doc:
- **§7-11** — scope, three-tier architecture, four entry rhythms (Daily / Event / Monthly Bill / Monthly Summary)
- **§12-18** — parameter inventory by category (water, energy, emissions, hazardous waste, non-hazardous waste, computed metrics, master data)
- **§19-27** — contributor PWA experience (PIN-based login, home screen, daily logger, event logger, bill upload, monthly summary, multi-contributor dynamics, push notifications)
- **§28-35** — HO desktop experience (six-surface sidebar: Dashboards, Bill Inbox, Alerts, Facilities, Data Explorer, Master Data)
- **§36-40** — AI integration (OCR, NL query via structured filter pattern, NL master updates with diff approval, NL audit search)
- **§41-46** — technical architecture (system topology, data flow, tech stack, data model, auth, audit trail)
- **§47-50** — synthetic data approach, build phases, deployment, deferred items
- **Appendix B** — decisions log inside the design doc itself
- **Appendix D** — open questions

## What we're building (the phase plan)

See `docs/playbooks/current-phase.md` for the live working playbook. Build proceeds in four phases per Section 48 of the design doc:

- **Phase 1 — Foundation** (~3 weeks). Scaffold + auth + master data CRUD + synthetic seed + contributor home + daily logger + basic HO list + CI/CD.
- **Phase 2 — Core experiences** (~4 weeks). Events, bill upload (no OCR yet), monthly summary, push registration, dashboards with universal filter bar, single Bill Inbox (manual review), Alerts (Compliance / Thresholds / Data Gaps), Facility drill-down, Data Explorer with filter chips, alert-rule configuration, breach detection, threshold-rule evaluation, nightly data-gap detection.
- **Phase 3 — AI integration** (~2 weeks). OCR pipeline through Azure Document Intelligence with confidence scoring, Bill Inbox bulk-approve, NL query in Data Explorer, NL master updates with diff-and-approve, NL audit search, AI cost telemetry.
- **Phase 4 — Polish** (~2 weeks). Scale testing at 18-month synthetic volume, PWA install on iOS/Android, push notifications on both platforms, AI graceful degradation, accessibility audit, security review, demo prep.

Each phase is shippable. If time runs out at a phase boundary, what exists is demonstrable.

## Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js 16 App Router, TypeScript, Tailwind 4 | Modern, well-supported; codebase is on this version |
| Database | Supabase Postgres (free tier in Phase 1, Pro from Phase 2) | Real Postgres; free covers Phase 1 synthetic load; Pro for production volume |
| Auth | iron-session (HO email+password) + custom PWA flow (contributor PIN) | Supabase Auth doesn't fit the facility-PIN model; custom is well-bounded |
| Storage | Supabase Storage | S3-compatible, integrates with Supabase auth for evidence file access |
| AI — NL extraction & query | Azure OpenAI GPT-4o-mini | Cost-efficient, sufficient for structured extraction |
| AI — OCR on bills | Azure Document Intelligence | Best-in-class for Indian utility bills + lab reports |
| Hosting | Azure App Service (B1 dev → B2 production) | Real Azure deployment |
| CI/CD | GitHub Actions | Free, standard |
| Region | South India (Chennai) | Data residency, proximity to ABFRL operations |

The Supabase deviation from the design doc's Azure-native data plane is documented in `docs/decisions.md` with rationale. Migration to Azure-native (Azure Postgres Flexible Server + Azure Blob Storage) is supported architecturally without app changes.

## Coding conventions you must follow

- **TypeScript strict mode.** No `any` unless commented and justified.
- **Server components by default.** Use `"use client"` only when interactivity demands it.
- **One concern per file.** A file that fetches data shouldn't also render UI.
- **Database access goes through `web/lib/db/`.** Never query Supabase directly from a component.
- **AI calls go through `web/lib/ai/`.** Never call OpenAI/Document Intelligence directly from a component.
- **Comments explain WHY.** The code shows what; comments explain reasoning. No "increment counter by 1" comments.
- **No dead code.** Don't leave commented-out blocks.
- **Tests for non-trivial logic.** Pure functions get unit tests. UI components don't need tests at v1.
- **Sensible names.** `getApprovedSubmissionsForFacilityInPeriod` not `gasfip`.

## The agent council

`.claude/agents/` holds the subagents. Each has a tier-appropriate model frontmatter; do not override globally.

- **planner** (opus) — plans every non-trivial task before execution. Reads the design doc + wireframes + current code state. Owns the "is this in scope and aligned with the design" check.
- **reviewer** (sonnet) — reviews diffs against the design doc and these conventions. Catches drift, missing audit entries, unauthorized component access through `web/lib/db`.
- **cost-checker** (haiku) — Azure spend discipline. Runs before any `az` command.
- **schema-architect** (opus) — owns the data model. Vetoes migrations that break effective-dating, ON DELETE RESTRICT, or audit append-only.
- **wireframe-fidelity** (sonnet) — single job: compare a UI route in `web/app/` against the corresponding page in `docs/ui-sketch.pdf`.

When a task involves master-data schema, invoke schema-architect after planner. When a task lands on a UI route, invoke wireframe-fidelity at review time.

## Workflow rules

1. **Plan first for any task larger than a typo fix.** Write the plan, get explicit approval, then execute.
2. **Read before writing.** Always view the existing file before editing.
3. **Run the dev server after meaningful changes.** Verify the change works before declaring done.
4. **Commit in small, descriptive units.** "Rebuild facilities seed for 15-facility scope" not "stuff."
5. **One feature branch per phase.** `phase-1-foundation`, `phase-2-core`, `phase-3-ai`, `phase-4-polish`.
6. **Stop and ask when uncertain.** Better to pause than to drift.

## Things to never do

- Never modify `docs/design-doc.docx`, `docs/ui-sketch.pdf`, or anything in `docs/_archive/` (locked baselines and historical record).
- Never commit `.env.local`, API keys, or any secrets.
- Never run destructive SQL (DROP, TRUNCATE, DELETE without WHERE) without confirmation. The PreToolUse hook in `.claude/settings.json` blocks these by default.
- Never push to `main` directly — feature branch + merge.
- Never disable strict TypeScript or ESLint to silence errors.
- Never add an npm dependency without justifying why.
- Never call `az` CLI commands without showing the architect first.
- Never let AI generate raw SQL — always go via the structured-filter pattern (design doc §38 + safety wrapper in `web/lib/ai/`).
- Never auto-deploy on push without explicit confirmation in chat.
- Never reintroduce retail stores, offices, mall-based flags, or the four-queue review model — those are explicitly out of scope per the May 2026 rescope.

## The "I'm done" handoff

When you finish a task, hand it off in this format:

```
Done: [one-line summary]

Changed:
- path/to/file1.tsx — [what changed]
- path/to/file2.ts — [what changed]

Tested:
- [what you ran]
- [what passed]

Not tested:
- [what you couldn't test, and why]

Next suggested step:
- [your recommendation]
```

This format is non-negotiable. The architect uses it as the review template.

## Status

- Phase: **Phase 2 + Phase 3 build complete** — all surfaces shipped, including 2.15 (late-entry HO override) and the 3.6 AI-spend dashboard. Awaiting architect click-through, then Phase 4 polish.
- Last meaningful update: see git log
- Active design: `docs/design-doc.docx` + `docs/ui-sketch.pdf`
- Active playbook: `docs/playbooks/current-phase.md`
- Active decisions log: `docs/decisions.md`
- HO admin guide: `docs/playbooks/ho-admin-guide.md`
- Security review: `docs/security-review.md`
- Accessibility review: `docs/a11y-review.md`
- Break-glass runbook: `docs/playbooks/break-glass.md`
- Deferred items: 2.1 PWA push spike (needs real devices), 4.1/4.2/4.3/4.8 (architect-driven).
