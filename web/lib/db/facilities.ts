import bcrypt from 'bcryptjs';
import { db } from './supabase';
import type { Facility, Personnel } from './types';

// Returns the facility row or null.  Used for login step 1.
export async function getFacilityBySapCode(sapCode: string): Promise<Facility | null> {
  const { data, error } = await db
    .from('facilities')
    .select('*')
    .eq('sap_code', sapCode.toUpperCase())
    .is('active_to', null)
    .single();

  if (error || !data) return null;
  return data as Facility;
}

// Returns only name + role — safe to expose for the login name dropdown.
export async function getPersonnelForFacility(
  facilityId: string,
): Promise<Pick<Personnel, 'id' | 'name' | 'role'>[]> {
  const { data, error } = await db
    .from('personnel')
    .select('id, name, role')
    .eq('facility_id', facilityId)
    .is('active_to', null)
    .order('name');

  if (error || !data) return [];
  return data as Pick<Personnel, 'id' | 'name' | 'role'>[];
}

// Returns the specific personnel row (for session payload).
export async function getPersonnelById(
  personnelId: string,
): Promise<Personnel | null> {
  const { data, error } = await db
    .from('personnel')
    .select('*')
    .eq('id', personnelId)
    .single();

  if (error || !data) return null;
  return data as Personnel;
}

type PinCheckResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_pin'; attempts_remaining: number }
  | { ok: false; reason: 'locked_until'; locked_until: string };

// Verifies a 4-digit PIN against the facility's bcrypt hash.
// Implements Section 14.2: 5 failures → 15-minute lockout.
export async function checkFacilityPin(
  facility: Facility,
  pin: string,
): Promise<PinCheckResult> {
  // Check lockout first
  if (facility.pin_lockout_until) {
    const lockExpiry = new Date(facility.pin_lockout_until);
    if (lockExpiry > new Date()) {
      return { ok: false, reason: 'locked_until', locked_until: facility.pin_lockout_until };
    }
    // Lockout expired — reset attempts
    await db
      .from('facilities')
      .update({ pin_failed_attempts: 0, pin_lockout_until: null })
      .eq('id', facility.id);
    facility = { ...facility, pin_failed_attempts: 0, pin_lockout_until: null };
  }

  const valid = await bcrypt.compare(pin, facility.pin_hash);

  if (valid) {
    // Reset failure counter on success
    await db
      .from('facilities')
      .update({ pin_failed_attempts: 0, pin_lockout_until: null })
      .eq('id', facility.id);
    return { ok: true };
  }

  // Increment failure counter; lock if threshold reached
  const newAttempts = facility.pin_failed_attempts + 1;
  const MAX_ATTEMPTS = 5;
  const lockoutUntil =
    newAttempts >= MAX_ATTEMPTS
      ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
      : null;

  await db
    .from('facilities')
    .update({
      pin_failed_attempts: newAttempts,
      ...(lockoutUntil ? { pin_lockout_until: lockoutUntil } : {}),
    })
    .eq('id', facility.id);

  if (lockoutUntil) {
    return { ok: false, reason: 'locked_until', locked_until: lockoutUntil };
  }

  return {
    ok: false,
    reason: 'invalid_pin',
    attempts_remaining: MAX_ATTEMPTS - newAttempts,
  };
}
