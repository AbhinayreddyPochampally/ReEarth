import { requireSession } from '@/lib/auth/session';
import { logoutAction } from '@/lib/auth/actions';
import { getPendingSubmissions } from '@/lib/db/reviews';
import ReviewQueue from './ReviewQueue';

export const metadata = { title: 'HO Review — ReEarth 2.0' };

export default async function HOPage(): Promise<React.ReactElement> {
  const [session, submissions] = await Promise.all([
    requireSession(),
    getPendingSubmissions(),
  ]);

  return (
    <main className="min-h-screen bg-zinc-50 pb-8">
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">Review Queue</h1>
            <p className="text-xs text-zinc-500">
              {session.name} · {submissions.length} pending
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Logout
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 pt-6">
        <ReviewQueue submissions={submissions} />
      </div>
    </main>
  );
}
