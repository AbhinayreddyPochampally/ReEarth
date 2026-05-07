'use server';

import { revalidatePath } from 'next/cache';
import { requireSession } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/db/audit';
import { addUploadedBill } from '@/lib/v1/bill-state-store';
import { resolveV1FacilityId } from '@/lib/v1/sample-data';
import type { Bill, BillKind } from '@/lib/v1/types';

export type EventResult = { ok: true; eventId: string } | { ok: false; error: string };

// Map event-form types to a Bill kind for the inbox flow. Most event types
// produce a delivery slip / invoice / lab report, which we model as a Bill
// row that lands in the HO inbox. Phase 3 swaps this stub with real
// submission_evidence rows + per-event-specialised parameter writes.
const EVENT_TO_BILL_KIND: Record<string, BillKind> = {
  'tanker-water':       'water',
  'drinking-water':     'water',
  'diesel-delivery':    'diesel',
  'biomass-delivery':   'diesel',     // biomass slips are processed similarly
  'lpg-delivery':       'diesel',
  'vehicle-fuel':       'diesel',
  'refrigerant-refill': 'lab_report', // service invoice; HO confirms gas type
  'co2-refill':         'lab_report',
  'lab-test':           'lab_report',
  'waste-pickup':       'lab_report', // manifest treated as lab-style document
};

const NO_OCR_CONFIDENCE = 0.65;

export async function logEventAction(formData: FormData): Promise<EventResult> {
  const session = await requireSession();
  if (session.role !== 'contributor') {
    return { ok: false, error: 'Only contributors can log events.' };
  }
  if (!session.facility_id) return { ok: false, error: 'No facility on session.' };

  const eventType = (formData.get('event_type') as string | null)?.trim() ?? '';
  const vendor = (formData.get('vendor') as string | null)?.trim() ?? '';
  const quantity = (formData.get('quantity') as string | null)?.trim() ?? '';
  const unit = (formData.get('unit') as string | null)?.trim() ?? '';
  const notes = (formData.get('notes') as string | null)?.trim() ?? '';
  const filenameRaw = formData.get('file') as File | null;
  const filename = filenameRaw && filenameRaw.size > 0 ? filenameRaw.name : '';

  const billKind = EVENT_TO_BILL_KIND[eventType];
  if (!billKind) return { ok: false, error: 'Unknown event type.' };
  if (!vendor) return { ok: false, error: 'Vendor is required.' };
  if (!quantity) return { ok: false, error: 'Quantity is required.' };

  const eventId = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const today = new Date().toISOString().slice(0, 10);

  // SAP-code bridge so the new bill appears in the contributor's My-Bills list
  // (which filters the in-memory v1 array by string id, not Supabase UUID).
  const v1FacilityId = resolveV1FacilityId({ sapCode: session.sap_code, facilityId: session.facility_id });
  const bill: Bill = {
    id: eventId,
    facilityId: v1FacilityId,
    kind: billKind,
    vendor,
    period: today,
    uploadedBy: session.personnel_id,
    ageHours: 0,
    status: 'ready_for_review',
    confidence: NO_OCR_CONFIDENCE,
    breach: false,
    extracted: [
      {
        key: 'quantity',
        label: `Quantity (${eventType})`,
        rawText: `${quantity} ${unit}`.trim(),
        parsedValue: Number(quantity) || quantity,
        unit: unit || '—',
        confidence: NO_OCR_CONFIDENCE,
        page: 1,
        bbox: { x: 0.4, y: 0.3, w: 0.2, h: 0.05 },
      },
    ],
  };

  addUploadedBill(bill);

  await logAuditEvent({
    event_type: 'event_logged',
    actor_id: session.personnel_id,
    entity_type: 'submission',
    entity_id: eventId,
    metadata: {
      facility_id: session.facility_id,
      event_type: eventType,
      vendor,
      quantity,
      unit,
      filename: filename || null,
      notes: notes || null,
    },
  });

  revalidatePath('/contributor');
  revalidatePath('/contributor/bills');
  revalidatePath('/ho/inbox');
  return { ok: true, eventId };
}
