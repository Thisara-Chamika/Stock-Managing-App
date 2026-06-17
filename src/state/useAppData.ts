import { useContext } from 'react';

import { AppDataContext, type AppData } from './AppDataContext';

/**
 * Consume the app-wide stocks + categories store.  Must be used inside
 * the `<AppDataProvider>` that wraps the routes in `App.tsx`.
 */
export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used inside <AppDataProvider>');
  }
  return ctx;
}
