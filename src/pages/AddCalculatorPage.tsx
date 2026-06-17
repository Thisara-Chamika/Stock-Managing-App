import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { TopBar } from '@/components/TopBar';
import { useAppData } from '@/state/useAppData';

/**
 * Standalone page used to append a calculator item to a stock batch that
 * was previously created without it.  Mirrors the per-item card on the
 * CreateStockPage but for exactly one item.
 *
 * Validation:
 *  - category required
 *  - quantity >= 1
 *  - buyingPrice > 0
 *  - sellingPrice > 0
 *  - category must not already exist in the same batch
 */
export function AddCalculatorPage(): JSX.Element {
  const navigate = useNavigate();
  const { id: stockId } = useParams<{ id: string }>();
  const { stocks, categories, addCalculatorToStock } = useAppData();

  const batch = stocks.find((s) => s.id === stockId);
  const existingCategoryNames = new Set(
    (batch?.calculators ?? []).map((c) => c.category.trim().toLowerCase()),
  );

  // Pre-select the first category that's not already in this batch.
  const initialCategory =
    categories.find((c) => !existingCategoryNames.has(c.name.trim().toLowerCase()))?.name ??
    categories[0]?.name ??
    '';

  const [category, setCategory] = useState<string>(initialCategory);
  const [quantity, setQuantity] = useState('');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!batch) {
    return (
      <div className="min-h-screen pb-24">
        <TopBar title="Stock not found" onBack={() => navigate('/stocks')} />
        <EmptyState
          title="We couldn't find that stock batch"
          description="It may have been deleted."
        />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="min-h-screen pb-24">
        <TopBar title="Add a calculator" onBack={() => navigate(-1)} />
        <EmptyState
          title="No categories available"
          description="Add at least one calculator category first."
          action={
            <Link
              to="/categories"
              className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Manage Categories
            </Link>
          }
        />
      </div>
    );
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setError(null);

    if (!categories.some((c) => c.name === category)) {
      setError('Please pick a calculator category.');
      return;
    }
    if (existingCategoryNames.has(category.trim().toLowerCase())) {
      setError('This calculator category already exists in this stock.');
      return;
    }

    const qty = parseIntOrNaN(quantity);
    const buy = parseIntOrNaN(buyingPrice);
    const sell = parseIntOrNaN(sellingPrice);

    if (!Number.isFinite(qty) || qty < 1) {
      setError('Quantity must be at least 1.');
      return;
    }
    if (!Number.isFinite(buy) || buy <= 0) {
      setError('Buying price must be greater than 0.');
      return;
    }
    if (!Number.isFinite(sell) || sell <= 0) {
      setError('Selling price must be greater than 0.');
      return;
    }

    const result = addCalculatorToStock(batch.id, {
      category,
      quantity: qty,
      buyingPrice: buy,
      sellingPrice: sell,
    });
    if (!result.ok) {
      setError(
        result.reason === 'duplicate'
          ? 'This calculator category already exists in this stock.'
          : 'Something went wrong.  Please try again.',
      );
      return;
    }
    navigate(`/stock/${batch.id}`);
  };

  return (
    <div className="min-h-screen pb-24">
      <TopBar title="Add a calculator" onBack={() => navigate(-1)} />

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <fieldset className="rounded-2xl bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <label htmlFor="cat" className="block text-sm font-medium text-slate-700">
              Calculator Type
            </label>
            <Link
              to="/categories"
              className="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
            >
              Manage Categories
            </Link>
          </div>
          <select
            id="cat"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {categories.map((c) => {
              const disabled = existingCategoryNames.has(c.name.trim().toLowerCase());
              return (
                <option key={c.id} value={c.name} disabled={disabled}>
                  {c.name}
                  {disabled ? ' — already in this batch' : ''}
                </option>
              );
            })}
          </select>

          <NumberField
            id="qty"
            label="Quantity"
            value={quantity}
            onChange={setQuantity}
            className="mt-3"
          />
          <NumberField
            id="buy"
            label="Buying Price"
            prefix="Rs"
            value={buyingPrice}
            onChange={setBuyingPrice}
            className="mt-3"
          />
          <NumberField
            id="sell"
            label="Selling Price"
            prefix="Rs"
            value={sellingPrice}
            onChange={setSellingPrice}
            className="mt-3"
          />
        </fieldset>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 pt-2">
          <Button type="submit" variant="primary" fullWidth>
            Save calculator
          </Button>
          <Button type="button" variant="secondary" fullWidth onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: string;
  prefix?: string;
  className?: string;
  onChange: (value: string) => void;
}

function NumberField({ id, label, value, prefix, onChange, className = '' }: NumberFieldProps): JSX.Element {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative mt-1">
        {prefix ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-slate-500">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder="0"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={[
            'w-full rounded-xl border border-slate-200 bg-white py-3 text-base text-slate-900',
            'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100',
            prefix ? 'pl-11 pr-3' : 'px-3',
          ].join(' ')}
        />
      </div>
    </div>
  );
}

function parseIntOrNaN(raw: string): number {
  if (raw.trim() === '') return Number.NaN;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : Number.NaN;
}
