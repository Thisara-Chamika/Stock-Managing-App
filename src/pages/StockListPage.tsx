import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { StockCard } from '@/components/StockCard';
import { TopBar } from '@/components/TopBar';
import { useAppData } from '@/state/useAppData';
import { fileTimestamp, formatMoney } from '@/utils/format';
import { buildBackup, summarizeAllStocks } from '@/utils/storage';

/**
 * Stocks page – lists every batch (newest first), surfaces a sold-revenue
 * and pending-payment summary, and hosts the Export / Import backup
 * actions.
 */
export function StockListPage(): JSX.Element {
  const navigate = useNavigate();
  const { stocks, isLoading, importBackup } = useAppData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importPayload, setImportPayload] = useState<unknown | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const grandTotals = summarizeAllStocks(stocks);

  const handleExport = (): void => {
    const payload = buildBackup(stocks);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calculator-stock-backup-${fileTimestamp()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = (): void => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      setImportPayload(parsed);
    } catch (error) {
      console.error(error);
      setImportError('Could not read that file. Make sure it is a valid backup JSON.');
    }
  };

  const confirmImport = (): void => {
    if (importPayload === null) return;
    try {
      importBackup(importPayload);
      setImportPayload(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import backup.';
      setImportError(message);
      setImportPayload(null);
    }
  };

  return (
    <div className="relative min-h-screen pb-32">
      <TopBar
        title="Stock Tracker"
        trailing={
          <div className="flex items-center gap-1">
            <IconAction label="Export backup" onClick={handleExport} disabled={stocks.length === 0}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3v12" />
                <path d="M7 10l5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
            </IconAction>
            <IconAction label="Import backup" onClick={handleImportClick}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 21V9" />
                <path d="M7 14l5-5 5 5" />
                <path d="M5 3h14" />
              </svg>
            </IconAction>
          </div>
        }
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileSelected}
      />

      {stocks.length > 0 ? (
        <section className="mb-4 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 p-4 text-white shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-100">All-time totals</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <HeaderStat label="Calculators" value={grandTotals.quantity} />
            <HeaderStat label="Sold" value={grandTotals.sold} />
            <HeaderStat label="Pending" value={grandTotals.pendingQty} highlight />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-center">
            <HeaderStat label="Sold revenue" value={formatMoney(grandTotals.totalSoldRevenue)} />
            <HeaderStat
              label="Pending payment"
              value={formatMoney(grandTotals.totalPendingPayment)}
              highlight
            />
          </div>
        </section>
      ) : null}

      {/* Backup-loss warning - always visible so the user remembers. */}
      <div className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800 ring-1 ring-amber-100">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        >
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
        <p>
          If your browser data is removed, your stock data may be lost. Regularly export backups
          using the icon above.
        </p>
      </div>

      {isLoading ? (
        <SkeletonList />
      ) : stocks.length === 0 ? (
        <EmptyState
          title="No stock batches yet"
          description="Tap the + button to record your first purchase from the supplier."
        />
      ) : (
        <ul className="space-y-3">
          {stocks.map((batch) => (
            <li key={batch.id}>
              <StockCard batch={batch} onOpen={(id) => navigate(`/stock/${id}`)} />
            </li>
          ))}
        </ul>
      )}

      {importError ? (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {importError}
        </p>
      ) : null}

      <FloatingActionButton label="Create new stock batch" onClick={() => navigate('/create')} />

      <ConfirmDialog
        open={importPayload !== null}
        title="Replace all data?"
        description="Importing this backup will overwrite your current stock list. This cannot be undone."
        confirmLabel="Replace data"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmImport}
        onCancel={() => setImportPayload(null)}
      />
    </div>
  );
}

function HeaderStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}): JSX.Element {
  const isMoney = typeof value === 'string';
  return (
    <div className={`rounded-xl px-2 py-2 ${highlight ? 'bg-white/20' : 'bg-white/10'}`}>
      <p className="text-[11px] uppercase tracking-wide text-brand-100">{label}</p>
      <p className={`${isMoney ? 'text-base' : 'text-lg'} font-semibold leading-tight`}>{value}</p>
    </div>
  );
}

function IconAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function SkeletonList(): JSX.Element {
  return (
    <ul className="space-y-3" aria-busy="true" aria-label="Loading stock batches">
      {[1, 2, 3].map((i) => (
        <li key={i} className="h-32 animate-pulse rounded-2xl bg-white shadow-card" />
      ))}
    </ul>
  );
}
