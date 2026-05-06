import type { ConditionalPredicate, Applicability, FacilityTemplate } from '../data/parameters';

type FacilityFlags = Record<string, unknown>;

/**
 * Evaluates a ConditionalPredicate against a facility's flags jsonb.
 * Predicate shape (post-2026-05-06 rescope):
 *   { has_dg: true }              → flags.has_dg === true
 *   { has_boiler: true }          → flags.has_boiler === true
 *   { has_first_aid: true }       → gates biomedical only
 *
 * The previous `active_haz_categories_contains` form is gone — all factories
 * see all hazardous categories per the inconsistency-J resolution in
 * docs/decisions.md.
 */
function evaluatePredicate(predicate: ConditionalPredicate, flags: FacilityFlags): boolean {
  for (const [key, expected] of Object.entries(predicate)) {
    if (flags[key] !== expected) return false;
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

/**
 * Maps facility_type DB enum to the FacilityTemplate used in the parameter
 * catalog. Post-2026-05-06 rescope: only 'factory' and 'warehouse' are valid.
 * If the DB still carries 'store' rows from a prior seed, this throws so the
 * caller surfaces the data drift instead of silently mis-classifying.
 */
export function facilityTypeToTemplate(dbType: string): FacilityTemplate {
  switch (dbType) {
    case 'factory':   return 'factory';
    case 'warehouse': return 'warehouse';
    default:
      throw new Error(
        `facilityTypeToTemplate: unsupported facility type "${dbType}". ` +
        `Post-2026-05-06 rescope only supports 'factory' and 'warehouse'. ` +
        `Run migration 003 + reseed if you see this.`
      );
  }
}
