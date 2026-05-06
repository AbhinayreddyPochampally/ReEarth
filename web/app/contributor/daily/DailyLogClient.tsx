'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Check, ChevronRight } from '@/components/reearth/Icons';
import { ButtonLink, Card, Chip } from '@/components/reearth/ui';
import type { Parameter, Submission } from '@/lib/v1/types';
import { useStoredDailyLogs } from '@/lib/v1/local-log-store';

const categoryOrder = ['energy', 'water', 'waste', 'emissions', 'compliance'] as const;

export function DailyLogClient({
  parameters,
  submissions,
}: {
  parameters: Parameter[];
  submissions: Submission[];
}): React.ReactElement {
  const localLogs = useStoredDailyLogs();

  const loggedByCode = useMemo(() => {
    const map = new Map<string, { value: number; unit: string }>();
    submissions.forEach(submission => map.set(submission.parameterCode, submission));
    localLogs.forEach(log => map.set(log.parameterCode, log));
    return map;
  }, [localLogs, submissions]);

  const done = parameters.filter(parameter => loggedByCode.has(parameter.code)).length;
  const total = parameters.length;

  return (
    <div className="space-y-4">
      <div>
        <div className="t-h2">Today&apos;s log</div>
        <div className="t-caption mt-1">Tuesday, 5 May - shared facility entry</div>
      </div>
      <div className="flex items-center gap-2">
        <Chip tone="accent">{done} of {total} done</Chip>
        <Chip tone={done >= total ? 'good' : 'warn'}>{Math.max(total - done, 0)} open logs</Chip>
      </div>

      {categoryOrder.map(category => {
        const rows = parameters.filter(parameter => parameter.category === category);
        if (rows.length === 0) return null;
        return (
          <section key={category}>
            <div className="t-eyebrow mb-2">{category}</div>
            <Card className="divide-y divide-[var(--line)] overflow-hidden">
              {rows.map(parameter => {
                const sub = loggedByCode.get(parameter.code);
                return (
                  <Link
                    className={`flex items-center gap-3 p-3 ${sub ? '' : 'bg-[var(--bg-subtle)]'}`}
                    href={`/contributor/daily/${parameter.code}`}
                    key={parameter.code}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${sub ? 'bg-[var(--good-soft)] text-[var(--good)]' : 'bg-[var(--bg-elev)] text-[var(--muted)]'}`}>
                      {sub ? <Check size={14} /> : <span className="h-2 w-2 rounded-full border border-dashed border-current" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="t-body-sm truncate font-semibold">{parameter.label}</div>
                      <div className="t-caption">{parameter.unit}</div>
                    </div>
                    {sub ? (
                      <div className="text-right">
                        <span className="t-num text-base font-semibold">{sub.value.toLocaleString('en-IN')}</span>
                        <span className="t-caption ml-1">{sub.unit}</span>
                      </div>
                    ) : (
                      <span className="t-caption inline-flex items-center gap-1">Tap to log <ChevronRight size={14} /></span>
                    )}
                  </Link>
                );
              })}
            </Card>
          </section>
        );
      })}

      <ButtonLink className="w-full" href="/contributor" variant={done >= total ? 'primary' : 'outline'}>
        Done for today
      </ButtonLink>
    </div>
  );
}
