import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { CalculatorTabs } from '@/components/CalculatorTabs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { QuantityControl } from '@/components/QuantityControl';
import { SummaryCard } from '@/components/SummaryCard';
import { TopBar } from '@/components/TopBar';
import { useAppData } from '@/state/useAppData';
import {
  haveToPay,
  pendingSupplierPayment,
  profit,
  revenuePotential,
  soldRevenue,
  stockCost,
} from '@/types/stock';
import { formatDisplayDate, formatMoney } from '@/utils/format';
import { summarizeBatch } from '@/utils/storage';

/**
 * Detail page for a single stock batch.  Lets the user adjust sold and paid
 * quantities, view all derived financial metrics, append more calculators,
 * and delete the batch.
 */
export function StockDetailPage(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { stocks, updateCalculator, deleteStock } = useAppData();

  const batch = useMemo(() => stocks.find((s) => s.id === id), [stocks, id]);

  const [activeCalcId, setActiveCalcId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!batch) {
    return (
      <div className="min-h-screen pb-24">
        <TopBar title="Stock not found" onBack={() => navigate('/stocks')} />
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-card">
          We couldn&apos;t find this stock batch. It may have been deleted.
        </p>
      </div>
    );
  }

  const resolvedActiveId = activeCalcId ?? batch.calculators[0]?.id ?? '';
  const activeCalc = batch.calculators.find((c) => c.id === resolvedActiveId) ?? batch.calculators[0];
  const totals = summarizeBatch(batch);

  const handleDelete = (): void => {
    deleteStock(batch.id);
    navigate('/stocks');
  };

  return (
    <div className="min-h-screen pb-24">
      <TopBar
        title={formatDisplayDate(batch.date)}
        onBack={() => navigate('/stocks')}
        trailing={
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            aria-label="Delete stock batch"
            className="flex h-10 w-10 items-center justify-center rounded-full text-red-600 hover:bg-red-50 active:bg-red-100"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        }
      />

      {batch.calculators.length > 0 ? (
        <div className="mb-4">
          <CalculatorTabs
            calculators={batch.calculators}
            activeId={activeCalc?.id ?? ''}
            onSelect={(nextId) => setActiveCalcId(nextId)}
          />
        </div>
      ) : null}

      {activeCalc ? (
        <ActiveCalculatorSection
          stockId={batch.id}
          activeCalc={activeCalc}
          onUpdate={updateCalculator}
        />
      ) : (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-card">
          This batch has no calculators recorded yet.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-card">
        <Link
          to={`/stock/${batch.id}/add`}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-3 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100 active:bg-brand-100"
        >
          <span className="text-base font-bold">+</span>
          Add Calculator
        </Link>
        <Link
          to="/categories"
          className="flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-100"
        >
          Manage Categories
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        <SummaryCard
          title="Batch quantities"
          rows={[
            { label: 'Total Quantity', value: totals.quantity },
            { label: 'Total Sold Quantity', value: totals.sold, tone: 'success' },
            { label: 'Total Paid Quantity', value: totals.paid },
            { label: 'Total Pending Quantity', value: totals.pendingQty, tone: 'warning' },
          ]}
        />
        <SummaryCard
          title="Batch financials"
          rows={[
            { label: 'Total Inventory Cost', value: totals.totalCost, format: 'money' },
            { label: 'Total Revenue Potential', value: totals.totalRevenuePotential, format: 'money' },
            { label: 'Total Sold Revenue', value: totals.totalSoldRevenue, format: 'money', tone: 'success' },
            { label: 'Total Profit', value: totals.totalProfit, format: 'money', tone: 'success' },
            {
              label: 'Total Pending Supplier Payment',
              value: totals.totalPendingPayment,
              format: 'money',
              tone: 'warning',
            },
          ]}
        />
      </div>

      <div className="mt-6">
        <Button variant="danger" fullWidth onClick={() => setConfirmDelete(true)}>
          Delete this stock batch
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this stock batch?"
        description="Are you sure you want to delete this stock batch? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Active calculator section                                                  */
/* -------------------------------------------------------------------------- */

interface ActiveCalculatorSectionProps {
  stockId: string;
  activeCalc: import('@/types/stock').Calculator;
  onUpdate: ReturnType<typeof useAppData>['updateCalculator'];
}

function ActiveCalculatorSection({ stockId, activeCalc, onUpdate }: ActiveCalculatorSectionProps): JSX.Element {
  const pending = haveToPay(activeCalc);
  const earnedProfit = profit(activeCalc);
  return (
    <section className="space-y-3">
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Calculator type</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">
          {activeCalc.category || 'Untitled item'}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="Quantity" value={String(activeCalc.quantity)} tone="brand" />
          <Stat label="Available" value={String(activeCalc.quantity - activeCalc.soldQuantity)} tone="muted" />
          <Stat label="Buying Price" value={formatMoney(activeCalc.buyingPrice)} tone="muted" />
          <Stat label="Selling Price" value={formatMoney(activeCalc.sellingPrice)} tone="muted" />
        </div>
      </div>

      <QuantityControl
        label="Sold Quantity"
        value={activeCalc.soldQuantity}
        max={activeCalc.quantity}
        onChange={(next) => onUpdate(stockId, activeCalc.id, { soldQuantity: next })}
        hint={`Cannot exceed in-stock quantity (${activeCalc.quantity}).`}
        tone="success"
      />

      <QuantityControl
        label="Paid Quantity"
        value={activeCalc.paidQuantity}
        max={activeCalc.soldQuantity}
        onChange={(next) => onUpdate(stockId, activeCalc.id, { paidQuantity: next })}
        hint={`Cannot exceed sold quantity (${activeCalc.soldQuantity}).`}
      />

      <div className={`rounded-2xl p-4 shadow-card ${pending > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
        <p
          className={`text-xs font-medium uppercase tracking-wide ${
            pending > 0 ? 'text-amber-700' : 'text-emerald-700'
          }`}
        >
          Have to pay
        </p>
        <div className="mt-1 flex items-baseline justify-between">
          <p className={`text-3xl font-bold ${pending > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {pending}
          </p>
          <p className={`text-xs ${pending > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {pending > 0
              ? `${formatMoney(pendingSupplierPayment(activeCalc))} owed to supplier`
              : 'all settled'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Financial breakdown
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MoneyStat label="Stock Cost" value={stockCost(activeCalc)} />
          <MoneyStat label="Revenue Potential" value={revenuePotential(activeCalc)} />
          <MoneyStat label="Sold Revenue" value={soldRevenue(activeCalc)} tone="success" />
          <MoneyStat label="Profit" value={earnedProfit} tone={earnedProfit >= 0 ? 'success' : 'warning'} />
          <MoneyStat
            label="Pending Supplier Payment"
            value={pendingSupplierPayment(activeCalc)}
            tone={pending > 0 ? 'warning' : 'default'}
          />
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat cells                                                                 */
/* -------------------------------------------------------------------------- */

interface StatProps {
  label: string;
  value: string;
  tone?: 'brand' | 'muted';
}

function Stat({ label, value, tone = 'brand' }: StatProps): JSX.Element {
  const isMuted = tone === 'muted';
  return (
    <div className={`rounded-xl px-3 py-2 ${isMuted ? 'bg-slate-50' : 'bg-brand-50'}`}>
      <p
        className={`text-[11px] font-medium uppercase tracking-wide ${
          isMuted ? 'text-slate-500' : 'text-brand-700'
        }`}
      >
        {label}
      </p>
      <p className={`text-base font-semibold ${isMuted ? 'text-slate-800' : 'text-brand-700'}`}>{value}</p>
    </div>
  );
}

interface MoneyStatProps {
  label: string;
  value: number;
  tone?: 'default' | 'success' | 'warning';
}

function MoneyStat({ label, value, tone = 'default' }: MoneyStatProps): JSX.Element {
  const toneClasses: Record<NonNullable<MoneyStatProps['tone']>, string> = {
    default: 'bg-slate-50 text-slate-900',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
  };
  return (
    <div className={`rounded-xl px-3 py-2 ${toneClasses[tone]}`}>
      <p className="text-[11px] font-medium uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-base font-semibold leading-tight">{formatMoney(value)}</p>
    </div>
  );
}
