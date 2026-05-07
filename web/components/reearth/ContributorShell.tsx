'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ArrowLeft, Bell, FileText, Home, Inbox, Plus, User } from './Icons';

// Bottom nav tabs — one per primary surface. Adding "Event log" per
// the architect's request 2026-05-06.
const tabs = [
  { href: '/contributor',         label: 'Today',     key: 'today',  icon: Home },
  { href: '/contributor/daily',   label: 'Daily log', key: 'daily',  icon: FileText },
  { href: '/contributor/event',   label: 'Event log', key: 'event',  icon: Plus },
  { href: '/contributor/bills',   label: 'Evidence',  key: 'bills',  icon: Inbox },
  { href: '/contributor/me',      label: 'Me',        key: 'me',     icon: User },
];

// The five "root" routes that are reachable from the bottom nav.
// On these we hide the back button — the bottom nav itself is the navigation.
// Anything deeper (e.g. /contributor/daily/[paramCode], /contributor/bills/new,
// /contributor/event/[eventType]) shows a back arrow in the header.
const ROOT_PATHS = new Set([
  '/contributor',
  '/contributor/daily',
  '/contributor/event',
  '/contributor/bills',
  '/contributor/me',
]);

function activeKey(pathname: string): string {
  if (pathname.startsWith('/contributor/daily'))   return 'daily';
  if (pathname.startsWith('/contributor/event'))   return 'event';
  if (pathname.startsWith('/contributor/bills'))   return 'bills';
  if (pathname.startsWith('/contributor/monthly')) return 'today'; // monthly summary belongs to Today
  if (pathname.startsWith('/contributor/me'))      return 'me';
  return 'today';
}

export function ContributorShell({
  children,
  name,
  facility,
}: {
  children: React.ReactNode;
  name: string;
  facility: string;
}): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const active = activeKey(pathname);
  const isRoot = ROOT_PATHS.has(pathname);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col border-x border-[var(--line)] bg-[var(--bg)] shadow-[var(--shadow-2)]">
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[rgb(250_248_243_/_0.94)] px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            {/* Back button — visible only on inner (non-root) pages.
                Uses router.back() so the user lands on whichever page they
                came from, falling back to /contributor as a safe default. */}
            {!isRoot && (
              <button
                aria-label="Go back"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] text-[var(--ink-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                onClick={() => {
                  // If there's no history (deep link / refresh), router.back()
                  // is a no-op — fall through to the contributor home.
                  if (window.history.length > 1) router.back();
                  else router.push('/contributor');
                }}
                type="button"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <div className="t-caption">{facility}</div>
              {/* h1 per route — screen reader announces the user as the page heading */}
              <h1 className="t-h3 m-0">Hi, {name.split(' ')[0]}</h1>
            </div>
            <button
              aria-label="Notifications"
              className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--bg-elev)] text-[var(--ink-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              type="button"
            >
              <Bell size={18} />
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 pb-28 pt-4" id="main-content">{children}</main>
        <nav
          aria-label="Primary"
          className="fixed bottom-0 left-1/2 z-30 grid w-full max-w-[430px] -translate-x-1/2 grid-cols-5 border-t border-[var(--line)] bg-[rgb(255_255_255_/_0.92)] px-1 pb-5 pt-2 backdrop-blur"
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = tab.key === active;
            return (
              <Link
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-semibold ${isActive ? 'text-[var(--primary)]' : 'text-[var(--muted-2)]'}`}
                href={tab.href}
                key={tab.key}
              >
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.7} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
