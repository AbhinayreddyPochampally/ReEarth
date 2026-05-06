# HO Admin Guide

For the people who actually use ReEarth from the corporate office. This guide walks
you through the daily / weekly tasks, common edge cases, and what to do when
something looks wrong.

The system covers **15 facilities** — 11 garment factories + 4 distribution
warehouses. You're the corporate sustainability team; contributors are the people at
each facility entering data. Your role is to confirm bills, monitor alerts, edit
master data, and pull data when reports are due.

## Logging in

Open the deployed URL on your laptop. The first screen lets contributors pick a
facility. **You're not a contributor — click the "HO user → log in here" link at the
bottom**, or navigate directly to `/login/ho`.

- Email: your corporate email (e.g. `neha.sharma@abfrl.com`)
- Password: set at deployment. If you've lost it, see the
  [break-glass runbook](break-glass.md).

You land on the **Dashboards** page. The sidebar has six surfaces:

| Surface | What you do there |
|---|---|
| Dashboards | Glance at the portfolio. Filter by facility, brand, period, etc. |
| Bill Inbox | Confirm or send back uploaded bills + reports |
| Alerts | Compliance breaches, threshold rule firings, data gaps |
| Facilities | Drill into one facility's data |
| Data Explorer | Ad-hoc queries (NL or filter chips), export to Excel |
| Master Data | Edit facility config, regulatory limits, alert rules |

The header bar has a **search box** — that's the global audit search ("Ask
anything…"). Use it to investigate "what happened with X" — see [Investigating an
issue](#investigating-an-issue) below.

## Daily routines

### 1. Triage the Bill Inbox (5–15 minutes per day)

Open **Bill Inbox** from the sidebar. The top of the page shows three numbers:

- **N bills waiting** — total awaiting your confirmation
- **M need attention** — breach-flagged or low-confidence (red dot)

The list is sorted by OCR confidence, with green-tagged bills on top. The fastest
path:

1. Click **"Bulk approve · N high-conf"**. The modal shows every green-tagged bill
   that has no compliance breach. Confirm — they all move to Approved in one
   action. Each contributor gets a confirmation push notification.
2. Click into amber and red bills one at a time. Each detail page shows:
   - The bill image on the left, with green rectangles overlaying the OCR-extracted
     fields
   - Extracted values on the right, editable
   - A trend chart for context (e.g. last 6 months of BOD)
3. For each bill: **Approve** if values look right, **Send back** with a reason if
   the photo is blurry / wrong document / suspect data. Sending back creates a
   discussion thread the contributor sees on their next PWA open.

### 2. Triage Alerts

Open **Alerts** from the sidebar. Three tabs:

- **Compliance** — regulatory breaches found in approved lab reports. Highest
  priority. Each alert links to the source bill detail page.
- **Thresholds** — rules you (or another HO) configured. Examples: water-positive
  ratio < 1.10, Bhiwandi grid > 15,000 kWh/month.
- **Data gaps** — facilities with incomplete daily logs / overdue monthly summaries
  / late lab reports. The system runs the gap-detector nightly.

For each alert: **Acknowledge** to mark you've seen it, **Resolve** when the
underlying issue is fixed. Resolution doesn't auto-close the source — you need to
follow up with the facility.

### 3. Glance at Dashboards

Open **Dashboards** in the morning. Eight metric cards across the top — water
withdrawn, water-positive, energy, per-garment emissions, renewable %, reuse %,
Scope 1+2, EPI. Below: a Scope 1+2 trend, an energy-mix donut, a 15-tile compliance
status grid (green / amber / red).

Click any compliance tile to open that facility's drill-down.

## Weekly routines

### 1. Pull data for stakeholder reports (15–30 minutes)

Open **Data Explorer**. Type your question into the "Ask anything" box. Examples
that work today:

- *"Show me water withdrawn by source for Q1 2026, all factories"*
- *"Last 6 months of Scope 1 + 2 by facility"*
- *"STP BOD trend for Tirupur"*
- *"Diesel use ranked by intensity, last quarter"*

The AI converts your question into filter chips (Facility, Period, Parameter,
etc.). You can edit any chip if the AI got it wrong. Click **Export** to download
CSV / Excel / PDF.

When the AI doesn't understand:

- **Out of scope** ("predict", "forecast", "why X happened") — the AI explicitly
  says "I can't do that yet" and suggests rephrasing. Predictive forecasting is
  out of scope for v1; causal analysis is too.
- **Ambiguous** ("show me bad facilities") — the AI asks you to be more specific.
- **Service unavailable** (rate limit / timeout) — you see "NL query is temporarily
  unavailable. Use manual filters." Click the chips below the question box to
  build the query yourself; functionally identical.

### 2. Master data updates

Open **Master Data**. Use **"Make a change with words"** for most edits. Examples
that work today:

- *"Add a 5th DG to Factory-Bengaluru, 250 kVA diesel"* — single-row diff
- *"Update CPCB STP outlet BOD limit to 25 mg/L for all factories effective 1 May
  2026"* — bulk diff across 11 factories
- *"Add vendor SafeChem Industrial for oil-soaked cotton at all 11 factories"* —
  vendor add

The AI generates a structured diff. **You always approve before anything is
applied.** The diff shows:

- The table that's affected
- The rows that close (with effective_to date)
- The rows that insert (with effective_from date)
- The list of facilities affected
- Side-effects (which contributors get a push notification, etc.)

Click **Approve & apply** when correct, **Discard** if not. AI never writes raw
SQL — every change goes through a deterministic translator that the architect built.

### 3. Late-entry override

When a contributor needs an entry older than 2 days (their PWA's daily logger
caps backdating at 2 days), they ask you. Open **Master Data → Late entry on
behalf**. Pick the facility, contributor, parameter, date, value, and write a
**reason** (mandatory, ≥8 chars). The reason becomes part of the audit log and is
searchable via the global audit-search bar.

## Monthly routines

### 1. AI spend check

Open **Master Data → AI spend**. The card at the top shows month-to-date ₹ spend
against the budget envelope (₹15K–40K/year). If it's tracking high:

- Inspect the per-feature breakdown. NL audit search is cheapest; OCR scales with
  bill volume.
- Look at the recent-call list. Spot anyone using NL master updates excessively.

### 2. Audit-log size check

The system auto-archives audit_log rows older than 90 days to Supabase Storage as
JSONL bundles. If you ever see audit search results getting slow or notice the
project nearing the 500 MB Supabase free-tier ceiling, run the manual cleanup
documented in [break-glass §2](break-glass.md#2--database-is-over-supabase-free-tier-ceiling).

### 3. BRSR pull

End of quarter: open **Data Explorer**, type queries that match the BRSR template
sections, export each as Excel. The "Recent" dropdown next to the search box
remembers your last 5 queries.

## Investigating an issue

Use the **header search bar** (the "Ask anything…" box at the top of every HO
page). Examples that work today:

- *"What happened with the March STP report from Tirupur?"* → returns a narrative
  summary with timestamped events grounded in real audit_log rows. Each event
  links to the source.
- *"Who edited Factory-Bengaluru's master data this year?"* → list of NL master
  updates with diffs.
- *"Why was the March electricity for Bengaluru sent back?"* → narrative + thread
  excerpts.

The audit-search panel is **read-only**. Use the action links to navigate to where
you can take action (e.g. "Open the bill" goes to the inbox detail; "Reply to
Ravi" goes to the discussion thread).

## Edge cases and troubleshooting

### Contributor is locked out

The contributor PWA locks for 15 minutes after 5 wrong PINs. They wait it out, or
you can reset the facility PIN from **Master Data → Facilities → [facility] →
Reset PIN**. The new PIN appears once on screen — you communicate it to the
facility through whatever internal channel works (Teams, in-person briefing).
Never email it.

### You forgot your password

If there are two HO super-users, the other one resets you from **Master Data →
Personnel → [your row] → Reset password**.

If there's only one super-user (current configuration) and you've forgotten yours
— that's a developer-mediated break-glass. Contact the developer and follow the
[break-glass runbook §1](break-glass.md). The break-glass writes an audit row, so
the override is itself recorded.

### A contributor disputes a Send Back

Open the bill detail. Scroll to the **Discussion** thread. You can post a follow-up
message. Both versions of any sent-back bill remain queryable via audit search.

### The dashboards look stale

Computed metrics are recalculated lazily on read. Reload the page; if it's still
stale by more than a few minutes, escalate. The lazy recompute should kick in
within seconds of an approval.

### A facility shows 0 % completion when you know they've been logging

Check the Facility drill-down. The "Daily completion" % is computed live from
`done / total` of the facility's assigned daily parameters. If `total` is wrong
(parameters not assigned correctly), open **Master Data → Facilities → [facility]
→ Conditional flags** and confirm the flags match reality (e.g. `has_boiler`,
`has_canteen`).

### OCR isn't running on uploaded bills

If a contributor uploads a bill and it lands in the inbox at amber confidence
(0.65) with empty extracted fields, OCR didn't run. Either the Azure Document
Intelligence service is down or the keys aren't configured. The bill is still
reviewable — you just see no extracted-value highlights. Phase 4 will add a
retry button on the bill detail; for now, ask the contributor to re-upload after
the service recovers.

### NL query / NL master updates / NL audit search say "temporarily unavailable"

Azure OpenAI rate limited or timed out. Wait a minute and retry. For NL query,
you can build the same query manually using the filter chips below the search
box — the query result is identical either way. For NL master updates, the slide-
over falls back to a mock diff with a warning ("AI service unavailable; diff is
offline-mock"). For NL audit search, click into the relevant facility's drill-
down and read the recent-activity list directly.

## Quick reference card

```
Daily        : Bill Inbox → Bulk approve green → individual review amber/red
                Alerts → triage compliance + threshold + gap
                Dashboards → glance at the 15-tile compliance grid
Weekly       : Data Explorer → BRSR / weekly metrics pulls
                Master Data NL panel → master edits with diff approval
                Late-entry HO override (Master Data → Late entry on behalf)
Monthly      : AI spend check (Master Data → AI spend)
                Audit-log size check (rare; see break-glass §2 if needed)
                Quarter-end: BRSR data pulls via Data Explorer
On-demand    : Header audit search for "what happened with X"
                Facilities sidebar → drill into one facility
                Master Data → Reset PIN if a contributor is locked out
```

## Where to learn more

- `docs/design-doc.docx` — the canonical design (~50 pages, what the system is and
  why)
- `docs/ui-sketch.pdf` — the wireframes (46 pages, visual reference)
- `docs/decisions.md` — every architectural decision with reasoning
- `docs/playbooks/break-glass.md` — runbooks for the rare bad days
- `docs/security-review.md` — what's been reviewed and what's still open
