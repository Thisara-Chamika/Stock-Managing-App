/**
 * LocalStorage persistence layer.
 *
 * All read/write access to the stock batches is funnelled through this module
 * so we have a single place to handle schema changes, error recovery and
 * backup/restore.
 */

import type { BackupPayload, Calculator, StockBatch } from '@/types/stock';
import {
  haveToPay,
  pendingSupplierPayment,
  revenuePotential,
  soldRevenue,
  stockCost,
} from '@/types/stock';

const STORAGE_KEY = 'cst.stocks.v1';

/** Shape used when the user fills in the "create new stock" form. */
export interface NewCalculatorInput {
  category: string;
  quantity: number;
  buyingPrice: number;
  sellingPrice: number;
}

/** Generate a reasonably unique identifier without pulling in a uuid lib. */
export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Build a fresh `Calculator[]` from the create-form inputs. */
export function buildCalculators(items: NewCalculatorInput[]): Calculator[] {
  return items.map((item) => ({
    id: createId(),
    category: item.category,
    quantity: Math.max(0, Math.floor(item.quantity)),
    soldQuantity: 0,
    paidQuantity: 0,
    buyingPrice: Math.max(0, Math.floor(item.buyingPrice)),
    sellingPrice: Math.max(0, Math.floor(item.sellingPrice)),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Read / write                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Read all stock batches from LocalStorage, migrating any legacy entries on
 * the way out.  If migration changed anything, the upgraded shape is written
 * back so subsequent reads are fast and a one-time upgrade is observable in
 * exports.
 */
export function getStocks(): StockBatch[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const { stocks, changed } = migrateStocks(parsed);
    if (changed) saveStocks(stocks);
    return stocks;
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
export function createStock(input: { date: string; items: NewCalculatorInput[] }): StockBatch {
  const batch: StockBatch = {
    id: createId(),
    date: input.date,
    createdAt: Date.now(),
    calculators: buildCalculators(input.items),
  };
  const stocks = [batch, ...getStocks()];
  saveStocks(stocks);
  return batch;
}

/** Update sold / paid quantities on a calculator and persist. */
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
        // Business invariants:
        //   sold ∈ [0, quantity]
        //   paid ∈ [0, sold]
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

/* -------------------------------------------------------------------------- */
/*  Backup / restore                                                           */
/* -------------------------------------------------------------------------- */

export function buildBackup(stocks: StockBatch[]): BackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    stocks,
  };
}

/**
 * Restore stocks from a parsed JSON payload.  Old-format backups are
 * automatically migrated to the new schema.  Throws if the payload is not a
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
  const { stocks } = migrateStocks(maybe.stocks);
  if (stocks.length === 0 && maybe.stocks.length > 0) {
    throw new Error('Backup file contains entries with an unexpected shape.');
  }
  saveStocks(stocks);
  return stocks;
}

/* -------------------------------------------------------------------------- */
/*  Aggregation                                                                */
/* -------------------------------------------------------------------------- */

/** All count + financial aggregates across a batch in a single pass. */
export function summarizeBatch(batch: StockBatch) {
  return batch.calculators.reduce(
    (acc, calc) => ({
      quantity: acc.quantity + calc.quantity,
      sold: acc.sold + calc.soldQuantity,
      paid: acc.paid + calc.paidQuantity,
      pendingQty: acc.pendingQty + haveToPay(calc),
      totalCost: acc.totalCost + stockCost(calc),
      totalRevenuePotential: acc.totalRevenuePotential + revenuePotential(calc),
      totalSoldRevenue: acc.totalSoldRevenue + soldRevenue(calc),
      totalPendingPayment: acc.totalPendingPayment + pendingSupplierPayment(calc),
    }),
    {
      quantity: 0,
      sold: 0,
      paid: 0,
      pendingQty: 0,
      totalCost: 0,
      totalRevenuePotential: 0,
      totalSoldRevenue: 0,
      totalPendingPayment: 0,
    },
  );
}

/* -------------------------------------------------------------------------- */
/*  Migration                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Convert a single calculator entry (possibly in the legacy `{ name, ... }`
 * shape) into the current `Calculator` shape.  Returns `null` when the entry
 * is too broken to recover so the caller can drop it.
 */
function migrateCalculator(raw: unknown): { value: Calculator; changed: boolean } | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;

  const id = typeof v['id'] === 'string' ? (v['id'] as string) : createId();
  const quantity = numberOr(v['quantity'], NaN);
  const soldQuantity = numberOr(v['soldQuantity'], NaN);
  const paidQuantity = numberOr(v['paidQuantity'], NaN);
  if (!Number.isFinite(quantity) || !Number.isFinite(soldQuantity) || !Number.isFinite(paidQuantity)) {
    return null;
  }

  let changed = false;

  let category: string;
  if (typeof v['category'] === 'string') {
    category = v['category'] as string;
  } else if (typeof v['name'] === 'string') {
    category = v['name'] as string;
    changed = true;
  } else {
    category = '';
    changed = true;
  }

  const hasBuying = typeof v['buyingPrice'] === 'number';
  const hasSelling = typeof v['sellingPrice'] === 'number';
  const buyingPrice = hasBuying ? (v['buyingPrice'] as number) : 0;
  const sellingPrice = hasSelling ? (v['sellingPrice'] as number) : 0;
  if (!hasBuying || !hasSelling) changed = true;

  if (v['id'] !== id) changed = true;

  return {
    value: { id, category, quantity, soldQuantity, paidQuantity, buyingPrice, sellingPrice },
    changed,
  };
}

/** Apply `migrateCalculator` across every stock batch. */
export function migrateStocks(raw: unknown[]): { stocks: StockBatch[]; changed: boolean } {
  let changed = false;
  const stocks: StockBatch[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') {
      changed = true;
      continue;
    }
    const s = entry as Partial<StockBatch> & { calculators?: unknown };
    if (typeof s.id !== 'string' || typeof s.date !== 'string' || typeof s.createdAt !== 'number') {
      changed = true;
      continue;
    }
    if (!Array.isArray(s.calculators)) {
      changed = true;
      continue;
    }
    const migratedCalcs: Calculator[] = [];
    for (const c of s.calculators) {
      const m = migrateCalculator(c);
      if (!m) {
        changed = true;
        continue;
      }
      if (m.changed) changed = true;
      migratedCalcs.push(m.value);
    }
    stocks.push({
      id: s.id,
      date: s.date,
      createdAt: s.createdAt,
      calculators: migratedCalcs,
    });
  }
  return { stocks, changed };
}

/* -------------------------------------------------------------------------- */
/*  Internal helpers                                                           */
/* -------------------------------------------------------------------------- */

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(Math.floor(value), min), max);
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export const __test__ = { STORAGE_KEY, migrateCalculator, migrateStocks };
