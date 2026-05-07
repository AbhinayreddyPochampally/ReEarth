import { requireSession } from '@/lib/auth/session';
import { parameters, resolveV1FacilityId, submissions } from '@/lib/v1/sample-data';
import { DailyLogClient } from './DailyLogClient';

export const metadata = { title: 'Daily log - ReEarth' };

export default async function DailyLogPage(): Promise<React.ReactElement> {
  const session = await requireSession();
  // SAP-code bridge — see resolveV1FacilityId in lib/v1/sample-data.ts.
  const v1FacilityId = resolveV1FacilityId({ sapCode: session.sap_code, facilityId: session.facility_id });
  const dailyParams = parameters.filter(parameter => parameter.cadence === 'daily');
  const logged = submissions.filter(submission => (
    submission.facilityId === v1FacilityId &&
    dailyParams.some(parameter => parameter.code === submission.parameterCode)
  ));

  return <DailyLogClient parameters={dailyParams} submissions={logged} />;
}
