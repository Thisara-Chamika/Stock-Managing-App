import { useEffect } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastProps {
  open: boolean;
  message: string;
  tone?: ToastTone;
  /** Auto-dismiss after this many milliseconds (default 3500). */
  durationMs?: number;
  onClose: () => void;
}

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-slate-800 text-white',
};

/**
 * Tiny self-dismissing toast pinned to the top of the safe area.  Used to
 * confirm successful exports / imports and to surface validation errors
 * without blocking the rest of the UI like a dialog would.
 */
export function Toast({ open, message, tone = 'info', durationMs = 3500, onClose }: ToastProps): JSX.Element | null {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4"
    >
      <div
        className={[
          'pointer-events-auto w-full max-w-app rounded-xl px-4 py-3 text-sm font-medium shadow-xl ring-1 ring-black/5',
          TONE_CLASSES[tone],
        ].join(' ')}
      >
        <div className="flex items-start gap-2">
          <ToneIcon tone={tone} />
          <p className="flex-1">{message}</p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onClose}
            className="-mr-1 -mt-1 rounded-md p-1 text-white/80 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ToneIcon({ tone }: { tone: ToastTone }): JSX.Element {
  if (tone === 'success') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  }
  if (tone === 'error') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}
