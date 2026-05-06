'use client';

import { useState, useTransition } from 'react';
import { Check } from '@/components/reearth/Icons';
import { ConfidenceDot } from '@/components/reearth/ui';
import { bulkApproveHighConfidenceAction } from './actions';

// Bulk-approve preview modal per UI sketch p27 / p29.
//
// Triggered from the inbox page header. Shows the eligible green-confidence
// bills, lets the architect confirm, and fires the server action. A success
// banner replaces the modal body when the approval lands.

interface EligibleBill {
  id: string;
  facilityName: string;
  vendor: string;
  summary: string;
  confidence: number;
}

interface Props {
  bills: EligibleBill[];
}

export default function BulkApproveModal({ bills }: Props): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<{ count: number } | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleConfirm(): void {
    setError('');
    startTransition(async () => {
      const result = await bulkApproveHighConfidenceAction();
      if (result.ok) {
        setDone({ count: result.count });
      } else {
        setError(result.error);
      }
    });
  }

  function handleClose(): void {
    setOpen(false);
    // Reset on close so a subsequent click starts fresh
    setDone(null);
    setError('');
  }

  if (bills.length === 0) {
    // Render disabled trigger when nothing's eligible — gives a visible affordance
    return (
      <button
        className="inline-flex cursor-not-allowed items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]"
        disabled
        type="button"
      >
        <Check size={12} /> No green-confidence bills
      </button>
    );
  }

  return (
    <>
      <button
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Check size={12} /> Bulk approve · {bills.length} high-conf
      </button>

      {open && (
        <div
          aria-labelledby="bulk-approve-heading"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
        >
          <div className="re-card w-full max-w-[640px] bg-white shadow-xl">
            {done ? (
              <div className="p-6">
                <div className="t-h3 mb-2 flex items-center gap-2 text-[var(--good)]">
                  <Check size={18} /> Approved {done.count} bills
                </div>
                <p className="t-body-sm text-[var(--muted)]">
                  Each contributor will get a confirmation push notification when their bill is
                  approved. Metric recomputes will run on next dashboard load.
                </p>
                <div className="mt-5 flex justify-end">
                  <button
                    className="rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    onClick={handleClose}
                    type="button"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-[var(--line)] px-6 py-4">
                  <h2 className="t-h3" id="bulk-approve-heading">
                    Bulk approve · {bills.length} high-confidence bills
                  </h2>
                  <p className="t-body-sm mt-1 text-[var(--muted)]">
                    All bills below are green-tagged (OCR ≥90%, vendor matches master data, no
                    compliance breaches detected). Approving moves them to Approved and triggers
                    metric recompute.
                  </p>
                </div>
                <ul className="max-h-[360px] divide-y divide-[var(--line)] overflow-y-auto px-6 py-2">
                  {bills.map(bill => (
                    <li className="flex items-center gap-3 py-2.5 text-sm" key={bill.id}>
                      <span className="flex-1 font-semibold text-[var(--ink)]">
                        {bill.facilityName}
                      </span>
                      <span className="t-body-sm flex-1 text-[var(--muted)]">
                        {bill.vendor} — {bill.summary}
                      </span>
                      <ConfidenceDot value={bill.confidence} />
                    </li>
                  ))}
                </ul>
                <div className="border-t border-[var(--line)] px-6 py-3">
                  <p className="t-tiny text-[var(--muted)]">
                    ↳ Each contributor will get a confirmation push notification.
                  </p>
                </div>
                {error && (
                  <p className="mx-6 mb-3 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">
                    {error}
                  </p>
                )}
                <div className="flex justify-end gap-2 border-t border-[var(--line)] px-6 py-3">
                  <button
                    className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink-2)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    disabled={isPending}
                    onClick={handleClose}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--ink)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    disabled={isPending}
                    onClick={handleConfirm}
                    type="button"
                  >
                    {isPending ? 'Approving…' : `✓ Approve all ${bills.length}`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
