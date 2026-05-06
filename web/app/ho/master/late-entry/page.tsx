import { ChevronLeft } from '@/components/reearth/Icons';
import { ButtonLink } from '@/components/reearth/ui';
import { facilities, parameters, personnel } from '@/lib/v1/sample-data';
import LateEntryForm from './LateEntryForm';

export const metadata = { title: 'Late entry · ReEarth · HO' };

// Late-entry HO override surface per inconsistency-D resolution.
// Lives under /ho/master because Master Data is where HO does data-modifying
// work that requires explicit accountability (rules, regulatory limits, etc.).
//
// The form is intentionally a separate page rather than a slide-over: the
// reason field is mandatory and explicit page navigation discourages casual
// use. This isn't a substitute for the contributor's own backdating window.
export default function LateEntryPage(): React.ReactElement {
  // Only contributors can be the "on behalf of" target — HO users are
  // corporate and don't have facility-scoped daily logs.
  const contributorPersonnel = personnel.filter(p => p.role === 'contributor');
  const dailyParams = parameters.filter(p => p.cadence === 'daily');

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <ButtonLink className="h-9 w-9 px-0" href="/ho/master" variant="outline">
          <ChevronLeft size={16} />
        </ButtonLink>
        <div>
          <h1 className="t-h2">Late entry on behalf</h1>
          <p className="t-caption mt-0.5 text-[var(--muted)]">
            Use this only when the contributor needs an entry &gt;2 days old. Their daily logger
            handles backdating within 2 days directly.
          </p>
        </div>
      </div>

      <LateEntryForm
        facilities={facilities.map(f => ({ id: f.id, name: f.name }))}
        contributors={contributorPersonnel.map(p => ({
          id: p.id,
          name: p.name,
          facilityIds: p.facilityIds,
        }))}
        parameters={dailyParams.map(p => ({ code: p.code, label: p.label, unit: p.unit }))}
      />
    </div>
  );
}
