import { alerts } from '@/lib/v1/sample-data';
import AlertsTabs from './AlertsTabs';

export const metadata = { title: 'Alerts - ReEarth' };

// Three-tab Alerts surface per design doc §31 + UI sketch p30/31/32:
//   Compliance — regulatory breaches detected from approved lab reports
//   Thresholds — HO-defined rule firings
//   Data gaps  — incomplete logs / missing bills / late lab reports
//
// Each tab shows the same row shape with specialised contextual fields.
export default function AlertsPage(): React.ReactElement {
  const compliance = alerts.filter(a => a.kind === 'compliance' && a.status === 'open');
  const threshold = alerts.filter(a => a.kind === 'threshold' && a.status === 'open');
  const gap = alerts.filter(a => a.kind === 'gap' && a.status === 'open');

  return (
    <div className="p-6">
      <h1 className="t-h2">Alerts</h1>
      <p className="t-caption mt-1 mb-4">
        {compliance.length + threshold.length + gap.length} open · across {new Set(alerts.filter(a => a.status === 'open').map(a => a.facilityId)).size} facilities
      </p>
      <AlertsTabs compliance={compliance} threshold={threshold} gap={gap} />
    </div>
  );
}
