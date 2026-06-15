import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { StockCard } from '@/components/StockCard';
import { TopBar } from '@/components/TopBar';
import type { StockBatch } from '@/types/stock';
import { fileTimestamp } from '@/utils/format';
import { buildBackup, summarizeBatch } from '@/utils/storage';

interface StockListPageProps {
  stocks: StockBatch[];
  isLoading: boolean;
  onImport: (payload: unknown) => void;
}

/**
 * Home page – lists every stock batch (newest first) along with aggregate
 * stats and the export / import backup actions.
 */
export function StockListPage({ stocks, isLoading, onImport }: StockListPageProps): JSX.Element {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importPayload, setImportPayload] = useState<unknown | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const grandTotals = stocks.reduce(
    (acc, batch) => {
      const t = summarizeBatch(batch);
      return {
        quantity: acc.quantity + t.quantity,
        sold: acc.sold + t.sold,
        pending: acc.pending + t.pending,
      };
    },
    { quantity: 0, sold: 0, pending: 0 },
  );

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
    // Reset the input so selecting the same file twice still triggers change.
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
      onImport(importPayload);
      setImportPayload(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import backup.';
      setImportError(message);
      setImportPayload(null);
    }
  };

  return (
    <div className="relative min-h-screen pb-28">
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
            <HeaderStat label="Pending" value={grandTotals.pending} highlight />
          </div>
        </section>
      ) : null}

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
  value: number;
  highlight?: boolean;
}): JSX.Element {
  return (
    <div className={`rounded-xl px-2 py-2 ${highlight ? 'bg-white/20' : 'bg-white/10'}`}>
      <p className="text-[11px] uppercase tracking-wide text-brand-100">{label}</p>
      <p className="text-lg font-semibold leading-tight">{value}</p>
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
        <li key={i} className="h-28 animate-pulse rounded-2xl bg-white shadow-card" />
      ))}
    </ul>
  );
}
