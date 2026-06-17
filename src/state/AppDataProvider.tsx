import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { Category } from '@/types/category';
import type { Calculator, StockBatch } from '@/types/stock';
import {
  addCategoryToStorage,
  countCategoryUsage,
  deleteCategoryFromStorage,
  getOrSeedCategories,
  renameCategoryInStorage,
} from '@/utils/categoryStorage';
import {
  addCalculatorToBatch,
  createStock as createStockInStorage,
  deleteStock as deleteStockInStorage,
  getStocks,
  renameCalculatorCategory,
  restoreBackup,
  saveStocks,
  updateCalculator as updateCalculatorInStorage,
  type NewCalculatorInput,
} from '@/utils/storage';

import { AppDataContext, type AppData } from './AppDataContext';

/**
 * Holds the entire app's data layer (stocks + categories) in a single
 * provider so cross-cutting operations like "rename category and cascade
 * into every stock record" stay atomic and don't need prop-drilling.
 */
export function AppDataProvider({ children }: { children: ReactNode }): JSX.Element {
  const [stocks, setStocks] = useState<StockBatch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial hydrate.
  useEffect(() => {
    setStocks(getStocks());
    setCategories(getOrSeedCategories());
    setIsLoading(false);
  }, []);

  // Stay in sync with other tabs.
  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key === null || event.key === 'cst.stocks.v1') {
        setStocks(getStocks());
      }
      if (event.key === null || event.key === 'cst.categories.v1') {
        setCategories(getOrSeedCategories());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /* -------------------- Stock mutators -------------------- */

  const createStock = useCallback((date: string, items: NewCalculatorInput[]): StockBatch => {
    const batch = createStockInStorage({ date, items });
    setStocks((prev) => [batch, ...prev]);
    return batch;
  }, []);

  const deleteStock = useCallback((stockId: string): void => {
    const next = deleteStockInStorage(stockId);
    setStocks(next);
  }, []);

  const updateCalculator = useCallback(
    (
      stockId: string,
      calculatorId: string,
      patch: Partial<Pick<Calculator, 'soldQuantity' | 'paidQuantity'>>,
    ): void => {
      const next = updateCalculatorInStorage(stockId, calculatorId, patch);
      setStocks(next);
    },
    [],
  );

  const addCalculatorToStock = useCallback(
    (stockId: string, item: NewCalculatorInput) => {
      const result = addCalculatorToBatch(stockId, item);
      if (result.ok) setStocks(result.stocks);
      return result.ok ? { ok: true as const } : { ok: false as const, reason: result.reason };
    },
    [],
  );

  const importBackup = useCallback((payload: unknown): void => {
    const next = restoreBackup(payload);
    setStocks(next);
  }, []);

  /* -------------------- Category mutators ----------------- */

  const addCategory = useCallback((name: string) => {
    const result = addCategoryToStorage(name);
    if (result.ok) {
      setCategories(result.categories);
      return { ok: true as const, category: result.created };
    }
    return { ok: false as const, reason: result.reason };
  }, []);

  const renameCategory = useCallback((id: string, newName: string) => {
    const result = renameCategoryInStorage(id, newName);
    if (!result.ok) return { ok: false as const, reason: result.reason };
    setCategories(result.categories);
    // Cascade the rename into existing stock records.
    const nextStocks = renameCalculatorCategory(result.oldName, result.newName);
    setStocks(nextStocks);
    return { ok: true as const };
  }, []);

  const deleteCategory = useCallback(
    (id: string) => {
      const result = deleteCategoryFromStorage(id, stocks);
      if (result.ok) {
        setCategories(result.categories);
        return { ok: true as const };
      }
      if (result.reason === 'missing') return { ok: false as const, reason: 'missing' as const };
      return { ok: false as const, reason: 'in_use' as const, usageCount: result.usageCount };
    },
    [stocks],
  );

  const categoryUsageCount = useCallback(
    (categoryName: string): number => countCategoryUsage(categoryName, stocks),
    [stocks],
  );

  /* -------------------- Maintenance ----------------------- */

  // Belt-and-braces: keep LocalStorage trimmed if someone clears state programmatically.
  useEffect(() => {
    if (!isLoading) saveStocks(stocks);
  }, [stocks, isLoading]);

  const value = useMemo<AppData>(
    () => ({
      stocks,
      isLoading,
      createStock,
      deleteStock,
      updateCalculator,
      addCalculatorToStock,
      importBackup,
      categories,
      addCategory,
      renameCategory,
      deleteCategory,
      categoryUsageCount,
    }),
    [
      stocks,
      isLoading,
      createStock,
      deleteStock,
      updateCalculator,
      addCalculatorToStock,
      importBackup,
      categories,
      addCategory,
      renameCategory,
      deleteCategory,
      categoryUsageCount,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
