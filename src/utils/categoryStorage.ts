/**
 * LocalStorage persistence for calculator categories.
 *
 * The category list is the source-of-truth for the dropdowns on every form,
 * and it is seeded on first launch with the five canonical FX-991 entries.
 * The user can add, rename and delete categories from the Manage Categories
 * page; renames cascade through every stock record so referential integrity
 * is preserved (calc.category stores the name string, not an id).
 */

import { type Category, DEFAULT_CATEGORY_NAMES } from '@/types/category';
import type { StockBatch } from '@/types/stock';
import { createId } from '@/utils/storage';

const STORAGE_KEY = 'cst.categories.v1';

/** Read the category list (creating defaults the first time we run). */
export function getOrSeedCategories(): Category[] {
  const existing = readCategories();
  if (existing.length > 0) return existing;
  const seeded = DEFAULT_CATEGORY_NAMES.map<Category>((name) => ({ id: createId(), name }));
  saveCategories(seeded);
  return seeded;
}

/** Plain read - returns `[]` when storage is empty (used by tests). */
export function readCategories(): Category[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCategory);
  } catch (error) {
    console.error('Failed to read categories from LocalStorage', error);
    return [];
  }
}

export function saveCategories(categories: Category[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Failed to write categories to LocalStorage', error);
  }
}

/**
 * Add a new category.  Names are unique and case-insensitive to avoid
 * the user accidentally typing "fx-991 ex" alongside the existing
 * "FX-991 EX" entry.
 */
export function addCategoryToStorage(
  name: string,
): { ok: true; categories: Category[]; created: Category } | { ok: false; reason: 'empty' | 'duplicate' } {
  const trimmed = name.trim();
  if (trimmed === '') return { ok: false, reason: 'empty' };
  const existing = readCategories();
  if (existing.some((c) => sameName(c.name, trimmed))) {
    return { ok: false, reason: 'duplicate' };
  }
  const created: Category = { id: createId(), name: trimmed };
  const next = [...existing, created];
  saveCategories(next);
  return { ok: true, categories: next, created };
}

/**
 * Rename a category by id.  Returns the new category list plus the old/new
 * names so the caller can cascade the change into stock records.
 */
export function renameCategoryInStorage(
  id: string,
  newName: string,
): { ok: true; categories: Category[]; oldName: string; newName: string } | { ok: false; reason: 'empty' | 'duplicate' | 'missing' } {
  const trimmed = newName.trim();
  if (trimmed === '') return { ok: false, reason: 'empty' };
  const existing = readCategories();
  const target = existing.find((c) => c.id === id);
  if (!target) return { ok: false, reason: 'missing' };
  if (sameName(target.name, trimmed)) {
    // No-op rename; treat as success without writing.
    return { ok: true, categories: existing, oldName: target.name, newName: target.name };
  }
  if (existing.some((c) => c.id !== id && sameName(c.name, trimmed))) {
    return { ok: false, reason: 'duplicate' };
  }
  const next = existing.map((c) => (c.id === id ? { ...c, name: trimmed } : c));
  saveCategories(next);
  return { ok: true, categories: next, oldName: target.name, newName: trimmed };
}

/**
 * Delete a category, but only when it is not referenced by any stock.
 * The caller passes in the current stock list so we don't have to import
 * storage.ts here (avoids a circular dependency).
 */
export function deleteCategoryFromStorage(
  id: string,
  stocks: StockBatch[],
): { ok: true; categories: Category[] } | { ok: false; reason: 'in_use'; usageCount: number } | { ok: false; reason: 'missing' } {
  const existing = readCategories();
  const target = existing.find((c) => c.id === id);
  if (!target) return { ok: false, reason: 'missing' };
  const usageCount = countCategoryUsage(target.name, stocks);
  if (usageCount > 0) return { ok: false, reason: 'in_use', usageCount };
  const next = existing.filter((c) => c.id !== id);
  saveCategories(next);
  return { ok: true, categories: next };
}

/** Number of calculator items across all batches that use the given name. */
export function countCategoryUsage(categoryName: string, stocks: StockBatch[]): number {
  let count = 0;
  for (const batch of stocks) {
    for (const calc of batch.calculators) {
      if (sameName(calc.category, categoryName)) count += 1;
    }
  }
  return count;
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<Category>;
  return typeof v.id === 'string' && typeof v.name === 'string';
}

export const __test__ = { STORAGE_KEY };
