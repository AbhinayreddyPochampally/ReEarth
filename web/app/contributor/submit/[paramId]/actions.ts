'use server';

import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/session';
import { getParameterById, createSubmission, attachEvidence } from '@/lib/db/submissions';
import { logAuditEvent } from '@/lib/db/audit';

export type SubmitResult = { ok: false; error: string } | { ok: true };

export async function submitFormAction(
  _prev: SubmitResult | null,
  formData: FormData,
): Promise<SubmitResult> {
  const session = await requireSession();

  const parameterId = formData.get('parameter_id');
  const valueStr = formData.get('value');
  const periodStart = formData.get('period_start');
  const periodEnd = formData.get('period_end');
  const photo = formData.get('photo');

  if (
    typeof parameterId !== 'string' ||
    typeof valueStr !== 'string' ||
    typeof periodStart !== 'string' ||
    typeof periodEnd !== 'string'
  ) {
    return { ok: false, error: 'Invalid form data.' };
  }

  const numericValue = parseFloat(valueStr);
  if (isNaN(numericValue) || numericValue < 0) {
    return { ok: false, error: 'Please enter a valid non-negative number.' };
  }

  const param = await getParameterById(parameterId);
  if (!param) return { ok: false, error: 'Parameter not found.' };

  let submissionId: string;
  try {
    submissionId = await createSubmission({
      facility_id: session.facility_id,
      parameter_id: parameterId,
      submitted_by: session.personnel_id,
      submitted_by_name: session.name,
      value_raw: valueStr,
      value_normalized: numericValue,
      unit_used: param.unit,
      period_start: periodStart,
      period_end: periodEnd,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Submission failed.';
    return { ok: false, error: msg };
  }

  if (photo instanceof File && photo.size > 0) {
    await attachEvidence(submissionId, photo);
  }

  await logAuditEvent({
    event_type: 'submission_created',
    actor_id: session.personnel_id,
    entity_type: 'submission',
    entity_id: submissionId,
    metadata: {
      parameter_code: param.code,
      value_raw: valueStr,
      unit: param.unit,
      period_start: periodStart,
    },
  });

  redirect('/contributor');
}
