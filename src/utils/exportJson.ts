/**
 * JSON backup export.
 *
 * Writes a complete v2 backup of the application's data (stocks + categories)
 * to a downloadable .json file and records the timestamp so the Settings
 * page can show "Last Backup".
 */

import type { Category } from '@/types/category';
import type { StockBatch } from '@/types/stock';
import { markBackupNow } from '@/utils/backupMeta';
import { downloadBlob, fileDateYmd } from '@/utils/download';
import { buildBackup } from '@/utils/storage';

export interface ExportJsonOptions {
  stocks: StockBatch[];
  categories: Category[];
}

/**
 * Trigger a download of the full application backup.  Returns the ISO
 * timestamp written to the file so the caller can update local UI state
 * (e.g. "Backup created at …") without having to read it back.
 */
export function exportJsonBackup({ stocks, categories }: ExportJsonOptions): string {
  const payload = buildBackup(stocks, categories);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadBlob(blob, `calculator-stock-backup-${fileDateYmd()}.json`);
  markBackupNow();
  return payload.exportedAt;
}
