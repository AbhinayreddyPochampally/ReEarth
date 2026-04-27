# ReEarth 2.0 — Demo Build

Deployed Azure demo of ReEarth 2.0, a sustainability data platform for ABFRL.

This is a synthetic-data demo. **Not for real users, not for real data.** Built to prove the platform thesis to a manager in a 30-minute walkthrough.

## What's in this repo

- `CLAUDE.md` — project memory (Claude Code reads this every session)
- `docs/foundation.docx` — canonical design document (~150 pages, 14 parts)
- `docs/vertical-slice-spec.md` — three-wave demo build plan
- `docs/decisions.md` — architectural decisions log (deviations from foundation doc)
- `docs/playbooks/current-wave.md` — live working playbook for the active wave
- `docs/playbooks/how-to-direct-claude.md` — architect's operating manual
- `.claude/skills/` — Claude Code skills (auto-loaded by topic)
- `.claude/agents/` — Claude Code subagents (planner, reviewer, cost-checker)
- `.claude/commands/` — slash commands (`/orient`, `/end-session`, `/cost`)
- `.claude/settings.json` — hooks for cost discipline and SQL safety
- `web/` — Next.js application (scaffolded by Claude Code in Wave 1)
- `supabase/` — database migrations and seed data

## Tech stack

- **Frontend:** Next.js 14+, TypeScript, Tailwind CSS
- **Database:** Supabase Postgres (free tier)
- **Auth:** Supabase Auth, customized for SAP+PIN UX
- **Storage:** Supabase Storage (free tier)
- **AI:** Azure OpenAI (GPT-4o-mini) + Azure Document Intelligence
- **Hosting:** Azure App Service B1
- **CI/CD:** GitHub Actions

See `docs/decisions.md` for why each choice was made.

## Working in this project

1. **Architect** = the human (you)
2. **Developer** = Claude Code

The architect doesn't write code. The architect reads plans, pushes back, approves, reviews handoffs. Claude Code does the typing.

### Daily workflow

Open the project in VS Code, start Claude Code, and run:

```
/orient
```

Claude will read context and propose the next task plan. Review it, approve or redirect, then let it execute.

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
| Just finished a change | "Use the reviewer subagent to review the diff" |
| About to use Azure CLI | `/cost` first |
| Stuck or lost | Re-read `docs/playbooks/how-to-direct-claude.md` |
| Disagree with Claude | "Why are you doing it that way?" |
| Wrong direction | "Stop. That's not what I want." |

## Setup (one time)

You only need to do this once on your machine.

### Required software

| Tool | Why | Install |
|---|---|---|
| Node.js v20 LTS | Runs Claude Code and Next.js | nodejs.org |
| Git | Version control | git-scm.com |
| VS Code | Editor | code.visualstudio.com |
| Claude Code CLI | The agent | `npm install -g @anthropic-ai/claude-code` |
| Claude Code VS Code extension | IDE integration | Search in VS Code Extensions |
| Azure CLI | Deployment commands | docs.microsoft.com/cli/azure |

### Required accounts

- **Claude Pro** ($20/month) — needed to run Claude Code at sustainable usage
- **GitHub** (free) — code hosting
- **Supabase** (free) — database hosting
- **Azure for Students** — $100 credit, takes 24h to verify with .edu email

### First-time setup commands

```bash
cd reearth-demo
git init
git add .
git commit -m "Initial scaffold"

# Login to Claude Code (one-time)
claude

# Login to Azure CLI (one-time)
az login

# Open in VS Code
code .
```

## Status

- Phase: **Wave 1 — Skeleton**
- Last meaningful update: see `git log`
