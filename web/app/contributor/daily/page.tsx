import { requireSession } from '@/lib/auth/session';
import { parameters, submissions } from '@/lib/v1/sample-data';
import { DailyLogClient } from './DailyLogClient';

export const metadata = { title: 'Daily log - ReEarth' };

export default async function DailyLogPage(): Promise<React.ReactElement> {
  const session = await requireSession();
  const dailyParams = parameters.filter(parameter => parameter.cadence === 'daily');
  const logged = submissions.filter(submission => (
    submission.facilityId === session.facility_id &&
    dailyParams.some(parameter => parameter.code === submission.parameterCode)
  ));

  return <DailyLogClient parameters={dailyParams} submissions={logged} />;
}
