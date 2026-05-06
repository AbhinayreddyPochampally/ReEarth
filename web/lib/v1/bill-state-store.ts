// Module-level in-memory bill-state overlay for the demo.
//
// Phase 2 placeholder: bills live in-memory in lib/v1/sample-data.ts as a
// static seed. Server actions (approve / send back / bulk approve / upload)
// need to mutate "state" without touching the seed array (seed is the
// canonical starting state). This module holds two overlays:
//
//   1. State changes for existing bills (HO actions on a seeded bill).
//   2. New bills uploaded by contributors that don't exist in the seed.
//
// Both reset on server restart — by design for the demo. Phase 3 swaps both
// for a real `bills_inbox` table queried via @/lib/db/.
//
// Audit logging happens at the action layer; this store is just the
// read/write of state values.

import type { Bill, BillStatus } from './types';

interface BillStateOverlay {
  status: BillStatus;
  ho_action_at: string;
  ho_actor_id: string;
  ho_comment?: string;
}

// State overlay for existing seeded bills.
const stateOverlay = new Map<string, BillStateOverlay>();

// New bills uploaded by contributors during this server's lifetime.
const uploaded: Bill[] = [];

export function getBillStateOverride(billId: string): BillStateOverlay | undefined {
  return stateOverlay.get(billId);
}

export function setBillState(billId: string, state: BillStateOverlay): void {
  stateOverlay.set(billId, state);
}

export function addUploadedBill(bill: Bill): void {
  uploaded.push(bill);
}

export function getUploadedBills(): readonly Bill[] {
  return uploaded;
}

export function clearAllBillStates(): void {
  stateOverlay.clear();
  uploaded.length = 0;
}

// Read-side helper: returns the seed-then-uploaded bill list with each bill's
// live status applied (so a sent-back bill shows as 'sent_back' even if the
// seed says 'ready_for_review'). Order: uploaded bills appear at the top
// (most-recent-first) since they're new arrivals.
export function listBillsWithLiveStatus(seedBills: readonly Bill[]): Bill[] {
  // Newest uploads first
  const merged = [...uploaded.slice().reverse(), ...seedBills];
  return merged.map(bill => {
    const override = stateOverlay.get(bill.id);
    return override ? { ...bill, status: override.status } : bill;
  });
}
