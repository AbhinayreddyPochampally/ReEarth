import { notFound } from 'next/navigation';
import { ArrowLeft } from '@/components/reearth/Icons';
import { ButtonLink, Card, Chip } from '@/components/reearth/ui';
import { facilityLogSnapshot, recentLogActivities } from '@/lib/v1/metrics';
import { alerts, facilities, getFacility } from '@/lib/v1/sample-data';

export function generateStaticParams(): { facilityId: string }[] {
  return facilities.map(facility => ({ facilityId: facility.id }));
}

export default async function FacilityPage({
  params,
}: {
  params: Promise<{ facilityId: string }>;
}): Promise<React.ReactElement> {
  const { facilityId } = await params;
  const exists = facilities.some(facility => facility.id === facilityId);
  if (!exists) notFound();
  const facility = getFacility(facilityId);
  const openAlerts = alerts.filter(alert => alert.facilityId === facility.id && alert.status === 'open');
  const logSnapshot = facilityLogSnapshot(facility.id);
  const recent = recentLogActivities(facility.id);

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-start gap-2">
        <ButtonLink href="/ho" variant="ghost"><ArrowLeft size={14} /> Facilities</ButtonLink>
        <div>
          <div className="t-h2">{facility.name}</div>
          <div className="t-caption mt-1">{facility.kind} - {facility.areaSqft.toLocaleString('en-IN')} sq ft - contributors: {facility.contributors}</div>
        </div>
        <span className="ml-auto">{openAlerts.length ? <Chip tone="warn">{openAlerts.length} open alert</Chip> : <Chip tone="good">Caught up</Chip>}</span>
      </div>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Electric units', logSnapshot.energyKwh ? logSnapshot.energyKwh.toLocaleString('en-IN') : '-', 'kWh logged'],
          ['Water logged', logSnapshot.waterM3 ? logSnapshot.waterM3.toLocaleString('en-IN') : '-', 'm3'],
          ['Daily completion', String(logSnapshot.completionPct), '%'],
          ['Open logs', String(logSnapshot.pendingLogs), 'items'],
        ].map(stat => (
          <Card className="p-4" key={stat[0]}>
            <div className="t-eyebrow">{stat[0]}</div>
            <div className="mt-2 flex items-baseline gap-2"><span className="t-num text-2xl font-semibold">{stat[1]}</span><span className="t-caption">{stat[2]}</span></div>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-4">
          <div className="mb-4 flex items-center">
            <div className="t-h4">Water flow - April</div>
            <div className="t-caption ml-auto">m3 cumulative</div>
          </div>
          <svg aria-label="Water withdrawal and recharge" className="h-72 w-full" viewBox="0 0 520 240">
            {[50, 95, 140, 185].map(y => <line key={y} stroke="#e6e2d8" strokeDasharray="3 3" x1="40" x2="500" y1={y} y2={y} />)}
            <path d="M40 64 L140 82 L240 108 L340 136 L440 170 L500 190" fill="none" stroke="#4a7fb1" strokeWidth="2" />
            <path d="M40 44 L140 58 L240 78 L340 108 L440 140 L500 160" fill="none" stroke="#5fbf8a" strokeWidth="2" />
            <text fill="#5fbf8a" fontSize="10" fontWeight="600" textAnchor="end" x="500" y="154">recharge</text>
            <text fill="#4a7fb1" fontSize="10" fontWeight="600" textAnchor="end" x="500" y="204">withdrawal</text>
          </svg>
          <div className="t-caption">Water-positive ratio = recharge divided by withdrawal. Target is at least 1.10.</div>
        </Card>
        <Card className="p-4">
          <div className="t-h4 mb-3">Recent activity</div>
          <div className="space-y-3">
            {recent.length > 0 ? recent.map(item => (
              <div className="flex gap-2" key={item.id}>
                <span className={`mt-1.5 h-2 w-2 rounded-full ${item.tone === 'warn' ? 'bg-[var(--warn)]' : item.tone === 'info' ? 'bg-[var(--info)]' : 'bg-[var(--good)]'}`} />
                <div>
                  <div className="t-body-sm font-semibold">{item.title}</div>
                  <div className="t-tiny">{item.actor} - {item.detail} - {item.atLabel}</div>
                </div>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-[var(--line)] p-4">
                <div className="t-body-sm font-semibold">No logs yet</div>
                <div className="t-caption mt-1">This facility is ready for contributor entries.</div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
