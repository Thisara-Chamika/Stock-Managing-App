import { Link } from 'react-router-dom';

import { InstallPromptCard } from '@/components/InstallPromptCard';
import { TopBar } from '@/components/TopBar';
import { useAppData } from '@/state/useAppData';
import { formatMoney } from '@/utils/format';
import { summarizeAllStocks } from '@/utils/storage';

/**
 * Landing page that gives the owner an at-a-glance view of the entire
 * business and acts as the entry point to Manage Categories and the PWA
 * install prompt.
 */
export function DashboardPage(): JSX.Element {
  const { stocks, categories, isLoading } = useAppData();
  const totals = summarizeAllStocks(stocks);

  return (
    <div className="min-h-screen pb-24">
      <TopBar title="Dashboard" />

      <InstallPromptCard />

      <section className="mt-3 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-4 text-white shadow-card">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-100">
          {isLoading ? 'Loading…' : 'Across all stocks'}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <HeaderTile label="Stocks" value={totals.totalStocks} />
          <HeaderTile label="Sold qty" value={totals.sold} />
          <HeaderTile label="Pending qty" value={totals.pendingQty} highlight />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-center">
          <HeaderTile label="Sold revenue" value={formatMoney(totals.totalSoldRevenue)} />
          <HeaderTile label="Profit" value={formatMoney(totals.totalProfit)} highlight />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <MoneyCard
          label="Total Inventory Cost"
          value={totals.totalCost}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="7" width="18" height="13" rx="2" />
              <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          }
        />
        <MoneyCard
          label="Revenue Potential"
          value={totals.totalRevenuePotential}
          tone="muted"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 17l6-6 4 4 7-9" />
              <path d="M14 6h6v6" />
            </svg>
          }
        />
        <MoneyCard
          label="Sold Revenue"
          value={totals.totalSoldRevenue}
          tone="success"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v10M9 10h4.5a2 2 0 0 1 0 4H10a2 2 0 0 0 0 4h4.5" />
            </svg>
          }
        />
        <MoneyCard
          label="Pending Payments"
          value={totals.totalPendingPayment}
          tone="warning"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          }
        />
      </section>

      <section className="mt-4 rounded-2xl bg-white p-4 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Counts</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          <Row label="Total Quantity" value={totals.quantity} />
          <Row label="Total Sold" value={totals.sold} tone="success" />
          <Row label="Total Paid" value={totals.paid} />
          <Row label="Pending Quantity" value={totals.pendingQty} tone="warning" />
        </dl>
      </section>

      <section className="mt-4 rounded-2xl bg-white p-4 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlight</p>
        <p className="mt-2 text-3xl font-bold text-emerald-700">{formatMoney(totals.totalProfit)}</p>
        <p className="mt-0.5 text-xs text-slate-500">Total profit earned across all sold calculators.</p>
      </section>

      <section className="mt-4 space-y-3">
        <QuickAction
          to="/categories"
          title="Manage Categories"
          description={`${categories.length} categories available`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          }
        />
        <QuickAction
          to="/stocks"
          title="View Stocks"
          description={`${totals.totalStocks} ${totals.totalStocks === 1 ? 'batch' : 'batches'} recorded`}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="3" width="16" height="18" rx="3" />
              <path d="M9 7h6M9 12h6M9 17h4" />
            </svg>
          }
        />
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function HeaderTile({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}): JSX.Element {
  const isMoney = typeof value === 'string';
  return (
    <div className={`rounded-xl px-2 py-2 ${highlight ? 'bg-white/20' : 'bg-white/10'}`}>
      <p className="text-[11px] uppercase tracking-wide text-brand-100">{label}</p>
      <p className={`${isMoney ? 'text-base' : 'text-lg'} font-semibold leading-tight`}>{value}</p>
    </div>
  );
}

interface MoneyCardProps {
  label: string;
  value: number;
  tone?: 'default' | 'muted' | 'success' | 'warning';
  icon: React.ReactNode;
}

function MoneyCard({ label, value, tone = 'default', icon }: MoneyCardProps): JSX.Element {
  const toneClasses: Record<NonNullable<MoneyCardProps['tone']>, string> = {
    default: 'bg-white text-slate-900',
    muted: 'bg-slate-50 text-slate-900',
    success: 'bg-emerald-50 text-emerald-800',
    warning: 'bg-amber-50 text-amber-800',
  };
  return (
    <div className={`rounded-2xl p-3 shadow-card ${toneClasses[tone]}`}>
      <div className="flex items-center gap-2 opacity-80">
        {icon}
        <p className="text-[11px] font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-2 text-lg font-bold leading-tight">{formatMoney(value)}</p>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'success' | 'warning';
}): JSX.Element {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-sm text-slate-600">{label}</dt>
      <dd
        className={[
          'text-base font-semibold',
          tone === 'success' ? 'text-emerald-700' : tone === 'warning' ? 'text-amber-700' : 'text-slate-900',
        ].join(' ')}
      >
        {value}
      </dd>
    </div>
  );
}

function QuickAction({
  to,
  title,
  description,
  icon,
}: {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}): JSX.Element {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card transition active:scale-[0.99] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        {icon}
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  );
}
