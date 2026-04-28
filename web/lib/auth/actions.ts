'use server';

import { redirect } from 'next/navigation';
import { getSession } from './session';
import { getFacilityBySapCode, getPersonnelById, checkFacilityPin } from '@/lib/db/facilities';
import { logAuditEvent } from '@/lib/db/audit';

export type LoginResult =
  | { ok: true }
  | { ok: false; error: string };

export async function loginAction(
  _prev: LoginResult | null,
  formData: FormData,
): Promise<LoginResult> {
  const sap = (formData.get('sap') as string | null)?.trim().toUpperCase() ?? '';
  const pin = (formData.get('pin') as string | null)?.trim() ?? '';
  const personnelId = (formData.get('personnel_id') as string | null)?.trim() ?? '';

  if (!sap || !pin || !personnelId) {
    return { ok: false, error: 'All fields are required.' };
  }

  const facility = await getFacilityBySapCode(sap);
  if (!facility) {
    return { ok: false, error: 'Invalid SAP code.' };
  }

  const pinResult = await checkFacilityPin(facility, pin);
  if (!pinResult.ok) {
    if (pinResult.reason === 'locked_until') {
      const lockDate = new Date(pinResult.locked_until);
      const minutesLeft = Math.ceil((lockDate.getTime() - Date.now()) / 60000);
      return { ok: false, error: `Account locked. Try again in ${minutesLeft} minute(s).` };
    }
    const remaining = pinResult.attempts_remaining;
    return {
      ok: false,
      error: `Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
    };
  }

  const personnel = await getPersonnelById(personnelId);
  if (!personnel || personnel.facility_id !== facility.id) {
    return { ok: false, error: 'Invalid selection.' };
  }

  const session = await getSession();
  session.facility_id = facility.id;
  session.personnel_id = personnel.id;
  session.role = personnel.role;
  session.name = personnel.name;
  session.facility_name = facility.name;
  session.sap_code = facility.sap_code;
  await session.save();

  await logAuditEvent({
    event_type: 'pin_login_success',
    actor_id: personnel.id,
    entity_type: 'facility',
    entity_id: facility.id,
    metadata: { role: personnel.role, sap_code: facility.sap_code },
  });

  redirect(personnel.role === 'ho' ? '/ho' : '/contributor');
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  const actorId = session.personnel_id ?? null;
  const entityId = session.facility_id ?? 'unknown';
  session.destroy();

  await logAuditEvent({
    event_type: 'logout',
    actor_id: actorId ?? null,
    entity_type: 'facility',
    entity_id: entityId,
  });

  redirect('/login');
}
