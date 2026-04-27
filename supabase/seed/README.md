# Wave 1 seed

Populates the demo Supabase database with all 10 facilities, 43 parameters, 23 personnel, 3 months of synthetic historical submissions, hazardous-event chains, and one compliance breach.

## Prerequisites

1. Node.js 18+ installed.
2. Create `supabase/seed/.env` (git-ignored) with two values from the Supabase dashboard → Settings → API:
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

The script takes about 30–60 seconds. When it finishes it prints row counts and writes `output/pins.csv`.

## Output

`supabase/seed/output/pins.csv` — plaintext PIN for every facility and personnel. This is your **login cheat sheet** for the demo. Open it before any demo walk-through.

The file is git-ignored and must never be committed.

## Re-running

The script truncates all seed-managed tables in FK-safe order before re-inserting. This is safe on a fresh database.

**If the app has been used** (auth screens built, submissions made, audit trail has entries), the delete of `personnel` will fail due to a FK from `audit_log`. In that case:

1. Open the Supabase SQL Editor.
2. Run: `TRUNCATE audit_log CASCADE;`
3. Re-run the seed.

## What gets seeded

| Table | Count |
|---|---|
| `facilities` | 10 |
| `parameters` | 43 |
| `personnel` | 23 (incl. 1 HO reviewer at Factory-001) |
| `parameter_assignments` | Computed per facility × conditional flags |
| `regulatory_limits` | 4 (boiler PM, STP BOD/COD/TSS) |
| `submissions` | ~3 months × all params × all facilities |
| `hazardous_events` | 2 gen + 1 disposal per factory × haz category |
| `compliance_breaches` | 1 (Factory-001 boiler, March 2026, 145 vs 100 mg/Nm³) |

## HO login

The HO reviewer ("Anita HO") is a `personnel` record inside Factory-001. Login:
- SAP code: `FAC00001`
- PIN: `7421` (see `pins.csv`)
- Name: `Anita HO [ho]`

This routes to `/ho` after login.
