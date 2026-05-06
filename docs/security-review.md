# Security Review — 2026-05-06

Static review of auth, session, audit, and AI-gateway code paths. Phase 4 task 4.6
deliverable. The fixes called out below have been applied; the verification path
remains for the architect to confirm during deploy.

## Scope

- `web/lib/auth/*` — session, login actions
- `web/lib/db/audit.ts` — append-only invariant
- `web/app/api/*` — public-facing routes
- `web/lib/ai/gateway.ts` — AI service mediation
- `supabase/migrations/*.sql` — schema-level constraints
- `.env.local.example` and the project's secret-handling pattern

Out of scope: dependency audit (`npm audit`), penetration testing, runtime fuzzing —
those are deploy-time tasks for the architect.

## Findings and applied fixes

### CRITICAL · 4.6.1 · Hardcoded session-secret fallback

**Where:** `web/lib/auth/session.ts`, the `SESSION_SECRET` resolution.

**Before:** The code fell back to the literal string `'reearth-demo-dev-secret-32-chars!!'` whenever `SESSION_SECRET` was unset. Anyone with source-tree access could mint forged session cookies and impersonate any HO super-user.

**Fix applied:** Wrapped the resolution in `resolveSessionSecret()`. Production (`NODE_ENV === 'production'`) hard-fails on startup if the env var is missing or shorter than 32 chars. The dev fallback only fires outside production.

**Architect verification:** Confirm `SESSION_SECRET` is set as an Azure App Service application setting before any production deploy. Generate with `openssl rand -base64 48` and rotate annually.

### MEDIUM · 4.6.2 · Missing audit row for failed PIN attempts

**Where:** `web/lib/auth/actions.ts → contributorLoginAction`.

**Before:** Successful logins emitted `pin_login_success`. Failed PIN attempts returned an error to the user but wrote nothing to `audit_log`. An attacker probing PINs across facilities left no forensic trail beyond the `pin_failed_attempts` counter on the facilities row (which only tracks the latest failure burst, not the full history).

**Fix applied:** Every PIN failure now writes a `pin_login_failure` audit row with the facility id, the failure reason (`invalid_pin` vs `locked_until`), and either `attempts_remaining` or `locked_until` in metadata. PIN itself is never recorded.

### MEDIUM · 4.6.3 · Personnel-mismatch error revealed which check failed

**Where:** `web/lib/auth/actions.ts → contributorLoginAction`, the personnel lookup branch.

**Before:** Error string `"That contributor isn't at this facility"` revealed that the personnel id existed in the system but didn't match the facility — a small information leak that lets an attacker enumerate valid personnel ids by trial.

**Fix applied:** Generic error `"Selection didn't match. Try again."` regardless of which check failed (missing record, wrong facility, or wrong role). The audit row `pin_login_personnel_mismatch` records the facility id but stays silent on which check failed (the attacker can't read the audit log; only HO can).

### LOW · 4.6.4 · No HO password lockout

**Where:** `web/lib/auth/actions.ts → hoLoginAction`.

**Observation:** Wrong-PIN flow has 5-attempts / 15-min lockout (`checkFacilityPin`). HO email+password has no equivalent. An attacker who knows or guesses an HO email can run a slow brute-force without being slowed down beyond bcrypt cost. Mitigated somewhat by:

- bcrypt cost 12 (≈250ms per attempt on modern hardware)
- The single super-user pattern (only one valid email to attack)
- HO passwords are 16+ chars from the seed (`ChangeMeNeha!2026`)

**Recommendation:** Phase 4-week-2 ticket. Add a `personnel.failed_login_attempts` + `personnel.locked_until` columns via a new migration, and apply the same 5-attempts / 15-min rule in `hoLoginAction`. Until then, the architect should set rotating passwords ≥20 chars.

### LOW · 4.6.5 · No rate limiting on `/api/audit-search` or `/api/rules/run`

**Where:** Both API routes are HO-gated but unthrottled. A misbehaving HO client could spam audit-search calls.

**Observation:** Internal HO use only and the AI gateway has its own token caps; risk is low. If exposure widens (e.g., HO clients on contractor laptops), add per-session rate limit middleware.

### INFO · 4.6.6 · audit_log append-only is properly enforced

**Where:** `supabase/migrations/001_core_schema.sql:262-276`.

A trigger function `audit_log_block_mutations()` raises an exception on UPDATE/DELETE. As belt-and-braces, `REVOKE UPDATE, DELETE ON audit_log FROM anon, authenticated, service_role` is also applied. This satisfies design doc §46 + the 2026-04-27 ADR.

### INFO · 4.6.7 · Service-role key handling

**Where:** `web/lib/db/supabase.ts` reads `SUPABASE_SERVICE_ROLE_KEY` from `process.env`.

The key is server-side only — Next.js server components and server actions never expose it to the client bundle. Confirmed by grep: no `NEXT_PUBLIC_*SERVICE*` exists. The `.env.local.example` correctly groups it under "Supabase" without a `NEXT_PUBLIC_` prefix.

### INFO · 4.6.8 · `.gitignore` excludes credential CSVs

`supabase/seed/output/pins.csv` and `supabase/seed/output/ho-passwords.csv` are in `.gitignore` (verified). The seed script's documentation says "Never commit." Confirmed there's no `output/*.csv` file currently in the working tree's index.

### INFO · 4.6.9 · Headers and CSP

Next.js 16 defaults provide reasonable security headers. No custom CSP is set. For Phase 4 production deploy, the architect should add a CSP via `next.config.mjs` `async headers()` that:

- `default-src 'self'`
- `connect-src 'self' https://*.supabase.co https://*.openai.azure.com https://*.cognitiveservices.azure.com`
- `img-src 'self' data: https://*.supabase.co`
- `style-src 'self' 'unsafe-inline'` (Tailwind requires inline styles)

This is a deploy-time task, not an immediate code change.

## Follow-ups for the architect

1. Apply migration that adds HO lockout columns (4.6.4) — track as a Phase 4 ticket if HO password attacks become a real concern. For the demo, current bcrypt cost is sufficient.
2. Set `SESSION_SECRET` in Azure App Service application settings before any production deploy (4.6.1).
3. Set up rotating passwords for HO super-users; document in `docs/playbooks/ho-admin-guide.md` (4.7).
4. Add CSP headers in `next.config.mjs` before production deploy (4.6.9).
5. Audit `npm audit` output and snyk-equivalent dependency scan before deploy. Out of scope for this static review.

## Reproduce this audit

```bash
# From repo root
grep -rn "SESSION_SECRET\|reearth-demo-dev-secret" web/
grep -rn "console\." web/lib/auth/    # confirm no PIN/password leaks
grep -rn "logAuditEvent" web/lib/auth/web/app/api/
grep -n "REVOKE\|append-only\|audit_log" supabase/migrations/001_core_schema.sql
```

Each grep should now return only the exact patterns documented above.
