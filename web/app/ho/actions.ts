'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth/session';
import { db } from '@/lib/db/supabase';
import { logAuditEvent } from '@/lib/db/audit';

export type ReviewResult = { ok: true } | { ok: false; error: string };

export async function approveSubmission(submissionId: string): Promise<ReviewResult> {
  const session = await requireSession();
  if (session.role !== 'ho') return { ok: false, error: 'Not authorized.' };

  const { error } = await db
    .from('submissions')
    .update({ status: 'approved' })
    .eq('id', submissionId)
    .eq('status', 'pending');

  if (error) return { ok: false, error: error.message };

  await logAuditEvent({
    event_type: 'submission_approved',
    actor_id: session.personnel_id,
    entity_type: 'submission',
    entity_id: submissionId,
    metadata: { approved_by: session.name },
  });

  revalidatePath('/ho');
  return { ok: true };
}

export async function sendBackSubmission(
  submissionId: string,
  comment: string,
): Promise<ReviewResult> {
  const session = await requireSession();
  if (session.role !== 'ho') return { ok: false, error: 'Not authorized.' };

  const trimmed = comment.trim();
  if (!trimmed) return { ok: false, error: 'A comment is required when sending back.' };

  const { error: subErr } = await db
    .from('submissions')
    .update({ status: 'sent_back' })
    .eq('id', submissionId)
    .eq('status', 'pending');

  if (subErr) return { ok: false, error: subErr.message };

  // Create the discussion thread for this submission
  const { data: thread, error: thrErr } = await db
    .from('discussion_threads')
    .insert({ submission_id: submissionId, status: 'open' })
    .select('id')
    .single();

  if (thrErr || !thread) {
    return { ok: false, error: thrErr?.message ?? 'Could not create discussion thread.' };
  }

  const { error: msgErr } = await db.from('discussion_messages').insert({
    thread_id: (thread as { id: string }).id,
    author_id: session.personnel_id,
    author_role: 'ho',
    message_text: trimmed,
  });

  if (msgErr) return { ok: false, error: msgErr.message };

  await logAuditEvent({
    event_type: 'submission_sent_back',
    actor_id: session.personnel_id,
    entity_type: 'submission',
    entity_id: submissionId,
    metadata: { sent_back_by: session.name, comment: trimmed },
  });

  revalidatePath('/ho');
  return { ok: true };
}
