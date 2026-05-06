'use client';

import { useState, useTransition } from 'react';
import { Sparkle } from '@/components/reearth/Icons';
import { Card, Chip } from '@/components/reearth/ui';
import { chipsFor } from '@/lib/ai/structured-filter';
import type { StructuredFilter } from '@/lib/ai/structured-filter';
import { runNlQueryAction } from './actions';

interface ResultState {
  filter: StructuredFilter;
  partial: boolean;
  notes?: string;
}

const RECENT_QUERIES = [
  'Show me water withdrawn by source for Q1 2026, all factories',
  'Last 6 months of Scope 1 + 2 by facility',
  'Diesel use ranked by intensity, last quarter',
  'STP BOD trend for Tirupur',
];

export default function NLQueryClient(): React.ReactElement {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<{ msg: string; suggestions?: string[] } | null>(null);
  const [isPending, startTransition] = useTransition();

  function runQuery(query: string): void {
    setError(null);
    startTransition(async () => {
      const response = await runNlQueryAction(query);
      if (response.ok) {
        const next: ResultState = { filter: response.filter, partial: response.partial };
        if (response.notes) next.notes = response.notes;
        setResult(next);
      } else {
        setResult(null);
        const errPayload: { msg: string; suggestions?: string[] } = { msg: response.error };
        if (response.suggestions) errPayload.suggestions = response.suggestions;
        setError(errPayload);
      }
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (!text.trim()) return;
    runQuery(text.trim());
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 shadow-[var(--shadow-2)]">
        <form className="flex items-center gap-2" onSubmit={handleSubmit}>
          <Sparkle className="text-[var(--accent)]" size={18} />
          <input
            aria-label="Ask any question across 15 facilities"
            className="re-input flex-1"
            disabled={isPending}
            onChange={event => setText(event.target.value)}
            placeholder="Ask a question — e.g. Show me water withdrawn by source for Q1 2026, all factories"
            type="text"
            value={text}
          />
          <button
            className="rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--ink)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            disabled={isPending || !text.trim()}
            type="submit"
          >
            {isPending ? 'Asking…' : 'Ask'}
          </button>
        </form>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="t-caption text-[var(--muted)]">Recent:</span>
          {RECENT_QUERIES.map(q => (
            <button
              className="t-caption rounded-full border border-[var(--line)] bg-white px-2 py-0.5 hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              disabled={isPending}
              key={q}
              onClick={() => {
                setText(q);
                runQuery(q);
              }}
              type="button"
            >
              {q}
            </button>
          ))}
        </div>
      </Card>

      <div aria-live="polite" className="contents">
      {error && (
        <Card className="border-[var(--danger)] bg-[var(--danger-soft)] p-4">
          <div className="t-h4 mb-1 text-[var(--danger)]">I can&apos;t do that — yet.</div>
          <p className="t-body-sm text-[#7a2e22]">{error.msg}</p>
          {error.suggestions && error.suggestions.length > 0 && (
            <>
              <div className="t-eyebrow mt-3">Try these instead</div>
              <div className="mt-1 space-y-1">
                {error.suggestions.map(suggestion => (
                  <button
                    className="block rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-left text-sm hover:bg-[var(--bg-hover)]"
                    key={suggestion}
                    onClick={() => {
                      const q = suggestion.replace(/^"|"$/g, '');
                      setText(q);
                      runQuery(q);
                    }}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {result && (
        <div>
          <div className="t-eyebrow mb-2">Interpreted as</div>
          {result.notes && (
            <p className="t-caption mb-2 text-[var(--muted)]">{result.notes}</p>
          )}
          <div className="mb-3 flex flex-wrap gap-2">
            {chipsFor(result.filter).map(chip => (
              <Chip key={`${chip.field}-${chip.display}`} tone={chip.uncertain || result.partial ? 'warn' : 'accent'}>
                <span className="font-semibold">{chip.label}:</span> {chip.display}
              </Chip>
            ))}
            {chipsFor(result.filter).length === 0 && (
              <Chip tone="warn">All facilities · this month · approved (default)</Chip>
            )}
          </div>
          <Card className="p-4">
            <div className="t-eyebrow mb-2">Results</div>
            <p className="t-caption">
              Phase-2 stub: filter chips render the AI&apos;s interpretation but the results table
              is wired to live data in Phase 3 once the deterministic translator at{' '}
              <code className="t-mono">@/lib/db/query-builder.ts</code> is built.
            </p>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}
