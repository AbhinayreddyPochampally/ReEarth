# ReEarth 2.0

Sustainability data platform for ABFRL — built and validated against synthetic data, then onboarded to **15 facilities (11 garment factories + 4 distribution warehouses)**. Single codebase, Azure-hosted, AI-assisted at the HO tier.

This repo is the working build. It is single-tenant and single-developer-shape. The architect directs; the agent (Claude Code) writes.

## What's in this repo

- `CLAUDE.md` — project memory (Claude Code reads this every session)
- `docs/design-doc.docx` — canonical design document (April 2026, Version 1.0)
- `docs/ui-sketch.pdf` — canonical lo-fi wireframes (03 May 2026, 46 pages)
- `docs/decisions.md` — architectural decisions log (additions and deviations)
- `docs/playbooks/current-phase.md` — live working playbook for the active phase
- `docs/playbooks/how-to-direct-claude.md` — architect's operating manual
- `docs/playbooks/day-1-setup.md` — first-day install / account setup
- `docs/_archive/` — superseded design materials, kept for trail
- `.claude/skills/` — Claude Code skills (auto-loaded by topic)
- `.claude/agents/` — Claude Code subagents (planner, reviewer, cost-checker, schema-architect, wireframe-fidelity)
- `.claude/commands/` — slash commands (`/orient`, `/end-session`, `/cost`)
- `.claude/settings.json` — hooks for cost discipline and SQL safety
- `web/` — Next.js 16 application (App Router, TypeScript strict, Tailwind 4)
- `supabase/` — database migrations and seed data

## Tech stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind 4
- **Database:** Supabase Postgres (free tier in Phase 1, Pro from Phase 2)
- **Auth:** iron-session + bcryptjs (HO email+password; contributor facility-PIN)
- **Storage:** Supabase Storage
- **AI:** Azure OpenAI (GPT-4o-mini) for NL features + Azure Document Intelligence for OCR
- **Hosting:** Azure App Service (B1 dev → B2 production), South India region
- **CI/CD:** GitHub Actions

Why each choice was made: see `docs/decisions.md`.

## Working in this project

1. **Architect** = the human (you)
2. **Developer** = Claude Code (or whichever agent is sitting in the chair)

The architect doesn't write code. The architect reads plans, pushes back, approves, reviews handoffs. The agent does the typing.

### Daily workflow

Open the project in VS Code, start Claude Code, and run:

```
/orient
```

Claude reads context and proposes the next task plan. Review it, approve or redirect, then let it execute.

End sessions with:

```
/end-session
```

Check Azure spend with:

```
/cost
```

### When to use what

| Situation | What to do |
|---|---|
| Starting a session | `/orient` |
| Non-trivial task ahead | "Use the planner subagent to plan this" |
| Schema or migration touched | "Use the schema-architect subagent to verify" |
| UI route built or changed | "Use the wireframe-fidelity subagent to review" |
| Just finished a change | "Use the reviewer subagent to review the diff" |
| About to use Azure CLI | `/cost` first |
| Stuck or lost | Re-read `docs/playbooks/how-to-direct-claude.md` |
| Disagree with Claude | "Why are you doing it that way?" |
| Wrong direction | "Stop. That's not what I want." |

## Build phases

Per design doc Section 48:

| Phase | Focus | Target |
|---|---|---|
| **Phase 1 — Foundation** | Scaffold, auth, master data CRUD, synthetic seed, contributor home + daily logger, basic HO list, CI/CD | ~3 weeks |
| **Phase 2 — Core experiences** | Events, bill upload (no OCR), monthly summary, push, dashboards, Bill Inbox, Alerts, Facility drill-down, Data Explorer (chips), alert rules, breach detection, data-gap detection | ~4 weeks |
| **Phase 3 — AI integration** | OCR, Bill Inbox bulk approve, NL query, NL master updates, NL audit search, AI cost telemetry | ~2 weeks |
| **Phase 4 — Polish** | Scale testing, PWA install testing, push reliability, accessibility, security review, demo prep | ~2 weeks |

## Setup (one time)

See `docs/playbooks/day-1-setup.md`.

## Status

- Phase: **Phase 1 reconciliation** (post-rescope cleanup; pre-Phase-2)
- Last meaningful update: see `git log`
