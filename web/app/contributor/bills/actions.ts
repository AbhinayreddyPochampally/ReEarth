'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/db/audit';
import { addUploadedBill, setBillState } from '@/lib/v1/bill-state-store';
import { runOCR } from '@/lib/ai/ocr';
import type { Bill, BillKind } from '@/lib/v1/types';

export type UploadResult =
  | { ok: true; billId: string }
  | { ok: false; error: string };

const VALID_KINDS: BillKind[] = ['electricity', 'diesel', 'water', 'lab_report', 'solar_ppa'];

// Phase 2 placeholder confidence — OCR hasn't run yet, so we mark the bill
// with a "no OCR" amber confidence (0.65). Phase 3 replaces this with the
// real Document Intelligence confidence.
const NO_OCR_CONFIDENCE = 0.65;

// Upload a new bill. Phase 2 stub: the file itself isn't persisted (real
// Supabase Storage upload comes with Phase 3 OCR pipeline). We capture metadata
// and create a Bill row that lands in the HO inbox immediately.
export async function uploadBillAction(formData: FormData): Promise<UploadResult> {
  const session = await requireSession();
  if (session.role !== 'contributor') {
    return { ok: false, error: 'Only contributors can upload bills.' };
  }
  if (!session.facility_id) {
    return { ok: false, error: 'No facility on session.' };
  }

  const kind = (formData.get('kind') as string | null)?.trim() ?? '';
  const vendor = (formData.get('vendor') as string | null)?.trim() ?? '';
  const period = (formData.get('period') as string | null)?.trim() ?? '';
  const filenameRaw = formData.get('file') as File | null;
  const filename = filenameRaw && filenameRaw.size > 0 ? filenameRaw.name : '';

  if (!VALID_KINDS.includes(kind as BillKind)) {
    return { ok: false, error: 'Pick a bill kind first.' };
  }
  if (!vendor) return { ok: false, error: 'Vendor is required.' };
  if (!period) return { ok: false, error: 'Period is required.' };

  // Phase 2 stub: filename is captured for the audit trail but the file is
  // discarded. Phase 3 streams it to Supabase Storage and triggers OCR via
  // the gateway in /lib/ai/ocr.ts.
  const billId = `up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const billDraft: Pick<Bill, 'id' | 'kind' | 'vendor'> = { id: billId, kind: kind as BillKind, vendor };
  const ocr = await runOCR(billDraft, `phase2-stub:${filename || 'no-file'}`);

  const bill: Bill = {
    id: billId,
    facilityId: session.facility_id,
    kind: kind as BillKind,
    vendor,
    period,
    uploadedBy: session.personnel_id,
    ageHours: 0,
    status: 'ready_for_review',
    // OCR result drives the inbox confidence. If OCR errored, fall back to
    // NO_OCR_CONFIDENCE so the bill still routes to the inbox.
    confidence: ocr.ok ? ocr.documentConfidence : NO_OCR_CONFIDENCE,
    breach: false,
    extracted: ocr.ok ? ocr.fields : [],
  };

  addUploadedBill(bill);

  await logAuditEvent({
    event_type: 'bill_uploaded',
    actor_id: session.personnel_id,
    entity_type: 'submission',
    entity_id: billId,
    metadata: {
      facility_id: session.facility_id,
      kind,
      vendor,
      period,
      filename: filename || null,
      ocr_run: false,
    },
  });

  revalidatePath('/contributor/bills');
  revalidatePath('/ho/inbox');
  return { ok: true, billId };
}

// Re-upload after a sent-back bill (UI sketch p18). Resets the bill to
// ready_for_review (clearing the sent_back state) so HO sees it fresh.
export async function reuploadBillAction(billId: string, formData: FormData): Promise<UploadResult> {
  const session = await requireSession();
  if (session.role !== 'contributor') {
    return { ok: false, error: 'Only contributors can re-upload.' };
  }
  if (!session.facility_id) {
    return { ok: false, error: 'No facility on session.' };
  }

  const filenameRaw = formData.get('file') as File | null;
  const filename = filenameRaw && filenameRaw.size > 0 ? filenameRaw.name : '';
  if (!filename) {
    return { ok: false, error: 'Pick a file to re-upload.' };
  }

  // Reset the override to ready_for_review so the bill flows back to HO.
  setBillState(billId, {
    status: 'ready_for_review',
    ho_action_at: new Date().toISOString(),
    ho_actor_id: session.personnel_id,
  });

  await logAuditEvent({
    event_type: 'bill_reuploaded',
    actor_id: session.personnel_id,
    entity_type: 'submission',
    entity_id: billId,
    metadata: { filename, facility_id: session.facility_id },
  });

  revalidatePath('/contributor/bills');
  revalidatePath('/ho/inbox');
  return { ok: true, billId };
}
