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

- [ ] **Task 1.3** — Create database migration: core schema
  - Migration `001_core_schema.sql` in `supabase/migrations/`
  - Tables: `facilities`, `personnel`, `parameters`, `parameter_assignments`, `submissions`, `evidence`, `audit_log`, `discussions`
  - Schema follows foundation Section 8 + Appendix B
  - Apply migration to Supabase, verify tables exist

- [ ] **Task 1.4** — Seed minimal Wave 1 data
  - Seed: 1 factory + 1 store
  - 3 parameters per facility
  - 1 PIN per facility (hashed)
  - 2 personnel per facility
  - 5 historical submissions (mixed status)
  - Commit seed script in `supabase/seed/wave1.ts`

### Auth phase

- [ ] **Task 1.5** — Build login screen UI
  - Three-field form: SAP code, PIN, name dropdown
  - Name dropdown populates after SAP code is entered (lookup personnel for that facility)
  - Loading states, error states
  - Mobile-responsive

- [ ] **Task 1.6** — Build auth backend
  - SAP code + PIN validates against `facilities` table (hash compare)
  - Successful login creates Supabase Auth session with custom metadata: facility_id, personnel_id, role (contributor or ho)
  - Failed PIN: track attempts, lockout after 5 fails for 15 minutes (per Section 14.2)
  - Logout flow

- [ ] **Task 1.7** — Routing post-login
  - HO users redirect to `/ho`
  - Contributors redirect to `/contributor`
  - Logged-out users hitting protected routes redirect to `/login`

### Contributor phase

- [ ] **Task 1.8** — Build contributor Home screen
  - Shows pending parameters for the facility, sorted by due date
  - Each row: parameter name, due period, frequency badge
  - Tap a row → navigate to form for that parameter

- [ ] **Task 1.9** — Build contributor form screen
  - Numerical input field (with unit shown)
  - Photo upload (camera + gallery)
  - Date selector (defaults to today, allows backdate per rules)
  - Submit button
  - On submit: insert submission, upload photo to storage, link as evidence, create audit log entry
  - Show success toast, return to Home

### HO phase

- [ ] **Task 1.10** — Build HO review queue
  - Single list, all pending submissions, sorted by submitted_at DESC
  - Each row: facility name, parameter, value+unit, evidence thumbnail, contributor name, submitted_at
  - Click thumbnail to view full image
  - Two buttons: Approve, Send Back (with comment input)
  - On Approve: status → approved, audit log entry, contributor's history updates
  - On Send Back: status → sent_back, comment stored as discussion entry, audit log entry

### Deployment phase

- [ ] **Task 1.11** — GitHub Actions workflow for Azure App Service
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
