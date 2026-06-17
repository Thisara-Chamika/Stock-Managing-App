import { Navigate, Route, Routes } from 'react-router-dom';

import { BottomNav } from '@/components/BottomNav';
import { AddCalculatorPage } from '@/pages/AddCalculatorPage';
import { CreateStockPage } from '@/pages/CreateStockPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ManageCategoriesPage } from '@/pages/ManageCategoriesPage';
import { StockDetailPage } from '@/pages/StockDetailPage';
import { StockListPage } from '@/pages/StockListPage';
import { AppDataProvider } from '@/state/AppDataProvider';

/**
 * Top-level application shell.  Centres the phone-sized column on larger
 * screens (max 430px), wraps every page in the shared data provider, and
 * pins the bottom tab bar.
 */
export default function App(): JSX.Element {
  return (
    <AppDataProvider>
      <div className="mx-auto min-h-screen w-full max-w-app bg-slate-100 px-4 pb-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/stocks" element={<StockListPage />} />
          <Route path="/create" element={<CreateStockPage />} />
          <Route path="/stock/:id" element={<StockDetailPage />} />
          <Route path="/stock/:id/add" element={<AddCalculatorPage />} />
          <Route path="/categories" element={<ManageCategoriesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </AppDataProvider>
  );
}
