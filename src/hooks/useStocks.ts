import { useCallback, useEffect, useState } from 'react';

import type { Calculator, StockBatch } from '@/types/stock';
import {
  createStock as createStockInStorage,
  deleteStock as deleteStockInStorage,
  getStocks,
  restoreBackup,
  saveStocks,
  updateCalculator as updateCalculatorInStorage,
} from '@/utils/storage';

/**
 * Single source of truth for the stock list across the app.
 *
 * Each mutation writes through to LocalStorage immediately (as required by the
 * spec) and then updates React state so the UI re-renders.
 */
export function useStocks() {
  const [stocks, setStocks] = useState<StockBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initial hydrate.  Wrapped in useEffect so the first paint shows the
  // "loading" skeleton instead of a flash of empty state.
  useEffect(() => {
    setStocks(getStocks());
    setIsLoading(false);
  }, []);

  // Keep this tab in sync if another tab modifies storage.
  useEffect(() => {
    const onStorage = (): void => setStocks(getStocks());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const create = useCallback((date: string, quantities: [number, number, number]): StockBatch => {
    const batch = createStockInStorage({ date, quantities });
    setStocks((prev) => [batch, ...prev]);
    return batch;
  }, []);

  const remove = useCallback((stockId: string): void => {
    const next = deleteStockInStorage(stockId);
    setStocks(next);
  }, []);

  const updateCalc = useCallback(
    (stockId: string, calculatorId: string, patch: Partial<Pick<Calculator, 'soldQuantity' | 'paidQuantity'>>): void => {
      const next = updateCalculatorInStorage(stockId, calculatorId, patch);
      setStocks(next);
    },
    [],
  );

  const importBackup = useCallback((payload: unknown): void => {
    const next = restoreBackup(payload);
    setStocks(next);
  }, []);

  const replaceAll = useCallback((next: StockBatch[]): void => {
    saveStocks(next);
    setStocks(next);
  }, []);

  return {
    stocks,
    isLoading,
    createStock: create,
    deleteStock: remove,
    updateCalculator: updateCalc,
    importBackup,
    replaceAll,
  } as const;
}
