import { PROFILES, CATEGORY_DEFAULTS, type ValueRange } from '../data/size-profiles';

// Returns a deterministic-ish synthetic value for a parameter at a facility.
// month: 0=Feb 2026, 1=Mar 2026, 2=Apr 2026 (used for mild drift).
// The value is rounded to 1 decimal place for realism.
export function syntheticValue(
  sapCode: string,
  paramCode: string,
  category: string,
  monthIndex: number,
): number {
  const profile = PROFILES[sapCode];
  const range: ValueRange | undefined = profile
    ? (profile as Record<string, ValueRange | undefined>)[paramCode]
    : undefined;

  const [min, max] = range ?? CATEGORY_DEFAULTS[category] ?? [10, 100];

  // Mild upward drift month-over-month (0.5% per month) for realism
  const driftFactor = 1 + monthIndex * 0.005;
  const base = min + Math.random() * (max - min);
  const raw = base * driftFactor;

  // Return integer for large values (≥50), one decimal for small values
  return raw >= 50 ? Math.round(raw) : Math.round(raw * 10) / 10;
}

// Produces a human-readable string matching how a contributor would type the value.
// e.g. 3241 → "3241", 12.4 → "12.4"
export function valueRaw(value: number): string {
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}
