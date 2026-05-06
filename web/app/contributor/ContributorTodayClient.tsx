'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Bolt, ChevronRight, FileText, Plus, Upload } from '@/components/reearth/Icons';
import { ButtonLink, Card, Chip } from '@/components/reearth/ui';
import type { LogActivity, Parameter, Submission } from '@/lib/v1/types';
import { useStoredDailyLogs } from '@/lib/v1/local-log-store';

export function ContributorTodayClient({
  dailyParams,
  logActivities,
  monthlyReady,
  seededSubmissions,
}: {
  dailyParams: Parameter[];
  logActivities: LogActivity[];
  monthlyReady: boolean;
  seededSubmissions: Submission[];
}): React.ReactElement {
  const localLogs = useStoredDailyLogs();

  const loggedCodes = useMemo(() => {
    const codes = new Set(seededSubmissions.map(submission => submission.parameterCode));
    localLogs.forEach(log => codes.add(log.parameterCode));
    return codes;
  }, [localLogs, seededSubmissions]);

  const done = dailyParams.filter(parameter => loggedCodes.has(parameter.code)).length;
  const total = Math.max(dailyParams.length, 1);
  const pct = Math.round((done / total) * 100);
  const pending = dailyParams.filter(parameter => !loggedCodes.has(parameter.code)).slice(0, 5);
  const localRecent = localLogs.slice(-3).reverse().map(log => {
    const parameter = dailyParams.find(item => item.code === log.parameterCode);
    return {
      id: `local-${log.parameterCode}`,
      actor: 'You',
      title: `${parameter?.label ?? log.parameterCode} saved`,
      detail: `${log.value.toLocaleString('en-IN')} ${log.unit}`,
      atLabel: 'now',
    };
  });
  const recent = [...localRecent, ...logActivities].slice(0, 3);

  // UI sketch p7/p8/p9: three visual states for the daily-log card.
  //   Empty       → bright primary, "No entries yet today" + "Start logging"
  //   In-progress → bright primary, "N / total entered" + "Continue logging"
  //   Complete    → calm green, "All N done ✓" + "View entries"
  const isEmpty = done === 0;
  const isComplete = done >= dailyParams.length && dailyParams.length > 0;
  const todayLabel = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  const lastEntryLabel = recent[0]
    ? `Last: ${recent[0].atLabel}${recent[0].actor !== 'You' ? ' by ' + recent[0].actor : ''}`
    : '';

  return (
    <div className="space-y-4">
      {/*
        The Card component sets `background: var(--bg-elev)` via the .re-card
        class — the `background` shorthand resets background-image to none,
        which kills any Tailwind `bg-[linear-gradient(...)]` arbitrary class.
        Using a plain div + inline style sidesteps that and guarantees the
        intended dark/light palette renders.
      */}
      {isComplete ? (
        // Complete state — calm green card per UI sketch p9.
        <div
          className="rounded-xl border p-4 shadow-[var(--shadow-1)]"
          style={{
            background: 'linear-gradient(135deg, #e7f3eb 0%, #d8edd8 100%)',
            borderColor: 'var(--good, #5fbf8a)',
            color: '#1f3a2e',
          }}
        >
          <div className="t-eyebrow" style={{ color: '#3d8a5e' }}>
            Daily log ✓ · {todayLabel}
          </div>
          <div className="mt-2 text-3xl font-semibold leading-tight">All {total} done</div>
          {lastEntryLabel && (
            <div className="t-caption mt-1" style={{ color: '#6b7770' }}>{lastEntryLabel}</div>
          )}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(95,191,138,0.2)' }}>
            <div className="h-full rounded-full" style={{ width: '100%', background: '#3d8a5e' }} />
          </div>
          <div className="mt-3 flex items-center">
            <span className="t-caption" style={{ color: '#6b7770' }}>You&apos;re all caught up.</span>
            <ButtonLink className="ml-auto px-3 py-1.5 text-xs" href="/contributor/daily" variant="outline">
              View entries
            </ButtonLink>
          </div>
        </div>
      ) : (
        // Empty + In-progress — primary dark-green gradient, white text per UI sketch p7/p8.
        <div
          className="rounded-xl border p-4 shadow-[var(--shadow-1)]"
          style={{
            background: 'linear-gradient(135deg, #1f3a2e 0%, #2e5240 100%)',
            borderColor: 'var(--primary)',
            color: '#ffffff',
          }}
        >
          <div className="t-eyebrow" style={{ color: '#9bcdb0' }}>
            Today&apos;s daily log · {todayLabel}
          </div>
          {isEmpty ? (
            <>
              <div className="mt-3 text-2xl font-semibold leading-tight">No entries yet today</div>
              <div className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.72)' }}>
                {total} numbers needed · typically takes 90 sec
              </div>
            </>
          ) : (
            <>
              <div className="mt-3 flex items-end gap-2">
                <span className="t-num text-4xl font-semibold">{done}</span>
                <span className="pb-1 text-2xl font-semibold" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  / {total}
                </span>
                <span className="pb-1.5 ml-1 text-sm" style={{ color: 'rgba(255,255,255,0.72)' }}>
                  entered
                </span>
              </div>
              {lastEntryLabel && (
                <div className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.72)' }}>
                  {lastEntryLabel}
                </div>
              )}
            </>
          )}
          <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
          </div>
          <div className="mt-3 flex items-center text-sm">
            <span style={{ color: 'rgba(255,255,255,0.82)' }}>
              {isEmpty
                ? 'Tap below to start'
                : `${Math.max(total - done, 0)} left · ~${Math.max(5, (total - done) * 5)} sec`}
            </span>
            <ButtonLink className="ml-auto px-3 py-1.5 text-xs" href="/contributor/daily" variant="accent">
              {isEmpty ? 'Start logging' : 'Continue logging'} <ChevronRight size={14} />
            </ButtonLink>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link className="re-card p-4" href="/contributor/event">
          <Plus className="text-[var(--primary)]" size={18} />
          <div className="t-h4 mt-2">Log event</div>
          <div className="t-caption mt-1">Pickups, refills, tests</div>
        </Link>
        <Link className="re-card p-4" href="/contributor/bills/new">
          <Upload className="text-[var(--primary)]" size={18} />
          <div className="t-h4 mt-2">Upload evidence</div>
          <div className="t-caption mt-1">Optional photos or PDFs</div>
        </Link>
      </div>

      {monthlyReady && (
        <Link className="re-card flex items-center border-l-4 border-l-[var(--warn)] p-4" href="/contributor/monthly">
          <div>
            <div className="t-h4">April monthly summary</div>
            <div className="t-caption mt-1">Due in 3 days - ready for sign-off</div>
          </div>
          <ChevronRight className="ml-auto text-[var(--muted)]" size={16} />
        </Link>
      )}

      <section>
        <div className="t-eyebrow mb-2">Pending today</div>
        <div className="space-y-2">
          {pending.length > 0 ? pending.map(parameter => (
            <Link className="re-card flex items-center gap-3 p-3" href={`/contributor/daily/${parameter.code}`} key={parameter.code}>
              <Bolt className="text-[var(--warn)]" size={16} />
              <div className="min-w-0 flex-1">
                <div className="t-body-sm truncate font-semibold">{parameter.label}</div>
                <div className="t-caption">{parameter.category} - {parameter.unit}</div>
              </div>
              <Chip tone="warn">Tap to enter</Chip>
            </Link>
          )) : (
            <Card className="p-4">
              <div className="t-h4">All daily logs complete</div>
              <div className="t-caption mt-1">Nothing is pending for this facility today.</div>
            </Card>
          )}
        </div>
      </section>

      <section>
        <div className="t-eyebrow mb-2">Recent</div>
        <Card className="divide-y divide-[var(--line)] overflow-hidden">
          {recent.map(item => (
            <div className="flex items-center gap-3 p-3" key={item.id}>
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--info)] text-xs font-semibold text-white">{item.actor[0]}</div>
              <div className="min-w-0 flex-1">
                <div className="t-body-sm truncate font-semibold">{item.title}</div>
                <div className="t-tiny truncate">{item.detail}</div>
              </div>
              <div className="t-tiny">{item.atLabel}</div>
            </div>
          ))}
        </Card>
      </section>

      <ButtonLink className="w-full" href="/contributor/daily" variant="primary">
        <FileText size={16} />
        Open full daily log
      </ButtonLink>
    </div>
  );
}
