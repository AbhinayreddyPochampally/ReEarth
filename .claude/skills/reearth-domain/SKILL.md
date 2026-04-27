---
name: reearth-domain
description: Use whenever the developer mentions parameters, facilities, evidence, contributors, HO review, hazardous waste, or any ReEarth concept. Triggers on terms like SAP code, facility PIN, DNA template, conditional flag, generation event, disposal event, month-close, evidence quality scoring, Express/Standard/Deep/Compliance queue, or any reference to the foundation document. Provides domain vocabulary, design constraints, and the canonical answers for ReEarth design questions.
---

# ReEarth Domain Knowledge

## Use this skill when the architect asks anything about

- Facility types, DNA templates, conditional flags
- Parameters, units, frequency classes, evidence rules
- Authentication (SAP code, facility PIN, name selection, sessions)
- Contributor screens (the four-screen architecture)
- HO review queues and evidence quality scoring
- Master data, regulatory limits, compliance breach detection
- Inspection module (real-time and aftermath modes)
- AI features (and their Phase 1 boundaries)
- Why a design decision was made the way it was

## The single source of truth

**`docs/foundation.docx`** is canonical (~150 pages). When this skill disagrees with the foundation document, the foundation document wins. When the foundation document doesn't answer a question, ask the architect rather than inventing an answer.

## Domain vocabulary (essential terms)

| Term | Meaning |
|---|---|
| **Facility** | A physical location: store, office, warehouse, or factory |
| **DNA template** | One of four facility-type configurations: Retail / Office / Warehouse / Factory |
| **Conditional flag** | Boolean per facility activating/deactivating parameters (has_dg, has_solar, has_canteen, mall_based, etc.) |
| **Parameter** | A single data point the facility reports (e.g., "grid electricity in kWh, monthly") |
| **Evidence** | Supporting document (photo of bill, manifest, register page) |
| **Submission** | One actual data entry: parameter + value + event_at + evidence + contributor |
| **Contributor** | A person at a facility authorized to submit data (also called Personnel) |
| **HO** | Head Office reviewer — single role with shared permissions, multiple people |
| **Express / Standard / Deep / Compliance** | The four HO review queues (Section 35–36) |
| **Generation event** | Hazardous waste added to on-site storage |
| **Disposal event** | Hazardous waste picked up by authorized handler |
| **Month-close ceremony** | Factory-only consolidated submission on day 8 of M+1 |

## Hard rules (never violate without explicit approval)

1. **PINs are facility-level, not per-person.** Stored on the `facilities` table. Multiple personnel at one facility share one PIN. Attribution happens via name selection at login. (See foundation Appendix B.1.)
2. **No outbound integrations.** No email, no SMS, no HRMS push, no ERP integration. Anything that needs to leave the system goes out as Excel download.
3. **Humans always approve final data.** AI assists, never decides.
4. **No pre-formatted reports.** Data Explorer with flexible filters + Excel export only.
5. **English only for the demo.** No multilingual UI yet.
6. **Hazardous waste uses two-event model.** Generation events (HWM register photo, weekly batch) + Disposal events (manifest, per-pickup). Running balance with FIFO batch ledger drives the 90-day clock.
7. **Factory backdate rule overrides default.** Days 1–7 of month M+1 allow backdating to ANY date in month M. Other facility types use rolling 7-day window.
8. **NL features are AI-assisted, not AI-decided.** AI extracts/converts; human confirms. Always.
9. **NL query never generates raw SQL.** Use the structured filter pattern (see `docs/decisions.md`).

## When asked about a parameter

Before answering, verify:
- Which facility types have it?
- What unit?
- What frequency?
- What evidence?
- Any regulatory limit?

If unsure on any of the above, ask the architect.

## Common gotchas

- **"Monthly" submissions don't always mean once-per-month.** Some are aggregated from daily readings (factory boiler biomass).
- **Refrigerant refills are scope-1 emissions, not scope-3.**
- **Stack count is per-facility, not per-template.** A factory with 1 boiler + 1 DG = 8 emission parameters (4 pollutants × 2 stacks).
- **Mall-shared diesel is a specific edge case.** Activates a different evidence model.

## Workflow when the architect asks a design question

1. Search this skill for the term they used.
2. If not here, point them to a section number in the foundation document.
3. If not in either, ask: "I don't have this in either source. Should I treat this as a new design decision and add it to `docs/decisions.md`, or did you mean something already documented?"

Never invent a design answer to be helpful. Inventing creates drift between docs and code.
