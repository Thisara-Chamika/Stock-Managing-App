import type { Calculator } from '@/types/stock';

interface CalculatorTabsProps {
  calculators: Calculator[];
  activeId: string;
  onSelect: (id: string) => void;
}

/**
 * Horizontal segmented control used to switch between calculator items on the
 * stock detail page.  Scrolls horizontally when the labels are wider than the
 * 430px column.
 */
export function CalculatorTabs({ calculators, activeId, onSelect }: CalculatorTabsProps): JSX.Element {
  return (
    <div
      role="tablist"
      aria-label="Calculator type"
      className="-mx-1 flex gap-1 overflow-x-auto rounded-xl bg-slate-200/70 p-1"
      style={{ scrollbarWidth: 'none' }}
    >
      {calculators.map((calc, index) => {
        const isActive = calc.id === activeId;
        const label = calc.category && calc.category.trim() !== '' ? calc.category : `Item ${index + 1}`;
        return (
          <button
            key={calc.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onSelect(calc.id)}
            className={[
              'min-h-[40px] shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 active:bg-white/60',
            ].join(' ')}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
