import type { Calculator } from '@/types/stock';

interface CalculatorTabsProps {
  calculators: Calculator[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Segmented control used to switch between the 3 calculator types on the
 * stock detail page.  Stays compact even on narrow phone screens.
 */
export function CalculatorTabs({ calculators, activeId, onSelect }: CalculatorTabsProps): JSX.Element {
  return (
    <div
      role="tablist"
      aria-label="Calculator type"
      className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1"
    >
      {calculators.map((calc, index) => {
        const isActive = calc.id === activeId;
        return (
          <button
            key={calc.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onSelect(calc.id)}
            className={[
              'min-h-[40px] rounded-lg px-2 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 active:bg-white/60',
            ].join(' ')}
          >
            Calc {index + 1}
          </button>
        );
      })}
    </div>
  );
}
