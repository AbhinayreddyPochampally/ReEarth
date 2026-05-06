'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Check } from '@/components/reearth/Icons';
import { Card, Chip } from '@/components/reearth/ui';
import { logEventAction } from '../actions';

interface EventTypeMeta {
  title: string;
  emoji: string;
  vendorPlaceholder: string;
  unit: string;
  quantityLabel: string;
  subPicker?: { label: string; options: string[] }[];
}

interface Props {
  eventType: string;
  meta: EventTypeMeta;
}

export default function EventForm({ eventType, meta }: Props): React.ReactElement {
  const router = useRouter();
  const [filename, setFilename] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    setFilename(file ? file.name : '');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError('');
    if (meta.subPicker && !subCategory) {
      setError(`Pick a ${meta.subPicker[0]?.label.toLowerCase().replace(/\?$/, '')}.`);
      return;
    }
    const formEl = event.currentTarget;
    startTransition(async () => {
      const fd = new FormData(formEl);
      fd.set('event_type', eventType);
      const result = await logEventAction(fd);
      if (result.ok) {
        router.push('/contributor');
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {meta.subPicker && (
        <div>
          <div className="t-eyebrow mb-2">{meta.subPicker[0]?.label}</div>
          <div className="grid grid-cols-2 gap-2">
            {meta.subPicker[0]?.options.map(option => {
              const isActive = subCategory === option;
              return (
                <button
                  aria-pressed={isActive}
                  className={`re-card px-3 py-2.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
                    isActive ? 'border-[var(--primary)] bg-[var(--accent-soft)]' : ''
                  }`}
                  key={option}
                  onClick={() => setSubCategory(option)}
                  type="button"
                >
                  {option}
                </button>
              );
            })}
          </div>
          {subCategory && <input name="sub_category" type="hidden" value={subCategory} />}
        </div>
      )}

      <Card className="border-2 border-dashed border-[var(--line-strong)] bg-[var(--bg-subtle)] p-5 text-center">
        <Camera className="mx-auto text-[var(--ink-2)]" size={26} />
        <div className="t-body-sm mt-2 font-semibold">Take photo of slip</div>
        <div className="t-caption mt-1">OCR will fill the form (Phase 3)</div>
        <label className="mt-3 inline-block cursor-pointer rounded-lg border border-[var(--primary)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--accent-soft)]">
          <input
            accept="image/*,application/pdf"
            capture="environment"
            className="sr-only"
            name="file"
            onChange={handleFileChange}
            type="file"
          />
          Choose / capture
        </label>
        {filename && <div className="t-caption mt-2">· {filename}</div>}
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
            placeholder={meta.vendorPlaceholder}
            required
            type="text"
          />
        </div>
        <div>
          <label className="t-body-sm block font-semibold text-[var(--ink-2)]" htmlFor="quantity">
            {meta.quantityLabel}
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              className="re-input flex-1"
              id="quantity"
              inputMode="decimal"
              name="quantity"
              placeholder="0"
              required
              type="text"
            />
            <input
              className="re-input w-20"
              defaultValue={meta.unit}
              name="unit"
              type="text"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="t-body-sm block font-semibold text-[var(--ink-2)]" htmlFor="notes">
          Notes <span className="t-caption text-[var(--muted)]">(optional)</span>
        </label>
        <textarea
          className="re-input mt-1.5 min-h-[64px]"
          id="notes"
          name="notes"
          placeholder="Anything HO should know"
        />
      </div>

      <Chip tone="info">Submits to HO inbox at amber confidence until OCR runs (Phase 3).</Chip>

      {error && (
        <p className="rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">
          {error}
        </p>
      )}

      <button
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ink)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        disabled={isPending}
        type="submit"
      >
        <Check size={16} />
        {isPending ? 'Submitting…' : 'Submit to HO'}
      </button>
    </form>
  );
}
