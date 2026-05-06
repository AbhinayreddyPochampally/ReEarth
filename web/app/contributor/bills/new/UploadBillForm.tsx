'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Check, Upload } from '@/components/reearth/Icons';
import { Card, Chip } from '@/components/reearth/ui';
import { uploadBillAction } from '../actions';

type BillKind = 'electricity' | 'diesel' | 'water' | 'lab_report' | 'solar_ppa';

interface KindOption {
  value: BillKind;
  label: string;
  hint: string;
}

const KIND_OPTIONS: KindOption[] = [
  { value: 'electricity', label: 'Grid bill',     hint: 'DISCOM monthly' },
  { value: 'diesel',      label: 'Diesel invoice', hint: 'DG / fleet' },
  { value: 'water',       label: 'Water bill',     hint: 'Municipal / tanker' },
  { value: 'lab_report',  label: 'Lab report',     hint: 'STP / borewell / stack' },
  { value: 'solar_ppa',   label: 'Solar PPA',      hint: 'Monthly invoice' },
];

export default function UploadBillForm(): React.ReactElement {
  const router = useRouter();
  const [kind, setKind] = useState<BillKind | null>(null);
  const [vendor, setVendor] = useState('');
  const [period, setPeriod] = useState('');
  const [filenames, setFilenames] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files;
    if (!files) return;
    setFilenames(Array.from(files).map(file => file.name));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError('');
    if (!kind) {
      setError('Pick a bill kind first.');
      return;
    }
    const formEl = event.currentTarget;
    startTransition(async () => {
      const fd = new FormData(formEl);
      fd.set('kind', kind);
      const result = await uploadBillAction(fd);
      if (result.ok) {
        router.push('/contributor/bills');
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <div className="t-eyebrow mb-2">What kind of bill?</div>
        <div className="grid grid-cols-2 gap-2">
          {KIND_OPTIONS.map(option => {
            const isActive = kind === option.value;
            return (
              <button
                aria-pressed={isActive}
                className={`re-card p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                  isActive ? 'border-[var(--primary)] bg-[var(--accent-soft)]' : ''
                }`}
                key={option.value}
                onClick={() => setKind(option.value)}
                type="button"
              >
                <Upload className={isActive ? 'text-[var(--primary)]' : 'text-[var(--muted)]'} size={16} />
                <div className="t-body-sm mt-2 font-semibold">{option.label}</div>
                <div className="t-caption mt-0.5 text-[var(--muted)]">{option.hint}</div>
              </button>
            );
          })}
        </div>
      </div>

      <Card className="border-2 border-dashed border-[var(--line-strong)] bg-[var(--bg-subtle)] p-6 text-center">
        <Camera className="mx-auto text-[var(--ink-2)]" size={28} />
        <div className="t-h4 mt-2">Drop bills or tap to choose</div>
        <div className="t-caption mt-1">Multi-file · PDF or JPG · up to 8 pages each</div>
        <label className="mt-3 inline-block cursor-pointer rounded-lg border border-[var(--primary)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--accent-soft)]">
          <input
            accept="application/pdf,image/*"
            className="sr-only"
            multiple
            name="file"
            onChange={handleFileChange}
            type="file"
          />
          Choose files
        </label>
        {filenames.length > 0 && (
          <ul className="mt-3 space-y-1 text-left text-xs">
            {filenames.map(name => (
              <li className="t-caption" key={name}>
                · {name}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="t-body-sm block font-semibold text-[var(--ink-2)]" htmlFor="vendor">
            Vendor
          </label>
          <input
            className="re-input mt-1.5"
            id="vendor"
            name="vendor"
            onChange={event => setVendor(event.target.value)}
            placeholder="e.g. BESCOM"
            required
            type="text"
            value={vendor}
          />
        </div>
        <div>
          <label className="t-body-sm block font-semibold text-[var(--ink-2)]" htmlFor="period">
            Period
          </label>
          <input
            className="re-input mt-1.5"
            id="period"
            name="period"
            onChange={event => setPeriod(event.target.value)}
            placeholder="e.g. Mar 2026 or 22 Apr 2026"
            required
            type="text"
            value={period}
          />
        </div>
      </div>

      <Chip tone="info">
        OCR will run on this file in Phase 3. For now the bill goes to HO with manual review.
      </Chip>

      {error && (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">
          {error}
        </p>
      )}

      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ink)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        disabled={isPending || !kind}
        type="submit"
      >
        <Check size={16} />
        {isPending ? 'Uploading…' : 'Submit to HO'}
      </button>
    </form>
  );
}
