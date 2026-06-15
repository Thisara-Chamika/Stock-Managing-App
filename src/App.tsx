import { Navigate, Route, Routes } from 'react-router-dom';

import { useStocks } from '@/hooks/useStocks';
import { CreateStockPage } from '@/pages/CreateStockPage';
import { StockDetailPage } from '@/pages/StockDetailPage';
import { StockListPage } from '@/pages/StockListPage';

/**
 * Top-level application shell.  Centres the phone-sized column on larger
 * screens (max 430px) and routes between the 3 pages.
 *
 * State is owned at this level via `useStocks` and passed down as props so
 * we avoid pulling in a global state library or React Context for a single
 * tiny data set.
 */
export default function App(): JSX.Element {
  const { stocks, isLoading, createStock, deleteStock, updateCalculator, importBackup } = useStocks();

  return (
    <div className="mx-auto min-h-screen w-full max-w-app bg-slate-100 px-4 pb-6">
      <Routes>
        <Route
          path="/"
          element={<StockListPage stocks={stocks} isLoading={isLoading} onImport={importBackup} />}
        />
        <Route path="/create" element={<CreateStockPage onCreate={createStock} />} />
        <Route
          path="/stock/:id"
          element={
            <StockDetailPage
              stocks={stocks}
              onUpdateCalculator={updateCalculator}
              onDelete={deleteStock}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
