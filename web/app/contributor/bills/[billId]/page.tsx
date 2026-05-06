import { notFound } from 'next/navigation';
import { ChevronLeft, MessageCircle } from '@/components/reearth/Icons';
import { ButtonLink, Card, Chip } from '@/components/reearth/ui';
import { requireSession } from '@/lib/auth/session';
import { bills } from '@/lib/v1/sample-data';
import { getBillStateOverride, getUploadedBills } from '@/lib/v1/bill-state-store';
import ReuploadForm from './ReuploadForm';

export const metadata = { title: 'Bill - ReEarth' };

// Sent-back bill detail / re-upload page per UI sketch p18.
// Shows the HO comment, the original upload preview placeholder, and the
// re-upload form. After re-upload, the bill flows back to HO inbox as
// ready_for_review.
export default async function ContributorBillPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}): Promise<React.ReactElement> {
  const session = await requireSession();
  const { billId } = await params;

  const allBills = [...bills, ...getUploadedBills()];
  const bill = allBills.find(b => b.id === billId);
  if (!bill || bill.facilityId !== session.facility_id) notFound();

  const override = getBillStateOverride(bill.id);
  const status = override?.status ?? bill.status;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <ButtonLink className="h-9 w-9 px-0" href="/contributor/bills" variant="outline">
          <ChevronLeft size={16} />
        </ButtonLink>
        <div>
          <div className="t-h3">
            {bill.vendor} · {bill.period}
          </div>
          <div className="t-caption mt-0.5">
            {status === 'sent_back'
              ? 'HO needs you to re-upload'
              : status === 'approved'
                ? 'Approved by HO'
                : 'Waiting on HO'}
          </div>
        </div>
      </div>

      {status === 'sent_back' && override?.ho_comment && (
        <Card className="p-3">
          <div className="t-eyebrow mb-1.5 flex items-center gap-1.5 text-[var(--danger)]">
            <MessageCircle size={12} /> HO comment
          </div>
          <p className="t-body-sm">“{override.ho_comment}”</p>
        </Card>
      )}

      <Card className="border-dashed p-4 text-center text-[var(--muted)]">
        <div className="t-body-sm font-semibold">Original upload</div>
        <div className="t-caption mt-1">Preview not stored in this demo phase.</div>
      </Card>

      {status === 'sent_back' ? (
        <ReuploadForm billId={bill.id} />
      ) : (
        <Chip tone="info">
          {status === 'approved'
            ? 'No further action needed.'
            : 'Waiting on HO. You will get a push notification when reviewed.'}
        </Chip>
      )}
    </div>
  );
}
