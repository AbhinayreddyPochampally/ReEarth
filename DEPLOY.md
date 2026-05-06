# Deploy Runbook

The agent can't push to GitHub, deploy to Azure, or apply migrations to Supabase
on its own — those steps require credentials I don't have access to. Everything
is committed and ready locally; you run the four steps below in order.

Total time: ~20 minutes if all secrets are already in place, ~45 minutes the
first time.

## 0 · Pre-flight (once)

Confirm the following are set on this machine:

```bash
git --version          # any modern git
node -v                # 20.x or newer
az --version           # any 2.x
gh --version           # optional, for the GitHub UI
```

You'll need three sets of secrets ready to paste:

| Where | Names |
|---|---|
| GitHub | none — `git push` uses your existing credentials |
| Azure App Service application settings | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SESSION_SECRET`, optionally `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_API_KEY` / `AZURE_OPENAI_DEPLOYMENT_NAME` / `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` / `AZURE_DOCUMENT_INTELLIGENCE_KEY` |
| Supabase seed runtime | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `supabase/seed/.env` |

`SESSION_SECRET` must be ≥32 chars. Generate one with:

```bash
openssl rand -base64 48
```

Without `SESSION_SECRET`, the production build boots but the **first request hard-
fails** (per `docs/security-review.md` finding 4.6.1).

## 1 · Push to GitHub

The repo points at `github.com/AbhinayreddyPochampally/ReEarth`. The current branch
has all of Phase 2 + 3 + 4 work uncommitted; the agent has staged and committed
everything in logical chunks (see `git log` for the message history).

```bash
cd C:/Users/VICTUS/Desktop/reearth-demo
git status                 # should be clean — no uncommitted changes
git log --oneline -20      # confirm the commit chain looks right

# Push the current branch. If you've been on `main`, this is straightforward.
# If you've been on a feature branch (e.g. `phase-2-core`), push that and
# open a PR via the GitHub UI rather than fast-forwarding main.
git push origin HEAD
```

If `git push` rejects with credential errors, run `gh auth login` (or set up a
personal access token) and retry.

## 2 · Apply Supabase migrations

Three migrations are already in `supabase/migrations/`:

- `001_core_schema.sql` — applied previously
- `002_audit_log_fk_set_null.sql` — applied previously
- `003_v1_schema_extensions.sql` — applied previously
- `004_personnel_ho_corporate.sql` — **needs apply** (post-rescope)

Apply 004 via the Supabase dashboard SQL Editor (the Phase 1 path used by 001):

1. Open https://supabase.com/dashboard/project/<your-ref>/sql
2. Paste the contents of `supabase/migrations/004_personnel_ho_corporate.sql`
3. Click Run
4. Confirm the schema changes:
   ```sql
   \d personnel
   -- facility_id should be nullable
   -- email, password_hash, is_super_user columns should exist
   -- personnel_role_consistency check constraint should exist
   ```

If a 003 was applied with different content under the wave-1 build (the
`003_v1_schema_extensions.sql`), 004 still applies cleanly — they're independent.

## 3 · Re-seed Supabase

The seed has been rebuilt for the 15-facility post-rescope footprint and now
includes the May-2026 tail so the demo lands in an in-progress state.

```bash
cd supabase/seed
# Copy your service-role key into supabase/seed/.env (git-ignored).
# The file should look like:
#   SUPABASE_URL=https://<project-ref>.supabase.co
#   SUPABASE_SERVICE_ROLE_KEY=<service-role>
# Don't commit this file.
cat > .env <<'EOF'
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
EOF

npm install                 # only needed once
npm run seed:wave1          # ~30-60 seconds
npm run upload:bills        # uploads the 11 sample bill SVGs to Storage
```

The seed prints a summary at the end. Confirm:

- 15 facilities (11 factories + 4 warehouses, no retail)
- ~46 parameters
- ~30 contributor personnel + 1 HO super-user
- ~1,800-2,500 daily / monthly submissions
- 11 sample bills (already in v1 sample-data) + 78 hazardous events + 1 breach

Outputs:

- `supabase/seed/output/pins.csv` — facility-PIN cheat sheet (git-ignored)
- `supabase/seed/output/ho-passwords.csv` — HO password (git-ignored)

If the re-seed fails with an FK-constraint error citing `audit_log`, run this in
the SQL Editor first then retry: `TRUNCATE audit_log CASCADE;`

## 4 · Deploy to Azure App Service

Existing CI/CD is via GitHub Actions on push to `main`. If you've pushed to
`main` in step 1, the workflow already started — wait 3-5 minutes and check the
Actions tab.

If you're on a feature branch and want to manually deploy, two paths:

### 4a · Use the existing Azure publish profile (preferred)

The repo's `.github/workflows/` directory has the deploy workflow. Trigger it
manually from the GitHub Actions tab:

1. Open `https://github.com/AbhinayreddyPochampally/ReEarth/actions`
2. Pick the deploy workflow
3. Click "Run workflow" → choose your branch → Run

### 4b · Manual `az webapp deploy`

If the Actions path is broken or you want to push from your laptop:

```bash
cd web
npm run build               # confirms it compiles + builds
# zip the standalone build
Compress-Archive -Path .next/standalone/* -DestinationPath ../deploy.zip -Force

az login
az webapp deploy --resource-group reearth-demo \
  --name reearth-app --src-path ../deploy.zip --type zip
```

Replace `reearth-demo` / `reearth-app` with your actual resource-group and
app-service names.

### App Service application settings (one-time)

Open Azure Portal → your App Service → Configuration → Application settings.
Set these (all server-only; never prefix with `NEXT_PUBLIC_*` except where noted):

| Name | Value | Required |
|---|---|---|
| `SESSION_SECRET` | `<openssl rand -base64 48>` | yes — the app hard-fails without it |
| `SUPABASE_URL` | `https://<ref>.supabase.co` | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `<service-role>` | yes |
| `NEXT_PUBLIC_SUPABASE_URL` | same as `SUPABASE_URL` | yes (build-time) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<anon-key>` | yes |
| `AZURE_OPENAI_ENDPOINT` | `https://<your>.openai.azure.com/` | optional — falls back to deterministic mocks |
| `AZURE_OPENAI_API_KEY` | `<key>` | optional |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | `gpt-4o-mini` | optional |
| `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` | `https://<your>.cognitiveservices.azure.com/` | optional |
| `AZURE_DOCUMENT_INTELLIGENCE_KEY` | `<key>` | optional |

Without the Azure AI keys the app still runs — NL features and OCR use
deterministic mocks (per Phase 4 task 4.4 graceful degradation).

After saving the settings, App Service restarts automatically (~30 seconds).

## 5 · First-load smoke test

Open the deployed URL on a phone (or DevTools mobile mode):

1. **Login** — pick a facility, e.g. Factory-Bengaluru. Use PIN from
   `supabase/seed/output/pins.csv`. Tap a contributor name. You land on the
   contributor home with the daily-log card showing in-progress state.
2. **HO login** — navigate to `/login/ho`, sign in with the email + password
   from `supabase/seed/output/ho-passwords.csv`.
3. **Bill Inbox** — `/ho/inbox`. 11 bills visible, "Bulk approve · 6 high-conf"
   button. Click; modal confirms; bills move to approved.
4. **Data Explorer** — `/ho/explorer`. Type "Show me water by source for Q1
   2026, all factories". Filter chips populate.
5. **AI spend** — `/ho/master/ai-spend`. After step 4, the recent-call list
   has one entry; spend > ₹0 if real Azure keys are configured.

If any step trips, see `docs/playbooks/ho-admin-guide.md` Edge cases section.

## 6 · Post-deploy follow-ups

From the security review (`docs/security-review.md`):

- Add CSP headers in `web/next.config.mjs` before the demo (4.6.9).
- Plan an HO password lockout migration (4.6.4) if HO password attacks become
  a real concern.
- Rotate `SESSION_SECRET` annually.

From the a11y review (`docs/a11y-review.md`):

- Run Lighthouse against the deployed URL: `npx lighthouse <url> --only-categories=accessibility`
- Action any contrast findings; the codebase is clean of structural a11y
  blockers but the brand palette needs verification once it's resolved.

## What's deferred (not in this deploy)

- 2.1 PWA service-worker + push spike — needs real iOS / Android devices.
- HO password lockout migration — Phase 4 follow-up.
- AI cost-telemetry → audit_log mirroring — Phase 4 follow-up.
- Several smaller a11y polish items (touch-target sweep on remaining icon
  buttons, `aria-describedby` form-error association) — Phase 4 follow-up.

These are all logged as TODO in the relevant docs; nothing is blocking demo
readiness.
