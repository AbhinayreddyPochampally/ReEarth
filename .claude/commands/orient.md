---
description: Start a working session — read context, identify next task, propose plan
---

Read these files in order and then orient us:

1. `CLAUDE.md` — project memory and conventions
2. `docs/design-doc.docx` — canonical design (use Grep on extracted text or Read directly for relevant sections)
3. `docs/playbooks/current-phase.md` — active phase with task list
4. `docs/decisions.md` — architectural decisions and inconsistency resolutions
5. `docs/ui-sketch.pdf` — wireframe set (read pages relevant to whatever's coming up)

Then:

1. Tell me which phase we're in
2. Tell me the next unchecked task
3. Use the planner subagent to draft a plan for that task
4. Wait for my approval before any execution

Do not write any code or make any changes yet.
