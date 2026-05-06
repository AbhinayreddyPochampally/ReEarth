'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart,
  Bell,
  Building,
  Database,
  Inbox,
  Leaf,
  Settings,
  Sparkle,
} from './Icons';
import { logoutAction } from '@/lib/auth/actions';
import { navCounts } from '@/lib/v1/metrics';
import AuditSearchBar from './AuditSearchBar';

// Six-surface sidebar per design doc §28.1 (post-2026-05-06 rescope).
// "Log Review" is removed — daily logs are trust signals, not HO-reviewed.
// Bill Inbox is the single confidence-sorted HO confirmation surface.
const nav = [
  { href: '/ho', label: 'Dashboards', key: 'dashboards', icon: BarChart },
  { href: '/ho/inbox', label: 'Bill Inbox', key: 'inbox', icon: Inbox },
  { href: '/ho/alerts', label: 'Alerts', key: 'alerts', icon: Bell },
  { href: '/ho/facilities/fac-hosur', label: 'Facilities', key: 'facilities', icon: Building },
  { href: '/ho/explorer', label: 'Data Explorer', key: 'explorer', icon: Sparkle },
  { href: '/ho/master', label: 'Master Data', key: 'master', icon: Database },
];

function activeKey(pathname: string): string {
  if (pathname.includes('/inbox')) return 'inbox';
  if (pathname.includes('/alerts')) return 'alerts';
  if (pathname.includes('/facilities')) return 'facilities';
  if (pathname.includes('/explorer')) return 'explorer';
  if (pathname.includes('/master')) return 'master';
  return 'dashboards';
}

export function HOShell({
  children,
  name,
}: {
  children: React.ReactNode;
  name: string;
}): React.ReactElement {
  const pathname = usePathname();
  const active = activeKey(pathname);
  const counts = navCounts();

  return (
    <div className="min-h-screen bg-[var(--bg)] p-3">
      <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1440px] overflow-hidden rounded-xl border border-[var(--line-strong)] bg-[var(--bg-elev)] shadow-[var(--shadow-2)]">
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--line)] bg-[var(--bg-subtle)] p-3 md:flex">
          <div className="mb-4 flex items-center gap-2 px-2 py-1.5 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--primary)] text-[var(--accent)]">
              <Leaf size={14} />
            </div>
            ReEarth
          </div>
          <div className="t-eyebrow px-2 pb-2 pt-1">Workspace</div>
          <nav className="flex flex-col gap-1">
            {nav.map(item => {
              const Icon = item.icon;
              const isActive = active === item.key;
              // Bill Inbox count uses the same `counts.logs` source for now —
              // post-rescope the metric represents confidence-tagged bills
              // awaiting HO confirmation, not daily-log review. Phase 2 will
              // rename navCounts.logs → navCounts.inbox.
              const badge = item.key === 'inbox' ? counts.logs : item.key === 'alerts' ? counts.alerts : 0;
              return (
                <Link
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold ${isActive ? 'bg-[var(--bg-elev)] text-[var(--ink)] shadow-[var(--shadow-1)]' : 'text-[var(--ink-2)] hover:bg-[var(--bg-hover)]'}`}
                  href={item.href}
                  key={item.key}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {badge > 0 && <span className="t-num ml-auto rounded-full bg-[var(--ink)] px-1.5 py-0.5 text-[10px] text-white">{badge}</span>}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-[var(--line)] pt-3">
            <Link className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-[var(--ink-2)] hover:bg-[var(--bg-hover)]" href="/ho/master">
              <Settings size={16} />
              Settings
            </Link>
            <div className="mt-2 flex items-center gap-2 px-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--info)] text-xs font-semibold text-white">{name[0]}</div>
              <div className="t-body-sm font-semibold">{name}</div>
            </div>
            <form action={logoutAction} className="mt-3">
              <button className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] px-2.5 py-2 text-sm font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)]" type="submit">
                Logout
              </button>
            </form>
          </div>
        </aside>
        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-[var(--line)] bg-[var(--bg-elev)] px-4">
            <div className="hidden max-w-xl flex-1 sm:flex">
              <AuditSearchBar />
            </div>
            <Link className="ml-auto inline-flex items-center gap-2 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-2)]" href="/ho/alerts">
              <Bell size={12} />
              {counts.alerts}
            </Link>
            <form action={logoutAction}>
              <button className="rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-soft)]" type="submit">
                Logout
              </button>
            </form>
          </header>
          <main className="re-scrollbar flex-1 overflow-auto bg-[var(--bg)]" id="main-content">{children}</main>
        </section>
      </div>
    </div>
  );
}
