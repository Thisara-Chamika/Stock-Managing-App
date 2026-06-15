import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { TopBar } from '@/components/TopBar';
import { todayIsoDate } from '@/utils/format';

interface CreateStockPageProps {
  onCreate: (date: string, quantities: [number, number, number]) => void;
}

interface FormState {
  date: string;
  q1: string;
  q2: string;
  q3: string;
}

/** Simple controlled form used to record a new supplier purchase. */
export function CreateStockPage({ onCreate }: CreateStockPageProps): JSX.Element {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    date: todayIsoDate(),
    q1: '',
    q2: '',
    q3: '',
  });
  const [error, setError] = useState<string | null>(null);

  const updateField = (key: keyof FormState, value: string): void => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const parseQuantity = (raw: string): number => {
    if (raw.trim() === '') return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : Number.NaN;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setError(null);

    if (!form.date) {
      setError('Please pick a date for this stock batch.');
      return;
    }

    const quantities: [number, number, number] = [parseQuantity(form.q1), parseQuantity(form.q2), parseQuantity(form.q3)];
    if (quantities.some((n) => Number.isNaN(n))) {
      setError('Quantities must be whole numbers.');
      return;
    }
    if (quantities.some((n) => n < 0)) {
      setError('Quantities cannot be negative.');
      return;
    }
    if (quantities.every((n) => n === 0)) {
      setError('Enter a quantity for at least one calculator.');
      return;
    }

    onCreate(form.date, quantities);
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
            value={form.date}
            max={todayIsoDate()}
            onChange={(event) => updateField('date', event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <fieldset className="rounded-2xl bg-white p-4 shadow-card">
          <legend className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Calculator quantities
          </legend>
          <div className="mt-3 space-y-3">
            <QuantityInput
              id="q1"
              label="Calculator 1"
              value={form.q1}
              onChange={(value) => updateField('q1', value)}
            />
            <QuantityInput
              id="q2"
              label="Calculator 2"
              value={form.q2}
              onChange={(value) => updateField('q2', value)}
            />
            <QuantityInput
              id="q3"
              label="Calculator 3"
              value={form.q3}
              onChange={(value) => updateField('q3', value)}
            />
          </div>
        </fieldset>

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

function QuantityInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}): JSX.Element {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        placeholder="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
