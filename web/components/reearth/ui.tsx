import Link from 'next/link';
import type { ReactNode } from 'react';

type Tone = 'default' | 'accent' | 'warn' | 'danger' | 'good' | 'info';

const toneClass: Record<Tone, string> = {
  default: 'bg-[var(--bg-subtle)] text-[var(--ink-2)] border-[var(--line)]',
  accent: 'bg-[var(--accent-soft)] text-[#1f5a3e] border-[#c4e3d2]',
  warn: 'bg-[var(--warn-soft)] text-[#76520d] border-[#ecd9a5]',
  danger: 'bg-[var(--danger-soft)] text-[#7a2e22] border-[#eccac0]',
  good: 'bg-[var(--good-soft)] text-[#1f5a3e] border-[#c8dfd0]',
  info: 'bg-[var(--info-soft)] text-[#264a73] border-[#c8dcef]',
};

export function BrandMark(): React.ReactElement {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-[var(--accent)]">
      <span className="text-lg leading-none">R</span>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }): React.ReactElement {
  return <div className={`re-card ${className}`}>{children}</div>;
}

export function Chip({
  children,
  tone = 'default',
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}): React.ReactElement {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium ${toneClass[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
  className = '',
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'accent' | 'danger';
  className?: string;
}): React.ReactElement {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2';
  const variants = {
    primary: 'border border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[var(--ink)]',
    accent: 'border border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[#4ea877]',
    outline: 'border border-[var(--line)] bg-[var(--bg-elev)] text-[var(--ink)] hover:bg-[var(--bg-hover)]',
    ghost: 'border border-transparent bg-transparent text-[var(--ink-2)] hover:bg-[var(--bg-hover)]',
    danger: 'border border-[var(--line)] bg-[var(--bg-elev)] text-[var(--danger)] hover:bg-[var(--danger-soft)]',
  };

  return <Link className={`${base} ${variants[variant]} ${className}`} href={href}>{children}</Link>;
}

export function ConfidenceDot({ value }: { value: number }): React.ReactElement {
  const tier = value >= 0.85 ? 'hi' : value >= 0.65 ? 'mid' : 'lo';
  const bg = tier === 'hi' ? 'bg-[var(--conf-hi)]' : tier === 'mid' ? 'bg-[var(--conf-mid)]' : 'bg-[var(--conf-lo)]';
  const halo = tier === 'hi' ? 'bg-[var(--good-soft)]' : tier === 'mid' ? 'bg-[var(--warn-soft)]' : 'bg-[var(--danger-soft)]';
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full ${halo}`}>
        <span className={`h-2 w-2 rounded-full ${bg}`} />
      </span>
      <span className="t-caption t-num">{Math.round(value * 100)}%</span>
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--bg-elev)] px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--primary)]">{icon}</div>
      <div className="t-h3">{title}</div>
      <p className="t-caption mt-1 max-w-sm">{body}</p>
    </div>
  );
}
