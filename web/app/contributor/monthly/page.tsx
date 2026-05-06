import { ChevronLeft } from '@/components/reearth/Icons';
import { ButtonLink } from '@/components/reearth/ui';
import { requireSession } from '@/lib/auth/session';
import { getFacility } from '@/lib/v1/sample-data';
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
  const facility = getFacility(session.facility_id!);

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
      <div className="flex items-start gap-2">
        <ButtonLink className="h-9 w-9 px-0" href="/contributor" variant="outline">
          <ChevronLeft size={16} />
        </ButtonLink>
        <div>
          <div className="t-h2">{PREVIOUS_MONTH_LABEL} summary</div>
          <div className="t-caption mt-0.5">Day 1 of {TODAY.toLocaleDateString('en-IN', { month: 'long' })} · due now</div>
        </div>
      </div>

      <MonthlySummaryForm cards={cards} period={PREVIOUS_MONTH.toISOString().slice(0, 7)} />
    </div>
  );
}
