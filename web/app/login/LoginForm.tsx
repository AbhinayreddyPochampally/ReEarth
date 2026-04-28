'use client';

import { useActionState, useState, useTransition } from 'react';
import { loginAction, type LoginResult } from '@/lib/auth/actions';

interface PersonnelEntry {
  id: string;
  name: string;
  role: string;
}

interface PersonnelResponse {
  facility_name: string;
  personnel: PersonnelEntry[];
}

export default function LoginForm(): React.ReactElement {
  const [step, setStep] = useState<'sap' | 'credentials'>('sap');
  const [sap, setSap] = useState('');
  const [facilityName, setFacilityName] = useState('');
  const [personnel, setPersonnel] = useState<PersonnelEntry[]>([]);
  const [fetchError, setFetchError] = useState('');
  const [isFetching, startFetch] = useTransition();

  const [state, formAction, isPending] = useActionState<LoginResult | null, FormData>(
    loginAction,
    null,
  );

  function handleContinue() {
    setFetchError('');
    if (sap.trim().length !== 8) {
      setFetchError('SAP code must be exactly 8 characters.');
      return;
    }
    startFetch(async () => {
      try {
        const res = await fetch(`/api/personnel?sap=${encodeURIComponent(sap.trim())}`);
        if (!res.ok) {
          setFetchError('SAP code not found. Check and try again.');
          return;
        }
        const json = (await res.json()) as PersonnelResponse;
        setFacilityName(json.facility_name);
        setPersonnel(json.personnel);
        setStep('credentials');
      } catch {
        setFetchError('Network error. Please try again.');
      }
    });
  }

  if (step === 'sap') {
    return (
      <div className="space-y-5">
        <div>
          <label htmlFor="sap" className="block text-sm font-medium text-zinc-700">
            SAP Code
          </label>
          <input
            id="sap"
            type="text"
            inputMode="text"
            maxLength={8}
            autoComplete="off"
            placeholder="e.g. FAC00001"
            value={sap}
            onChange={e => setSap(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') handleContinue(); }}
            className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm font-mono tracking-wider text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          {fetchError && (
            <p className="mt-1.5 text-xs text-red-600">{fetchError}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleContinue}
          disabled={isFetching}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
        >
          {isFetching ? 'Checking…' : 'Continue →'}
        </button>
      </div>
    );
  }

  // Step 2: credentials
  const errorMsg = state && !state.ok ? state.error : '';

  return (
    <form action={formAction} className="space-y-5">
      {/* Hidden SAP field so the server action has it */}
      <input type="hidden" name="sap" value={sap} />

      <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
        <span className="font-medium text-zinc-700">{facilityName}</span> — SAP {sap}
      </div>

      <div>
        <label htmlFor="pin" className="block text-sm font-medium text-zinc-700">
          Facility PIN
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          maxLength={4}
          autoComplete="current-password"
          placeholder="4-digit PIN"
          className="mt-1.5 block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm font-mono tracking-widest text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div>
        <label htmlFor="personnel_id" className="block text-sm font-medium text-zinc-700">
          Your name
        </label>
        <select
          id="personnel_id"
          name="personnel_id"
          defaultValue=""
          className="mt-1.5 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="" disabled>Select your name…</option>
          {personnel.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {errorMsg && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{errorMsg}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { setStep('sap'); setFetchError(''); }}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 focus:outline-none"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
        >
          {isPending ? 'Logging in…' : 'Login'}
        </button>
      </div>
    </form>
  );
}
