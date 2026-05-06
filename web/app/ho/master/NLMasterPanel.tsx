'use client';

import { useState, useTransition } from 'react';
import { Sparkle } from '@/components/reearth/Icons';
import { Card, Chip } from '@/components/reearth/ui';
import type { DiffProposal } from '@/lib/v1/contracts';
import { applyDiffAction, generateDiffAction } from './actions';

const EXAMPLE_QUERIES = [
  'Update CPCB STP outlet BOD limit to 25 mg/L for all factories effective 1 May 2026',
  'Add a 5th DG to Factory-Bengaluru, 250 kVA diesel',
  'Add vendor SafeChem Industrial for oil-soaked cotton at all 11 factories',
];

export default function NLMasterPanel(): React.ReactElement {
  const [text, setText] = useState('');
  const [proposal, setProposal] = useState<DiffProposal | null>(null);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);
  const [isGenerating, startGenerate] = useTransition();
  const [isApplying, startApply] = useTransition();

  function generate(query: string): void {
    setError('');
    setProposal(null);
    setApplied(false);
    startGenerate(async () => {
      const result = await generateDiffAction(query);
      if (result.ok) setProposal(result.proposal);
      else setError(result.error);
    });
  }

  function apply(): void {
    if (!proposal) return;
    setError('');
    startApply(async () => {
      const result = await applyDiffAction(text, proposal);
      if (result.ok) setApplied(true);
      else setError(result.error);
    });
  }

  return (
    <Card className="p-4 shadow-[var(--shadow-2)]">
      <div className="flex items-center gap-2">
        <Sparkle className="text-[var(--accent)]" size={16} />
        <h2 className="t-h4">Make a change with words</h2>
      </div>
      <p className="t-caption mt-1 text-[var(--muted)]">
        Describe a change. The AI proposes a structured diff. You review every change before it&apos;s
        applied. AI never writes raw SQL.
      </p>

      <textarea
        className="re-input mt-3 min-h-[80px] w-full"
        disabled={isGenerating}
        onChange={event => setText(event.target.value)}
        placeholder="e.g. Add a 5th DG to Factory-Bengaluru, 250 kVA diesel"
        value={text}
      />

      <div className="mt-2 flex flex-wrap gap-1.5">
        {EXAMPLE_QUERIES.map(q => (
          <button
            className="t-caption rounded-full border border-[var(--line)] bg-white px-2 py-0.5 hover:bg-[var(--bg-hover)]"
            disabled={isGenerating}
            key={q}
            onClick={() => {
              setText(q);
              generate(q);
            }}
            type="button"
          >
            {q.slice(0, 60)}…
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          className="rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--ink)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          disabled={isGenerating || !text.trim()}
          onClick={() => generate(text.trim())}
          type="button"
        >
          {isGenerating ? 'Generating diff…' : 'Generate diff'}
        </button>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-xs text-[var(--danger)]">
          {error}
        </p>
      )}

      {proposal && (
        <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
          <div className="flex items-center gap-2">
            <div className="t-eyebrow">Proposed change</div>
            <Chip tone="info">{proposal.table}</Chip>
            <span className="t-caption ml-auto">
              {proposal.affected.length} {proposal.affected.length === 1 ? 'facility' : 'facilities'} affected
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--line)] font-mono text-xs">
            {proposal.close.effectiveTo && (
              <div className="border-b border-[var(--line)] bg-[var(--warn-soft)] px-3 py-2 text-[#76520d]">
                ~ Close existing row · effective_to = {proposal.close.effectiveTo}
              </div>
            )}
            {proposal.insert.parameterCode && (
              <div className="bg-[var(--accent-soft)] px-3 py-2 text-[#1f5a3e]">
                + Insert · {proposal.insert.parameterCode} = {proposal.insert.limitValue} {proposal.insert.unit} ·
                {' '}effective_from = {proposal.insert.effectiveFrom} ·
                {' '}authority = {proposal.insert.authority}
              </div>
            )}
          </div>

          {proposal.affected.length > 0 && (
            <details className="re-card p-2 text-sm">
              <summary className="cursor-pointer font-semibold">
                {proposal.affected.length} affected — show all
              </summary>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {proposal.affected.map(a => (
                  <Chip key={a.id}>{a.label}</Chip>
                ))}
              </div>
            </details>
          )}

          <Card className="border-[#ecd9a5] bg-[var(--warn-soft)] p-3">
            <div className="t-eyebrow text-[#76520d]">Side effects</div>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-[#76520d]">
              {proposal.sideEffects.map(s => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>

          {applied ? (
            <Card className="bg-[var(--accent-soft)] p-3 text-[#1f5a3e]">
              <div className="t-h4">✓ Applied</div>
              <p className="t-caption mt-0.5">
                One audit row written. Affected facilities&apos; configs are updated.
              </p>
            </Card>
          ) : (
            <div className="flex justify-end gap-2">
              <button
                className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm font-semibold text-[var(--ink-2)] hover:bg-[var(--bg-hover)]"
                onClick={() => {
                  setProposal(null);
                  setError('');
                }}
                type="button"
              >
                Discard
              </button>
              <button
                className="rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--ink)] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                disabled={isApplying || proposal.table === 'unknown'}
                onClick={apply}
                type="button"
              >
                {isApplying ? 'Applying…' : '✓ Approve & apply'}
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
