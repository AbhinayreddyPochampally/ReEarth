import { ChevronLeft } from '@/components/reearth/Icons';
import { ButtonLink } from '@/components/reearth/ui';
import { requireSession } from '@/lib/auth/session';
import UploadBillForm from './UploadBillForm';

export const metadata = { title: 'Upload bills - ReEarth' };

// Bill upload page per UI sketch p15. Drop zone (or tap to upload), kind
// picker, vendor and period inputs. On submit creates a Bill in the HO inbox.
//
// Phase 2: file metadata is captured (filename) for the audit log; the file
// itself is discarded. Phase 3 streams to Supabase Storage and triggers OCR
// via Azure Document Intelligence.
export default async function UploadBillPage(): Promise<React.ReactElement> {
  // Layout already gates this — but keep the explicit requireSession so the
  // form gets an authenticated session at render time.
  await requireSession();

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <ButtonLink className="h-9 w-9 px-0" href="/contributor/bills" variant="outline">
          <ChevronLeft size={16} />
        </ButtonLink>
        <div>
          <div className="t-h2">Upload bills</div>
          <div className="t-caption mt-1">Drop multiple at once · PDF or JPG</div>
        </div>
      </div>

      <UploadBillForm />
    </div>
  );
}
