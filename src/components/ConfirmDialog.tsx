import { useEffect } from 'react';

import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable confirmation modal.  Rendered above everything via a fixed overlay
 * so it works correctly inside the centred app shell.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps): JSX.Element | null {
  // Lock background scroll while the dialog is open so the user doesn't
  // accidentally scroll the list behind it on mobile.
  useEffect(() => {
    if (!open) return;
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
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 px-4 pb-6 pt-10 sm:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-app rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} fullWidth>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} fullWidth>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
