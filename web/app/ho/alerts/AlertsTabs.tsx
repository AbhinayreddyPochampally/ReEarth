'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from '@/components/reearth/Icons';
import { Card, Chip } from '@/components/reearth/ui';
import { facilities } from '@/lib/v1/sample-data';
import type { Alert } from '@/lib/v1/types';

type Tab = 'compliance' | 'threshold' | 'gap';

interface Props {
  compliance: Alert[];
  threshold: Alert[];
  gap: Alert[];
}

function facilityName(id: string): string {
  return facilities.find(f => f.id === id)?.name ?? id;
}

function severityChip(severity: Alert['severity']): React.ReactElement {
  if (severity === 'critical') return <Chip tone="danger">critical</Chip>;
  if (severity === 'warn') return <Chip tone="warn">warn</Chip>;
  return <Chip>info</Chip>;
}

function ageLabel(ageHours: number): string {
  if (ageHours < 24) return `${ageHours}h ago`;
  return `${Math.floor(ageHours / 24)}d ago`;
}

function sourceHref(source: string): string {
  if (source.startsWith('bill-')) return `/ho/inbox/${source}`;
  if (source.startsWith('rule-')) return '/ho/master';
  if (source.startsWith('haz-')) return '/ho/master';
  // log-gap and gap-cron sources point to the affected facility's drill-down
  return '/ho/facilities/fac-bengaluru';
}

export default function AlertsTabs({ compliance, threshold, gap }: Props): React.ReactElement {
  const [active, setActive] = useState<Tab>(
    compliance.length > 0 ? 'compliance' : threshold.length > 0 ? 'threshold' : 'gap',
  );

  const list = active === 'compliance' ? compliance : active === 'threshold' ? threshold : gap;

  function tabClass(tab: Tab): string {
    return `mb-[-1px] inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
      tab === active
        ? 'border-[var(--primary)] text-[var(--ink)]'
        : 'border-transparent text-[var(--muted)] hover:text-[var(--ink-2)]'
    }`;
  }

  return (
    <div>
      <div className="mb-4 flex border-b border-[var(--line)]" role="tablist">
        <button aria-selected={active === 'compliance'} className={tabClass('compliance')} onClick={() => setActive('compliance')} role="tab" type="button">
          Compliance <Chip tone={compliance.length ? 'danger' : 'accent'}>{compliance.length}</Chip>
        </button>
        <button aria-selected={active === 'threshold'} className={tabClass('threshold')} onClick={() => setActive('threshold')} role="tab" type="button">
          Thresholds <Chip tone={threshold.length ? 'warn' : 'accent'}>{threshold.length}</Chip>
        </button>
        <button aria-selected={active === 'gap'} className={tabClass('gap')} onClick={() => setActive('gap')} role="tab" type="button">
          Data gaps <Chip tone={gap.length ? 'warn' : 'accent'}>{gap.length}</Chip>
        </button>
      </div>

      {list.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="t-h4 mb-2">All clear</div>
          <p className="t-caption">No open {active} alerts.</p>
        </Card>
      ) : (
        <div className="space-y-3" role="tabpanel">
          {list.map(alert => (
            <Card
              className={`border-l-4 p-4 ${
                alert.severity === 'critical'
                  ? 'border-l-[var(--danger)]'
                  : alert.severity === 'warn'
                    ? 'border-l-[var(--warn)]'
                    : 'border-l-[var(--line)]'
              }`}
              key={alert.id}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className={alert.severity === 'critical' ? 'text-[var(--danger)]' : 'text-[var(--warn)]'}
                  size={16}
                />
                <div className="t-h4 flex-1">{alert.title}</div>
                <Chip>{alert.id}</Chip>
                {severityChip(alert.severity)}
                <span className="t-caption">{ageLabel(alert.ageHours)}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <span className="font-semibold">{facilityName(alert.facilityId)}</span>
                <span className="text-[var(--muted)]">·</span>
                <span>{alert.body}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-2)] hover:bg-[var(--bg-hover)]"
                  href={sourceHref(alert.source)}
                >
                  Open source
                </Link>
                <button
                  className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-2)] hover:bg-[var(--bg-hover)]"
                  type="button"
                >
                  Acknowledge
                </button>
                <button
                  className="ml-auto rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--ink)]"
                  type="button"
                >
                  Resolve
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
