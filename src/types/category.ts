/**
 * Calculator category - either one of the seed defaults or a user-added one.
 *
 * Stored under its own LocalStorage key so the list can be managed
 * independently of the stock data and seeded just once on first launch.
 */
export interface Category {
  id: string;
  name: string;
}

/**
 * Names that get materialised as categories the very first time the user
 * opens the app (or after a backup import that contains no category list).
 * Kept as a `const` array so we can also use it to detect "untouched seed
 * data" for friendlier UX if needed in future.
 */
export const DEFAULT_CATEGORY_NAMES = [
  'FX-991 EX',
  'FX-991 ES',
  'FX-991 CW',
  'FX-991 ES Original',
  'FX-991 MS 2',
] as const;
