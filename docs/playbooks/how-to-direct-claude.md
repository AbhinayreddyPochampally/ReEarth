# How to direct Claude Code (architect's playbook)

This is your operating manual. You are the PM and architect; Claude Code is the developer. Here's how to make that work.

## The four phrases that run your day

1. **"Plan this in detail before writing code."** — kicks off Plan Mode for any non-trivial task
2. **"Show me the changes before committing."** — never let Claude commit without you seeing the diff
3. **"Why are you doing it that way?"** — your most powerful question; forces Claude to justify
4. **"Stop. That's not what I want."** — ends a wrong direction immediately

You will use all four many times per day. None of them are rude.

## The session opener

Every Claude Code session starts the same way. Paste this exactly:

> Read CLAUDE.md, docs/vertical-slice-spec.md, and docs/playbooks/current-wave.md. Tell me the next unchecked task in the current wave's playbook, and propose a plan for it. Do not write any code yet.

Claude reads the context, tells you what it thinks the next task is, and proposes a plan. You either approve or push back.

## The plan-review-execute loop

For every task larger than a typo:

1. **You ask Claude to plan.** "Plan task 1.5 in detail. Show me the schema for the login form, the validation logic, and how it'll integrate with Supabase Auth. Output the plan only — no code."
2. **Claude proposes a plan.** Multiple options, tradeoffs, file structure, dependencies.
3. **You review.** Read it. Ask questions. Push back on things you disagree with.
4. **You approve, or you redirect.** "Looks good, proceed" — or — "Don't use that library; use [other thing]. Re-plan with that constraint."
5. **Claude executes.** Edits files, runs commands.
6. **Claude hands off in the standard format** (see CLAUDE.md "I'm done" handoff).
7. **You verify.** Open the running app. Click the thing. Does it work?
8. **You commit, or you ask for fixes.**

Never skip step 3. The plan review is where you do your job.

## What to look for in plans (your review checklist)

When Claude shows you a plan, check:

- **Does it match the spec?** Compare against `vertical-slice-spec.md` and the foundation document. Is Claude inventing scope?
- **Is it the simplest thing?** Claude tends toward sophistication. "Why not just X?" is often the right pushback.
- **Are dependencies justified?** New npm packages = lifetime maintenance. "Do we actually need that library?"
- **Does the file structure make sense?** A 12-file plan for a small feature is a smell. Push for fewer files.
- **Are there security holes?** Especially: SQL injection, secret exposure, unauthenticated routes.
- **What's not in the plan?** Often the bug is what's missing, not what's there.

## When to push back hard

Don't be polite about these:

- **Claude proposes raw SQL generation from AI.** "No. Use the structured filter pattern in `decisions.md`."
- **Claude proposes a generic auth library that doesn't match the SAP+PIN flow.** "Re-read foundation Section 12. The user enters SAP code, PIN, and selects from a dropdown. Plan for that exact UX."
- **Claude wants to add 5 npm packages.** "Justify each one. Cut the list."
- **Claude scaffolds something complex when something simple works.** "This is over-engineered. Start with the minimum."
- **Claude commits without showing you.** "We agreed: show me the diff before committing."

The architect-developer relationship survives because of pushback, not despite it.

## When to defer to Claude

You're an architect, not a coder. Some things are Claude's call:

- **Idiomatic code.** If Claude says "this is the standard Next.js pattern," it usually is.
- **Naming conventions.** Claude knows what's idiomatic. Trust unless something feels off.
- **Test structure.** Claude knows how to test better than you do.
- **Library version pinning.** Claude reads the docs; you don't have to.

Don't pretend to know things you don't. If Claude says "we should use Server Components for this because it avoids hydration issues," and you don't know what that means, ask: "explain that in 3 sentences." Then either accept the explanation or get a second opinion.

## Reading what Claude generates

You don't have to read every line of code. You do have to read:

- **The plan** (always, in full)
- **The handoff summary** (always, in full)
- **The diff for any auth, payment, or data-deletion code** (line by line)
- **Anything that touches `web/lib/db/` or `web/lib/ai/`** (these are the system's spine)

Skim everything else. If the plan was right and the handoff is honest, the code is probably fine.

## Daily habits

- **Start each session by re-reading `current-wave.md`.** Know where you are in the build.
- **End each session by updating `current-wave.md`.** Check off completed tasks.
- **Keep a running issues file.** When a bug shows up, jot it in `docs/playbooks/issues.md` for later.
- **Commit at every working state.** "Save points" let you go back without panic.
- **Don't work past frustration.** If you're stuck for 30+ minutes, stop and ask me (the assistant).

## Red flags — stop everything if you see these

- Claude says "I'll just make a quick fix" without a plan
- Code is being written that you didn't review
- npm packages are being installed without justification
- Files are being created in places not in the plan
- Claude's handoff doesn't list what was tested
- Tests are being skipped because "it's just the demo"

When you see a red flag, paste this:

> Stop. Show me the current state of all changed files since my last approval, and explain what was done that I didn't approve.

Claude will surface what slipped. You decide whether to keep or revert.

## The "I don't know what to do next" reset

If you ever feel lost during a wave:

> Re-read CLAUDE.md, docs/vertical-slice-spec.md, and docs/playbooks/current-wave.md. List the unchecked tasks in order, and tell me what you think the next priority is and why. Don't do anything yet — just orient us.

Claude resets, you re-orient, work continues.

## Cost discipline

You have $100 of Azure credits. Every command that touches Azure costs money. Before letting Claude run anything Azure-related:

- Ask: "What will this cost? Will this leave any resources running between sessions?"
- Get the answer in writing in chat.
- For the first week, run `az consumption usage` daily to see actual spend.

The single biggest budget killer is forgetting to delete resources. Always know what's running.

## When the demo day approaches

One week before the demo:

- Stop adding features. Even if Wave 3 is incomplete, freeze.
- Run the full demo walk-through three times on the deployed URL.
- Document every flake or glitch.
- Plan for what to demo if a feature breaks live (have a backup story).
- Test on the same device you'll demo on.
- Test on the same network you'll demo on.

You don't ship the perfect demo. You ship the demo that works on the day.
