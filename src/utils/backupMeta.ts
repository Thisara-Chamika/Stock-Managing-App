/**
 * Tracks "last backup" metadata in LocalStorage so the Settings page can
 * remind the user when they last exported their data.
 *
 * Stored as a single ISO timestamp string under a dedicated key so it stays
 * isolated from the stock and category lists and never gets clobbered by an
 * import.
 */

const STORAGE_KEY = 'cst.backupMeta.v1';

/** Read the timestamp of the most recent successful export, if any. */
export function getLastBackupAt(): string | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // Quick sanity: we only ever write ISO timestamps.
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : raw;
  } catch (error) {
    console.warn('Failed to read backup metadata', error);
    return null;
  }
}

/** Persist "right now" as the most recent export timestamp. */
export function markBackupNow(): string {
  const iso = new Date().toISOString();
  try {
    window.localStorage.setItem(STORAGE_KEY, iso);
  } catch (error) {
    console.warn('Failed to write backup metadata', error);
  }
  return iso;
}

/**
 * Human-friendly rendering used by Settings.  Falls back to "Never" when no
 * backup has been recorded yet.
 */
export function formatBackupDate(iso: string | null): string {
  if (!iso) return 'Never';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Never';
  const pad = (n: number): string => String(n).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()] ?? '';
  const year = date.getFullYear();
  return `${day} ${month} ${year}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const __test__ = { STORAGE_KEY };
