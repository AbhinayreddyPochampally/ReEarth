import { logoutAction } from '@/lib/auth/actions';
import { requireSession } from '@/lib/auth/session';
import { Card, Chip } from '@/components/reearth/ui';

export const metadata = { title: 'Me - ReEarth' };

export default async function ContributorMePage(): Promise<React.ReactElement> {
  const session = await requireSession();

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--warn)] text-lg font-semibold text-white">{session.name[0]}</div>
          <div>
            <div className="t-h3">{session.name}</div>
            <div className="t-caption">{session.facility_name}</div>
          </div>
        </div>
      </Card>
      <Card className="space-y-3 p-4">
        <div className="t-eyebrow">Device</div>
        <div className="flex items-center justify-between">
          <span className="t-body-sm">Offline queue</span>
          <Chip tone="good">0 pending</Chip>
        </div>
        <div className="flex items-center justify-between">
          <span className="t-body-sm">PWA install</span>
          <Chip tone="accent">ready</Chip>
        </div>
      </Card>
      <form action={logoutAction}>
        <button className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] px-4 py-2.5 text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)]" type="submit">
          Logout
        </button>
      </form>
    </div>
  );
}
