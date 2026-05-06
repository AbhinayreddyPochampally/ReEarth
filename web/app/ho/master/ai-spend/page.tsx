import { ChevronLeft, Sparkle } from '@/components/reearth/Icons';
import { ButtonLink, Card, Chip } from '@/components/reearth/ui';
import { getCostSummary } from '@/lib/ai/cost-telemetry';

export const metadata = { title: 'AI spend · ReEarth · HO' };

const FEATURE_LABELS: Record<string, string> = {
  nl_query:        'NL query · Data Explorer',
  nl_master_diff:  'NL master updates',
  nl_audit:        'NL audit search',
  ocr:             'OCR · Document Intelligence',
};

const FEATURE_COLOURS: Record<string, string> = {
  nl_query:       '#5fbf8a',
  nl_master_diff: '#d4972c',
  nl_audit:       '#1f3a2e',
  ocr:            '#b14a3a',
};

// AI cost telemetry dashboard per Phase 3 task 3.6 + design doc §36.2 + §38.4.
//
// Shows month-to-date spend in ₹, a per-feature breakdown, and the recent
// call list. The data layer is `web/lib/ai/cost-telemetry.ts`. Numbers are
// 0 until the architect actually runs an NL query — that's expected.
//
// Design doc §36.2 caps total annual AI cost at ₹15-40K; this dashboard is
// the architect's pulse-check that we're tracking inside that envelope.
export default function AISpendPage(): React.ReactElement {
  const summary = getCostSummary();
  const total = summary.totalCostInrThisMonth;
  const annualBudgetLow  = 15_000;
  const annualBudgetHigh = 40_000;
  const monthlyBudgetLow  = annualBudgetLow / 12;
  const monthlyBudgetHigh = annualBudgetHigh / 12;
  const onTrack = total <= monthlyBudgetHigh;

  // Pre-compute per-feature percentages for the simple bar-chart
  const featureRows = Object.entries(summary.callsByFeature).map(([key, stats]) => ({
    key,
    label: FEATURE_LABELS[key] ?? key,
    colour: FEATURE_COLOURS[key] ?? '#1f3a2e',
    count: stats.count,
    costInr: stats.costInr,
    sharePct: total > 0 ? (stats.costInr / total) * 100 : 0,
  }));

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <ButtonLink className="h-9 w-9 px-0" href="/ho/master" variant="outline">
          <ChevronLeft size={16} />
        </ButtonLink>
        <div>
          <h1 className="t-h2 flex items-center gap-2">
            <Sparkle className="text-[var(--accent)]" size={20} /> AI spend
          </h1>
          <p className="t-caption mt-0.5 text-[var(--muted)]">
            Token usage and inferred cost for NL features and OCR. Resets monthly.
          </p>
        </div>
      </div>

      {/* Headline card */}
      <Card className="mb-4 p-5">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <div className="t-eyebrow">Month to date</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="t-num text-4xl font-semibold">₹{total.toFixed(2)}</span>
              <span className="t-caption text-[var(--muted)]">spent</span>
            </div>
          </div>
          <div className="flex-1 min-w-[220px]">
            <div className="t-eyebrow">Monthly envelope (per design doc §6.1)</div>
            <div className="mt-2 t-body-sm">
              ₹{monthlyBudgetLow.toFixed(0)} – ₹{monthlyBudgetHigh.toFixed(0)} (annualised ₹15K–40K)
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (total / monthlyBudgetHigh) * 100)}%`,
                  background: onTrack ? 'var(--good, #5fbf8a)' : 'var(--danger)',
                }}
              />
            </div>
          </div>
          <div>
            {onTrack ? <Chip tone="good">on track</Chip> : <Chip tone="danger">over envelope</Chip>}
          </div>
        </div>
        {total === 0 && (
          <p className="t-caption mt-4 text-[var(--muted)]">
            No AI calls recorded this month yet. Run an NL query in Data Explorer or click an NL
            example in Master Data to see numbers populate.
          </p>
        )}
      </Card>

      {/* Per-feature breakdown */}
      <div className="t-eyebrow mb-2">By feature</div>
      <Card className="mb-4 overflow-hidden">
        <ul className="divide-y divide-[var(--line)]">
          {featureRows.map(row => (
            <li className="flex items-center gap-3 px-4 py-3 text-sm" key={row.key}>
              <span aria-hidden className="h-3 w-3 rounded-sm" style={{ background: row.colour }} />
              <span className="flex-1 font-semibold">{row.label}</span>
              <span className="t-caption w-20 text-right text-[var(--muted)]">
                {row.count} call{row.count === 1 ? '' : 's'}
              </span>
              <span className="t-num w-24 text-right font-semibold">
                ₹{row.costInr.toFixed(2)}
              </span>
              <span className="t-caption w-16 text-right text-[var(--muted)]">
                {row.sharePct.toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Recent call list */}
      <div className="t-eyebrow mb-2">Recent calls (last 20)</div>
      {summary.recentCalls.length === 0 ? (
        <Card className="p-4">
          <p className="t-caption">
            No calls logged yet. Phase 3 wires this to the audit_log so a long-tail history is
            queryable via NL audit search.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Feature</th>
                <th className="px-3 py-2 text-right">Input tok</th>
                <th className="px-3 py-2 text-right">Output tok</th>
                <th className="px-3 py-2 text-right">₹</th>
              </tr>
            </thead>
            <tbody>
              {summary.recentCalls.slice().reverse().map(call => (
                <tr className="border-t border-[var(--line)]" key={call.occurredAt}>
                  <td className="px-3 py-2 text-[var(--muted)]">
                    {new Date(call.occurredAt).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                  <td className="px-3 py-2">{FEATURE_LABELS[call.feature] ?? call.feature}</td>
                  <td className="px-3 py-2 text-right t-num">{call.inputTokens.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right t-num">{call.outputTokens.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right t-num font-semibold">₹{call.costInr.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <p className="t-tiny mt-4 text-[var(--muted)]">
        Pricing model: GPT-4o-mini at $0.15 / 1M input, $0.60 / 1M output (May 2026 list).
        Document Intelligence at $1.50 / 1000 pages prebuilt model. Rates update from
        config; the cost estimate trails the live Azure invoice slightly.
      </p>
    </div>
  );
}
