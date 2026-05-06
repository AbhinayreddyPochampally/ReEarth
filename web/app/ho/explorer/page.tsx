import NLQueryClient from './NLQueryClient';

export const metadata = { title: 'Data Explorer - ReEarth' };

// Data Explorer per design doc §33 + §38 + UI sketch p34/p36/p37.
// Dual-mode interface: NL query + filter chips. The AI converts NL to a
// StructuredFilter (never raw SQL — see /lib/ai/structured-filter.ts).
export default function ExplorerPage(): React.ReactElement {
  return (
    <div className="p-6">
      <h1 className="t-h2">Data Explorer</h1>
      <p className="t-caption mt-1 mb-5">
        Ask any question across 15 facilities · 18 months of synthetic data.
      </p>
      <NLQueryClient />
    </div>
  );
}
