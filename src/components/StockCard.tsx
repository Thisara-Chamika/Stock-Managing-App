import type { StockBatch } from '@/types/stock';
import { formatDisplayDate } from '@/utils/format';
import { summarizeBatch } from '@/utils/storage';

interface StockCardProps {
  batch: StockBatch;
  onOpen: (batchId: string) => void;
}

/**
 * Card representation of a stock batch shown on the list page.
 * Tapping anywhere on the card opens the detail page for that batch.
 */
export function StockCard({ batch, onOpen }: StockCardProps): JSX.Element {
  const totals = summarizeBatch(batch);

  return (
    <button
      type="button"
      onClick={() => onOpen(batch.id)}
      className="w-full rounded-2xl bg-white p-4 text-left shadow-card transition active:scale-[0.99] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Stock batch</p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900">{formatDisplayDate(batch.date)}</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {batch.calculators.length} types
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Total" value={totals.quantity} tone="slate" />
        <Stat label="Sold" value={totals.sold} tone="emerald" />
        <Stat label="Pending" value={totals.pending} tone="amber" />
      </dl>
    </button>
  );
}

interface StatProps {
  label: string;
  value: number;
  tone: 'slate' | 'emerald' | 'amber';
}

function Stat({ label, value, tone }: StatProps): JSX.Element {
  const toneClasses: Record<StatProps['tone'], string> = {
    slate: 'bg-slate-50 text-slate-900',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className={`rounded-xl px-3 py-2 text-center ${toneClasses[tone]}`}>
      <dt className="text-[11px] font-medium uppercase tracking-wide opacity-70">{label}</dt>
      <dd className="text-base font-semibold leading-tight">{value}</dd>
    </div>
  );
}
