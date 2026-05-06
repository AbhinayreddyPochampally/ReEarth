# Seed (rescoped 2026-05-06)

> The script file is still named `wave1.ts` for npm-script compatibility, but its contents are the canonical post-rescope seed.

Populates the Supabase database with **15 facilities (11 factories + 4 warehouses, no retail)**, the parameter catalog, ~30 contributor personnel + 1 HO super-user, parameter assignments, regulatory limits, 3 months of synthetic historical submissions, hazardous-event chains, and one compliance breach.

## Prerequisites

1. Migrations 001 + 002 + 003 + 004 applied (004 makes `personnel.facility_id` nullable so HO users can be corporate).
2. Node.js 20+ installed.
3. Create `supabase/seed/.env` (git-ignored) with two values from the Supabase dashboard → Settings → API:
   ```
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```
   **Never commit this file.**

## Running

```bash
cd supabase/seed
npm install
npm run seed:wave1
```

The script takes about 30–60 seconds. When it finishes it prints row counts and writes credential CSVs.

## Outputs (both git-ignored — never commit)

- `supabase/seed/output/pins.csv` — plaintext PIN for every facility (contributor login cheat sheet).
- `supabase/seed/output/ho-passwords.csv` — plaintext password for the HO super-user.

## Re-running

The script truncates all seed-managed tables in FK-safe order before re-inserting. Safe on a fresh database.

**If the app has been used** (submissions made, audit trail has entries), the delete of `personnel` will fail due to a FK from `audit_log`. In that case:

1. Open the Supabase SQL Editor.
2. Run: `TRUNCATE audit_log CASCADE;`
3. Re-run the seed.

See also: `docs/playbooks/break-glass.md §3` for the seed-blocked-by-audit-log runbook.

## What gets seeded (approximate)

| Table | Count |
|---|---|
| `facilities` | 15 (11 factories + 4 warehouses) |
| `parameters` | ~46 |
| `personnel` (contributors) | ~30 |
| `personnel` (HO super-users) | 1 (`facility_id IS NULL`) |
| `parameter_assignments` | Computed per facility × conditional flags |
| `regulatory_limits` | 4 (boiler PM, STP BOD/COD/TSS) |
| `submissions` | 3 months × applicable params × all facilities |
| `hazardous_events` | 2 generation + 1 disposal per factory × applicable haz parameter |
| `compliance_breaches` | 1 (Factory-Bengaluru boiler, March 2026, 145 vs 100 mg/Nm³) |

## Logins

**Contributor:** open `pins.csv`. Each row is `facility_name, sap_code, pin, contributor_roster`. Login flow per UI sketch pages 3–5: facility picker → 4-digit PIN → name picker.

**HO super-user:** open `ho-passwords.csv`. The single row is `name, email, password, is_super_user`. Login at the HO web UI per UI sketch page 25 — email + password, no facility picker.
