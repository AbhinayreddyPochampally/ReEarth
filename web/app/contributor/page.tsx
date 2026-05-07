import { requireSession } from '@/lib/auth/session';
import { logActivities, monthlySummaries, parameters, resolveV1Facility, submissions } from '@/lib/v1/sample-data';
import { ContributorTodayClient } from './ContributorTodayClient';

export const metadata = { title: 'Today - ReEarth' };

export default async function ContributorTodayPage(): Promise<React.ReactElement> {
  const session = await requireSession();
  // Contributor sessions always have facility_id (enforced by ContributorLayout
  // gate + DB CHECK constraint in migration 004). On live deploy that id is a
  // Supabase UUID; v1 sample-data uses string ids like 'fac-bengaluru'. Resolve
  // through SAP code so the in-memory submissions/activities arrays match.
  const facility = resolveV1Facility({ sapCode: session.sap_code, facilityId: session.facility_id });
  const dailyParams = parameters.filter(parameter => parameter.cadence === 'daily');
  const monthly = monthlySummaries.find(summary => summary.facilityId === facility.id);
  const seededSubmissions = submissions.filter(submission => submission.facilityId === facility.id);
  const seededActivities = logActivities.filter(activity => activity.facilityId === facility.id);

  return (
    <ContributorTodayClient
      dailyParams={dailyParams}
      logActivities={seededActivities}
      monthlyReady={Boolean(monthly)}
      seededSubmissions={seededSubmissions}
    />
  );
}
