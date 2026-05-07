import { requireSession } from '@/lib/auth/session';
import { resolveV1Facility } from '@/lib/v1/sample-data';
import MonthlySummaryForm from './MonthlySummaryForm';

export const metadata = { title: 'Monthly summary - ReEarth' };

// Monthly summary per UI sketch p19. Day-1 trigger of the following month;
// card-based form similar to the Daily Logger but for monthly aggregates
// (production count, manhours, lumpy waste streams).

const TODAY = new Date();
const PREVIOUS_MONTH = new Date(TODAY.getFullYear(), TODAY.getMonth() - 1, 1);
const PREVIOUS_MONTH_LABEL = PREVIOUS_MONTH.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

export default async function MonthlySummaryPage(): Promise<React.ReactElement> {
  const session = await requireSession();
  // SAP-code bridge: live session.facility_id is a UUID and won't match v1
  // sample-data string ids — resolve through SAP code first.
  const facility = resolveV1Facility({ sapCode: session.sap_code, facilityId: session.facility_id });

  const isFactory = facility.kind === 'factory';

  // Per design doc §25.2 the cards are split into Production + Waste
  // generation aggregates. Production cards only apply to factories.
  const cards: { code: string; label: string; unit: string; group: 'Production' | 'Waste — generated' }[] = [];
  if (isFactory) {
    cards.push({ code: 'garments_produced_units', label: 'Garments produced',  unit: 'units', group: 'Production' });
    cards.push({ code: 'manhours_worked',         label: 'Manhours worked',    unit: 'hours', group: 'Production' });
  }
  cards.push({ code: 'haz_batteries_kg',         label: 'Battery generation',  unit: 'kg', group: 'Waste — generated' });
  cards.push({ code: 'haz_e_waste_regulated_kg', label: 'E-waste generation',  unit: 'kg', group: 'Waste — generated' });
  cards.push({ code: 'haz_biomedical_kg',        label: 'Biomedical (gated by has_first_aid)', unit: 'kg', group: 'Waste — generated' });
  cards.push({ code: 'haz_other_kg',             label: 'Other hazardous',     unit: 'kg', group: 'Waste — generated' });
  cards.push({ code: 'metal_scrap_kg',           label: 'Metal scrap',         unit: 'kg', group: 'Waste — generated' });
  cards.push({ code: 'wood_scrap_kg',            label: 'Wood scrap',          unit: 'kg', group: 'Waste — generated' });

  return (
    <div className="space-y-4">
      {/* Back is handled globally by ContributorShell on non-root paths. */}
      <div>
        <div className="t-h2">{PREVIOUS_MONTH_LABEL} summary</div>
        <div className="t-caption mt-0.5">Day 1 of {TODAY.toLocaleDateString('en-IN', { month: 'long' })} · due now</div>
      </div>

      <MonthlySummaryForm cards={cards} period={PREVIOUS_MONTH.toISOString().slice(0, 7)} />
    </div>
  );
}
