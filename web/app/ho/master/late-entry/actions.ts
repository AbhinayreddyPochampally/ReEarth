'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/db/audit';

export type LateEntryResult =
  | { ok: true; entryId: string }
  | { ok: false; error: string };

// Late-entry override per inconsistency-D resolution (2026-05-06).
// HO submits a daily-log entry on behalf of a contributor with a date older
// than the contributor's own 2-day backdating window.
//
// Phase 2 stub: the entry is captured in the audit_log only. Phase 3 wires
// it through to the submissions table with actor_type='ho_override' and
// drives metric recompute. The reason field is mandatory — it's the
// architect's accountability record for why this override was needed.
export async function submitLateEntryAction(formData: FormData): Promise<LateEntryResult> {
  const session = await requireSession();
  if (session.role !== 'ho') {
    return { ok: false, error: 'Only HO can submit late entries.' };
  }

  const facilityId  = (formData.get('facility_id')  as string | null)?.trim() ?? '';
  const contributor = (formData.get('contributor_id') as string | null)?.trim() ?? '';
  const parameter   = (formData.get('parameter_code') as string | null)?.trim() ?? '';
  const periodDate  = (formData.get('period_date') as string | null)?.trim() ?? '';
  const valueStr    = (formData.get('value') as string | null)?.trim() ?? '';
  const reason      = (formData.get('reason') as string | null)?.trim() ?? '';

  if (!facilityId)  return { ok: false, error: 'Pick a facility.' };
  if (!contributor) return { ok: false, error: 'Pick a contributor.' };
  if (!parameter)   return { ok: false, error: 'Pick a parameter.' };
  if (!periodDate)  return { ok: false, error: 'Date is required.' };
  if (!valueStr)    return { ok: false, error: 'Value is required.' };
  if (!reason || reason.length < 8) {
    return { ok: false, error: 'Reason is required (≥8 chars). HO override needs a paper trail.' };
  }

  const value = Number(valueStr);
  if (Number.isNaN(value)) return { ok: false, error: 'Value must be a number.' };

  // Sanity check: late entries should only be used for dates >2 days old.
  // The contributor PWA's daily logger handles within-2-days backdating directly.
  const days = Math.floor((Date.now() - new Date(periodDate).getTime()) / (24 * 60 * 60 * 1000));
  if (days < 2) {
    return {
      ok: false,
      error: 'Late entries are for dates >2 days old. The contributor can backdate within 2 days from the daily logger.',
    };
  }

  const entryId = `lt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await logAuditEvent({
    event_type: 'ho_late_entry_submitted',
    actor_id: session.personnel_id,
    entity_type: 'submission',
    entity_id: entryId,
    metadata: {
      // Captures the actor_type=ho_override flag inside metadata until the
      // audit helper signature is widened in Phase 3 to accept actor_type
      // as a top-level field (per design doc §46.2).
      actor_type: 'ho_override',
      facility_id: facilityId,
      contributor_id: contributor,
      parameter_code: parameter,
      period_date: periodDate,
      value,
      reason,
      ho_actor: session.name,
      days_back: days,
    },
  });

  revalidatePath('/ho/master');
  revalidatePath('/ho/master/late-entry');
  return { ok: true, entryId };
}
