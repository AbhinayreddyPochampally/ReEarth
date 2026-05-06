import { redirect } from 'next/navigation';
import { ChevronLeft } from '@/components/reearth/Icons';
import { ButtonLink } from '@/components/reearth/ui';
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
      <div className="flex items-start gap-2">
        <ButtonLink className="h-9 w-9 px-0" href="/contributor/daily" variant="outline">
          <ChevronLeft size={16} />
        </ButtonLink>
        <div>
          <div className="t-h3">{parameter.label}</div>
          <div className="t-caption">{parameter.category} - daily reading</div>
        </div>
      </div>

      <NumericEntryClient initialValue={displayValue} parameter={parameter} />
    </div>
  );
}
