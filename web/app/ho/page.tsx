import { requireSession } from '@/lib/auth/session';
import { logoutAction } from '@/lib/auth/actions';

export const metadata = { title: 'HO Review — ReEarth 2.0' };

export default async function HOPage(): Promise<React.ReactElement> {
  const session = await requireSession();

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">HO Review Queue</h1>
            <p className="text-xs text-zinc-500">{session.name}</p>
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

      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-200 text-2xl">
          📋
        </div>
        <h2 className="mt-4 text-lg font-semibold text-zinc-900">Review queue coming in Task 1.10</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Auth is working. HO screens are next after the contributor flow is complete.
        </p>
      </div>
    </main>
  );
}
