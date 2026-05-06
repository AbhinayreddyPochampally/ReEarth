// StructuredFilter — the contract between AI output and platform behavior
// per design doc §38.2. The AI converts NL queries into objects of this
// shape; a deterministic translator function then converts these into
// parameterised Postgres queries. The AI never produces raw SQL.

export interface StructuredFilter {
  parameter_ids?: string[];
  facility_ids?: string[];
  facility_types?: ('factory' | 'warehouse')[];
  facility_cities?: string[];
  facility_states?: string[];
  brands?: string[];
  date_range?: { start: string; end: string };
  status?: ('approved' | 'pending' | 'sent_back')[];
  sort?: { field: string; direction: 'asc' | 'desc' };
  aggregation?: { rows: string; columns?: string };
  limit?: number;
}

export interface InterpretationChip {
  field: keyof StructuredFilter;
  label: string;
  display: string;
  uncertain?: boolean;
}

// Phase 2/3 demo helper: render a StructuredFilter as readable chips for the
// Data Explorer "Interpreted as" row (UI sketch p34).
export function chipsFor(filter: StructuredFilter): InterpretationChip[] {
  const chips: InterpretationChip[] = [];

  if (filter.facility_ids?.length) {
    chips.push({ field: 'facility_ids', label: 'Facilities', display: `${filter.facility_ids.length} facilities` });
  } else if (filter.facility_types?.length) {
    chips.push({ field: 'facility_types', label: 'Facility type', display: filter.facility_types.join(', ') });
  }
  if (filter.brands?.length) {
    chips.push({ field: 'brands', label: 'Brand', display: filter.brands.join(', ') });
  }
  if (filter.facility_cities?.length) {
    chips.push({ field: 'facility_cities', label: 'Cities', display: filter.facility_cities.join(', ') });
  }
  if (filter.date_range) {
    chips.push({ field: 'date_range', label: 'Period', display: `${filter.date_range.start} → ${filter.date_range.end}` });
  }
  if (filter.parameter_ids?.length) {
    chips.push({ field: 'parameter_ids', label: 'Parameters', display: filter.parameter_ids.join(', ') });
  }
  if (filter.status?.length) {
    chips.push({ field: 'status', label: 'Status', display: filter.status.join(', ') });
  }
  if (filter.aggregation) {
    chips.push({
      field: 'aggregation',
      label: 'Group by',
      display: filter.aggregation.columns
        ? `${filter.aggregation.rows} × ${filter.aggregation.columns}`
        : filter.aggregation.rows,
    });
  }
  if (filter.sort) {
    chips.push({ field: 'sort', label: 'Sort', display: `${filter.sort.field} ${filter.sort.direction}` });
  }

  return chips;
}

// Validates that an AI response object only carries known keys. Prevents
// the AI from inventing a field that the deterministic translator wouldn't
// know how to handle.
export function validateStructuredFilter(input: unknown): { ok: true; filter: StructuredFilter } | { ok: false; error: string } {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'AI response was not an object.' };
  }
  const allowed: ReadonlyArray<keyof StructuredFilter> = [
    'parameter_ids', 'facility_ids', 'facility_types', 'facility_cities',
    'facility_states', 'brands', 'date_range', 'status', 'sort',
    'aggregation', 'limit',
  ];
  const obj = input as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!(allowed as readonly string[]).includes(key)) {
      return { ok: false, error: `AI returned unknown field "${key}". Rejected for safety.` };
    }
  }
  return { ok: true, filter: obj as StructuredFilter };
}
