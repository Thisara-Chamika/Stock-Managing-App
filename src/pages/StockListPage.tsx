import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ExportModal, type ExportFormat } from '@/components/ExportModal';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { StockCard } from '@/components/StockCard';
import { Toast, type ToastTone } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import { useAppData } from '@/state/useAppData';
import { exportExcel } from '@/utils/exportExcel';
import { exportJsonBackup } from '@/utils/exportJson';
import { exportPdf } from '@/utils/exportPdf';
import { formatMoney } from '@/utils/format';
import { BackupValidationError, readBackupFile } from '@/utils/importJson';
import { summarizeAllStocks } from '@/utils/storage';

interface ToastState {
  message: string;
  tone: ToastTone;
}

/**
 * Stocks page – lists every batch (newest first), surfaces a sold-revenue
 * and pending-payment summary, and hosts the Export / Import backup
 * actions.
 */
export function StockListPage(): JSX.Element {
  const navigate = useNavigate();
  const { stocks, categories, isLoading, importBackup } = useAppData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importPayload, setImportPayload] = useState<unknown | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const grandTotals = summarizeAllStocks(stocks);

  const handleExport = (format: ExportFormat): void => {
    setExportModalOpen(false);
    try {
      if (format === 'pdf') {
        exportPdf({ stocks });
        setToast({ message: 'PDF report exported.', tone: 'success' });
      } else if (format === 'excel') {
        exportExcel({ stocks });
        setToast({ message: 'Excel report exported.', tone: 'success' });
      } else {
        exportJsonBackup({ stocks, categories });
        setToast({ message: 'JSON backup exported.', tone: 'success' });
      }
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to export. Please try again.', tone: 'error' });
    }
  };

  const handleImportClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = await readBackupFile(file);
      setImportPayload(parsed);
    } catch (error) {
      const message = error instanceof BackupValidationError ? error.message : 'Invalid backup file.';
      setToast({ message, tone: 'error' });
    }
  };

  const confirmImport = (): void => {
    if (importPayload === null) return;
    try {
      importBackup(importPayload);
      setImportPayload(null);
      setToast({ message: 'Backup imported successfully.', tone: 'success' });
    } catch (error) {
      const message = error instanceof BackupValidationError ? error.message : 'Invalid backup file.';
      setImportPayload(null);
      setToast({ message, tone: 'error' });
    }
  };

  return (
    <div className="relative min-h-screen pb-32">
      <TopBar
        title="Stock Tracker"
        trailing={
          <div className="flex items-center gap-1">
            <IconAction
              label="Export data"
              onClick={() => setExportModalOpen(true)}
              disabled={stocks.length === 0}
            >
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

      <FloatingActionButton label="Create new stock batch" onClick={() => navigate('/create')} />

      <ExportModal
        open={exportModalOpen}
        onExport={handleExport}
        onCancel={() => setExportModalOpen(false)}
        disabled={stocks.length === 0}
      />

      <ConfirmDialog
        open={importPayload !== null}
        title="Replace your current data?"
        description="Importing this backup will replace your current data. Are you sure?"
        confirmLabel="Import"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmImport}
        onCancel={() => setImportPayload(null)}
      />

      <Toast
        open={toast !== null}
        message={toast?.message ?? ''}
        tone={toast?.tone ?? 'info'}
        onClose={() => setToast(null)}
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
