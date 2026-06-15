/**
 * LocalStorage persistence layer.
 *
 * All read/write access to the stock batches is funnelled through this module
 * so we have a single place to handle schema changes, error recovery and
 * backup/restore.
 */

import type { BackupPayload, Calculator, StockBatch } from '@/types/stock';
import { haveToPay } from '@/types/stock';

const STORAGE_KEY = 'cst.stocks.v1';

/** Generate a reasonably unique identifier without pulling in a uuid lib. */
export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Build the 3 default calculators required by the business rules. */
export function buildDefaultCalculators(quantities: [number, number, number]): Calculator[] {
  return [1, 2, 3].map((index) => ({
    id: createId(),
    name: `Calculator ${index}`,
    quantity: Math.max(0, Math.floor(quantities[index - 1] ?? 0)),
    soldQuantity: 0,
    paidQuantity: 0,
  }));
}

/** Read all stock batches from LocalStorage.  Never throws. */
export function getStocks(): StockBatch[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStockBatch);
  } catch (error) {
    console.error('Failed to read stocks from LocalStorage', error);
    return [];
  }
}

/** Replace the entire stock list in LocalStorage. */
export function saveStocks(stocks: StockBatch[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks));
  } catch (error) {
    console.error('Failed to write stocks to LocalStorage', error);
  }
}

/** Append a new stock batch and persist. Returns the saved batch. */
export function createStock(input: { date: string; quantities: [number, number, number] }): StockBatch {
  const batch: StockBatch = {
    id: createId(),
    date: input.date,
    createdAt: Date.now(),
    calculators: buildDefaultCalculators(input.quantities),
  };
  const stocks = [batch, ...getStocks()];
  saveStocks(stocks);
  return batch;
}

/** Update a single calculator within a stock batch and persist. */
export function updateCalculator(
  stockId: string,
  calculatorId: string,
  patch: Partial<Pick<Calculator, 'soldQuantity' | 'paidQuantity'>>,
): StockBatch[] {
  const stocks = getStocks().map((stock) => {
    if (stock.id !== stockId) return stock;
    return {
      ...stock,
      calculators: stock.calculators.map((calc) => {
        if (calc.id !== calculatorId) return calc;
        // Enforce the business invariants:
        //   sold  ∈ [0, quantity]
        //   paid  ∈ [0, sold]
        const nextSold = clamp(patch.soldQuantity ?? calc.soldQuantity, 0, calc.quantity);
        const nextPaid = clamp(patch.paidQuantity ?? calc.paidQuantity, 0, nextSold);
        return { ...calc, soldQuantity: nextSold, paidQuantity: nextPaid };
      }),
    };
  });
  saveStocks(stocks);
  return stocks;
}

/** Delete a stock batch by id and persist. */
export function deleteStock(stockId: string): StockBatch[] {
  const stocks = getStocks().filter((stock) => stock.id !== stockId);
  saveStocks(stocks);
  return stocks;
}

/** Build a JSON backup blob suitable for download. */
export function buildBackup(stocks: StockBatch[]): BackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    stocks,
  };
}

/**
 * Restore stocks from a parsed JSON payload.  Throws if the payload is not a
 * valid backup so the caller can surface the error to the user.
 */
export function restoreBackup(payload: unknown): StockBatch[] {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Backup file is empty or not a JSON object.');
  }
  const maybe = payload as Partial<BackupPayload> & { stocks?: unknown };
  if (!Array.isArray(maybe.stocks)) {
    throw new Error('Backup file is missing the "stocks" array.');
  }
  const stocks = maybe.stocks.filter(isStockBatch);
  if (stocks.length !== maybe.stocks.length) {
    throw new Error('Backup file contains entries with an unexpected shape.');
  }
  saveStocks(stocks);
  return stocks;
}

/** Aggregate totals across an entire stock batch. */
export function summarizeBatch(batch: StockBatch) {
  return batch.calculators.reduce(
    (acc, calc) => ({
      quantity: acc.quantity + calc.quantity,
      sold: acc.sold + calc.soldQuantity,
      paid: acc.paid + calc.paidQuantity,
      pending: acc.pending + haveToPay(calc),
    }),
    { quantity: 0, sold: 0, paid: 0, pending: 0 },
  );
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(Math.floor(value), min), max);
}

function isStockBatch(value: unknown): value is StockBatch {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<StockBatch>;
  return (
    typeof v.id === 'string' &&
    typeof v.date === 'string' &&
    typeof v.createdAt === 'number' &&
    Array.isArray(v.calculators) &&
    v.calculators.every(isCalculator)
  );
}

function isCalculator(value: unknown): value is Calculator {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Calculator>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.quantity === 'number' &&
    typeof v.soldQuantity === 'number' &&
    typeof v.paidQuantity === 'number'
  );
}

export const __test__ = { STORAGE_KEY };
