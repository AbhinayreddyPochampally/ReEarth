import { ChevronLeft } from '@/components/reearth/Icons';
import { ButtonLink } from '@/components/reearth/ui';
import { requireSession } from '@/lib/auth/session';
import EventForm from './EventForm';

interface EventTypeMeta {
  title: string;
  emoji: string;
  vendorPlaceholder: string;
  unit: string;
  quantityLabel: string;
  subPicker?: { label: string; options: string[] }[];
}

const EVENT_META: Record<string, EventTypeMeta> = {
  'tanker-water':       { title: 'Tanker water',       emoji: '💧', vendorPlaceholder: 'e.g. AquaRich Tankers',  unit: 'kL', quantityLabel: 'Volume' },
  'drinking-water':     { title: 'Drinking water',     emoji: '🚰', vendorPlaceholder: 'e.g. Bisleri',            unit: 'L',  quantityLabel: 'Volume' },
  'diesel-delivery':    { title: 'Diesel delivery',    emoji: '⛽', vendorPlaceholder: 'e.g. Bharat Petroleum',   unit: 'L',  quantityLabel: 'Quantity' },
  'biomass-delivery':   { title: 'Biomass delivery',   emoji: '🪵', vendorPlaceholder: 'e.g. SaiBio Briquettes',  unit: 'kg', quantityLabel: 'Quantity' },
  'lpg-delivery':       { title: 'LPG delivery',       emoji: '🔥', vendorPlaceholder: 'e.g. HP Gas',             unit: 'kg', quantityLabel: 'Quantity' },
  'vehicle-fuel':       { title: 'Vehicle fuel',       emoji: '🚗', vendorPlaceholder: 'e.g. IOCL fuel station',  unit: 'L',  quantityLabel: 'Volume' },
  'refrigerant-refill': { title: 'Refrigerant refill', emoji: '❄️', vendorPlaceholder: 'e.g. CoolFix Services',  unit: 'kg', quantityLabel: 'Gas refilled' },
  'co2-refill':         { title: 'CO₂ refill',         emoji: '🧯', vendorPlaceholder: 'e.g. SafeGuard Fire',     unit: 'kg', quantityLabel: 'CO₂ refilled' },
  'lab-test':           { title: 'Lab test',           emoji: '🧪', vendorPlaceholder: 'e.g. GreenTech Labs',     unit: 'mg/L', quantityLabel: 'Reading' },
  'waste-pickup':       {
    title: 'Waste pickup', emoji: '♻️', vendorPlaceholder: 'e.g. EcoSpark Recyclers', unit: 'kg', quantityLabel: 'Quantity',
    subPicker: [{
      label: 'What kind of waste?',
      options: ['Used oil', 'Oil-soaked cotton', 'E-waste', 'Batteries', 'Biomedical', 'Sanitary', 'Other'],
    }],
  },
};

export default async function EventFormPage({
  params,
}: {
  params: Promise<{ eventType: string }>;
}): Promise<React.ReactElement> {
  await requireSession();
  const { eventType } = await params;
  const meta = EVENT_META[eventType];
  if (!meta) {
    return (
      <div className="space-y-3">
        <div className="t-h3">Unknown event type</div>
        <p className="t-caption">Pick from the event picker.</p>
        <ButtonLink href="/contributor/event" variant="primary">Back to picker</ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <ButtonLink className="h-9 w-9 px-0" href="/contributor/event" variant="outline">
          <ChevronLeft size={16} />
        </ButtonLink>
        <div>
          <div className="t-h3">{meta.emoji} {meta.title}</div>
          <div className="t-caption mt-0.5">Photo first · OCR will fill the fields</div>
        </div>
      </div>

      <EventForm eventType={eventType} meta={meta} />
    </div>
  );
}
