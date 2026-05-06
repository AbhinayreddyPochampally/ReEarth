import Link from 'next/link';
import { Card } from '@/components/reearth/ui';
import { facilities } from '@/lib/v1/sample-data';
import { facilityStatusRows, portfolioKpis } from '@/lib/v1/metrics';
import FilterBar from './FilterBar';

export const metadata = { title: 'Dashboards - ReEarth' };

// Dashboards landing per design doc §29 + UI sketch p26.
//
// Sections: filter bar (universal), 8 metric cards, two charts (energy mix +
// emissions trend), 15-facility compliance status grid color-coded by open
// alert count.
export default function HODashboardPage(): React.ReactElement {
  const kpis = portfolioKpis();
  const rows = facilityStatusRows();

  // Compliance tile colour: green if 0 open alerts, amber if 1, red if ≥2.
  function tileTone(openAlerts: number): string {
    if (openAlerts === 0) return 'bg-[#5fbf8a]';
    if (openAlerts === 1) return 'bg-[#d4972c]';
    return 'bg-[#b14a3a]';
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <h1 className="t-h2">Dashboards · 15 facilities</h1>
          <p className="t-caption mt-1">Approved data · This month</p>
        </div>
      </div>

      <FilterBar />

      <div className="mb-5 grid gap-3 grid-cols-2 sm:grid-cols-4">
        {kpis.map(kpi => (
          <Card className="p-4" key={kpi.label}>
            <div className="t-eyebrow">{kpi.label}</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="t-num text-xl font-semibold">{kpi.value}</span>
              <span className="t-caption">{kpi.unit}</span>
            </div>
            <div className={`t-caption mt-1 ${kpi.tone === 'good' ? 'text-[var(--good)]' : 'text-[var(--warn)]'}`}>{kpi.delta}</div>
          </Card>
        ))}
      </div>

      <div className="mb-5 grid gap-3 xl:grid-cols-[2fr_1fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center">
            <div className="t-h4">Emissions trend · Scope 1+2</div>
            <div className="t-caption ml-auto">last 6 months · tCO₂e</div>
          </div>
          <svg aria-label="Scope 1 and 2 emissions trend" className="h-56 w-full" viewBox="0 0 600 220">
            <defs>
              <linearGradient id="re-trend" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#5fbf8a" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#5fbf8a" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[50, 95, 140, 185].map(y => <line key={y} stroke="#e6e2d8" strokeDasharray="3 3" x1="40" x2="590" y1={y} y2={y} />)}
            <path d="M70 105 L170 82 L270 118 L370 88 L470 92 L570 66 L570 190 L70 190 Z" fill="url(#re-trend)" />
            <path d="M70 105 L170 82 L270 118 L370 88 L470 92 L570 66" fill="none" stroke="#1f3a2e" strokeWidth="2" />
            {['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map((month, index) => (
              <text fill="#6b7770" fontSize="11" key={month} textAnchor="middle" x={70 + index * 100} y="212">{month}</text>
            ))}
          </svg>
        </Card>

        <Card className="p-4">
          <div className="t-h4 mb-3">Energy mix · April</div>
          <div className="relative mx-auto h-40 w-40">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="none" r="40" stroke="#e6e2d8" strokeWidth="14" />
              <circle cx="50" cy="50" fill="none" r="40" stroke="#5fbf8a" strokeDasharray="96 251" strokeWidth="14" />
              <circle cx="50" cy="50" fill="none" r="40" stroke="#d4972c" strokeDasharray="130 251" strokeDashoffset="-96" strokeWidth="14" />
              <circle cx="50" cy="50" fill="none" r="40" stroke="#b14a3a" strokeDasharray="25 251" strokeDashoffset="-226" strokeWidth="14" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="t-num text-2xl font-semibold">38%</div>
              <div className="t-tiny">renewable</div>
            </div>
          </div>
          <div className="t-body-sm mt-4 space-y-1">
            {[
              ['Solar',     '#5fbf8a', '38.4%'],
              ['Grid',      '#d4972c', '52.0%'],
              ['DG diesel', '#b14a3a', '9.6%'],
            ].map(item => (
              <div className="flex items-center gap-2" key={item[0]}>
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item[1] }} />
                <span className="flex-1">{item[0]}</span>
                <span className="t-num font-semibold">{item[2]}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <div className="t-eyebrow">Compliance status · 15 facilities</div>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-[var(--muted)]">
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#5fbf8a]" /> green</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#d4972c]" /> amber-warn</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#b14a3a]" /> red-breach</span>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 xl:grid-cols-15">
        {rows.map(row => (
          <Link
            aria-label={`${row.facility.name} — ${row.openAlerts} open alert${row.openAlerts === 1 ? '' : 's'}`}
            className={`group flex aspect-square items-center justify-center rounded-md text-white transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${tileTone(row.openAlerts)}`}
            href={`/ho/facilities/${row.facility.id}`}
            key={row.facility.id}
          >
            <span className="text-[10px] font-semibold leading-tight text-center px-1">
              {row.facility.name.replace(/^Factory[ -]/, 'F · ').replace(/^Warehouse[ -]/, 'W · ')}
            </span>
          </Link>
        ))}
        {/* Pad the grid to 15 even if rows is short */}
        {rows.length < facilities.length &&
          Array.from({ length: facilities.length - rows.length }).map((_, idx) => (
            <div className="aspect-square rounded-md bg-[var(--bg-subtle)]" key={`pad-${idx}`} />
          ))}
      </div>
    </div>
  );
}
