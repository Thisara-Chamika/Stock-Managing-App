import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  /** Optional content rendered on the right (icon buttons, etc). */
  trailing?: ReactNode;
  onBack?: () => void;
}

/**
 * Sticky top bar used by every page.  Renders a back button when `onBack`
 * is provided so navigation feels consistent on mobile.
 */
export function TopBar({ title, trailing, onBack }: TopBarProps): JSX.Element {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur safe-pt">
      <div className="flex h-14 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:bg-slate-200"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : null}
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        </div>
        {trailing ? <div className="flex items-center gap-1">{trailing}</div> : null}
      </div>
    </header>
  );
}
