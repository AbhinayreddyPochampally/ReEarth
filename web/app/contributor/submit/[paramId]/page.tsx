import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth/session';
import { getParameterById } from '@/lib/db/submissions';
import SubmitForm from './SubmitForm';

interface Props {
  params: Promise<{ paramId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { paramId } = await params;
  const param = await getParameterById(paramId);
  return { title: param ? `Submit — ${param.name}` : 'Submit' };
}

// Returns the first and last day of the current month as ISO date strings.
function currentPeriod(): { start: string; end: string; label: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const start = new Date(y, m, 1).toISOString().slice(0, 10);
  const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
  const label = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  return { start, end, label };
}

export default async function SubmitPage({ params }: Props): Promise<React.ReactElement> {
  const { paramId } = await params;

  const [session, param] = await Promise.all([
    requireSession(),
    getParameterById(paramId),
  ]);

  if (!param) notFound();

  const period = currentPeriod();

  return (
    <main className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <a href="/contributor" className="text-zinc-400 hover:text-zinc-600 text-sm">← Back</a>
          <div>
            <h1 className="text-base font-semibold text-zinc-900">{param.name}</h1>
            <p className="text-xs text-zinc-500">{period.label} · {param.unit}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 pt-6">
        <SubmitForm
          parameterId={param.id}
          parameterName={param.name}
          unit={param.unit}
          evidenceRequired={param.evidence_required}
          periodStart={period.start}
          periodEnd={period.end}
          periodLabel={period.label}
          submittedByName={session.name}
        />
      </div>
    </main>
  );
}
