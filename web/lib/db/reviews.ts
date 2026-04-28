import { db } from './supabase';
import type { SubmissionStatus } from './types';

export interface PendingSubmission {
  id: string;
  facility_id: string;
  facility_name: string;
  parameter_id: string;
  parameter_name: string;
  value_normalized: number;
  unit_used: string;
  submitted_by_name: string;
  submitted_at: string;
  period_start: string;
  period_end: string;
  status: SubmissionStatus;
  thumb_url: string | null;
}

// Returns all pending standard submissions for the HO review queue,
// enriched with facility name, parameter name, and a public storage URL
// for the first evidence photo (null if none).
export async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  const { data, error } = await db
    .from('submissions')
    .select(`
      id,
      facility_id,
      parameter_id,
      value_normalized,
      unit_used,
      submitted_by_name,
      submitted_at,
      period_start,
      period_end,
      status,
      facilities ( name ),
      parameters ( name ),
      evidence ( storage_path )
    `)
    .eq('status', 'pending')
    .eq('event_type', 'standard')
    .order('submitted_at', { ascending: false });

  if (error || !data) return [];

  return data.map(row => {
    const r = row as Record<string, unknown>;
    const fac = r['facilities'] as { name: string } | null;
    const par = r['parameters'] as { name: string } | null;
    const evArr = r['evidence'] as { storage_path: string }[] | null;
    const firstPath = evArr?.[0]?.storage_path ?? null;

    // getPublicUrl is a synchronous URL builder (no network call).
    // Requires the 'evidence' bucket to be set public in Supabase dashboard.
    const thumbUrl = firstPath
      ? db.storage.from('evidence').getPublicUrl(firstPath).data.publicUrl
      : null;

    return {
      id: r['id'] as string,
      facility_id: r['facility_id'] as string,
      facility_name: fac?.name ?? 'Unknown facility',
      parameter_id: r['parameter_id'] as string,
      parameter_name: par?.name ?? 'Unknown parameter',
      value_normalized: r['value_normalized'] as number,
      unit_used: r['unit_used'] as string,
      submitted_by_name: r['submitted_by_name'] as string,
      submitted_at: r['submitted_at'] as string,
      period_start: r['period_start'] as string,
      period_end: r['period_end'] as string,
      status: r['status'] as SubmissionStatus,
      thumb_url: thumbUrl,
    };
  });
}
