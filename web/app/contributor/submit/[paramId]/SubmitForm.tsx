'use client';

import { useActionState, useRef } from 'react';
import { submitFormAction, type SubmitResult } from './actions';

interface Props {
  parameterId: string;
  parameterName: string;
  unit: string;
  evidenceRequired: 'required' | 'optional' | 'none';
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  submittedByName: string;
}

export default function SubmitForm({
  parameterId,
  parameterName,
  unit,
  evidenceRequired,
  periodStart,
  periodEnd,
  periodLabel,
  submittedByName,
}: Props): React.ReactElement {
  const [state, formAction, isPending] = useActionState<SubmitResult | null, FormData>(
    submitFormAction,
    null,
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const errorMsg = state && !state.ok ? state.error : '';

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-6">
      {/* Hidden fields */}
      <input type="hidden" name="parameter_id" value={parameterId} />
      <input type="hidden" name="period_start" value={periodStart} />
      <input type="hidden" name="period_end" value={periodEnd} />

      {/* Period + submitter summary */}
      <div className="rounded-xl bg-white px-4 py-4 ring-1 ring-zinc-200 space-y-1">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Period</span>
          <span className="font-medium text-zinc-700">{periodLabel}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>Submitted by</span>
          <span className="font-medium text-zinc-700">{submittedByName}</span>
        </div>
      </div>

      {/* Value input */}
      <div>
        <label htmlFor="value" className="block text-sm font-medium text-zinc-700">
          {parameterName}
          <span className="ml-2 text-xs font-normal text-zinc-400">({unit})</span>
        </label>
        <div className="mt-1.5 flex rounded-lg shadow-sm ring-1 ring-zinc-300 focus-within:ring-2 focus-within:ring-emerald-500">
          <input
            id="value"
            name="value"
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            required
            placeholder="0.0"
            className="block w-full rounded-l-lg border-0 bg-white px-3 py-3 text-lg font-semibold text-zinc-900 placeholder:text-zinc-300 focus:outline-none"
          />
          <span className="inline-flex items-center rounded-r-lg bg-zinc-50 px-3 text-sm font-medium text-zinc-500 ring-1 ring-inset ring-zinc-300">
            {unit}
          </span>
        </div>
      </div>

      {/* Photo upload */}
      {evidenceRequired !== 'none' && (
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Supporting photo
            {evidenceRequired === 'required' && (
              <span className="ml-1 text-xs font-normal text-amber-600">required</span>
            )}
            {evidenceRequired === 'optional' && (
              <span className="ml-1 text-xs font-normal text-zinc-400">optional</span>
            )}
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-white py-6 text-sm text-zinc-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
          >
            <span className="text-xl">📷</span>
            <span>Take photo or choose from gallery</span>
          </button>
          <input
            ref={fileRef}
            name="photo"
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f && fileRef.current) {
                const btn = fileRef.current.previousElementSibling;
                if (btn) btn.textContent = `📷 ${f.name}`;
              }
            }}
          />
        </div>
      )}

      {errorMsg && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
      >
        {isPending ? 'Submitting…' : 'Submit'}
      </button>
    </form>
  );
}
