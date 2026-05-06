'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { getSession } from './session';
import {
  checkFacilityPin,
  getFacilityById,
  getHOPersonnelByEmail,
  getPersonnelById,
} from '@/lib/db/facilities';
import { logAuditEvent } from '@/lib/db/audit';

export type LoginResult = { ok: true } | { ok: false; error: string };

// Contributor login (post-2026-05-06 rescope, three-step flow).
//
// Form fields:
//   facility_id   — chosen at step 1 (UI sketch p3)
//   pin           — entered at step 2 (UI sketch p4)
//   personnel_id  — picked at step 3, submitted as the button's `value` (UI sketch p5)
//
// Contract: every successful login records a `pin_login_success` audit event;
// every failure records a `pin_login_failure` event. Lockout (5 attempts /
// 15 min) is enforced inside checkFacilityPin per design doc §20.3.
export async function contributorLoginAction(
  _prev: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const facilityId = (formData.get('facility_id') as string | null)?.trim() ?? '';
  const pin = (formData.get('pin') as string | null)?.trim() ?? '';
  const personnelId = (formData.get('personnel_id') as string | null)?.trim() ?? '';

  if (!facilityId || !pin || !personnelId) {
    return { ok: false, error: 'Pick facility, enter PIN, and tap your name.' };
  }

  const facility = await getFacilityById(facilityId);
  if (!facility) {
    return { ok: false, error: 'Facility not found. Pick again.' };
  }

  const pinResult = await checkFacilityPin(facility, pin);
  if (!pinResult.ok) {
    // Audit every PIN failure — needed for brute-force forensics per
    // security review (4.6). The audit row carries facility id but never
    // the attempted PIN.
    await logAuditEvent({
      event_type: 'pin_login_failure',
      actor_id: null,
      entity_type: 'facility',
      entity_id: facility.id,
      metadata: {
        sap_code: facility.sap_code,
        reason: pinResult.reason,
        ...(pinResult.reason === 'invalid_pin'
          ? { attempts_remaining: pinResult.attempts_remaining }
          : { locked_until: pinResult.locked_until }),
      },
    });

    if (pinResult.reason === 'locked_until') {
      const lockDate = new Date(pinResult.locked_until);
      const minutesLeft = Math.max(1, Math.ceil((lockDate.getTime() - Date.now()) / 60000));
      return { ok: false, error: `Too many wrong PINs. Locked for ${minutesLeft} min.` };
    }
    const remaining = pinResult.attempts_remaining;
    return {
      ok: false,
      error: `Wrong PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  const personnel = await getPersonnelById(personnelId);
  if (!personnel || personnel.facility_id !== facility.id || personnel.role !== 'contributor') {
    // Generic error — don't reveal which check failed (whether the personnel
    // record exists, belongs to a different facility, or has a different
    // role). Per security review (4.6).
    await logAuditEvent({
      event_type: 'pin_login_personnel_mismatch',
      actor_id: null,
      entity_type: 'facility',
      entity_id: facility.id,
      metadata: { sap_code: facility.sap_code },
    });
    return { ok: false, error: 'Selection didn’t match. Try again.' };
  }

  const session = await getSession();
  session.personnel_id = personnel.id;
  session.facility_id = facility.id;
  session.role = 'contributor';
  session.name = personnel.name;
  session.facility_name = facility.name;
  session.sap_code = facility.sap_code;
  await session.save();

  await logAuditEvent({
    event_type: 'pin_login_success',
    actor_id: personnel.id,
    entity_type: 'facility',
    entity_id: facility.id,
    metadata: { role: 'contributor', sap_code: facility.sap_code },
  });

  redirect('/contributor');
}

// HO login (UI sketch p25, design doc §28.3 / §45.1).
// Email + password. No facility picker. Sets session with facility_id=null,
// role='ho', and personnel_id set to the matched HO row.
//
// Bcrypt comparison against personnel.password_hash. Demo-mode rows carry a
// 'demo:' prefix on the hash so the seeded plaintext password compares
// without bcrypt — see getHOPersonnelByEmail.
export async function hoLoginAction(
  _prev: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  const password = (formData.get('password') as string | null) ?? '';

  if (!email || !password) {
    return { ok: false, error: 'Enter your email and password.' };
  }

  const ho = await getHOPersonnelByEmail(email);
  if (!ho) {
    return { ok: false, error: 'Email not recognized.' };
  }

  const hash = ho.password_hash ?? '';
  let valid = false;
  if (hash.startsWith('demo:')) {
    valid = password === hash.slice(5);
  } else if (hash) {
    try {
      valid = await bcrypt.compare(password, hash);
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    await logAuditEvent({
      event_type: 'ho_login_failure',
      actor_id: ho.id,
      entity_type: 'personnel',
      entity_id: ho.id,
      metadata: { email },
    });
    return { ok: false, error: 'Wrong password.' };
  }

  const session = await getSession();
  session.personnel_id = ho.id;
  session.facility_id = null;
  session.role = 'ho';
  session.name = ho.name;
  session.facility_name = null;
  session.sap_code = null;
  session.is_super_user = ho.is_super_user;
  await session.save();

  await logAuditEvent({
    event_type: 'ho_login_success',
    actor_id: ho.id,
    entity_type: 'personnel',
    entity_id: ho.id,
    metadata: { is_super_user: ho.is_super_user },
  });

  redirect('/ho');
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  const actorId = session.personnel_id ?? null;
  const wasHO = session.role === 'ho';
  const entityId = wasHO
    ? actorId ?? 'unknown'
    : session.facility_id ?? 'unknown';
  session.destroy();

  await logAuditEvent({
    event_type: 'logout',
    actor_id: actorId ?? null,
    entity_type: wasHO ? 'personnel' : 'facility',
    entity_id: entityId,
  });

  redirect('/login');
}
