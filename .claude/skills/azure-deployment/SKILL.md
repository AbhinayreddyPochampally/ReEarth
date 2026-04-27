---
name: azure-deployment
description: Use whenever the architect mentions Azure, deployment, App Service, Document Intelligence, Azure OpenAI, GitHub Actions, or anything about getting code running on a real URL. Also triggers on terms like environment variables, secrets, publish profile, resource group, App Service plan, billing, cost. Critical for cost discipline — the architect has $100 of Azure for Students credits and every Azure command costs money.
---

# Azure Deployment for ReEarth Demo

## Critical: cost discipline

The architect has **$100 of Azure for Students credit**. Every Azure operation costs money. Before running any `az` CLI command:

1. **State the cost in chat.** "This will cost approximately $X per month if left running."
2. **State the runtime impact.** "This resource accrues cost continuously. You will need to delete it after the demo."
3. **Get explicit confirmation.** Don't run `az` commands unilaterally.
4. **Track usage daily during build.** Run `az consumption usage list --start-date YYYY-MM-DD --end-date YYYY-MM-DD` and report.

## The demo's Azure resources

Provision exactly these. Anything else is scope creep.

| Resource | SKU | Approx cost/month | Purpose |
|---|---|---|---|
| App Service Plan | B1 (Basic) | $13 | Hosts the Next.js app |
| App Service | (uses plan above) | $0 (included) | The web app itself |
| Azure OpenAI account | S0 (pay-per-use) | $5–15 budget | NL features |
| GPT-4o-mini deployment | (in OpenAI account) | (per token) | NL extraction + query |
| Azure Document Intelligence | F0 (free tier — 500 pages/month) | $0 | OCR on bills |
| Storage (incidental) | Standard LRS, hot tier | <$1 | App logs only |

**Total expected: $20–30/month.** Demo runs ~3 months on the credit.

The database and file storage are NOT in Azure. They're in Supabase (per `docs/decisions.md`).

## Resource group convention

All resources go in one resource group: **`reearth-demo`**. This makes cleanup trivial — delete the resource group and everything goes.

```bash
az group create --name reearth-demo --location centralindia
```

(Central India region for low latency from India.)

## Provisioning order (in this exact order)

1. Resource group
2. App Service Plan (B1)
3. App Service (Linux, Node 20 runtime)
4. Azure OpenAI account (East US 2 — GPT-4o-mini availability)
5. Document Intelligence (Central India, F0 tier)
6. Configure App Service environment variables
7. Configure GitHub Actions deployment
8. Smoke test

## Environment variables required on App Service

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=
AZURE_DOCUMENT_INTELLIGENCE_KEY=
NEXT_PUBLIC_APP_NAME=ReEarth Demo
NEXT_PUBLIC_APP_ENV=production
```

Use App Service Configuration → Application settings to set these. Never put them in code.

## The "I'm done for the day" routine

When pausing the project for more than a day:

1. **Don't delete the App Service** — restarting takes time and the URL changes
2. **Do stop the App Service** to save B1 plan cost: `az webapp stop --name <name> --resource-group reearth-demo`
3. **Restart when resuming**: `az webapp start --name <name> --resource-group reearth-demo`

App Service Plan accrues cost even when web app is stopped, but it's the only way to keep the URL stable. Acceptable for the demo.

## The "demo is over" cleanup

Delete the entire resource group:

```bash
az group delete --name reearth-demo --yes
```

This stops all billing immediately. Supabase data persists separately (free tier doesn't expire).

## What to never do without permission

- Provision additional App Service Plans
- Use any tier higher than B1 for App Service
- Provision Azure SQL (we use Supabase — see decisions.md)
- Provision Azure Blob (we use Supabase Storage)
- Use Standard or Premium tier for any service unless explicitly approved
- Enable diagnostic logs to a Log Analytics workspace (incurs cost)
- Provision Front Door, App Gateway, or any networking layer
- Set up Azure Key Vault (overkill for a demo; use App Service env vars)

## Failure modes to watch for

- **B1 plan billing kicks in immediately** — even before App Service is deployed
- **Azure OpenAI quota requests can take 24–48 hours** — provision early
- **Document Intelligence F0 tier limit is 500 pages/month** — count your test runs
- **Central India region OpenAI not always available** — fall back to East US 2 if needed

## Daily cost check command

Run this every morning during build:

```bash
az consumption usage list \
  --start-date $(date -u -d '7 days ago' +%Y-%m-%d) \
  --end-date $(date -u +%Y-%m-%d) \
  --query "[?contains(instanceName, 'reearth')].{Date:usageStart, Service:meterCategory, Cost:pretaxCost}" \
  -o table
```

If anything looks wrong, stop and report to the architect.
