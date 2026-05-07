import Link from 'next/link';
import { Card, Chip } from '@/components/reearth/ui';
import { facilityStatusRows } from '@/lib/v1/metrics';

export const metadata = { title: 'Facilities - ReEarth' };

// Facilities list (HO surface 4 of 6 — design doc §29.3, UI sketch p32).
// Sortable list of all 15 facilities with completion %, open alerts, renewable
// share, water-positive ratio. Each row links to /ho/facilities/[facilityId]
// for the drill-down. Replaces the previous hardcoded link to fac-hosur.
export default function HOFacilitiesListPage(): React.ReactElement {
  const rows = facilityStatusRows();

  function alertChip(openAlerts: number): React.ReactElement {
    if (openAlerts === 0) return <Chip tone="good">caught up</Chip>;
    if (openAlerts === 1) return <Chip tone="warn">1 open</Chip>;
    return <Chip tone="danger">{openAlerts} open</Chip>;
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="t-h2">Facilities · 15</h1>
        <p className="t-caption mt-1">11 garment factories + 4 distribution warehouses · click any row to drill down</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] border-b border-[var(--line)] bg-[var(--bg-subtle)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          <div>Facility</div>
          <div>Type</div>
          <div className="text-right">Completion</div>
          <div className="text-right">Renewable</div>
          <div className="text-right">Status</div>
        </div>
        {rows.map(row => (
          <Link
            className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center border-b border-[var(--line)] px-4 py-3 last:border-b-0 hover:bg-[var(--bg-subtle)]"
            href={`/ho/facilities/${row.facility.id}`}
            key={row.facility.id}
          >
            <div>
              <div className="t-body-sm font-semibold">{row.facility.name}</div>
              <div className="t-caption mt-0.5">{row.facility.city}, {row.facility.state}</div>
            </div>
            <div className="t-caption capitalize">{row.facility.kind}</div>
            <div className="text-right t-num text-sm font-semibold">{row.completion}%</div>
            <div className="text-right t-num text-sm">
              {row.renewablePct > 0 ? `${row.renewablePct}%` : '—'}
            </div>
            <div className="flex justify-end">{alertChip(row.openAlerts)}</div>
          </Link>
        ))}
      </Card>
    </div>
  );
}
