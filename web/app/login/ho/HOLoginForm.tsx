'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { hoLoginAction, type LoginResult } from '@/lib/auth/actions';

// HO email + password login form (UI sketch p25).
//
// Per the 2026-05-06 rescope inconsistency-E resolution, there is exactly one
// HO super-user at deployment. Catastrophic password loss is recovered via
// the SQL break-glass procedure documented in docs/playbooks/break-glass.md.
// The "Lost your password?" hint below points the user there.
export default function HOLoginForm(): React.ReactElement {
  const [state, formAction, isPending] = useActionState<LoginResult | null, FormData>(
    hoLoginAction,
    null,
  );
  const errorMsg = state && !state.ok ? state.error : '';

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="t-body-sm block font-semibold text-[var(--ink-2)]" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="re-input mt-1.5"
          id="email"
          name="email"
          placeholder="neha.sharma@abfrl.com"
          required
          type="email"
        />
      </div>

      <div>
        <label className="t-body-sm block font-semibold text-[var(--ink-2)]" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="re-input mt-1.5"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {errorMsg && (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">
          {errorMsg}
        </p>
      )}

      <button
        className="w-full rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ink)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1"
        disabled={isPending}
        type="submit"
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="t-caption text-center text-[var(--muted)]">
        Lost your password? Ask another HO super-user to reset — no email reset.
      </p>

      <div className="border-t border-[var(--line)] pt-3 text-center">
        <Link
          className="t-caption text-[var(--primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          href="/login"
        >
          ← Back to facility login
        </Link>
      </div>
    </form>
  );
}
