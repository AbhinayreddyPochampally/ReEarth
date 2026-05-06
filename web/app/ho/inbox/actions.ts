'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/db/audit';
import { setBillState } from '@/lib/v1/bill-state-store';
import { bills } from '@/lib/v1/sample-data';

export type InboxResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

const HIGH_CONFIDENCE_THRESHOLD = 0.90;

// Approve a single bill. Per design doc §30, approval makes the bill's
// extracted values canonical and triggers downstream metric recomputation
// (the recomputation hook is Phase 2 task 2.12 — for now the action just
// sets state and audits).
export async function approveBillAction(billId: string): Promise<InboxResult> {
  const session = await requireSession();
  if (session.role !== 'ho') return { ok: false, error: 'Only HO can approve bills.' };
  if (!bills.find(b => b.id === billId)) return { ok: false, error: 'Bill not found.' };

  setBillState(billId, {
    status: 'approved',
    ho_action_at: new Date().toISOString(),
    ho_actor_id: session.personnel_id,
  });

  await logAuditEvent({
    event_type: 'bill_approved',
    actor_id: session.personnel_id,
    entity_type: 'submission',
    entity_id: billId,
    metadata: { approved_by: session.name },
  });

  revalidatePath('/ho/inbox');
  revalidatePath(`/ho/inbox/${billId}`);
  return { ok: true, count: 1 };
}

// Send a bill back. Per design doc §30.4 a comment is required and a
// discussion thread is opened (Phase 2 wiring TBD on the discussion side;
// for now the comment is captured in the audit log and the bill state).
export async function sendBackBillAction(
  billId: string,
  comment: string,
): Promise<InboxResult> {
  const session = await requireSession();
  if (session.role !== 'ho') return { ok: false, error: 'Only HO can send bills back.' };
  if (!bills.find(b => b.id === billId)) return { ok: false, error: 'Bill not found.' };

  const trimmed = comment.trim();
  if (!trimmed) return { ok: false, error: 'A reason is required when sending a bill back.' };

  setBillState(billId, {
    status: 'sent_back',
    ho_action_at: new Date().toISOString(),
    ho_actor_id: session.personnel_id,
    ho_comment: trimmed,
  });

  await logAuditEvent({
    event_type: 'bill_sent_back',
    actor_id: session.personnel_id,
    entity_type: 'submission',
    entity_id: billId,
    metadata: { sent_back_by: session.name, comment: trimmed },
  });

  revalidatePath('/ho/inbox');
  revalidatePath(`/ho/inbox/${billId}`);
  return { ok: true, count: 1 };
}

// Bulk-approve every green-confidence bill that's still awaiting review and
// not flagged as a breach. UI sketch p29 shows the modal preview; the action
// itself is what fires after the architect confirms.
//
// Excludes breaches deliberately: per design doc §30.2, green confidence is
// "OCR confident, structure matches, vendor recognised — safe to bulk-approve."
// A breach is none of those guarantees safe by themselves.
export async function bulkApproveHighConfidenceAction(): Promise<InboxResult> {
  const session = await requireSession();
  if (session.role !== 'ho') return { ok: false, error: 'Only HO can bulk-approve.' };

  const eligible = bills.filter(
    b => b.confidence >= HIGH_CONFIDENCE_THRESHOLD && !b.breach && b.status === 'ready_for_review',
  );

  const approvedAt = new Date().toISOString();
  for (const bill of eligible) {
    setBillState(bill.id, {
      status: 'approved',
      ho_action_at: approvedAt,
      ho_actor_id: session.personnel_id,
    });
  }

  await logAuditEvent({
    event_type: 'bills_bulk_approved',
    actor_id: session.personnel_id,
    entity_type: 'submission',
    entity_id: 'bulk',
    metadata: {
      approved_by: session.name,
      count: eligible.length,
      bill_ids: eligible.map(b => b.id),
      threshold: HIGH_CONFIDENCE_THRESHOLD,
    },
  });

  revalidatePath('/ho/inbox');
  return { ok: true, count: eligible.length };
}
