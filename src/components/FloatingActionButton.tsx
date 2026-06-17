interface FloatingActionButtonProps {
  onClick: () => void;
  label: string;
}

/**
 * Sticky floating "+" button anchored to the bottom-right of the app shell.
 * We use `fixed` with the same max-width as the app so the FAB stays inside
 * the centred phone-sized column on larger screens.
 *
 * The bottom offset is generous (`bottom-20`) so the button clears the
 * 56px tall BottomNav plus the iOS home-bar safe area.
 */
export function FloatingActionButton({ onClick, label }: FloatingActionButtonProps): JSX.Element {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center safe-pb">
      <div className="relative mx-auto w-full max-w-app">
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="pointer-events-auto absolute bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-3xl font-light text-white shadow-fab hover:bg-brand-700 active:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}
