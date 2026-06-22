/**
 * JSON backup import.
 *
 * Reads a previously exported backup file (v1 stocks-only OR v2 stocks +
 * categories), validates its shape, restores both LocalStorage slots and
 * returns the parsed data so the UI layer can update React state.
 *
 * The validator is intentionally strict on top-level structure so we
 * surface a clear "Invalid backup file." error instead of corrupting
 * the user's data with a half-parsed payload.
 */

import type { Category } from '@/types/category';
import type { StockBatch } from '@/types/stock';
import { saveCategories } from '@/utils/categoryStorage';
import { migrateStocks, saveStocks } from '@/utils/storage';

/** Generic error thrown for any validation failure during import. */
export class BackupValidationError extends Error {
  constructor(message = 'Invalid backup file.') {
    super(message);
    this.name = 'BackupValidationError';
  }
}

export interface ImportResult {
  stocks: StockBatch[];
  categories: Category[];
  /** Source backup version (1 = legacy stocks-only, 2 = current). */
  version: 1 | 2;
}

/**
 * Read a `File` (from a `<input type="file">`) as text and parse it as JSON.
 * Throws `BackupValidationError` on malformed JSON or empty file.
 */
export async function readBackupFile(file: File): Promise<unknown> {
  let text: string;
  try {
    text = await file.text();
  } catch (error) {
    console.error(error);
    throw new BackupValidationError('Invalid backup file.');
  }
  if (text.trim() === '') {
    throw new BackupValidationError('Invalid backup file.');
  }
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    console.error(error);
    throw new BackupValidationError('Invalid backup file.');
  }
}

/**
 * Validate a parsed JSON payload as a backup.  Returns the normalised
 * `{ stocks, categories, version }` triple ready to be persisted.
 *
 * Validation rules:
 *   - Must be an object.
 *   - `stocks` MUST be an array.
 *   - `categories` MAY be missing (v1 backups); when present it MUST be an
 *     array of `{ id: string, name: string }`.
 *   - Each stock must satisfy `migrateStocks` (i.e. have an id, date,
 *     createdAt and a calculators array).
 *
 * Throws `BackupValidationError` on any failure.
 */
export function validateBackup(payload: unknown): ImportResult {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new BackupValidationError();
  }

  const obj = payload as Record<string, unknown>;
  if (!Array.isArray(obj['stocks'])) {
    throw new BackupValidationError();
  }

  const { stocks } = migrateStocks(obj['stocks']);
  // If we got nothing back but the source had entries, the entries are
  // structurally broken - reject so we don't silently wipe the user's data.
  if (stocks.length === 0 && (obj['stocks'] as unknown[]).length > 0) {
    throw new BackupValidationError();
  }

  let categories: Category[] = [];
  if (obj['categories'] !== undefined) {
    if (!Array.isArray(obj['categories'])) {
      throw new BackupValidationError();
    }
    categories = (obj['categories'] as unknown[]).filter(isCategory);
    if (categories.length === 0 && (obj['categories'] as unknown[]).length > 0) {
      throw new BackupValidationError();
    }
  }

  const version: 1 | 2 = obj['categories'] === undefined ? 1 : 2;
  return { stocks, categories, version };
}

/**
 * Validate `payload`, persist both stocks and categories to LocalStorage and
 * return the parsed data so the React state can be refreshed.
 *
 * For v1 (stocks-only) backups, the existing category list is left
 * untouched so the user doesn't lose their custom categories during a
 * legacy restore.
 */
export function importJsonBackup(payload: unknown): ImportResult {
  const result = validateBackup(payload);
  saveStocks(result.stocks);
  if (result.version === 2) {
    saveCategories(result.categories);
  }
  return result;
}

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v['id'] === 'string' && typeof v['name'] === 'string';
}
