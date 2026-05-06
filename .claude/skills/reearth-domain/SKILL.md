---
name: reearth-domain
description: Use whenever the developer mentions parameters, facilities, evidence, contributors, HO review, hazardous waste, or any ReEarth concept. Triggers on terms like SAP code, facility PIN, conditional flag, generation event, disposal event, Bill Inbox confidence, structured filter, NL query, NL master update, or any reference to the design document. Provides domain vocabulary, design constraints, and the canonical answers for ReEarth design questions.
---

# ReEarth Domain Knowledge

## Use this skill when the architect asks anything about

- Facility types, conditional flags
- Parameters, units, frequency classes, evidence rules
- Authentication (facility picker, facility PIN, name selection, sessions; HO email + password)
- Contributor PWA screens (home, daily logger, event logger, bill upload, monthly summary)
- HO desktop screens (Dashboards, Bill Inbox, Alerts, Facilities, Data Explorer, Master Data)
- Master data, regulatory limits, compliance breach detection
- AI features (OCR, NL query, NL master updates, NL audit search)
- Why a design decision was made the way it was

## The single sources of truth

1. **`docs/design-doc.docx`** — canonical design (April 2026, Version 1.0). Supersedes the prior foundation document.
2. **`docs/ui-sketch.pdf`** — canonical lo-fi wireframes (03 May 2026). When the wireframe and the design doc disagree, the wireframe is the more recent decision *unless* `docs/decisions.md` records otherwise.
3. **`docs/decisions.md`** — running ADR log. Resolutions of ambiguities and inconsistencies between the doc and the wireframes live here. Always check this before answering.

When this skill disagrees with the design doc, the design doc wins. When the design doc doesn't answer a question, check `decisions.md` next, then ask the architect rather than inventing an answer.

## Domain vocabulary (essential terms)

| Term | Meaning |
|---|---|
| **Facility** | A physical location. Two types only: factory or warehouse. (Retail and offices are out of scope per the 2026-05-06 rescope.) |
| **Conditional flag** | Boolean (or small enum) per facility on `facilities.flags` jsonb. Activates/deactivates parameters: `has_dg`, `dg_count`, `has_solar`, `has_canteen`, `has_groundwater`, `has_stp`, `has_boiler`, `has_internal_fleet`, `has_first_aid`, `has_municipal_water`, `has_tanker_water`, `has_rainwater_harvesting`. |
| **Parameter** | A single data point the facility reports (e.g., "grid electricity in kWh, monthly"). |
| **Evidence** | Supporting document (photo of bill, manifest, register page, lab report). |
| **Submission** | One data entry: parameter + value + event_at + evidence + contributor. |
| **Contributor** | A person at a facility authorized to submit data via the PWA. |
| **HO** | Head Office reviewer (corporate, not facility-bound). Single role with shared permissions; one super-user at deployment per the 2026-05-06 rescope. |
| **Bill Inbox** | The single HO surface for confidence-tagged bills awaiting confirmation. Replaces the prior Express/Standard/Deep/Compliance four-queue model. |
| **Generation event** | Hazardous waste added to on-site storage. |
| **Disposal event** | Hazardous waste picked up by authorized handler. |
| **Structured filter pattern** | The contract by which AI converts NL queries into validated JSON filter objects, never raw SQL. (Design doc §38.) |

## Hard rules (never violate without explicit approval)

1. **PINs are facility-level, not per-person.** Stored hashed on `facilities`. Multiple contributors at one facility share one PIN. Attribution happens via name selection at first login. (Design doc §20.)
2. **HO authenticates by email + password, not by PIN.** HO users have `personnel.facility_id IS NULL`. (Design doc §28.3, §45.1.)
3. **No outbound integrations.** No email, no SMS, no HRMS push, no ERP integration. Notifications are PWA push only, with in-app banner fallback. Anything that needs to leave the system goes out as Excel download. (Design doc §8.7, §27.)
4. **Humans always approve final data.** AI assists, never decides. (Design doc §8.2, §36.2.)
5. **NL query never generates raw SQL.** Use the structured filter pattern. (Design doc §38, decisions log 2026-04-27.)
6. **Hazardous waste uses two-event model.** Generation events + Disposal events. Running balance with FIFO batch ledger drives the 90-day clock. (Design doc §15.)
7. **All factories see all hazardous categories.** No per-facility category list. Biomedical is the only narrow exception (gated by `has_first_aid`). (Design doc §15.1, decisions log 2026-05-06 resolution J.)
8. **Master data is effective-dated.** Submissions are evaluated against the limit/config that was effective on event_date, not the current value. Historical breach decisions are stable. (Design doc §18.2.)
9. **Audit log is append-only.** No updates, no deletes. Indefinite retention with a Phase 2 archival job that moves rows >90 days old to Supabase Storage. (Design doc §46, decisions log 2026-05-06 resolution K.)
10. **Daily-log retroactive edits are allowed indefinitely.** No edit window. Each edit creates a new audit_log row preserving before/after. The card displays the latest value. (Decisions log 2026-05-06 resolution G.)

## When asked about a parameter

Before answering, verify:
- Which facility types have it (factory and/or warehouse)?
- What unit?
- What frequency (daily / weekly / monthly / quarterly / annual)?
- What evidence (required / optional / none)?
- Any regulatory limit?

If unsure on any of the above, check `supabase/seed/data/parameters.ts` or ask the architect.

## Common gotchas

- **"Monthly" submissions don't always mean once-per-month.** Some are aggregated from daily readings (boiler briquettes, groundwater extraction). The frequency in the catalog is the *aggregation cadence at submission time*, not the observation cadence.
- **Refrigerant refills are scope-1 emissions, not scope-3.**
- **Stack count is per-facility.** A factory with 1 boiler + 4 DGs generates 5 stack reports per month, each with PM/SOx/NOx/CO. Each report is a single submission against `stack_emissions_*_mgnm3` because the schema's `submissions.value_normalized` is a single numeric.
- **The single Bill Inbox is sorted by OCR confidence (green / amber / red).** Bulk-approve covers green only. Amber and red are individual review.
- **Boiler fuel is briquettes-only across all factories.** No multi-fuel variants. (Decisions log 2026-04-28 Gate 2.)
- **Yesterday's value is hidden on number-entry cards.** Architect override 2026-05-06 (resolution A) overrides the May wireframe page 11 which shows yesterday + 7-day average.
- **Daily logger autosaves on each card; no Submit button.** Architect override 2026-05-06 (resolution C). The bottom button on UI sketch p10 is a passive nav, not a state-change.

## Workflow when the architect asks a design question

1. Search this skill for the term they used.
2. If not here, point them to a section number in the design doc.
3. If still not answered, check `docs/decisions.md` for an ADR.
4. If not in any of those, ask: "I don't have this in any source. Should I treat this as a new design decision and add it to `docs/decisions.md`, or did you mean something already documented?"

Never invent a design answer to be helpful. Inventing creates drift between docs and code.
