# Current Wave — Wave 1: Skeleton

This is the live working playbook. Update it as tasks complete.

## Goal of this wave

Get a deployed Azure URL where the architect can log in as a contributor at one fake store, submit one form, then log in as HO on a laptop and approve it.

If everything else fails, this URL is the demo.

## Task list (in order — don't skip ahead)

### Setup phase

- [x] **Task 1.0** — Initialize Next.js project in `web/`
  - Create with `npx create-next-app@latest web --typescript --tailwind --app --eslint --src-dir=false --import-alias="@/*" --use-npm`
  - Verify `npm run dev` starts a server on localhost:3000
  - Commit as "wave 1.0: scaffold Next.js project"

- [x] **Task 1.1** — Set up Supabase project
  - Architect creates the Supabase project at supabase.com (free tier)
  - Architect provides URL + anon key + service role key, written into `.env.local`
  - Verify connection by running `web/scripts/test-supabase-connection.ts`

- [x] **Task 1.2** — Set up Azure App Service
  - Architect runs `az login` then provides Resource Group name
  - Create App Service B1 tier, link to GitHub Actions deployment
  - Verify a hello-world Next.js deploys and serves on the Azure URL

### Database phase

- [x] **Task 1.3** — Create database migration: core schema
  - Migration `001_core_schema.sql` in `supabase/migrations/`
  - Tables: `facilities`, `personnel`, `parameters`, `parameter_assignments`, `submissions`, `evidence`, `audit_log`, `discussions`
  - Schema follows foundation Section 8 + Appendix B
  - Apply migration to Supabase, verify tables exist

- [x] **Task 1.4** — Seed full Wave 1 data (all 10 facilities)

  Completed 2026-04-28. Verified output:
  Facilities 10, Parameters 43, Personnel 23, Assignments 173,
  Regulatory limits 4, Submissions 496, Hazardous events 78, Breaches 1.

  Key decisions recorded in `docs/decisions.md` (2026-04-28 entries):
  boiler fuel = briquettes only, DG stack emissions includes warehouse,
  monthly aggregate for per-event params, STP split into 3 rows,
  master-data params catalog-only, store flag defaults approved.

  Migration 002 applied: `audit_log.actor_id` changed to ON DELETE SET NULL
  so re-seeds never block on prior audit trail entries.

  Login credentials in `supabase/seed/output/pins.csv` (git-ignored).
  HO user: FAC00001 / PIN 7421 / name "Anita HO".

### Auth phase

- [x] **Task 1.5** — Build login screen UI
  - Two-step form: SAP code → Continue → personnel list fetched from /api/personnel
  - PIN entry + name dropdown in step 2
  - Loading states, error states; mobile-responsive
  - Completed 2026-04-28

- [x] **Task 1.6** — Build auth backend
  - iron-session (v8) for HttpOnly encrypted cookie sessions
  - bcryptjs PIN verify against facilities.pin_hash
  - Lockout after 5 fails for 15 min (Section 14.2) via facilities.pin_failed_attempts
  - Logout destroys session + writes audit event
  - Completed 2026-04-28

- [x] **Task 1.7** — Routing post-login
  - proxy.ts (Next.js 16 renamed from middleware.ts) — cookie-existence guard
  - Layout components (contributor/layout.tsx, ho/layout.tsx) do full session + role validation
  - / → /login; HO → /ho; contributor → /contributor
  - Completed 2026-04-28

### Contributor phase

- [x] **Task 1.8** — Build contributor Home screen
  - Parameters grouped by status: Due / Pending review / Approved
  - Sorted by urgency then category then name
  - Row shows name, unit, frequency badge, status chip; tappable for Due/Sent-back
  - Completed 2026-04-28

- [x] **Task 1.9** — Build contributor form screen
  - Numerical input with unit, optional photo upload (camera + gallery)
  - Period defaults to current calendar month (no date picker in Wave 1 — Wave 2)
  - Server action creates submission + optional evidence + audit_log entry
  - Redirects to /contributor on success
  - Note: Supabase Storage bucket 'evidence' must be created manually for photo upload to work
  - Completed 2026-04-28

### HO phase

- [ ] **Task 1.10** — Build HO review queue
  - Single list, all pending submissions, sorted by submitted_at DESC
  - Each row: facility name, parameter, value+unit, evidence thumbnail, contributor name, submitted_at
  - Click thumbnail to view full image
  - Two buttons: Approve, Send Back (with comment input)
  - On Approve: status → approved, audit log entry, contributor's history updates
  - On Send Back: status → sent_back, comment stored as discussion entry, audit log entry

### Deployment phase

- [x] **Task 1.11** — GitHub Actions workflow for Azure App Service
  - Build Next.js, deploy to Azure on push to `main`
  - Smoke test: hit the deployed URL after deploy, expect 200
  - Use Azure publish profile (architect provides)

- [ ] **Task 1.12** — End-to-end demo walk-through
  - Run the demo flow on the deployed URL
  - Document any issues in `docs/playbooks/wave1-issues.md`
  - Architect signs off

## Wave 1 done = checkboxes above all green.

When done, copy this file to `docs/playbooks/wave1-complete.md`, then replace it with the Wave 2 playbook.

## Notes from the architect

2026-04-27 — Session 1: Project scaffolded, CLAUDE.md written, safety hooks added to settings.json, decisions.md populated with four initial architecture decisions. No Wave 1 tasks started yet.
