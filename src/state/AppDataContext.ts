import { createContext } from 'react';

import type { Category } from '@/types/category';
import type { Calculator, StockBatch } from '@/types/stock';
import type { NewCalculatorInput } from '@/utils/storage';

/* -------------------------------------------------------------------------- */
/*  Shape exposed to consumers                                                 */
/* -------------------------------------------------------------------------- */

export interface AppData {
  // Stocks
  stocks: StockBatch[];
  isLoading: boolean;
  createStock: (date: string, items: NewCalculatorInput[]) => StockBatch;
  deleteStock: (stockId: string) => void;
  updateCalculator: (
    stockId: string,
    calculatorId: string,
    patch: Partial<Pick<Calculator, 'soldQuantity' | 'paidQuantity'>>,
  ) => void;
  addCalculatorToStock: (
    stockId: string,
    item: NewCalculatorInput,
  ) => { ok: true } | { ok: false; reason: 'duplicate' | 'missing' };
  importBackup: (payload: unknown) => void;

  // Categories
  categories: Category[];
  addCategory: (
    name: string,
  ) => { ok: true; category: Category } | { ok: false; reason: 'empty' | 'duplicate' };
  renameCategory: (
    id: string,
    newName: string,
  ) => { ok: true } | { ok: false; reason: 'empty' | 'duplicate' | 'missing' };
  deleteCategory: (
    id: string,
  ) => { ok: true } | { ok: false; reason: 'in_use'; usageCount: number } | { ok: false; reason: 'missing' };
  categoryUsageCount: (categoryName: string) => number;
}

export const AppDataContext = createContext<AppData | null>(null);
