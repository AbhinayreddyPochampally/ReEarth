'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveBillAction, sendBackBillAction } from '../actions';

// Approve / Send-back buttons for the detail page. Send-back captures a
// required comment via a small inline textarea (UI sketch p28 + p29 thread
// preview). On success, navigates back to the inbox.

interface Props {
  billId: string;
  hasBreach: boolean;
}

export default function BillActions({ billId, hasBreach }: Props): React.ReactElement {
  const router = useRouter();
  const [showSendBack, setShowSendBack] = useState(false);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleApprove(): void {
    setError('');
    startTransition(async () => {
      const result = await approveBillAction(billId);
      if (result.ok) {
        router.push('/ho/inbox');
      } else {
        setError(result.error);
      }
    });
  }

  function handleSendBack(): void {
    setError('');
    if (!comment.trim()) {
      setError('Please explain why this is being sent back.');
      return;
    }
    startTransition(async () => {
      const result = await sendBackBillAction(billId, comment);
      if (result.ok) {
        router.push('/ho/inbox');
      } else {
        setError(result.error);
      }
    });
  }

  if (showSendBack) {
    return (
      <div className="space-y-3">
        <label className="t-body-sm block font-semibold text-[var(--ink-2)]" htmlFor="sb-comment">
          Why is this being sent back?
        </label>
        <textarea
          autoFocus
          className="re-input min-h-[88px] w-full"
          disabled={isPending}
          id="sb-comment"
          onChange={event => setComment(event.target.value)}
          placeholder="The contributor sees this in the discussion thread."
          value={comment}
        />
        {error && (
          <p
            aria-live="assertive"
            className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]"
            role="alert"
          >
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink-2)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            disabled={isPending}
            onClick={() => {
              setShowSendBack(false);
              setError('');
            }}
            type="button"
          >
            Cancel
          </button>
          <button
            className="flex-1 rounded-lg border border-[var(--danger)] bg-[var(--danger)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            disabled={isPending}
            onClick={handleSendBack}
            type="button"
          >
            {isPending ? 'Sending…' : 'Send back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p
          aria-live="assertive"
          className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]"
          role="alert"
        >
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          className="flex-1 rounded-lg border border-[var(--danger)] bg-white px-4 py-2 text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          disabled={isPending}
          onClick={() => setShowSendBack(true)}
          type="button"
        >
          Send back
        </button>
        <button
          className="flex-1 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--ink)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          disabled={isPending}
          onClick={handleApprove}
          type="button"
        >
          {isPending
            ? 'Approving…'
            : hasBreach
              ? '✓ Approve · accept breach'
              : '✓ Approve'}
        </button>
      </div>
    </div>
  );
}
