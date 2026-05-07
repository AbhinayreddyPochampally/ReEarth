import Link from 'next/link';
import { ChevronRight, Upload } from '@/components/reearth/Icons';
import { ButtonLink, Card, Chip, EmptyState } from '@/components/reearth/ui';
import { requireSession } from '@/lib/auth/session';
import { bills, resolveV1FacilityId } from '@/lib/v1/sample-data';
import { getBillStateOverride, listBillsWithLiveStatus } from '@/lib/v1/bill-state-store';
import type { Bill, BillStatus } from '@/lib/v1/types';
import MyBillsTabs from './MyBillsTabs';

export const metadata = { title: 'My bills - ReEarth' };

// "My Bills" status list per UI sketch p17 (numbered "16 My bills — status
// list" in the contents but appears at p17 in the rendered PDF).
//
// Tabs: All · Pending · Sent back. Each row shows period/value summary,
// status chip, and tap-to-open. Sent-back rows are visually highlighted and
// route to the re-upload prompt (UI sketch p18).
//
// Filters by the contributor's facility — they only see their own bills.

function statusChip(status: BillStatus): React.ReactElement {
  if (status === 'approved') return <Chip tone="good">✓ confirmed</Chip>;
  if (status === 'sent_back') return <Chip tone="danger">↩ sent back · re-upload</Chip>;
  return <Chip tone="warn">⏳ waiting on HO</Chip>;
}

function summaryLine(bill: Bill): string {
  const first = bill.extracted[0];
  if (!first) return bill.kind;
  const value =
    typeof first.parsedValue === 'number'
      ? first.parsedValue.toLocaleString('en-IN')
      : first.parsedValue;
  return `${value} ${first.unit}`;
}

export default async function MyBillsPage(): Promise<React.ReactElement> {
  const session = await requireSession();
  // SAP-code bridge — ContributorShell handles back navigation globally now,
  // so the in-page back chevron has been retired. Bottom nav is the way home.
  const v1FacilityId = resolveV1FacilityId({ sapCode: session.sap_code, facilityId: session.facility_id });
  const all = listBillsWithLiveStatus(bills).filter(
    bill => bill.facilityId === v1FacilityId,
  );
  const pending = all.filter(b => b.status === 'ready_for_review');
  const sentBack = all.filter(b => b.status === 'sent_back');

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="t-h2">My bills</div>
          <div className="t-caption mt-1">Last 30 days · {all.length} uploads</div>
        </div>
        <ButtonLink href="/contributor/bills/new" variant="primary">
          <Upload size={14} /> Upload
        </ButtonLink>
      </div>

      <MyBillsTabs allCount={all.length} pendingCount={pending.length} sentBackCount={sentBack.length}>
        {{
          all: <BillList bills={all} />,
          pending: <BillList bills={pending} emptyMessage="Nothing waiting on HO right now." />,
          sent_back: (
            <BillList
              bills={sentBack}
              emptyMessage="No bills currently sent back. Good."
              showReUpload
            />
          ),
        }}
      </MyBillsTabs>
    </div>
  );
}

interface BillListProps {
  bills: Bill[];
  emptyMessage?: string;
  showReUpload?: boolean;
}

function BillList({ bills, emptyMessage, showReUpload }: BillListProps): React.ReactElement {
  if (bills.length === 0) {
    return (
      <EmptyState
        body={emptyMessage ?? 'No bills here yet. Tap Upload to add one.'}
        icon={<Upload size={22} />}
        title="Empty"
      />
    );
  }
  return (
    <div className="space-y-2">
      {bills.map(bill => {
        const override = getBillStateOverride(bill.id);
        const detailHref = bill.status === 'sent_back' ? `/contributor/bills/${bill.id}` : '#';
        return (
          <Card className="p-3" key={bill.id}>
            <Link className="flex items-center gap-3" href={detailHref}>
              <div className="flex h-12 w-10 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--muted)]">
                <Upload size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="t-body-sm font-semibold">
                  {bill.vendor} · {bill.period}
                </div>
                <div className="t-caption mt-0.5">{summaryLine(bill)}</div>
              </div>
              <div className="text-right">{statusChip(bill.status)}</div>
              {showReUpload && bill.status === 'sent_back' && (
                <ChevronRight className="text-[var(--muted)]" size={16} />
              )}
            </Link>
            {override?.ho_comment && bill.status === 'sent_back' && (
              <div className="mt-2 rounded-md bg-[var(--danger-soft)] px-2.5 py-2 text-xs text-[var(--danger)]">
                <span className="font-semibold">HO: </span>“{override.ho_comment}”
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
