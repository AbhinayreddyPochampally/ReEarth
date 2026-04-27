import type { ConditionalPredicate, Applicability } from '../data/parameters';

type FacilityFlags = Record<string, unknown>;

// Evaluates a ConditionalPredicate against a facility's flags jsonb.
// Handles three forms:
//   { has_dg: true }                             → flags.has_dg === true
//   { has_boiler: true, boiler_fuel: 'briquettes' }  → all keys must match (AND)
//   { active_haz_categories_contains: 'used_oil' }   → flags.active_haz_categories array includes value
function evaluatePredicate(predicate: ConditionalPredicate, flags: FacilityFlags): boolean {
  for (const [key, expected] of Object.entries(predicate)) {
    if (key === 'active_haz_categories_contains') {
      const arr = flags['active_haz_categories'];
      if (!Array.isArray(arr) || !arr.includes(expected as string)) return false;
    } else {
      if (flags[key] !== expected) return false;
    }
  }
  return true;
}

// Returns true if a parameter should be assigned to a facility, given the
// parameter's applicability value for the facility's template.
export function shouldAssign(
  applicability: Applicability,
  predicate: ConditionalPredicate | null,
  flags: FacilityFlags,
): boolean {
  if (applicability === 'not_applicable') return false;
  if (applicability === 'always') return true;
  // conditional: evaluate predicate if present, otherwise include
  if (!predicate) return true;
  return evaluatePredicate(predicate, flags);
}

// Maps facility_type DB enum to the FacilityTemplate used in the parameter catalog.
export function facilityTypeToTemplate(dbType: string): 'retail' | 'office' | 'warehouse' | 'factory' {
  switch (dbType) {
    case 'factory':   return 'factory';
    case 'warehouse': return 'warehouse';
    case 'store':     return 'retail';
    default:          return 'retail';
  }
}
