import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { CalculatorTabs } from '@/components/CalculatorTabs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { QuantityControl } from '@/components/QuantityControl';
import { SummaryCard } from '@/components/SummaryCard';
import { TopBar } from '@/components/TopBar';
import type { Calculator, StockBatch } from '@/types/stock';
import {
  haveToPay,
  pendingSupplierPayment,
  revenuePotential,
  soldRevenue,
  stockCost,
} from '@/types/stock';
import { formatDisplayDate, formatMoney } from '@/utils/format';
import { summarizeBatch } from '@/utils/storage';

interface StockDetailPageProps {
  stocks: StockBatch[];
  onUpdateCalculator: (
    stockId: string,
    calculatorId: string,
    patch: Partial<Pick<Calculator, 'soldQuantity' | 'paidQuantity'>>,
  ) => void;
  onDelete: (stockId: string) => void;
}

/**
 * Detail page for a single stock batch.  Lets the user adjust sold and paid
 * quantities for each calculator and view all derived financial metrics.
 */
export function StockDetailPage({ stocks, onUpdateCalculator, onDelete }: StockDetailPageProps): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const batch = useMemo(() => stocks.find((s) => s.id === id), [stocks, id]);

  const [activeCalcId, setActiveCalcId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!batch) {
    return (
      <div className="min-h-screen pb-10">
        <TopBar title="Stock not found" onBack={() => navigate('/')} />
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
    onDelete(batch.id);
    navigate('/');
  };

  if (!activeCalc) {
    return (
      <div className="min-h-screen pb-10">
        <TopBar title="Empty batch" onBack={() => navigate('/')} />
        <p className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow-card">
          This batch has no calculators recorded.
        </p>
      </div>
    );
  }

  const pending = haveToPay(activeCalc);

  return (
    <div className="min-h-screen pb-10">
      <TopBar
        title={formatDisplayDate(batch.date)}
        onBack={() => navigate('/')}
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

      <div className="mb-4">
        <CalculatorTabs
          calculators={batch.calculators}
          activeId={activeCalc.id}
          onSelect={(nextId) => setActiveCalcId(nextId)}
        />
      </div>

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
          onChange={(next) => onUpdateCalculator(batch.id, activeCalc.id, { soldQuantity: next })}
          hint={`Cannot exceed in-stock quantity (${activeCalc.quantity}).`}
          tone="success"
        />

        <QuantityControl
          label="Paid Quantity"
          value={activeCalc.paidQuantity}
          max={activeCalc.soldQuantity}
          onChange={(next) => onUpdateCalculator(batch.id, activeCalc.id, { paidQuantity: next })}
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
            <MoneyStat
              label="Pending Supplier Payment"
              value={pendingSupplierPayment(activeCalc)}
              tone={pending > 0 ? 'warning' : 'default'}
            />
          </div>
        </div>
      </section>

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
