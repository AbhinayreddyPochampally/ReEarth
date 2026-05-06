import Link from 'next/link';
import { Card, Chip } from '@/components/reearth/ui';
import { facilities, personnel } from '@/lib/v1/sample-data';
import { getCostSummary } from '@/lib/ai/cost-telemetry';
import NLMasterPanel from './NLMasterPanel';

export const metadata = { title: 'Master Data - ReEarth' };

// Master Data per design doc §34 + UI sketch p37-43.
// Six sub-sections (Facilities, Personnel, Regulatory limits, Vendors, Alert
// rules, Parameters). Phase 2 surface keeps the sub-section list view simple
// and pairs it with the NL update panel from §39 (the "Make a change with
// words" affordance).
export default function MasterDataPage(): React.ReactElement {
  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <h1 className="t-h2">Master Data</h1>
          <p className="t-caption mt-1">
            Effective-dated configuration. Every change is audited.
          </p>
        </div>
      </div>

      <NLMasterPanel />

      {/* HO action surfaces — late entry override + AI spend dashboard */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          className="re-card flex items-center gap-3 p-4 transition hover:border-[var(--primary)] hover:shadow-[var(--shadow-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          href="/ho/master/late-entry"
        >
          <span aria-hidden className="text-2xl">⏰</span>
          <span className="flex-1">
            <span className="t-h4 block">Late entry on behalf</span>
            <span className="t-caption mt-0.5 block text-[var(--muted)]">
              Backdated daily-log entry &gt;2 days old. Mandatory reason field.
            </span>
          </span>
        </Link>
        <Link
          className="re-card flex items-center gap-3 p-4 transition hover:border-[var(--primary)] hover:shadow-[var(--shadow-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          href="/ho/master/ai-spend"
        >
          <span aria-hidden className="text-2xl">✨</span>
          <span className="flex-1">
            <span className="t-h4 block">AI spend</span>
            <span className="t-caption mt-0.5 block text-[var(--muted)]">
              ₹{getCostSummary().totalCostInrThisMonth.toFixed(2)} this month · per-feature breakdown
            </span>
          </span>
        </Link>
      </div>

      <div className="mt-6 grid gap-3 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2">
            <span className="t-eyebrow">Facilities</span>
            <span className="t-caption ml-auto">{facilities.length} active</span>
          </div>
          <ul className="divide-y divide-[var(--line)]">
            {facilities.slice(0, 6).map(f => (
              <li className="flex items-center gap-3 px-3 py-2 text-sm" key={f.id}>
                <span aria-hidden>{f.kind === 'factory' ? '🏭' : '🏬'}</span>
                <span className="flex-1 font-semibold">{f.name}</span>
                <span className="t-caption">{f.city}</span>
              </li>
            ))}
            <li className="px-3 py-2 text-xs text-[var(--muted)]">
              + {facilities.length - 6} more — full list in Phase 3.
            </li>
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2">
            <span className="t-eyebrow">Personnel</span>
            <span className="t-caption ml-auto">{personnel.length} active</span>
          </div>
          <ul className="divide-y divide-[var(--line)]">
            {personnel.map(p => (
              <li className="flex items-center gap-3 px-3 py-2 text-sm" key={p.id}>
                <span className="flex-1 font-semibold">{p.name}</span>
                {p.role === 'ho' ? (
                  <Chip tone="accent">HO</Chip>
                ) : (
                  <Chip>contributor</Chip>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2">
            <span className="t-eyebrow">Regulatory limits · effective-dated</span>
            <span className="t-caption ml-auto">4 active</span>
          </div>
          <ul className="divide-y divide-[var(--line)] text-sm">
            <li className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 font-semibold">STP outlet · BOD · all factories</span>
              <span className="t-num">30 mg/L</span>
              <Chip tone="accent">CPCB</Chip>
            </li>
            <li className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 font-semibold">STP outlet · COD · all factories</span>
              <span className="t-num">250 mg/L</span>
              <Chip tone="accent">CPCB</Chip>
            </li>
            <li className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 font-semibold">DG stack · PM · all DGs</span>
              <span className="t-num">75 mg/Nm³</span>
              <Chip tone="accent">CPCB</Chip>
            </li>
            <li className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 font-semibold">Borewell · TDS · all factories</span>
              <span className="t-num">2,000 mg/L</span>
              <Chip tone="accent">IS 10500</Chip>
            </li>
          </ul>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--bg-subtle)] px-3 py-2">
            <span className="t-eyebrow">Alert rules</span>
            <span className="t-caption ml-auto">12 active</span>
          </div>
          <ul className="divide-y divide-[var(--line)] text-sm">
            <li className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 font-semibold">water-positive &lt; 1.10</span>
              <Chip tone="warn">warning · all factories</Chip>
            </li>
            <li className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 font-semibold">Bhiwandi grid &gt; 15,000 kWh/mo</span>
              <Chip tone="danger">critical</Chip>
            </li>
            <li className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 font-semibold">DG-2 SFC &gt; 0.40 L/kWh</span>
              <Chip tone="warn">warning</Chip>
            </li>
            <li className="flex items-center gap-3 px-3 py-2">
              <span className="flex-1 font-semibold">Used oil &gt; 80% storage cap</span>
              <Chip tone="info">info · all factories</Chip>
            </li>
            <li className="px-3 py-2 text-xs text-[var(--muted)]">
              Edit any rule via the NL panel above (UI sketch p41 editor coming in Phase 3).
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
