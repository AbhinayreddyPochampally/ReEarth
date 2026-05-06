'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/db/audit';

export type SummaryResult = { ok: true; saved: number } | { ok: false; error: string };

// Phase 2 stub: monthly summary entries are accepted, audited, and otherwise
// held in-memory (we don't have a real submissions backing in v1 sample
// data for monthly aggregates yet). Phase 3 routes these into the real
// submissions table with frequency='monthly' + event_type='standard'.
const monthlySubmissions = new Map<string, Map<string, number>>();

export async function submitMonthlySummaryAction(
  period: string,
  formData: FormData,
): Promise<SummaryResult> {
  const session = await requireSession();
  if (session.role !== 'contributor') {
    return { ok: false, error: 'Only contributors can submit monthly summaries.' };
  }
  if (!session.facility_id) return { ok: false, error: 'No facility on session.' };

  const key = `${session.facility_id}|${period}`;
  if (!monthlySubmissions.has(key)) monthlySubmissions.set(key, new Map());
  const facilityMap = monthlySubmissions.get(key)!;

  let saved = 0;
  for (const [paramCode, raw] of formData.entries()) {
    if (typeof raw !== 'string') continue;
    if (!paramCode.startsWith('value_')) continue;
    const value = Number(raw.trim());
    if (Number.isNaN(value)) continue;
    const code = paramCode.slice('value_'.length);
    facilityMap.set(code, value);
    saved += 1;
  }

  await logAuditEvent({
    event_type: 'monthly_summary_submitted',
    actor_id: session.personnel_id,
    entity_type: 'facility',
    entity_id: session.facility_id,
    metadata: {
      period,
      saved_count: saved,
      values: Object.fromEntries(facilityMap.entries()),
    },
  });

  revalidatePath('/contributor');
  revalidatePath('/contributor/monthly');
  return { ok: true, saved };
}
