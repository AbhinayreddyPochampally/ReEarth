import Link from 'next/link';

export const metadata = { title: 'Log event - ReEarth' };

// Event picker per UI sketch p13. 2-column grid of large-icon cards. Each
// event type opens a specialized form. The 10 categories are canonical from
// design doc §11.2 + §23.1.
const EVENTS: { id: string; label: string; emoji: string; hint: string }[] = [
  { id: 'tanker-water',       label: 'Tanker water',       emoji: '💧', hint: 'Vendor tanker' },
  { id: 'drinking-water',     label: 'Drinking water',     emoji: '🚰', hint: 'Cans / bottles' },
  { id: 'diesel-delivery',    label: 'Diesel delivery',    emoji: '⛽', hint: 'DG fuel' },
  { id: 'biomass-delivery',   label: 'Biomass delivery',   emoji: '🪵', hint: 'Boiler briquettes' },
  { id: 'lpg-delivery',       label: 'LPG delivery',       emoji: '🔥', hint: 'Canteen' },
  { id: 'vehicle-fuel',       label: 'Vehicle fuel',       emoji: '🚗', hint: 'Internal fleet' },
  { id: 'refrigerant-refill', label: 'Refrigerant refill', emoji: '❄️', hint: 'HVAC' },
  { id: 'co2-refill',         label: 'CO₂ refill',         emoji: '🧯', hint: 'Fire suppression' },
  { id: 'lab-test',           label: 'Lab test',           emoji: '🧪', hint: 'STP / borewell / stack' },
  { id: 'waste-pickup',       label: 'Waste pickup',       emoji: '♻️', hint: 'Hazardous or recycler' },
];

export default function EventPickerPage(): React.ReactElement {
  return (
    <div className="space-y-4">
      <div>
        <div className="t-h2">Log event</div>
        <div className="t-caption mt-1">What happened?</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {EVENTS.map(event => (
          <Link
            className="re-card flex flex-col items-center gap-2 p-4 text-center transition hover:border-[var(--primary)] hover:shadow-[var(--shadow-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            href={`/contributor/event/${event.id}`}
            key={event.id}
          >
            <span aria-hidden className="text-3xl">{event.emoji}</span>
            <div className="t-body-sm font-semibold leading-tight">{event.label}</div>
            <div className="t-caption text-[var(--muted)]">{event.hint}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
