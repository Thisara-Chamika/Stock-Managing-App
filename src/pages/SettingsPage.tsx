import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ExportModal, type ExportFormat } from '@/components/ExportModal';
import { Toast, type ToastTone } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import { useAppData } from '@/state/useAppData';
import {
  formatBackupDate,
  getLastBackupAt,
} from '@/utils/backupMeta';
import { exportExcel } from '@/utils/exportExcel';
import { exportJsonBackup } from '@/utils/exportJson';
import { exportPdf } from '@/utils/exportPdf';
import { BackupValidationError, readBackupFile } from '@/utils/importJson';

interface ToastState {
  message: string;
  tone: ToastTone;
}

/**
 * Settings page.  Hosts the Backup & Export section (PDF / Excel / JSON
 * exports + JSON import) plus the recurring "your data lives on this
 * device" warning so the user is reminded to back up regularly.
 */
export function SettingsPage(): JSX.Element {
  const navigate = useNavigate();
  const { stocks, categories, importBackup } = useAppData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importPayload, setImportPayload] = useState<unknown | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(() => getLastBackupAt());

  // Re-read the "last backup" timestamp whenever the export modal closes -
  // exporters write it synchronously so we just need to peek again.
  useEffect(() => {
    if (!exportModalOpen) setLastBackup(getLastBackupAt());
  }, [exportModalOpen]);

  const hasData = stocks.length > 0;

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
      setLastBackup(getLastBackupAt());
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
    // Reset the input so picking the same file twice in a row still fires "change".
    event.target.value = '';
    if (!file) return;
    try {
      const payload = await readBackupFile(file);
      setImportPayload(payload);
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
    <div className="min-h-screen pb-24">
      <TopBar title="Settings" onBack={() => navigate('/')} />

      {/* Backup & Export section ------------------------------------- */}
      <section className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="text-base font-semibold text-slate-900">Backup &amp; Export</h2>
        <p className="mt-1 text-sm text-slate-600">
          Download your data as a report or back it up so you can restore it later.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="primary"
            fullWidth
            onClick={() => setExportModalOpen(true)}
            disabled={!hasData}
          >
            Export Data
          </Button>
          <Button variant="secondary" fullWidth onClick={handleImportClick}>
            Import Backup
          </Button>
        </div>

        {!hasData ? (
          <p className="mt-3 text-xs text-slate-500">
            Add at least one stock batch before exporting.
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Last Backup</p>
          <p className="text-sm font-semibold text-slate-800">{formatBackupDate(lastBackup)}</p>
        </div>
      </section>

      {/* Data safety warning ----------------------------------------- */}
      <section className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-100">
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
          className="mt-0.5 shrink-0"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
        <div className="space-y-1">
          <p className="font-semibold">Keep your data safe</p>
          <p className="text-amber-800">
            Your data is stored locally on this device. If browser data is removed or the
            device is reset, your data may be lost.
          </p>
          <p className="text-amber-800">Export JSON backups regularly.</p>
        </div>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileSelected}
      />

      <ExportModal
        open={exportModalOpen}
        onExport={handleExport}
        onCancel={() => setExportModalOpen(false)}
        disabled={!hasData}
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
