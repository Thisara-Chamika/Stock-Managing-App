import { formatMoney } from '@/utils/format';

interface SummaryRow {
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'warning';
  /** When 'money', the value is rendered through `formatMoney`. Default 'number'. */
  format?: 'number' | 'money';
}

interface SummaryCardProps {
  title?: string;
  rows: SummaryRow[];
}

/**
 * Tabular summary card used at the bottom of the stock detail page to show
 * aggregate totals.  Each row can independently choose count vs money
 * formatting.
 */
export function SummaryCard({ title = 'Summary', rows }: SummaryCardProps): JSX.Element {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-card">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <dl className="mt-3 divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2">
            <dt className="text-sm text-slate-600">{row.label}</dt>
            <dd
              className={[
                'text-base font-semibold',
                row.tone === 'success'
                  ? 'text-emerald-700'
                  : row.tone === 'warning'
                    ? 'text-amber-700'
                    : 'text-slate-900',
              ].join(' ')}
            >
              {row.format === 'money' ? formatMoney(row.value) : row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
