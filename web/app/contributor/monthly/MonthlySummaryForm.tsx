'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Chip } from '@/components/reearth/ui';
import { Check } from '@/components/reearth/Icons';
import { submitMonthlySummaryAction } from './actions';

interface SummaryCard {
  code: string;
  label: string;
  unit: string;
  group: 'Production' | 'Waste — generated';
}

interface Props {
  cards: SummaryCard[];
  period: string;
}

export default function MonthlySummaryForm({ cards, period }: Props): React.ReactElement {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  // Group cards for display per UI sketch p19.
  const grouped: Record<string, SummaryCard[]> = {};
  for (const card of cards) {
    if (!grouped[card.group]) grouped[card.group] = [];
    grouped[card.group]!.push(card);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError('');
    const formEl = event.currentTarget;
    startTransition(async () => {
      const fd = new FormData(formEl);
      const result = await submitMonthlySummaryAction(period, fd);
      if (result.ok) {
        router.push('/contributor');
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Card className="border-[var(--accent)] bg-[var(--accent-soft)] p-3 text-center">
        <div className="t-body-sm font-semibold">{cards.length} entries to complete</div>
        <div className="t-caption mt-0.5 text-[var(--muted)]">From your internal records</div>
      </Card>

      {Object.entries(grouped).map(([group, items]) => (
        <div className="space-y-2" key={group}>
          <div className="t-eyebrow">{group}</div>
          {items.map(card => (
            <Card className="flex items-center gap-3 p-3" key={card.code}>
              <div className="min-w-0 flex-1">
                <div className="t-body-sm font-semibold">{card.label}</div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="re-input w-28"
                  inputMode="decimal"
                  name={`value_${card.code}`}
                  placeholder="0"
                  type="text"
                />
                <span className="t-caption w-10 text-[var(--muted)]">{card.unit}</span>
              </div>
            </Card>
          ))}
        </div>
      ))}

      <Chip tone="info">Partial submit OK — anything left blank stays pending.</Chip>

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
        {isPending ? 'Submitting…' : 'Submit summary'}
      </button>
    </form>
  );
}
