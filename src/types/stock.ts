/**
 * Type definitions for the Calculator Stock Tracker domain.
 *
 * A single user buys batches of calculators from a supplier, sells them to
 * customers, and later pays the supplier for the ones that actually sold.
 *
 * Derived values such as `haveToPay`, `stockCost`, `revenuePotential`,
 * `soldRevenue` and `pendingSupplierPayment` are intentionally computed
 * (never stored) so the data set can't drift out of sync.
 */

/**
 * Canonical list of calculator categories shown in the "create stock" form.
 *
 * The runtime `Calculator.category` field is intentionally typed as a plain
 * `string` (not `CalculatorCategory`) so legacy values like `"Calculator 1"`
 * from older LocalStorage records keep working after migration.  The dropdown
 * in the create form still constrains *new* entries to this list.
 */
export const CALCULATOR_CATEGORIES = [
  'FX-991 EX',
  'FX-991 ES',
  'FX-991 CW',
  'FX-991 ES Original',
  'FX-991 MS 2',
] as const;

export type CalculatorCategory = (typeof CALCULATOR_CATEGORIES)[number];

/** A single calculator line item inside a stock batch. */
export interface Calculator {
  /** Stable identifier (uuid-like). */
  id: string;
  /** Model name e.g. "FX-991 EX".  Plain string to tolerate migrated data. */
  category: string;
  /** Quantity bought from the supplier in this batch. */
  quantity: number;
  /** Quantity already sold to customers. */
  soldQuantity: number;
  /** Quantity already paid to the supplier for sold units. */
  paidQuantity: number;
  /** Cost per unit when bought from the supplier (in Sri Lankan rupees). */
  buyingPrice: number;
  /** Selling price per unit charged to customers (LKR). */
  sellingPrice: number;
}

/** A single purchase from the supplier. */
export interface StockBatch {
  id: string;
  /** ISO date string (YYYY-MM-DD) shown in the UI. */
  date: string;
  /** Epoch millis – used for sorting newest first. */
  createdAt: number;
  /** One or more calculators recorded in this batch. */
  calculators: Calculator[];
}

/** Shape persisted to LocalStorage and to backup JSON files. */
export interface BackupPayload {
  version: 1;
  exportedAt: string;
  stocks: StockBatch[];
}

/* -------------------------------------------------------------------------- */
/*  Derived (computed) values                                                  */
/* -------------------------------------------------------------------------- */

/** Number of sold calculators that still owe the supplier a payment. */
export function haveToPay(c: Pick<Calculator, 'soldQuantity' | 'paidQuantity'>): number {
  return Math.max(0, c.soldQuantity - c.paidQuantity);
}

/** Money tied up in this calculator's stock (quantity × buying price). */
export function stockCost(c: Pick<Calculator, 'quantity' | 'buyingPrice'>): number {
  return c.quantity * c.buyingPrice;
}

/** Revenue if every unit were sold (quantity × selling price). */
export function revenuePotential(c: Pick<Calculator, 'quantity' | 'sellingPrice'>): number {
  return c.quantity * c.sellingPrice;
}

/** Revenue realised so far from this calculator (sold × selling price). */
export function soldRevenue(c: Pick<Calculator, 'soldQuantity' | 'sellingPrice'>): number {
  return c.soldQuantity * c.sellingPrice;
}

/** Money still owed to the supplier for already-sold units. */
export function pendingSupplierPayment(
  c: Pick<Calculator, 'soldQuantity' | 'paidQuantity' | 'buyingPrice'>,
): number {
  return haveToPay(c) * c.buyingPrice;
}
