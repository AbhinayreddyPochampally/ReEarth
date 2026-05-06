'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { contributorLoginAction, type LoginResult } from '@/lib/auth/actions';

// Three-step contributor login matching UI sketch pages 3–5:
//   step 'facility' → facility picker (scrollable list)
//   step 'pin'      → 4-digit PIN entry with on-screen number pad
//   step 'name'     → tappable list of contributors at the chosen facility
//
// HO users follow a separate /login/ho route (UI sketch p25). A small link
// at the bottom of the facility picker routes there.

interface FacilityPickerRow {
  id: string;
  sap_code: string;
  name: string;
  type: 'factory' | 'warehouse';
  city: string;
  state: string;
}

interface PersonnelEntry {
  id: string;
  name: string;
  role: 'contributor' | 'ho';
}

interface PersonnelResponse {
  facility_id: string;
  facility_name: string;
  sap_code: string;
  personnel: PersonnelEntry[];
}

type Step = 'facility' | 'pin' | 'name';

const PIN_LENGTH = 4;

export default function LoginForm(): React.ReactElement {
  const [step, setStep] = useState<Step>('facility');

  // Step 1 state
  const [allFacilities, setAllFacilities] = useState<FacilityPickerRow[]>([]);
  const [facilitiesError, setFacilitiesError] = useState('');
  const [, startFacilityFetch] = useTransition();

  // Step 2 state — facility chosen + PIN entry
  const [chosenFacility, setChosenFacility] = useState<FacilityPickerRow | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Step 3 state — roster + name selection
  const [personnel, setPersonnel] = useState<PersonnelEntry[]>([]);
  const [rosterError, setRosterError] = useState('');
  const [isLoadingRoster, startRosterFetch] = useTransition();

  // Server-action result for the final login submit
  const [state, formAction, isPending] = useActionState<LoginResult | null, FormData>(
    contributorLoginAction,
    null,
  );

  // Fetch the facility list on mount.
  useEffect(() => {
    startFacilityFetch(async () => {
      try {
        const res = await fetch('/api/facilities');
        if (!res.ok) {
          setFacilitiesError('Could not load facilities. Refresh and try again.');
          return;
        }
        const json = (await res.json()) as { facilities: FacilityPickerRow[] };
        setAllFacilities(json.facilities);
      } catch {
        setFacilitiesError('Network error. Refresh and try again.');
      }
    });
  }, []);

  function handlePickFacility(facility: FacilityPickerRow): void {
    setChosenFacility(facility);
    setPin('');
    setPinError('');
    setStep('pin');
  }

  function handlePinDigit(digit: string): void {
    if (pin.length >= PIN_LENGTH) return;
    setPinError('');
    setPin(prev => (prev + digit).slice(0, PIN_LENGTH));
  }

  function handlePinBackspace(): void {
    setPinError('');
    setPin(prev => prev.slice(0, -1));
  }

  // After PIN reaches 4 digits, fetch the roster. The actual PIN check
  // happens server-side at form submit (Step 3) — fetching the roster here
  // is purely a UX shortcut that lets the next screen render immediately.
  useEffect(() => {
    if (step !== 'pin') return;
    if (pin.length !== PIN_LENGTH) return;
    if (!chosenFacility) return;

    startRosterFetch(async () => {
      try {
        const res = await fetch(
          `/api/personnel?facility_id=${encodeURIComponent(chosenFacility.id)}`,
        );
        if (!res.ok) {
          setRosterError('Could not load contributors. Try again.');
          return;
        }
        const json = (await res.json()) as PersonnelResponse;
        setPersonnel(json.personnel);
        setStep('name');
      } catch {
        setRosterError('Network error. Try again.');
      }
    });
  }, [pin, step, chosenFacility]);

  // ── Step 1: facility picker ──────────────────────────────────────────────
  if (step === 'facility') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="t-body-sm font-semibold text-[var(--ink-2)]">Pick your facility</p>
          {facilitiesError && (
            <p className="t-caption mt-2 text-[var(--danger)]">{facilitiesError}</p>
          )}
        </div>
        <ul
          aria-label="Facilities"
          className="-mx-1 max-h-[420px] space-y-1.5 overflow-y-auto px-1"
          role="listbox"
        >
          {allFacilities.map(facility => (
            <li key={facility.id}>
              <button
                aria-label={`${facility.name} in ${facility.city}`}
                className="re-card w-full px-3 py-3 text-left transition hover:border-[var(--primary)] hover:shadow-[var(--shadow-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                onClick={() => handlePickFacility(facility)}
                type="button"
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--bg-subtle)] text-base"
                  >
                    {facility.type === 'factory' ? '🏭' : '🏬'}
                  </span>
                  <span className="flex flex-1 flex-col text-sm">
                    <span className="font-semibold text-[var(--ink)]">{facility.name}</span>
                    <span className="t-caption mt-0.5 text-[var(--muted)]">
                      {facility.city}, {facility.state}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="t-caption text-center text-[var(--muted)]">
          {allFacilities.length > 0 ? `Scroll · ${allFacilities.length} facilities` : 'Loading…'}
        </p>
        <div className="border-t border-[var(--line)] pt-3 text-center">
          <Link
            className="t-caption text-[var(--primary)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            href="/login/ho"
          >
            HO user → log in here →
          </Link>
        </div>
      </div>
    );
  }

  // ── Step 2: PIN entry ────────────────────────────────────────────────────
  if (step === 'pin' && chosenFacility) {
    return (
      <PinEntry
        chosenFacility={chosenFacility}
        isLoadingRoster={isLoadingRoster}
        onBack={() => {
          setStep('facility');
          setPin('');
          setPinError('');
        }}
        onBackspace={handlePinBackspace}
        onDigit={handlePinDigit}
        pin={pin}
        pinError={pinError || rosterError}
      />
    );
  }

  // ── Step 3: name picker (and final submission) ───────────────────────────
  const errorMsg = state && !state.ok ? state.error : '';

  return (
    <form action={formAction} className="space-y-4">
      <input name="facility_id" type="hidden" value={chosenFacility?.id ?? ''} />
      <input name="pin" type="hidden" value={pin} />

      <div className="text-center">
        <p className="t-body-sm font-semibold text-[var(--ink-2)]">Who are you?</p>
        <p className="t-caption mt-1 text-[var(--muted)]">
          {chosenFacility?.name} · {personnel.length} contributor
          {personnel.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="space-y-1.5" role="radiogroup" aria-label="Tap your name">
        {personnel.map(person => (
          <button
            aria-label={`Sign in as ${person.name}`}
            className="re-card flex w-full items-center gap-3 px-3 py-3 text-left text-sm transition hover:border-[var(--primary)] hover:shadow-[var(--shadow-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
            disabled={isPending}
            key={person.id}
            name="personnel_id"
            type="submit"
            value={person.id}
          >
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-xs font-semibold text-[var(--ink-2)]"
            >
              {person.name.charAt(0)}
            </span>
            <span className="font-semibold text-[var(--ink)]">{person.name}</span>
          </button>
        ))}
      </div>

      <p className="t-caption text-center text-[var(--muted)]">
        Phone remembers — won&apos;t ask again
      </p>

      {errorMsg && (
        <p
          aria-live="polite"
          className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]"
          role="status"
        >
          {errorMsg}
        </p>
      )}

      <div className="flex gap-3">
        <button
          className="rounded-lg border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--ink-2)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          onClick={() => {
            setStep('pin');
            setPin('');
            setPersonnel([]);
          }}
          type="button"
        >
          Back
        </button>
      </div>
    </form>
  );
}

// ── Internal: PIN-entry sub-component ──────────────────────────────────────
// Pulled out because the JSX is dense and reusing it for the lockout screen
// later (UI sketch p6) becomes natural.
interface PinEntryProps {
  chosenFacility: FacilityPickerRow;
  isLoadingRoster: boolean;
  onBack(): void;
  onBackspace(): void;
  onDigit(digit: string): void;
  pin: string;
  pinError: string;
}

function PinEntry({
  chosenFacility,
  isLoadingRoster,
  onBack,
  onBackspace,
  onDigit,
  pin,
  pinError,
}: PinEntryProps): React.ReactElement {
  // Auto-focus the first slot for accessibility / keyboard users
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Keyboard handling — supports digit keys 0-9, Backspace, and Escape (back)
  function handleKey(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      onBack();
      return;
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
      onBackspace();
      return;
    }
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      onDigit(event.key);
    }
  }

  return (
    <div
      className="space-y-4 outline-none"
      onKeyDown={handleKey}
      ref={containerRef}
      tabIndex={-1}
    >
      <div className="text-center">
        <button
          className="t-caption mb-2 inline-flex items-center text-[var(--muted)] hover:text-[var(--ink)] focus:outline-none"
          onClick={onBack}
          type="button"
        >
          ← Back
        </button>
        <p className="t-body-sm font-semibold text-[var(--ink-2)]">Enter PIN</p>
        <p className="t-caption mt-1 text-[var(--muted)]">
          {chosenFacility.name} · 4-digit facility PIN
        </p>
      </div>

      {/* PIN slot display */}
      <div aria-live="polite" className="flex justify-center gap-2">
        {Array.from({ length: PIN_LENGTH }).map((_, idx) => {
          const filled = idx < pin.length;
          return (
            <span
              aria-hidden
              className={`flex h-12 w-12 items-center justify-center rounded-md border text-xl font-semibold ${
                filled
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--ink)]'
                  : 'border-[var(--line)] bg-[var(--bg-subtle)] text-[var(--muted-2)]'
              }`}
              key={idx}
            >
              {filled ? '•' : ''}
            </span>
          );
        })}
      </div>

      {/* On-screen number pad */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <button
            aria-label={`Digit ${d}`}
            className="rounded-lg border border-[var(--line)] bg-white py-3 text-lg font-semibold text-[var(--ink)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
            disabled={isLoadingRoster || pin.length >= PIN_LENGTH}
            key={d}
            onClick={() => onDigit(d)}
            type="button"
          >
            {d}
          </button>
        ))}
        <span aria-hidden />
        <button
          aria-label="Digit 0"
          className="rounded-lg border border-[var(--line)] bg-white py-3 text-lg font-semibold text-[var(--ink)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
          disabled={isLoadingRoster || pin.length >= PIN_LENGTH}
          onClick={() => onDigit('0')}
          type="button"
        >
          0
        </button>
        <button
          aria-label="Backspace"
          className="rounded-lg border border-[var(--line)] bg-white py-3 text-lg font-semibold text-[var(--muted)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
          disabled={isLoadingRoster || pin.length === 0}
          onClick={onBackspace}
          type="button"
        >
          ⌫
        </button>
      </div>

      {pinError && (
        <p
          aria-live="assertive"
          className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-center text-xs text-[var(--danger)]"
          role="alert"
        >
          {pinError}
        </p>
      )}

      {isLoadingRoster && (
        <p className="t-caption text-center text-[var(--muted)]">Checking…</p>
      )}
    </div>
  );
}
