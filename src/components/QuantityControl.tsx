interface QuantityControlProps {
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (next: number) => void;
  /** Optional helper text shown under the control. */
  hint?: string;
  tone?: 'default' | 'success' | 'warning';
}

/**
 * `[-]  value  [+]` stepper used for both sold and paid quantities.
 *
 * The component is "controlled" – the parent decides what the next value
 * should be – but it enforces min/max locally so consumers can't drift past
 * the configured bounds even if they mishandle the callback.
 */
export function QuantityControl({
  label,
  value,
  min = 0,
  max,
  onChange,
  hint,
  tone = 'default',
}: QuantityControlProps): JSX.Element {
  const canDecrement = value > min;
  const canIncrement = value < max;

  const toneClasses: Record<NonNullable<QuantityControlProps['tone']>, string> = {
    default: 'text-slate-900',
    success: 'text-emerald-700',
    warning: 'text-amber-700',
  };

  const handleStep = (delta: number): void => {
    const next = Math.min(Math.max(value + delta, min), max);
    if (next !== value) onChange(next);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="text-xs text-slate-400">max {max}</p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <StepperButton ariaLabel={`Decrease ${label}`} disabled={!canDecrement} onClick={() => handleStep(-1)}>
          −
        </StepperButton>
        <div className="flex-1 text-center">
          <p className={`text-3xl font-bold leading-none ${toneClasses[tone]}`}>{value}</p>
        </div>
        <StepperButton ariaLabel={`Increase ${label}`} disabled={!canIncrement} onClick={() => handleStep(1)}>
          +
        </StepperButton>
      </div>
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

interface StepperButtonProps {
  ariaLabel: string;
  disabled: boolean;
  onClick: () => void;
  children: string;
}

function StepperButton({ ariaLabel, disabled, onClick, children }: StepperButtonProps): JSX.Element {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold',
        'transition-colors select-none',
        disabled
          ? 'bg-slate-100 text-slate-300'
          : 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-100',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
