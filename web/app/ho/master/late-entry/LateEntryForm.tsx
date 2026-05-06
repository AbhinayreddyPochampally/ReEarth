'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Chip } from '@/components/reearth/ui';
import { Check } from '@/components/reearth/Icons';
import { submitLateEntryAction } from './actions';

interface FacilityOption { id: string; name: string }
interface ContributorOption { id: string; name: string; facilityIds: string[] }
interface ParameterOption { code: string; label: string; unit: string }

interface Props {
  facilities: FacilityOption[];
  contributors: ContributorOption[];
  parameters: ParameterOption[];
}

export default function LateEntryForm({
  facilities,
  contributors,
  parameters,
}: Props): React.ReactElement {
  const router = useRouter();
  const [facilityId, setFacilityId] = useState('');
  const [contributorId, setContributorId] = useState('');
  const [parameterCode, setParameterCode] = useState('');
  const [periodDate, setPeriodDate] = useState('');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ entryId: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // When facility changes, narrow contributor dropdown
  const contributorsForFacility = useMemo(
    () => contributors.filter(c => !facilityId || c.facilityIds.includes(facilityId)),
    [contributors, facilityId],
  );

  const selectedParam = parameters.find(p => p.code === parameterCode);

  // Maximum allowable date is 3 days ago (we want >2 days old per the rule).
  // Minimum: 90 days back as a sanity guard against accidental year-typos.
  const maxDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const minDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError('');
    setSuccess(null);
    const formEl = event.currentTarget;
    startTransition(async () => {
      const fd = new FormData(formEl);
      const result = await submitLateEntryAction(fd);
      if (result.ok) {
        setSuccess({ entryId: result.entryId });
        // Don't auto-redirect — show the success state so HO sees the entry id.
      } else {
        setError(result.error);
      }
    });
  }

  if (success) {
    return (
      <Card className="p-4">
        <div className="t-h3 mb-2 text-[var(--good)]">✓ Late entry recorded</div>
        <p className="t-body-sm">
          Audit-log row written with entry ID{' '}
          <code className="t-mono rounded bg-[var(--bg-subtle)] px-1.5 py-0.5">{success.entryId}</code>.
        </p>
        <p className="t-caption mt-2 text-[var(--muted)]">
          The recorded reason is now visible to other HO users via Master Data → audit log,
          and via the global audit-search bar. Contributor receives a push notification:
          “HO submitted an entry on your behalf for {periodDate}.”
        </p>
        <div className="mt-4 flex gap-2">
          <button
            className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm font-semibold text-[var(--ink-2)] hover:bg-[var(--bg-hover)]"
            onClick={() => {
              setSuccess(null);
              setError('');
              setFacilityId('');
              setContributorId('');
              setParameterCode('');
              setPeriodDate('');
              setValue('');
              setReason('');
            }}
            type="button"
          >
            Record another
          </button>
          <button
            className="rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--ink)]"
            onClick={() => router.push('/ho/master')}
            type="button"
          >
            Back to Master Data
          </button>
        </div>
      </Card>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="t-body-sm block font-semibold text-[var(--ink-2)]" htmlFor="facility">
              Facility
            </label>
            <select
              className="re-input mt-1.5"
              id="facility"
              name="facility_id"
              onChange={event => {
                setFacilityId(event.target.value);
                setContributorId('');
              }}
              required
              value={facilityId}
            >
              <option value="">Pick a facility…</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="t-body-sm block font-semibold text-[var(--ink-2)]" htmlFor="contributor">
              On behalf of (contributor)
            </label>
            <select
              className="re-input mt-1.5"
              disabled={!facilityId}
              id="contributor"
              name="contributor_id"
              onChange={event => setContributorId(event.target.value)}
              required
              value={contributorId}
            >
              <option value="">
                {facilityId ? 'Pick a contributor…' : 'Pick facility first'}
              </option>
              {contributorsForFacility.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="t-body-sm block font-semibold text-[var(--ink-2)]" htmlFor="parameter">
              Parameter (daily)
            </label>
            <select
              className="re-input mt-1.5"
              id="parameter"
              name="parameter_code"
              onChange={event => setParameterCode(event.target.value)}
              required
              value={parameterCode}
            >
              <option value="">Pick a daily parameter…</option>
              {parameters.map(p => (
                <option key={p.code} value={p.code}>{p.label} ({p.unit})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="t-body-sm block font-semibold text-[var(--ink-2)]" htmlFor="period_date">
              Date (must be &gt;2 days old)
            </label>
            <input
              className="re-input mt-1.5"
              id="period_date"
              max={maxDate}
              min={minDate}
              name="period_date"
              onChange={event => setPeriodDate(event.target.value)}
              required
              type="date"
              value={periodDate}
            />
          </div>
        </div>
        <div className="mt-3">
          <label className="t-body-sm block font-semibold text-[var(--ink-2)]" htmlFor="value">
            Value {selectedParam && <span className="t-caption text-[var(--muted)]">({selectedParam.unit})</span>}
          </label>
          <input
            className="re-input mt-1.5 max-w-xs"
            id="value"
            inputMode="decimal"
            name="value"
            onChange={event => setValue(event.target.value)}
            placeholder="0"
            required
            type="text"
            value={value}
          />
        </div>
      </Card>

      <Card className="border-[var(--warn)] bg-[var(--warn-soft)] p-4">
        <label className="t-body-sm block font-semibold text-[#76520d]" htmlFor="reason">
          Reason for the override (mandatory · ≥8 chars)
        </label>
        <textarea
          className="re-input mt-1.5 min-h-[88px] w-full"
          id="reason"
          name="reason"
          onChange={event => setReason(event.target.value)}
          placeholder='e.g. "Contributor was on sick leave Apr 28; meter reading taken from logbook page 22 by plant manager."'
          required
          value={reason}
        />
        <p className="t-tiny mt-1 text-[#76520d]">
          This text becomes part of the audit log and is searchable via NL audit search.
          Be specific — future you will thank you.
        </p>
      </Card>

      {error && (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Chip tone="warn">HO override · audit-logged</Chip>
        <button
          className="ml-auto flex items-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--ink)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          disabled={isPending}
          type="submit"
        >
          <Check size={14} />
          {isPending ? 'Recording…' : 'Submit late entry'}
        </button>
      </div>
    </form>
  );
}
