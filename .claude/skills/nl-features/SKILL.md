---
name: nl-features
description: Use whenever the architect asks about natural language input, NL query, NL master updates, OCR on bills, or any AI-powered I/O feature. Triggers on terms like Azure OpenAI, Document Intelligence, structured filter, prompt engineering, GPT-4o, NL extraction, confirmation card, filter chips, master data diff, audit search. Critical for getting the AI features right since these are the demo's headline.
---

# Natural Language Features Implementation Guide

## The four NL features in Wave 3

1. **NL Input on contributor form** — contributor types/speaks, AI extracts structured submission
2. **NL Query on HO data explorer** — HO types question, AI converts to structured filter
3. **NL Master Updates** — HO types intent, AI generates a diff for approval
4. **NL Audit Search (bonus)** — HO asks "what happened with X submission," AI summarizes audit log

OCR on bill upload is integrated into Feature 1.

## Universal AI design principles

These apply to all four features:

1. **AI extracts; human confirms.** Never auto-submit on AI output.
2. **Show the AI's interpretation visibly.** Don't hide it behind a "we got it right" assumption.
3. **Editable confirmations.** When AI extracts something, the user can correct each field before submitting.
4. **Conversational fallback on ambiguity.** If the AI is missing required info, ask back instead of guessing.
5. **Token caps.** Every AI call has `max_tokens` set aggressively (300–500 for extraction, 500 for queries). No unbounded calls.
6. **Bounded scope.** AI sees only what it needs — facility-level data for that user, not the full database.
7. **No raw SQL ever.** All NL→data flows go through the structured filter pattern.

## Feature 1: NL Input on contributor form

### UX flow

```
Contributor on form screen
  ↓
Two big buttons at top: [📝 Type or speak] [📋 Fill the form]
  ↓
"Type or speak" tapped → text area appears
  ↓
Contributor types: "April electricity bill 12,400 units"
  ↓
[Submit to AI] button
  ↓
AI extracts → confirmation card appears below text
  ↓
Card shows: parameter • value • period • unit
  ↓
Each field has a small "edit" pencil icon
  ↓
"Looks good, attach evidence" button → photo upload step
  ↓
Photo uploaded → OCR runs on bill
  ↓
If OCR value matches typed value → green check
  ↓
If OCR value differs → soft warning "You typed X, bill shows Y. Which is correct?"
  ↓
Contributor confirms → submit
```

### Prompt template (NL extraction)

```
You are extracting structured data from a sustainability contributor's text input.
The contributor is at facility: {facility_name} ({facility_type}).
They are submitting data for one of these parameters:
{parameters_list_with_ids_units_and_descriptions}

Their input: "{contributor_text}"

Return a JSON object with these fields:
- parameter_id: the matched parameter ID, or null if no match
- value: the numerical value, or null if not provided
- unit: the unit if specified, or null
- period_label: the period the contributor is referring to (e.g., "April 2026", "2026-04"), or null
- confidence: "high" / "medium" / "low"
- missing_fields: list of fields the user didn't provide that are required
- clarification_question: if missing_fields is non-empty, a polite question to ask back

If the input is ambiguous about parameter (e.g., they said "bill" without specifying), pick the most likely and set confidence to "medium".
If the input doesn't match any parameter, return parameter_id: null.

Output only valid JSON. No prose.
```

### Implementation notes

- File: `web/lib/ai/extract-submission.ts`
- Model: `gpt-4o-mini` (cheap, fast, sufficient)
- Temperature: `0` (deterministic extraction)
- max_tokens: `300`
- Always validate JSON structure on response; reject malformed
- Return type is a typed `ExtractionResult` discriminated union

## Feature 2: NL Query on HO data explorer

### UX flow

```
HO data explorer screen
  ↓
Big text input at top: "Ask anything about the data..."
  ↓
HO types: "Show me electricity submissions from Bengaluru stores last month"
  ↓
[Search] button or Enter key
  ↓
AI converts to structured filter object
  ↓
Filter chips render below the input:
  [Parameter: Grid electricity ×] [Period: March 2026 ×]
  [Facility city: Bengaluru ×] [Facility type: retail ×]
  [Sort: submitted_at DESC ×]
  ↓
Results render below the chips (table)
  ↓
HO can click × on any chip to remove it, or tap Edit Filters to manually adjust
  ↓
[Export to Excel] button on results
```

### The structured filter type

```typescript
// web/lib/db/types.ts
export type StructuredFilter = {
  parameter_ids?: string[];
  facility_ids?: string[];
  facility_types?: ('retail' | 'office' | 'warehouse' | 'factory')[];
  facility_cities?: string[];
  facility_states?: string[];
  brands?: string[];
  date_range?: { start: string; end: string };
  status?: ('pending' | 'approved' | 'sent_back' | 'flagged')[];
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
};
```

### Prompt template (NL → filter)

```
You convert sustainability data queries from natural language into structured filter objects.
The user is an HO reviewer. They want to query the submissions table.

Available filter fields and their valid values:
{filter_schema_with_examples}

Available facilities:
{facility_list_with_ids_names_cities_states_types_brands}

Available parameters:
{parameter_list_with_ids_names_categories}

Today's date: {today}

User query: "{user_query}"

Return a JSON object matching the StructuredFilter type. Resolve relative dates ("last month", "this quarter") to explicit ISO date ranges.
If the user mentions a facility by partial name, match to facility_ids.
If the user is ambiguous, pick the most likely interpretation.
If the user asks for something outside the filter schema (e.g., "predict next month's value"), return: { error: "explanation" }.

Output only valid JSON. No prose.
```

### Implementation notes

- File: `web/lib/ai/nl-to-filter.ts` (AI conversion) + `web/lib/db/query-builder.ts` (filter → SQL)
- Filter execution uses Supabase's PostgREST builder; never raw SQL
- Filter chips are rendered as React components from the StructuredFilter object — single source of truth
- HO can edit chips → updates filter object → re-runs query

## Feature 3: NL Master Updates

### UX flow

```
HO master data screen
  ↓
Big text input: "Describe the change you want to make..."
  ↓
HO types: "Add a 5th DG to Mysuru factory, 250 kVA, runs on diesel"
  ↓
AI generates structured diff
  ↓
Diff renders as side-by-side or inline:
  facilities/factory-mysuru:
    dg_count: 4 → 5
    conditional_flags.dg_5_capacity_kva: (new) → 250
    conditional_flags.dg_5_fuel: (new) → "diesel"
  ↓
[Approve] [Edit] [Cancel] buttons
  ↓
Approve → master data updates atomically, audit log entry created
```

### Prompt template (NL → master diff)

```
You generate master data change diffs for ReEarth.

Current master data state:
{relevant_master_state_json}

User intent: "{user_query}"

Return a JSON object:
{
  target_entity: "facilities" | "personnel" | "parameters" | "regulatory_limits",
  target_id: string,
  changes: { field_path: { from: any, to: any } }[],
  notes: string  // human-readable summary
}

If the change is destructive (deleting a facility, removing all parameters), include warning: "...".
If the intent is ambiguous, return: { error: "explanation" }.

Output only valid JSON.
```

### Implementation notes

- File: `web/lib/ai/nl-to-master-diff.ts`
- Diffs are atomic (all-or-nothing); use Postgres transaction
- Audit log entry includes the original user query, the AI-generated diff, and the HO approver's ID
- Highest-risk feature for the demo — review changes carefully before applying

## Feature 4: NL Audit Search (bonus)

### UX flow

Single text box. HO types: "Why was the March electricity for Pantaloons-Bengaluru sent back?"

AI:
1. Resolves entity (which submission)
2. Pulls audit_log + discussion entries for that submission
3. Returns natural-language summary

### Implementation notes

- File: `web/lib/ai/nl-audit-search.ts`
- Two AI calls: one to resolve the entity, one to summarize after data is fetched
- Or one combined call with tool-use pattern (preferred; cheaper)
- Read-only by definition; lower risk

## OCR (integrated into Feature 1)

### Implementation notes

- Service: Azure Document Intelligence, prebuilt invoice / receipt model
- File: `web/lib/ai/extract-bill.ts`
- Returns: `{ amount: number, period: string, billed_to: string, raw: object }`
- Compares to contributor-typed value; if mismatch > 5%, soft warning to user
- Free tier (F0): 500 pages/month — ample for demo

## Cost estimates (demo-volume)

| Feature | Calls/month at demo volume | Cost |
|---|---|---|
| NL input | ~30 | $0.10 |
| NL query | ~50 | $0.30 |
| NL master | ~20 | $0.15 |
| NL audit | ~10 | $0.05 |
| OCR | ~30 (within free tier) | $0 |
| **Total** | | **~$0.60/month** |

The AI features are essentially free at demo scale. The real cost is testing during development — assume 10x the demo volume during build = ~$6/month, well within budget.

## Testing approach

For each feature, write a small test file with hardcoded "user inputs" and expected structured outputs. AI extraction can drift; the test is the early-warning system. File: `web/lib/ai/__tests__/`.
