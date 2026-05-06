import Link from 'next/link';
import { AlertTriangle, ChevronRight, Inbox } from '@/components/reearth/Icons';
import { Card, Chip, ConfidenceDot, EmptyState } from '@/components/reearth/ui';
import { bills, getFacility, getPersonName } from '@/lib/v1/sample-data';
import { listBillsWithLiveStatus } from '@/lib/v1/bill-state-store';
import type { Bill } from '@/lib/v1/types';
import BulkApproveModal from './BulkApproveModal';

export const metadata = { title: 'Bill Inbox - ReEarth' };

const HIGH_CONFIDENCE = 0.9;
const MEDIUM_CONFIDENCE = 0.7;

function summary(bill: Bill): string {
  const first = bill.extracted[0];
  if (!first) return bill.kind;
  const value =
    typeof first.parsedValue === 'number'
      ? first.parsedValue.toLocaleString('en-IN')
      : first.parsedValue;
  return `${value} ${first.unit}`;
}

export default function BillInboxPage(): React.ReactElement {
  // Awaiting-review = any bill (seeded or contributor-uploaded) currently in
  // ready_for_review state. listBillsWithLiveStatus folds the overlay in.
  const awaiting = listBillsWithLiveStatus(bills).filter(b => b.status === 'ready_for_review');
  const greenAwaiting = awaiting.filter(b => b.confidence >= HIGH_CONFIDENCE && !b.breach);
  const needsAttention = awaiting.filter(b => b.breach || b.confidence < MEDIUM_CONFIDENCE);

  // Modal payload — only the fields the modal needs.
  const modalBills = greenAwaiting.map(b => ({
    id: b.id,
    facilityName: getFacility(b.facilityId).name,
    vendor: b.vendor,
    summary: `${b.kind === 'lab_report' ? 'Lab report' : b.kind === 'solar_ppa' ? 'Solar PPA' : b.kind} · ${summary(b)}`,
    confidence: b.confidence,
  }));

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div>
          <h1 className="t-h2 flex items-center gap-2">
            <Inbox size={20} /> Bill Inbox
          </h1>
          <p className="t-caption mt-1">
            {awaiting.length} bill{awaiting.length === 1 ? '' : 's'} waiting
            {needsAttention.length > 0 && (
              <>
                {' · '}
                <span className="font-semibold text-[var(--danger)]">
                  {needsAttention.length} need{needsAttention.length === 1 ? 's' : ''} attention
                </span>
              </>
            )}
          </p>
        </div>
        {awaiting.length > 0 && (
          <div className="ml-auto flex gap-2">
            <BulkApproveModal bills={modalBills} />
          </div>
        )}
      </div>

      {awaiting.length === 0 ? (
        <EmptyState
          body="When contributors upload bills or third-party reports, they appear here for HO confirmation."
          icon={<Inbox size={22} />}
          title="Inbox empty"
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">
            <Chip tone="accent">All · {awaiting.length}</Chip>
            <Chip tone="good">Green · {greenAwaiting.length}</Chip>
            <Chip tone="warn">
              Amber ·{' '}
              {
                awaiting.filter(
                  b => b.confidence < HIGH_CONFIDENCE && b.confidence >= MEDIUM_CONFIDENCE,
                ).length
              }
            </Chip>
            <Chip tone="danger">
              Red · {awaiting.filter(b => b.confidence < MEDIUM_CONFIDENCE).length}
            </Chip>
            {needsAttention.length > 0 && (
              <Chip tone="danger">⚠ {needsAttention.length} attention</Chip>
            )}
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead className="bg-[var(--bg-subtle)] text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
                  <tr>
                    <th className="px-3 py-2">Facility</th>
                    <th className="px-3 py-2">Bill</th>
                    <th className="px-3 py-2">Value read</th>
                    <th className="px-3 py-2">Confidence</th>
                    <th className="px-3 py-2">From</th>
                    <th className="px-3 py-2">Age</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {awaiting.map(bill => (
                    <tr className="hover:bg-[var(--bg-hover)]" key={bill.id}>
                      <td className="border-t border-[var(--line)] px-3 py-3 font-semibold">
                        {getFacility(bill.facilityId).name}
                      </td>
                      <td className="border-t border-[var(--line)] px-3 py-3">
                        {bill.vendor} · {bill.period}
                      </td>
                      <td className="t-num border-t border-[var(--line)] px-3 py-3 font-semibold">
                        {summary(bill)}
                        {bill.breach && (
                          <span className="ml-2 align-middle">
                            <Chip tone="danger">
                              <AlertTriangle size={11} /> breach
                            </Chip>
                          </span>
                        )}
                      </td>
                      <td className="border-t border-[var(--line)] px-3 py-3">
                        <ConfidenceDot value={bill.confidence} />
                      </td>
                      <td className="border-t border-[var(--line)] px-3 py-3">
                        {getPersonName(bill.uploadedBy)}
                      </td>
                      <td className="border-t border-[var(--line)] px-3 py-3">{bill.ageHours}h</td>
                      <td className="border-t border-[var(--line)] px-3 py-3">
                        <Link
                          aria-label={`Open ${bill.vendor}`}
                          className="inline-flex items-center"
                          href={`/ho/inbox/${bill.id}`}
                        >
                          <ChevronRight className="text-[var(--muted)]" size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
