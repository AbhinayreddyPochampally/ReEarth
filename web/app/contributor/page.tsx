import Link from 'next/link';
import { requireSession } from '@/lib/auth/session';
import { logoutAction } from '@/lib/auth/actions';
import { getParametersWithStatus } from '@/lib/db/submissions';
import type { ParameterWithStatus } from '@/lib/db/types';

export const metadata = { title: 'My Tasks — ReEarth 2.0' };

const FREQ_LABEL: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
  quarterly: 'Quarterly', annual: 'Annual',
};

const CAT_ORDER: Record<string, number> = {
  energy: 0, water: 1, waste_general: 2, waste_haz: 3, air: 4, operational: 5,
};

function statusBadge(p: ParameterWithStatus): React.ReactElement {
  const s = p.latest_submission?.status;
  if (!s)
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Due</span>;
  if (s === 'sent_back')
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Sent back</span>;
  if (s === 'pending')
    return <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">Pending review</span>;
  return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Approved ✓</span>;
}

function sortKey(p: ParameterWithStatus): string {
  const s = p.latest_submission?.status;
  const urgency = !s ? '0' : s === 'sent_back' ? '1' : s === 'pending' ? '2' : '3';
  const cat = String(CAT_ORDER[p.category] ?? 9);
  return `${urgency}-${cat}-${p.name}`;
}

export default async function ContributorPage(): Promise<React.ReactElement> {
  const session = await requireSession();
  const params = await getParametersWithStatus(session.facility_id);

  const sorted = [...params].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  const due = sorted.filter(p => { const s = p.latest_submission?.status; return !s || s === 'sent_back'; });
  const inFlight = sorted.filter(p => p.latest_submission?.status === 'pending');
  const done = sorted.filter(p => p.latest_submission?.status === 'approved');

  const now = new Date();
  const monthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <main className="min-h-screen bg-zinc-50 pb-8">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-900">{session.facility_name}</h1>
            <p className="text-xs text-zinc-500">{session.name} · {monthLabel}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">
              Logout
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 pt-6 space-y-6">
        {/* Summary chips */}
        <div className="flex gap-3 text-xs font-medium">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">{due.length} due</span>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">{inFlight.length} pending</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">{done.length} approved</span>
        </div>

        {params.length === 0 && (
          <p className="text-sm text-zinc-500">No parameters assigned to this facility.</p>
        )}

        {/* Due / sent back */}
        {due.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Due this month
            </h2>
            <ul className="space-y-2">
              {due.map(p => (
                <li key={p.id}>
                  <Link
                    href={`/contributor/submit/${p.id}`}
                    className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200 hover:ring-emerald-400 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-900">{p.name}</p>
                      <p className="text-xs text-zinc-400">{FREQ_LABEL[p.frequency] ?? p.frequency} · {p.unit}</p>
                    </div>
                    <div className="ml-3 flex flex-shrink-0 items-center gap-2">
                      {statusBadge(p)}
                      <span className="text-zinc-300">›</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Pending review */}
        {inFlight.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Pending review
            </h2>
            <ul className="space-y-2">
              {inFlight.map(p => (
                <li key={p.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200 opacity-70">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">{p.name}</p>
                    <p className="text-xs text-zinc-400">{FREQ_LABEL[p.frequency] ?? p.frequency} · {p.unit}</p>
                  </div>
                  <div className="ml-3 flex-shrink-0">{statusBadge(p)}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Approved */}
        {done.length > 0 && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Approved this month
            </h2>
            <ul className="space-y-2">
              {done.map(p => (
                <li key={p.id} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-zinc-200 opacity-60">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">{p.name}</p>
                    <p className="text-xs text-zinc-400">{FREQ_LABEL[p.frequency] ?? p.frequency} · {p.unit}</p>
                  </div>
                  <div className="ml-3 flex-shrink-0">{statusBadge(p)}</div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
