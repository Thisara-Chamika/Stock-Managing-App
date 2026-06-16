/** Small formatting helpers used across the UI. */

/** Display dates as "16 Jun 2026" – short and unambiguous on mobile. */
export function formatDisplayDate(isoDate: string): string {
  // Construct manually so we don't depend on the user's locale during build.
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  if (!year || !month || !day) return isoDate;
  const monthIndex = Number.parseInt(month, 10) - 1;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[monthIndex] ?? month;
  return `${Number.parseInt(day, 10)} ${monthName} ${year}`;
}

/** ISO date (YYYY-MM-DD) for "today" in the user's local timezone. */
export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** A filename-safe timestamp e.g. "2026-06-16_01-12". */
export function fileTimestamp(): string {
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(
    now.getMinutes(),
  )}`;
}

/**
 * Format a money amount with the Sri Lankan rupee prefix and Indian-style
 * digit grouping (1,00,000) which feels natural in the local market.
 *
 *   formatMoney(4500)    -> "Rs 4,500"
 *   formatMoney(125000)  -> "Rs 1,25,000"
 *   formatMoney(NaN)     -> "Rs 0"
 */
export function formatMoney(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  return `Rs ${safe.toLocaleString('en-IN')}`;
}
