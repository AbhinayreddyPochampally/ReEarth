import { redirect } from 'next/navigation';
import { getParameter, parameters } from '@/lib/v1/sample-data';
import { NumericEntryClient } from './NumericEntryClient';

export const metadata = { title: 'Daily entry · ReEarth' };

export function generateStaticParams(): { paramCode: string }[] {
  return parameters.map(parameter => ({ paramCode: parameter.code }));
}

export default async function NumericEntryPage({
  params,
}: {
  params: Promise<{ paramCode: string }>;
}): Promise<React.ReactElement> {
  const { paramCode } = await params;
  const parameter = getParameter(paramCode);
  if (!parameter) redirect('/contributor/daily');

  const displayValue = parameter.code === 'grid_kwh' ? '8,420' : parameter.softMin.toLocaleString('en-IN');

  return (
    <div className="flex min-h-[calc(100vh-180px)] flex-col space-y-4">
      {/* Back is handled globally by ContributorShell on non-root paths. */}
      <div>
        <div className="t-h3">{parameter.label}</div>
        <div className="t-caption">{parameter.category} - daily reading</div>
      </div>

      <NumericEntryClient initialValue={displayValue} parameter={parameter} />
    </div>
  );
}
