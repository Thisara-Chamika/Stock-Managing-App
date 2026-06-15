import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700 disabled:bg-slate-300',
  secondary: 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 active:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-700 disabled:bg-slate-300',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200',
};

/**
 * Generic button with mobile-friendly tap targets and a few preset variants.
 * Used everywhere we need a button so styling stays consistent.
 */
export function Button({
  variant = 'primary',
  fullWidth = false,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold',
        'transition-colors select-none min-h-[44px]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-80',
        fullWidth ? 'w-full' : '',
        VARIANT_CLASSES[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
