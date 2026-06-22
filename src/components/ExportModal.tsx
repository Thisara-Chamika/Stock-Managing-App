import { useEffect, useState } from 'react';

import { Button } from './Button';

/** Identifies which exporter the user picked in the modal. */
export type ExportFormat = 'pdf' | 'excel' | 'json';

interface ExportModalProps {
  open: boolean;
  /** Called with the chosen format when the user taps "Export". */
  onExport: (format: ExportFormat) => void;
  onCancel: () => void;
  /** When true the action buttons are disabled (e.g. no data to export). */
  disabled?: boolean;
}

interface FormatOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: JSX.Element;
}

const OPTIONS: FormatOption[] = [
  {
    id: 'pdf',
    label: 'PDF Report',
    description: 'Printable summary + stock details',
    icon: <PdfIcon />,
  },
  {
    id: 'excel',
    label: 'Excel Report',
    description: 'Spreadsheet you can sort and filter',
    icon: <ExcelIcon />,
  },
  {
    id: 'json',
    label: 'JSON Backup',
    description: 'Full backup you can later import',
    icon: <JsonIcon />,
  },
];

/**
 * Bottom-sheet style export menu.  Shown when the user hits the "Export
 * Data" button on the Settings (or Stocks) page.  Renders an option list
 * and an explicit "Export" CTA so the choice is intentional (matches the
 * action-sheet spec in the design doc).
 */
export function ExportModal({ open, onExport, onCancel, disabled = false }: ExportModalProps): JSX.Element | null {
  const [selected, setSelected] = useState<ExportFormat>('pdf');

  useEffect(() => {
    if (!open) return;
    // Reset to PDF every time the modal opens so the choice is predictable.
    setSelected('pdf');
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 px-4 pb-6 pt-10 sm:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-app rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="export-modal-title" className="text-lg font-semibold text-slate-900">
          Export Data
        </h2>
        <p className="mt-1 text-sm text-slate-600">Choose a format below, then tap Export.</p>

        <fieldset className="mt-4 space-y-2" disabled={disabled}>
          <legend className="sr-only">Export format</legend>
          {OPTIONS.map((option) => {
            const isSelected = selected === option.id;
            return (
              <label
                key={option.id}
                className={[
                  'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors',
                  isSelected
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100'
                    : 'border-slate-200 bg-white hover:bg-slate-50',
                  disabled ? 'cursor-not-allowed opacity-60' : '',
                ].join(' ')}
              >
                <input
                  type="radio"
                  name="export-format"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => setSelected(option.id)}
                  className="sr-only"
                />
                <span
                  className={[
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {option.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{option.label}</span>
                  <span className="block text-xs text-slate-500">{option.description}</span>
                </span>
                <span
                  className={[
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                    isSelected ? 'border-brand-600 bg-brand-600' : 'border-slate-300 bg-white',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {isSelected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} fullWidth>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onExport(selected)}
            disabled={disabled}
            fullWidth
          >
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tiny icons (kept inline so we don't depend on an icon library)             */
/* -------------------------------------------------------------------------- */

function PdfIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h2M8 17h6" />
    </svg>
  );
}

function ExcelIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 8l4 8M12 8l-4 8" />
    </svg>
  );
}

function JsonIcon(): JSX.Element {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 3H6a2 2 0 0 0-2 2v4a2 2 0 0 1-2 2 2 2 0 0 1 2 2v4a2 2 0 0 0 2 2h2" />
      <path d="M16 3h2a2 2 0 0 1 2 2v4a2 2 0 0 0 2 2 2 2 0 0 0-2 2v4a2 2 0 0 1-2 2h-2" />
    </svg>
  );
}
