'use client';

import { useState } from 'react';

type Tab = 'all' | 'pending' | 'sent_back';

interface Props {
  allCount: number;
  pendingCount: number;
  sentBackCount: number;
  children: Record<Tab, React.ReactNode>;
}

export default function MyBillsTabs({
  allCount,
  pendingCount,
  sentBackCount,
  children,
}: Props): React.ReactElement {
  const [active, setActive] = useState<Tab>('all');

  function tabClasses(tab: Tab): string {
    const base = 'rounded-full border px-3 py-1 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)]';
    if (tab === active) {
      return `${base} border-[var(--primary)] bg-[var(--primary)] text-white`;
    }
    return `${base} border-[var(--line)] bg-white text-[var(--ink-2)] hover:bg-[var(--bg-hover)]`;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2" role="tablist">
        <button
          aria-selected={active === 'all'}
          className={tabClasses('all')}
          onClick={() => setActive('all')}
          role="tab"
          type="button"
        >
          All · {allCount}
        </button>
        <button
          aria-selected={active === 'pending'}
          className={tabClasses('pending')}
          onClick={() => setActive('pending')}
          role="tab"
          type="button"
        >
          Pending · {pendingCount}
        </button>
        <button
          aria-selected={active === 'sent_back'}
          className={tabClasses('sent_back')}
          onClick={() => setActive('sent_back')}
          role="tab"
          type="button"
        >
          Sent back · {sentBackCount}
        </button>
      </div>
      <div role="tabpanel">{children[active]}</div>
    </div>
  );
}
