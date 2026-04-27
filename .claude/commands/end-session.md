---
description: End the working session — update wave playbook, summarize progress, suggest next task
---

We're ending this session. Do these things in order:

1. Run `git status` and `git log --oneline -10` to confirm what's committed and what isn't
2. If anything is uncommitted, ask me whether to commit, stash, or discard
3. Read `docs/playbooks/current-wave.md` and update the checklist for tasks completed this session
4. Append a one-line note to the "Notes from the architect" section with date and summary
5. If we touched the `docs/decisions.md`, summarize what was added

Then output:

```
## Session summary — {date}

### Completed
- [bullets of what got done]

### In progress
- [bullets of what's started but not done, with status]

### Blocked / questions
- [anything we got stuck on]

### Recommended next session
- [what to do first next time]
```

Don't run any other commands. Don't propose new work.
