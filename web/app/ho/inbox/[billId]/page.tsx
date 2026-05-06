import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, FileText } from '@/components/reearth/Icons';
import { ButtonLink, Card, Chip, ConfidenceDot } from '@/components/reearth/ui';
import { bills, getFacility } from '@/lib/v1/sample-data';
import { getBillStateOverride, getUploadedBills } from '@/lib/v1/bill-state-store';
import type { Bill } from '@/lib/v1/types';
import BillActions from './BillActions';

function trendForBill(bill: Bill): { title: string; threshold?: number; values: number[]; unit: string } | null {
  if (bill.kind === 'electricity') {
    return { title: 'Trend - electric units last 6 months', values: [11240, 11680, 10920, 12110, 12480, 12847], unit: 'kWh' };
  }
  if (bill.kind === 'lab_report') {
    return { title: 'Trend - BOD last 6 months', threshold: 30, values: [24, 27, 22, 28, 32, 38], unit: 'mg/L' };
  }
  return null;
}

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}): Promise<React.ReactElement> {
  const { billId } = await params;
  // Search both the seed and contributor-uploaded bills.
  const bill = bills.find(item => item.id === billId)
    ?? getUploadedBills().find(item => item.id === billId);
  if (!bill) notFound();
  const facility = getFacility(bill.facilityId);
  const trend = trendForBill(bill);
  // If the bill has already been acted upon, surface that — the actions
  // panel is hidden in that case (no double-actions on the same bill).
  const override = getBillStateOverride(bill.id);
  const liveStatus = override?.status ?? bill.status;
  const alreadyActed = liveStatus === 'approved' || liveStatus === 'sent_back';

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <ButtonLink href="/ho/inbox" variant="ghost"><ArrowLeft size={14} /> Inbox</ButtonLink>
        <span className="t-caption">/</span>
        <span className="t-caption">{facility.name}</span>
        <span className="t-caption">/</span>
        <span className="t-h4">{bill.vendor} - {bill.period}</span>
        {bill.breach && <span className="ml-auto"><Chip tone="danger"><AlertTriangle size={11} /> Compliance breach</Chip></span>}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Card className="overflow-hidden">
          <div className="relative h-[520px] overflow-hidden bg-[#1f1f1f]">
            {bill.imageUrl ? (
              // SVG / PDF preview rendered via <img>. The OCR field bboxes
              // overlay on top in the same coordinate space (0-1 fractions of
              // the image area), so the green highlight rectangles line up
              // with the extracted fields.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${bill.vendor} · ${bill.period}`}
                className="h-full w-full object-contain"
                src={bill.imageUrl}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-white/40">
                <FileText size={72} />
              </div>
            )}
            <div className="absolute left-4 top-4 text-xs text-white">p1 · {bill.vendor} · {bill.period}</div>
            <div className="absolute right-4 top-4 rounded-full bg-white px-2 py-1"><ConfidenceDot value={bill.confidence} /></div>
            {bill.extracted.map(field => (
              <div
                className="absolute rounded border-2 border-[var(--accent)] bg-[rgb(95_191_138_/_0.15)]"
                key={field.key}
                style={{ left: `${field.bbox.x * 100}%`, top: `${field.bbox.y * 100}%`, width: `${field.bbox.w * 100}%`, height: `${field.bbox.h * 100}%` }}
              />
            ))}
          </div>
        </Card>

        <div className="space-y-3">
          {bill.breach && (
            <Card className="border-[#eccac0] bg-[var(--danger-soft)] p-4">
              <div className="t-h4 flex items-center gap-2 text-[#7a2e22]"><AlertTriangle size={16} /> BOD exceeds CPCB limit</div>
              <p className="t-body-sm mt-2 text-[#7a2e22]">Reading <b>38 mg/L</b> - limit <b>30 mg/L</b> (CPCB effective 01 Apr 2024) - 27% over.</p>
              <p className="t-tiny mt-2 text-[#7a2e22]">If approved, this creates Compliance alert #A-038.</p>
            </Card>
          )}

          <Card className="divide-y divide-[var(--line)] overflow-hidden">
            <div className="flex items-center bg-[var(--bg-subtle)] px-4 py-3">
              <span className="t-eyebrow">Read from PDF</span>
              <span className="t-tiny ml-auto">tap to edit</span>
            </div>
            {bill.extracted.map(field => (
              <div className="flex items-center gap-3 px-4 py-3" key={field.key}>
                <span className="t-body-sm flex-1 text-[var(--muted)]">{field.label}</span>
                <span className="t-num font-semibold">{field.parsedValue.toLocaleString()}</span>
                <span className="t-caption w-14">{field.unit}</span>
                <ConfidenceDot value={field.confidence} />
              </div>
            ))}
          </Card>

          {trend && (
            <Card className="p-4">
              <div className="t-eyebrow mb-2">{trend.title}</div>
              <svg className="h-24 w-full" viewBox="0 0 300 90">
                {trend.threshold !== undefined && (
                  <>
                    <line stroke="#b14a3a" strokeDasharray="3 3" x1="0" x2="300" y1="42" y2="42" />
                    <text fill="#b14a3a" fontSize="9" textAnchor="end" x="295" y="38">Limit {trend.threshold}</text>
                  </>
                )}
                {trend.values.map((value, index, list) => {
                  const max = Math.max(...list, trend.threshold ?? 0);
                  const y = 82 - (value / max) * 58;
                  const x = 25 + index * 50;
                  const previous = list[index - 1];
                  const previousY = previous === undefined ? 0 : 82 - (previous / max) * 58;
                  const breach = trend.threshold !== undefined && value > trend.threshold;
                  return (
                    <g key={`${bill.kind}-${index}-${value}`}>
                      {previous !== undefined && <line stroke="#1f3a2e" strokeWidth="1.5" x1={25 + (index - 1) * 50} x2={x} y1={previousY} y2={y} />}
                      <circle cx={x} cy={y} fill={breach ? '#b14a3a' : '#1f3a2e'} r="3" />
                      {index === list.length - 1 && <text fill="#6b7770" fontSize="9" x={x - 18} y={Math.max(10, y - 7)}>{value.toLocaleString()} {trend.unit}</text>}
                    </g>
                  );
                })}
              </svg>
            </Card>
          )}

          {alreadyActed ? (
            <Card className="p-3">
              <div className="t-body-sm font-semibold">
                {liveStatus === 'approved' ? '✓ Approved' : '↩ Sent back'}
              </div>
              <p className="t-caption mt-1 text-[var(--muted)]">
                {liveStatus === 'approved'
                  ? 'This bill has been approved. The contributor has been notified.'
                  : 'This bill is awaiting re-upload by the contributor.'}
              </p>
              {override?.ho_comment && (
                <p className="t-caption mt-2 text-[var(--ink-2)]">
                  &ldquo;{override.ho_comment}&rdquo;
                </p>
              )}
            </Card>
          ) : (
            <BillActions billId={bill.id} hasBreach={bill.breach} />
          )}
        </div>
      </div>
    </div>
  );
}
