# ReEarth 2.0 Demo — Project Memory

This file is read by Claude Code at the start of every session. Read it before doing anything.

## Critical context: the developer is not writing code

The person you are working with is the **architect** of this system. They wrote the foundation document. They are not writing the code — **you are**. Their role is to:

- Tell you what to build at each wave
- Review your plans before you execute
- Catch design drift and push back
- Decide tradeoffs when you surface them
- Test the running app and report issues

This means several things must be true of how you work:

1. **Always plan first, then execute.** Even for tasks that seem small. The architect cannot review code line-by-line; they need to review your plans.
2. **Explain your reasoning in plain language.** When you propose something, say why. "I'm using table inheritance here because Section 28.5 of the foundation doc requires polymorphic event types" is good. "I'm using table inheritance" alone is bad.
3. **Surface tradeoffs, don't decide them silently.** If there are two valid approaches, present both with pros/cons and ask. Don't pick the clever one without permission.
4. **Flag uncertainty loudly.** When you're not sure if something is right, say so. The architect will tell you whether to research, ask, or proceed.
5. **Never assume "they'll catch it in code review."** They might not. Build right the first time.
6. **Treat "looks good" as approval to proceed only on the specific thing reviewed.** Don't treat it as a license to refactor adjacent code.

## What this project is

A **deployed Azure demo** of ReEarth 2.0, a sustainability data platform for ABFRL. The demo proves the platform works in a real cloud environment with synthetic data. It is NOT for real users or real data.

Footprint: **10 seeded facilities** — 2 factories, 1 warehouse, 7 retail stores. Demo is a single-tenant, single-developer environment.

## The canonical design document

**`docs/foundation.docx`** is the canonical design (~150 pages, 14 parts, 5 appendices, every architectural decision reasoned through). When in doubt, that document wins.

Most-referenced sections:
- **Sections 11–15** — auth (SAP code + facility PIN + name selection)
- **Sections 16–23** — contributor experience (four-screen architecture)
- **Sections 24–32** — parameter specifications by facility type
- **Sections 33–39** — HO review queues
- **Section 8** — data model
- **Section 29.4** — hazardous waste two-event model
- **Section 19.4** — factory month-close ceremony
- **Section 60–66** — AI feature specifications

## What we're building (the demo target)

See `docs/vertical-slice-spec.md` for the current build target. We build in three waves:

- **Wave 1 — Skeleton** — basic auth + one form + one review screen, deployed
- **Wave 2 — Breadth** — all facilities, all parameters, full review queues, discussion threads
- **Wave 3 — NL I/O** — Azure OpenAI integration for natural language input/query/master updates + Document Intelligence OCR

Wave 4 (inspection module) is deferred until Wave 3 is solid.

We are NOT building the full foundation document at once. Each wave is shippable on its own. If we run out of time at any wave boundary, the architect can demo what exists.

## Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js 14+ App Router, TypeScript, Tailwind | Modern, well-supported, you generate excellent code in this stack |
| Database | Supabase Postgres (free tier) | Free, real Postgres, scales to demo size easily |
| Auth | Supabase Auth, customized to mirror SAP+PIN UX | Saves auth implementation; users see SAP+PIN, not Supabase |
| Storage | Supabase Storage | Free tier covers demo |
| AI — NL extraction & query | Azure OpenAI GPT-4o-mini | Cheap, fast, good for structured extraction |
| AI — OCR on bills | Azure Document Intelligence | Best-in-class for Indian utility bills |
| Hosting | Azure App Service (B1 tier) | Real Azure deployment story |
| CI/CD | GitHub Actions | Standard, free for public repos |

The Supabase deviation from the foundation document's Azure-native stack is documented in `docs/decisions.md` with rationale. Do not silently revert to Azure-native.

## Coding conventions you must follow

- **TypeScript strict mode.** No `any` unless commented and justified.
- **Server components by default.** Use `"use client"` only when interactivity demands it.
- **One concern per file.** A file that fetches data shouldn't also render UI.
- **Database access goes through `web/lib/db/`.** Never query Supabase directly from a component.
- **AI calls go through `web/lib/ai/`.** Never call OpenAI/Document Intelligence directly from a component.
- **Comments explain WHY.** The code shows what; comments explain reasoning. No "increment counter by 1" comments.
- **No dead code.** Don't leave commented-out blocks.
- **Tests for non-trivial logic.** Pure functions get unit tests. UI components don't need tests for the demo.
- **Sensible names.** `getApprovedSubmissionsForFacilityInPeriod` not `gasfip`.

## Workflow rules

1. **Plan Mode for any task larger than a typo fix.** Write the plan, get explicit approval, then execute.
2. **Read before writing.** Always view the existing file before editing.
3. **Run the dev server after meaningful changes.** Verify the change works before declaring done.
4. **Commit in small, descriptive units.** "Add facility seeding script" not "stuff."
5. **One feature branch per wave.** `wave-1-skeleton`, `wave-2-breadth`, `wave-3-nl-io`.
6. **Stop and ask when uncertain.** Better to pause than to drift.

## Things to never do

- Never modify `docs/foundation.docx` (locked design baseline)
- Never commit `.env.local`, API keys, or any secrets
- Never run destructive SQL (DROP, TRUNCATE, DELETE without WHERE) without confirmation
- Never push to `main` directly — feature branch + merge
- Never disable strict TypeScript or ESLint to silence errors
- Never add a npm dependency without justifying why
- Never call `az` CLI commands without showing the architect first
- Never let the AI generate raw SQL — always go via the structured-filter pattern (Section 63 + safety wrapper)
- Never auto-deploy on push without explicit confirmation in chat

## The "I'm done" handoff

When you finish a task, hand it off in this format:

```
✅ Done: [one-line summary]

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

- Phase: **Setup → Wave 1**
- Last meaningful update: see git log
- Active spec: `docs/vertical-slice-spec.md`
- Active wave: see `docs/playbooks/current-wave.md`
