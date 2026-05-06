import { requireSession } from '@/lib/auth/session';
import { getFacility, logActivities, monthlySummaries, parameters, submissions } from '@/lib/v1/sample-data';
import { ContributorTodayClient } from './ContributorTodayClient';

export const metadata = { title: 'Today - ReEarth' };

export default async function ContributorTodayPage(): Promise<React.ReactElement> {
  const session = await requireSession();
  // Contributor sessions always have facility_id (enforced by ContributorLayout
  // gate + DB CHECK constraint in migration 004).
  const facility = getFacility(session.facility_id!);
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
