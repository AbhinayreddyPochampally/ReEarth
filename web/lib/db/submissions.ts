import { db } from './supabase';
import type { Parameter, ParameterWithStatus, Submission } from './types';

// Returns all active parameters assigned to a facility, joined with the most
// recent submission for the current calendar month (if any).
// Used to render the contributor Home screen.
export async function getParametersWithStatus(
  facilityId: string,
): Promise<ParameterWithStatus[]> {
  // Fetch active assignments with parameter data
  const { data: assignments, error: aErr } = await db
    .from('parameter_assignments')
    .select('parameter_id, parameters(id, code, name, unit, frequency, evidence_required, category, active_to)')
    .eq('facility_id', facilityId)
    .is('active_to', null);

  if (aErr || !assignments) return [];

  const params = assignments
    .map(a => a.parameters as unknown as Parameter)
    .filter(p => p && !p.active_to);

  if (params.length === 0) return [];

  // Current period: first/last day of today's month
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  // Fetch current-month standard submissions for these parameters
  const paramIds = params.map(p => p.id);
  const { data: subs } = await db
    .from('submissions')
    .select('id, parameter_id, status, period_start, submitted_at')
    .eq('facility_id', facilityId)
    .in('parameter_id', paramIds)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .eq('event_type', 'standard')
    .order('submitted_at', { ascending: false });

  // Build a map: paramId → latest submission
  const latestByParam = new Map<
    string,
    Pick<Submission, 'id' | 'status' | 'period_start' | 'submitted_at'>
  >();
  for (const s of subs ?? []) {
    if (!latestByParam.has(s.parameter_id as string)) {
      latestByParam.set(s.parameter_id as string, {
        id: s.id as string,
        status: s.status as Submission['status'],
        period_start: s.period_start as string,
        submitted_at: s.submitted_at as string,
      });
    }
  }

  return params.map(p => ({
    ...p,
    latest_submission: latestByParam.get(p.id) ?? null,
  }));
}

export async function getParameterById(parameterId: string): Promise<Parameter | null> {
  const { data, error } = await db
    .from('parameters')
    .select('*')
    .eq('id', parameterId)
    .single();

  if (error || !data) return null;
  return data as Parameter;
}

interface CreateSubmissionInput {
  facility_id: string;
  parameter_id: string;
  submitted_by: string;
  submitted_by_name: string;
  value_raw: string;
  value_normalized: number;
  unit_used: string;
  period_start: string;
  period_end: string;
}

// Creates a new standard submission row and returns its ID.
export async function createSubmission(input: CreateSubmissionInput): Promise<string> {
  const now = new Date().toISOString();
  const { data, error } = await db
    .from('submissions')
    .insert({
      facility_id: input.facility_id,
      parameter_id: input.parameter_id,
      submitted_by: input.submitted_by,
      submitted_by_name: input.submitted_by_name,
      event_at: now,
      submitted_at: now,
      period_start: input.period_start,
      period_end: input.period_end,
      value_raw: input.value_raw,
      unit_used: input.unit_used,
      value_normalized: input.value_normalized,
      event_type: 'standard',
      status: 'pending',
      ocr_run: false,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create submission: ${error?.message ?? 'unknown error'}`);
  }
  return (data as { id: string }).id;
}

// Uploads a photo to Supabase Storage and creates an evidence row.
// Non-fatal: if storage is not configured, logs a warning and returns.
export async function attachEvidence(
  submissionId: string,
  file: File,
): Promise<void> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `submissions/${submissionId}/evidence.${ext}`;

  const { error: uploadErr } = await db.storage
    .from('evidence')
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadErr) {
    console.warn('[evidence] storage upload failed:', uploadErr.message);
    return;
  }

  const { error: rowErr } = await db.from('evidence').insert({
    submission_id: submissionId,
    storage_path: path,
    evidence_type: 'photo',
    mime_type: file.type,
    file_size_bytes: file.size,
  });

  if (rowErr) {
    console.warn('[evidence] row insert failed:', rowErr.message);
  }
}
