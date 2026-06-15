import { useCallback, useEffect, useState } from 'react';

/**
 * Generic LocalStorage-backed state hook.
 *
 * - Initial value is read synchronously so the first render already shows the
 *   persisted data (no "flash of empty state").
 * - Writes are wrapped in try/catch because LocalStorage can throw in private
 *   browsing mode or when the quota is exceeded.
 * - Listens to the "storage" event so multiple open tabs stay in sync.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialValue;
      return JSON.parse(raw) as T;
    } catch (error) {
      console.warn(`useLocalStorage: failed to read "${key}"`, error);
      return initialValue;
    }
  }, [key, initialValue]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch (error) {
          console.warn(`useLocalStorage: failed to write "${key}"`, error);
        }
        return next;
      });
    },
    [key],
  );

  // Stay in sync across tabs / windows.
  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key !== key) return;
      setStoredValue(readValue());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, readValue]);

  return [storedValue, setValue];
}
