'use client';

import { useState } from 'react';

// Universal filter bar per design doc §29.1 + UI sketch p26.
//
// Phase 2 scope: pure UI. State changes don't yet refilter the underlying
// data — the filter values persist in the URL on Phase 3 when the data
// layer is wired through. For now, picking a filter shows a chip and
// closes its picker, so the architect can demo the interaction.

const FILTERS = [
  { key: 'facility',    label: 'Facility',    options: ['All 15', 'All factories', 'All warehouses', 'Factory-Bengaluru', 'Factory-Tirupur'] },
  { key: 'brand',       label: 'Brand',       options: ['All', 'Pantaloons', 'Allen Solly', 'Van Heusen', 'Louis Philippe', 'Peter England'] },
  { key: 'period',      label: 'Period',      options: ['Today', 'This week', 'This month', 'Last month', 'This quarter', 'This year'] },
  { key: 'category',    label: 'Category',    options: ['All', 'Water', 'Energy', 'Emissions', 'Waste'] },
  { key: 'parameter',   label: 'Parameter',   options: ['All'] },
  { key: 'status',      label: 'Status',      options: ['Approved', 'Pending', 'Sent back', 'All'] },
  { key: 'comparison',  label: 'Compare',     options: ['None', 'vs Last period', 'vs Same period last year'] },
  { key: 'aggregation', label: 'Group by',    options: ['By facility', 'By month', 'By category'] },
];

const DEFAULTS: Record<string, string> = {
  facility: 'All 15',
  brand: 'All',
  period: 'This month',
  category: 'All',
  parameter: 'All',
  status: 'Approved',
  comparison: 'None',
  aggregation: 'By facility',
};

export default function FilterBar(): React.ReactElement {
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);
  const [openKey, setOpenKey] = useState<string | null>(null);

  function setValue(key: string, value: string): void {
    setValues(prev => ({ ...prev, [key]: value }));
    setOpenKey(null);
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {FILTERS.map(filter => (
        <div className="relative" key={filter.key}>
          <button
            aria-expanded={openKey === filter.key}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink-2)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            onClick={() => setOpenKey(openKey === filter.key ? null : filter.key)}
            type="button"
          >
            <span className="text-[var(--muted)]">{filter.label}:</span>
            <span>{values[filter.key]}</span>
            <span aria-hidden className="text-[var(--muted)]">▾</span>
          </button>
          {openKey === filter.key && (
            <ul
              className="absolute left-0 top-full z-10 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-[var(--line)] bg-white shadow-[var(--shadow-2)]"
              role="menu"
            >
              {filter.options.map(option => (
                <li key={option}>
                  <button
                    className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-hover)] focus:outline-none ${
                      values[filter.key] === option ? 'font-semibold text-[var(--primary)]' : ''
                    }`}
                    onClick={() => setValue(filter.key, option)}
                    type="button"
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      <button
        className="ml-auto inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        onClick={() => setValues(DEFAULTS)}
        type="button"
      >
        Reset
      </button>
    </div>
  );
}
