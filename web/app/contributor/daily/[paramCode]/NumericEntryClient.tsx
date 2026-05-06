'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Check } from '@/components/reearth/Icons';
import { Card, Chip } from '@/components/reearth/ui';
import type { Parameter } from '@/lib/v1/types';
import { readStoredDailyLogs, writeStoredDailyLogs } from '@/lib/v1/local-log-store';

export function NumericEntryClient({
  parameter,
  initialValue,
}: {
  parameter: Parameter;
  initialValue: string;
}): React.ReactElement {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(false);
  const quickValues = useMemo(
    () => [parameter.softMin, (parameter.softMin + parameter.softMax) / 2, parameter.softMax],
    [parameter.softMax, parameter.softMin],
  );

  function appendKey(key: string) {
    setSaved(false);
    setValue(current => {
      if (key === '<') return current.length > 1 ? current.slice(0, -1) : '0';
      if (key === '.' && current.includes('.')) return current;
      const next = current === '0' && key !== '.' ? key : `${current}${key}`;
      return next.replace(/^0+(\d)/, '$1');
    });
  }

  function save() {
    const numericValue = Number(value.replace(/,/g, ''));
    const existing = readStoredDailyLogs();
    const next = [
      ...existing.filter(log => log.parameterCode !== parameter.code),
      { parameterCode: parameter.code, value: numericValue, unit: parameter.unit },
    ];
    writeStoredDailyLogs(next);
    setSaved(true);
    router.push('/contributor/daily');
  }

  return (
    <>
      <Card className="p-4 text-center">
        <div className="t-caption">Reading from main meter</div>
        <div className="mt-3 flex items-baseline justify-center gap-2">
          <span className="t-num text-5xl font-semibold">{value || '0'}</span>
          <span className="t-h3 text-[var(--muted)]">{parameter.unit}</span>
        </div>
        <div className="t-caption mt-2">Typical: {parameter.softMin.toLocaleString('en-IN')} to {parameter.softMax.toLocaleString('en-IN')} {parameter.unit}</div>
      </Card>

      <div>
        <div className="t-caption mb-2">Quick entry</div>
        <div className="flex flex-wrap gap-2">
          {quickValues.map(quickValue => (
            <button
              className="contents"
              key={quickValue}
              onClick={() => {
                setSaved(false);
                setValue(Math.round(quickValue).toLocaleString('en-IN'));
              }}
              type="button"
            >
              <Chip>{Math.round(quickValue).toLocaleString('en-IN')}</Chip>
            </button>
          ))}
        </div>
      </div>

      <Card className="flex items-center gap-3 border-dashed p-3">
        <Camera className="text-[var(--muted)]" size={18} />
        <div>
          <div className="t-body-sm font-semibold">Add meter photo</div>
          <div className="t-caption">Optional backup; saved with the log in production mode.</div>
        </div>
      </Card>

      <div className="mt-auto grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '<'].map(key => (
          <button
            aria-label={key === '<' ? 'Delete digit' : key === '.' ? 'Decimal point' : `Digit ${key}`}
            className="h-13 rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] text-xl font-semibold shadow-[var(--shadow-1)]"
            key={key}
            onClick={() => appendKey(key)}
            type="button"
          >
            {key}
          </button>
        ))}
      </div>

      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
        onClick={save}
        type="button"
      >
        <Check size={16} />
        {saved ? 'Saved' : 'Save reading'}
      </button>
    </>
  );
}
