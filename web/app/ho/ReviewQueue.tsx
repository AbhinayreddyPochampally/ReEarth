'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { approveSubmission, sendBackSubmission } from './actions';
import type { PendingSubmission } from '@/lib/db/reviews';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function periodLabel(start: string): string {
  return new Date(start + 'T00:00:00').toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

interface CardProps {
  sub: PendingSubmission;
  onActioned: () => void;
}

function SubmissionCard({ sub, onActioned }: CardProps): React.ReactElement {
  const [showSendBack, setShowSendBack] = useState(false);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const [lightbox, setLightbox] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveSubmission(sub.id);
      if (!result.ok) { setErr(result.error); return; }
      onActioned();
    });
  }

  function handleSendBack() {
    startTransition(async () => {
      const result = await sendBackSubmission(sub.id, comment);
      if (!result.ok) { setErr(result.error); return; }
      setShowSendBack(false);
      setComment('');
      onActioned();
    });
  }

  return (
    <>
      {/* Lightbox */}
      {lightbox && sub.thumb_url && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src={sub.thumb_url}
            alt="Evidence"
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute right-4 top-4 text-2xl text-white"
            onClick={() => setLightbox(false)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="rounded-xl bg-white shadow-sm ring-1 ring-zinc-200 overflow-hidden">
        <div className="flex gap-3 p-4">
          {/* Evidence thumbnail */}
          <div className="flex-shrink-0">
            {sub.thumb_url ? (
              <button
                type="button"
                onClick={() => setLightbox(true)}
                className="relative block h-16 w-16 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200 hover:ring-emerald-400 transition-all"
                title="Click to view full image"
              >
                <Image
                  src={sub.thumb_url}
                  alt="Evidence photo"
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-100 text-xl text-zinc-400 ring-1 ring-zinc-200">
                📄
              </div>
            )}
          </div>

          {/* Submission details */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900">{sub.parameter_name}</p>
            <p className="text-xs text-zinc-500">{sub.facility_name}</p>
            <p className="mt-1 text-base font-bold text-zinc-900">
              {sub.value_normalized.toLocaleString('en-IN')}{' '}
              <span className="text-sm font-normal text-zinc-500">{sub.unit_used}</span>
            </p>
            <p className="text-xs text-zinc-400">
              {sub.submitted_by_name} · {periodLabel(sub.period_start)} · {timeAgo(sub.submitted_at)}
            </p>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="border-t border-zinc-100 bg-red-50 px-4 py-2 text-xs text-red-700">
            {err}
          </div>
        )}

        {/* Send back comment input */}
        {showSendBack && (
          <div className="border-t border-zinc-100 bg-zinc-50 p-4 space-y-3">
            <label className="block text-xs font-medium text-zinc-600">
              Comment for contributor (required)
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Explain what needs to be corrected…"
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowSendBack(false); setComment(''); setErr(''); }}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendBack}
                disabled={isPending || !comment.trim()}
                className="flex-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {isPending ? 'Sending…' : 'Send Back'}
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!showSendBack && (
          <div className="flex gap-2 border-t border-zinc-100 px-4 py-3">
            <button
              type="button"
              onClick={() => { setShowSendBack(true); setErr(''); }}
              disabled={isPending}
              className="flex-1 rounded-lg border border-zinc-300 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
            >
              Send Back ↩
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? 'Approving…' : '✓ Approve'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

interface Props {
  submissions: PendingSubmission[];
}

export default function ReviewQueue({ submissions }: Props): React.ReactElement {
  const router = useRouter();

  function refresh() {
    router.refresh();
  }

  if (submissions.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
          ✓
        </div>
        <h2 className="mt-4 text-base font-semibold text-zinc-900">All caught up</h2>
        <p className="mt-1 text-sm text-zinc-500">No pending submissions to review.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {submissions.map(sub => (
        <li key={sub.id}>
          <SubmissionCard sub={sub} onActioned={refresh} />
        </li>
      ))}
    </ul>
  );
}
