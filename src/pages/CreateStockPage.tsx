import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { TopBar } from '@/components/TopBar';
import { CALCULATOR_CATEGORIES, type CalculatorCategory } from '@/types/stock';
import { todayIsoDate } from '@/utils/format';
import type { NewCalculatorInput } from '@/utils/storage';

interface CreateStockPageProps {
  onCreate: (date: string, items: NewCalculatorInput[]) => void;
}

/**
 * Form draft for a single calculator item being entered by the user.
 *
 * Numbers are kept as strings so the inputs stay controlled and let the user
 * blank a field temporarily without it snapping to `0`.  They're parsed once
 * at submit time.
 */
interface ItemDraft {
  draftId: string;
  category: CalculatorCategory;
  quantity: string;
  buyingPrice: string;
  sellingPrice: string;
}

function blankItem(): ItemDraft {
  return {
    draftId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category: CALCULATOR_CATEGORIES[0],
    quantity: '',
    buyingPrice: '',
    sellingPrice: '',
  };
}

/** Controlled form for recording a new supplier purchase. */
export function CreateStockPage({ onCreate }: CreateStockPageProps): JSX.Element {
  const navigate = useNavigate();
  const [date, setDate] = useState<string>(todayIsoDate());
  const [items, setItems] = useState<ItemDraft[]>(() => [blankItem()]);
  const [error, setError] = useState<string | null>(null);

  const updateItem = (draftId: string, patch: Partial<ItemDraft>): void => {
    setItems((prev) => prev.map((it) => (it.draftId === draftId ? { ...it, ...patch } : it)));
  };

  const addItem = (): void => {
    setItems((prev) => [...prev, blankItem()]);
  };

  const removeItem = (draftId: string): void => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((it) => it.draftId !== draftId)));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setError(null);

    if (!date) {
      setError('Please pick a date for this stock batch.');
      return;
    }

    const parsed: NewCalculatorInput[] = [];
    for (let i = 0; i < items.length; i += 1) {
      const draft = items[i];
      if (!draft) continue;
      const label = `Item ${i + 1}`;

      if (!CALCULATOR_CATEGORIES.includes(draft.category)) {
        setError(`${label}: please pick a calculator category.`);
        return;
      }

      const quantity = parseIntOrNaN(draft.quantity);
      const buyingPrice = parseIntOrNaN(draft.buyingPrice);
      const sellingPrice = parseIntOrNaN(draft.sellingPrice);

      if (!Number.isFinite(quantity) || quantity < 0) {
        setError(`${label}: quantity must be a non-negative number.`);
        return;
      }
      if (quantity < 1) {
        setError(`${label}: quantity must be at least 1.`);
        return;
      }
      if (!Number.isFinite(buyingPrice) || buyingPrice <= 0) {
        setError(`${label}: buying price must be greater than 0.`);
        return;
      }
      if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
        setError(`${label}: selling price must be greater than 0.`);
        return;
      }

      parsed.push({ category: draft.category, quantity, buyingPrice, sellingPrice });
    }

    if (parsed.length === 0) {
      setError('Please add at least one calculator.');
      return;
    }

    onCreate(date, parsed);
    navigate('/');
  };

  return (
    <div className="min-h-screen pb-10">
      <TopBar title="New Stock Batch" onBack={() => navigate(-1)} />

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <label className="block text-sm font-medium text-slate-700" htmlFor="date">
            Purchase date
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            max={todayIsoDate()}
            onChange={(event) => setDate(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <ItemCard
              key={item.draftId}
              index={index}
              item={item}
              canRemove={items.length > 1}
              onChange={(patch) => updateItem(item.draftId, patch)}
              onRemove={() => removeItem(item.draftId)}
            />
          ))}
        </div>

        <Button type="button" variant="secondary" fullWidth onClick={addItem}>
          + Add Calculator
        </Button>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 pt-2">
          <Button type="submit" variant="primary" fullWidth>
            Save stock batch
          </Button>
          <Button type="button" variant="secondary" fullWidth onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

interface ItemCardProps {
  index: number;
  item: ItemDraft;
  canRemove: boolean;
  onChange: (patch: Partial<ItemDraft>) => void;
  onRemove: () => void;
}

function ItemCard({ index, item, canRemove, onChange, onRemove }: ItemCardProps): JSX.Element {
  return (
    <fieldset className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Item {index + 1}
        </legend>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove item ${index + 1}`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50 active:bg-red-100"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <label className="block text-sm font-medium text-slate-700" htmlFor={`cat-${item.draftId}`}>
            Calculator Type
          </label>
          <select
            id={`cat-${item.draftId}`}
            value={item.category}
            onChange={(event) => onChange({ category: event.target.value as CalculatorCategory })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            {CALCULATOR_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <NumberField
          id={`qty-${item.draftId}`}
          label="Quantity"
          value={item.quantity}
          onChange={(quantity) => onChange({ quantity })}
        />
        <NumberField
          id={`buy-${item.draftId}`}
          label="Buying Price"
          prefix="Rs"
          value={item.buyingPrice}
          onChange={(buyingPrice) => onChange({ buyingPrice })}
        />
        <NumberField
          id={`sell-${item.draftId}`}
          label="Selling Price"
          prefix="Rs"
          value={item.sellingPrice}
          onChange={(sellingPrice) => onChange({ sellingPrice })}
        />
      </div>
    </fieldset>
  );
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: string;
  prefix?: string;
  onChange: (value: string) => void;
}

function NumberField({ id, label, value, prefix, onChange }: NumberFieldProps): JSX.Element {
  return (
    <div>
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
