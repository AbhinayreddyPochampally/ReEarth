'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Sparkle } from './Icons';

interface TimelineEntry {
  actor: string;
  action: string;
  whenLabel: string;
  href?: string;
}

interface SearchOk {
  ok: true;
  summary: string;
  timeline: TimelineEntry[];
}
interface SearchErr {
  ok: false;
  error: string;
}

type SearchResult = SearchOk | SearchErr;

// Global audit-search bar (UI sketch p38). Sits in the HO header. Clicking
// returns a slide-over panel with NL summary + timeline grounded in real
// audit_log entries. Read-only — never modifies anything.
export default function AuditSearchBar(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function runSearch(query: string): void {
    setResult(null);
    startTransition(async () => {
      const response = await fetch('/api/audit-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query }),
      });
      const json = (await response.json()) as SearchResult;
      setResult(json);
    });
  }

  return (
    <>
      <button
        className="flex flex-1 items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--bg-hover)]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Sparkle size={14} className="text-[var(--accent)]" />
        Ask anything across facilities, logs, alerts, and audit trail
      </button>

      {open && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex justify-end bg-black/30"
          role="dialog"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[480px] overflow-y-auto bg-white p-6 shadow-xl"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center gap-2">
              <Sparkle className="text-[var(--accent)]" size={18} />
              <h2 className="t-h3">Audit search</h2>
              <button
                aria-label="Close"
                className="ml-auto rounded-lg border border-[var(--line)] px-2 py-1 text-xs hover:bg-[var(--bg-hover)]"
                onClick={() => setOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={event => {
                event.preventDefault();
                if (!text.trim()) return;
                runSearch(text.trim());
              }}
            >
              <input
                autoFocus
                className="re-input w-full"
                onChange={event => setText(event.target.value)}
                placeholder="e.g. What happened with March STP from Tirupur?"
                type="text"
                value={text}
              />
              <div className="mt-2 flex justify-end gap-2">
                {!isPending && (
                  <button
                    className="rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--ink)] disabled:opacity-50"
                    disabled={!text.trim()}
                    type="submit"
                  >
                    Search
                  </button>
                )}
              </div>
            </form>

            {isPending && (
              <p className="t-caption mt-4 text-[var(--muted)]">Reading audit log…</p>
            )}

            {result && result.ok && (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="t-eyebrow mb-1">Summary</div>
                  <p className="t-body-sm">{result.summary}</p>
                </div>
                {result.timeline.length > 0 && (
                  <div>
                    <div className="t-eyebrow mb-2">Timeline · grounded in audit_log</div>
                    <ol className="space-y-2 border-l-2 border-[var(--line)] pl-3">
                      {result.timeline.map((entry, i) => (
                        <li className="text-sm" key={`${entry.whenLabel}-${i}`}>
                          <div className="font-semibold">
                            {entry.actor} · <span className="text-[var(--muted)]">{entry.whenLabel}</span>
                          </div>
                          <div className="t-caption mt-0.5">
                            {entry.href ? (
                              <Link
                                className="text-[var(--primary)] hover:underline"
                                href={entry.href}
                                onClick={() => setOpen(false)}
                              >
                                {entry.action}
                              </Link>
                            ) : (
                              entry.action
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <p className="t-tiny text-[var(--muted)]">
                  This panel is read-only. Clicking a timeline link takes you to the source where
                  you can act.
                </p>
              </div>
            )}

            {result && !result.ok && (
              <p className="mt-4 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">
                {result.error}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
