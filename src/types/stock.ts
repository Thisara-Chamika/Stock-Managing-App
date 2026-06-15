/**
 * Type definitions for the Calculator Stock Tracker domain.
 *
 * A single user buys batches of calculators from a supplier, sells them to
 * customers, and later pays the supplier for the ones that actually sold.
 *
 * The "have to pay" amount is intentionally derived (not stored) so that the
 * data set can never drift out of sync.
 */

/** A single calculator line item inside a stock batch. */
export interface Calculator {
  /** Stable identifier (uuid-like). */
  id: string;
  /** Display name e.g. "Calculator 1". */
  name: string;
  /** Quantity bought from the supplier in this batch. */
  quantity: number;
  /** Quantity already sold to customers. */
  soldQuantity: number;
  /** Quantity already paid to the supplier for sold units. */
  paidQuantity: number;
}

/** A single purchase from the supplier. */
export interface StockBatch {
  id: string;
  /** ISO date string (YYYY-MM-DD) shown in the UI. */
  date: string;
  /** Epoch millis – used for sorting newest first. */
  createdAt: number;
  /** Always exactly 3 calculators by business rule. */
  calculators: Calculator[];
}

/** Shape persisted to LocalStorage and to backup JSON files. */
export interface BackupPayload {
  version: 1;
  exportedAt: string;
  stocks: StockBatch[];
}

/**
 * Derived value: number of sold calculators that still owe a supplier
 * payment.  Computed everywhere as `sold - paid` and never stored.
 */
export function haveToPay(calculator: Pick<Calculator, 'soldQuantity' | 'paidQuantity'>): number {
  return Math.max(0, calculator.soldQuantity - calculator.paidQuantity);
}
