import bcrypt from 'bcryptjs';
import { db } from './supabase';
import type { Facility, Personnel } from './types';
import { facilities as v1Facilities, personnel as v1Personnel } from '@/lib/v1/sample-data';

function demoFacilityBySapCode(sapCode: string): Facility | null {
  const facility = v1Facilities.find(item => item.sapCode === sapCode.toUpperCase());
  if (!facility) return null;
  return {
    id: facility.id,
    sap_code: facility.sapCode,
    name: facility.name,
    type: facility.kind,
    brand: null,
    city: facility.city,
    state: facility.state,
    pincode: '560001',
    address: `${facility.name}, ${facility.city}`,
    // size_sqft was dropped from Facility in the 2026-05-06 rescope (floor area
    // moved to a master-data parameter). The v1 sample data still carries
    // areaSqft; we just don't propagate it to the Facility shape anymore.
    flags: facility.flags,
    pin_hash: 'demo:7421',
    pin_failed_attempts: 0,
    pin_lockout_until: null,
    active_from: '2026-05-01T00:00:00.000Z',
    active_to: null,
  };
}

function demoPersonnelByFacility(facilityId: string): Pick<Personnel, 'id' | 'name' | 'role'>[] {
  const rows = v1Personnel.filter(person => person.facilityIds.includes(facilityId));
  if (facilityId === 'fac-bengaluru' && !rows.some(person => person.role === 'ho')) {
    return [...rows, { id: 'neha', name: 'Neha Sharma', role: 'ho' }];
  }
  return rows.map(person => ({ id: person.id, name: person.name, role: person.role }));
}

function demoPersonnelById(personnelId: string): Personnel | null {
  const person = v1Personnel.find(item => item.id === personnelId);
  if (!person) return null;
  // Post-2026-05-06 rescope: HO users have facility_id=null. Demo HO matches
  // the seeded super-user (Neha Sharma); plaintext password is recognised by
  // the 'demo:' prefix in actions.ts.
  const isHO = person.role === 'ho';
  return {
    id: person.id,
    facility_id: isHO ? null : person.facilityIds[0]!,
    name: person.name,
    designation: isHO ? 'Head of Sustainability' : 'Facility contributor',
    email: isHO ? 'neha.sharma@abfrl.com' : null,
    password_hash: isHO ? 'demo:ChangeMeNeha!2026' : null,
    is_super_user: isHO,
    role: person.role,
    active_to: null,
  };
}

// Returns the facility row or null.  Used for login step 2 (PIN check).
export async function getFacilityBySapCode(sapCode: string): Promise<Facility | null> {
  const demoFacility = demoFacilityBySapCode(sapCode);
  if (demoFacility) return demoFacility;

  const { data, error } = await db
    .from('facilities')
    .select('*')
    .eq('sap_code', sapCode.toUpperCase())
    .is('active_to', null)
    .single();

  if (error || !data) return null;
  return data as Facility;
}

// Returns the facility row by primary key. Used for login step 2 (PIN check)
// after the contributor has selected a facility from the picker.
export async function getFacilityById(facilityId: string): Promise<Facility | null> {
  const demoFacility = v1Facilities.find(item => item.id === facilityId);
  if (demoFacility) {
    return demoFacilityBySapCode(demoFacility.sapCode);
  }
  const { data, error } = await db
    .from('facilities')
    .select('*')
    .eq('id', facilityId)
    .is('active_to', null)
    .single();
  if (error || !data) return null;
  return data as Facility;
}

// Picker row shape — minimal fields for the contributor login facility picker.
// Per UI sketch p3, each row shows name + city + a factory/warehouse icon.
export interface FacilityPickerRow {
  id: string;
  sap_code: string;
  name: string;
  type: 'factory' | 'warehouse';
  city: string;
  state: string;
}

// Returns all active facilities as picker rows. Used by the login facility picker.
// Sorted by type (factories first) then by name for stable scrolling.
export async function listAllActiveFacilities(): Promise<FacilityPickerRow[]> {
  // Demo path — used when the v1 sample data is the source.
  if (v1Facilities.length > 0) {
    return v1Facilities
      .map(facility => ({
        id: facility.id,
        sap_code: facility.sapCode,
        name: facility.name,
        type: facility.kind,
        city: facility.city,
        state: facility.state,
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'factory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }

  const { data, error } = await db
    .from('facilities')
    .select('id, sap_code, name, type, city, state')
    .is('active_to', null)
    .order('type', { ascending: true })
    .order('name', { ascending: true });

  if (error || !data) return [];
  return data as FacilityPickerRow[];
}

// Returns only name + role — safe to expose for the login name dropdown.
export async function getPersonnelForFacility(
  facilityId: string,
): Promise<Pick<Personnel, 'id' | 'name' | 'role'>[]> {
  const demoPersonnel = demoPersonnelByFacility(facilityId);
  if (demoPersonnel.length > 0) return demoPersonnel;

  const { data, error } = await db
    .from('personnel')
    .select('id, name, role')
    .eq('facility_id', facilityId)
    .is('active_to', null)
    .order('name');

  if (error || !data) return [];
  const rows = data as Pick<Personnel, 'id' | 'name' | 'role'>[];
  return rows;
}

// Returns the specific personnel row (for session payload).
export async function getPersonnelById(
  personnelId: string,
): Promise<Personnel | null> {
  const demoPerson = demoPersonnelById(personnelId);
  if (demoPerson) return demoPerson;

  const { data, error } = await db
    .from('personnel')
    .select('*')
    .eq('id', personnelId)
    .single();

  if (error || !data) return null;
  return data as Personnel;
}

// Returns the HO personnel row matching this email (case-insensitive), with
// password_hash for bcrypt comparison. Used by the HO login flow per UI
// sketch p25 + design doc §28.3 / §45.1. Returns null if no match.
//
// Demo-mode fallback: any v1 personnel row with role='ho' matches the demo
// password 'ChangeMeNeha!2026'. Production path uses bcrypt.compare against
// the seeded password_hash.
export async function getHOPersonnelByEmail(
  email: string,
): Promise<(Personnel & { password_hash: string | null; is_super_user: boolean }) | null> {
  const normalized = email.trim().toLowerCase();
  // Demo-mode fallback
  const demoHO = v1Personnel.find(p => p.role === 'ho');
  if (demoHO) {
    return {
      id: demoHO.id,
      facility_id: null,
      name: demoHO.name,
      designation: 'Head of Sustainability',
      email: 'neha.sharma@abfrl.com',
      password_hash: 'demo:ChangeMeNeha!2026',
      is_super_user: true,
      role: demoHO.role,
      active_to: null,
    };
  }

  const { data, error } = await db
    .from('personnel')
    .select('id, facility_id, name, designation, email, password_hash, is_super_user, role, active_to')
    .eq('role', 'ho')
    .ilike('email', normalized)
    .is('active_to', null)
    .single();
  if (error || !data) return null;
  return data as Personnel & { password_hash: string | null; is_super_user: boolean };
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
  if (facility.pin_hash.startsWith('demo:')) {
    return pin === facility.pin_hash.slice(5)
      ? { ok: true }
      : { ok: false, reason: 'invalid_pin', attempts_remaining: 4 };
  }

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
