# Calculator Stock Tracker

A small, mobile-first web app for tracking calculator stock batches, sales, and
supplier payments. Designed for a single user (calculator reseller) on
iPhone 12 Pro / 12 Pro Max sized screens, but works on any Android phone or
desktop browser as well.

> No accounts, no servers, no cloud — all data stays on the device in
> LocalStorage. Use **Export Backup** to keep a JSON copy you can re-import
> later.

---

## Features

- **Dashboard** — landing page with global analytics: total stocks,
  quantities, sold revenue, profit, pending supplier payment, inventory
  cost, revenue potential, and quick-action links.
- **Profit tracking** — realised profit is computed per item and per batch
  as `soldQuantity × (sellingPrice − buyingPrice)` and rolled up on the
  dashboard.
- **Stock batches** — record every purchase from your supplier with a date.
- **Multiple calculator items per batch** — add as many calculators as the
  batch contains. Each item carries its own category, quantity, buying price
  and selling price.
- **Add more items later** — forgot something? Open the batch and use
  *+ Add Calculator* on the detail page.
- **Manage Categories** — the predefined `FX-991 EX / ES / CW / ES Original
  / MS 2` are seeded automatically; add, rename or delete your own
  (e.g. `FX-570 ES`, `Citizen CT-500`).  Renames cascade across existing
  stock records; deletion is blocked while a category is still in use.
- **Sold / paid quantity tracking** — `+` / `−` controls that can never
  exceed in-stock or sold respectively.
- **Have-to-pay** — always computed as `sold − paid`, never stored, so totals
  can never drift out of sync.
- **Financial breakdown per item** — stock cost, revenue potential, sold
  revenue, profit, and pending supplier payment, all computed live.
- **Duplicate-category guard** — the same calculator model cannot appear
  twice in a single batch.
- **Backup / Restore** — export everything as JSON; re-import to replace the
  current data after a confirmation prompt.
- **Auto-migration** — old data from previous versions is upgraded on first
  load with no manual steps and no crashes.
- **Installable PWA** — works fully offline, opens from the home screen,
  full-screen on iOS / Android.
- **Delete batch** — with a confirmation modal so it can't be done by accident.
- **Mobile-first UI** — capped at 430 px wide, centred on larger screens,
  rounded white cards, soft shadows, large touch targets, bottom tab nav,
  sticky FAB.
- **Empty + loading states** — friendly placeholders while data hydrates and
  when the list is empty.
- **TypeScript strict mode** throughout.

## Tech stack

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 5](https://vitejs.dev/) for the dev server / build
- [TailwindCSS 3](https://tailwindcss.com/) for styling
- [react-router-dom 6](https://reactrouter.com/) (HashRouter) for navigation
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + Workbox for the
  service worker and offline precaching
- Browser **LocalStorage** for persistence
- ESLint + typescript-eslint for linting
- `gh-pages` for one-command deployment

No Redux. A single React Context (`AppDataProvider`) owns stocks and
categories together so the cascade-rename operation can update both
atomically.

## Project structure

```
src/
  components/
    BottomNav.tsx           Bottom tab bar (Dashboard / Stocks)
    Button.tsx
    CalculatorTabs.tsx
    ConfirmDialog.tsx
    EmptyState.tsx
    FloatingActionButton.tsx
    InstallPromptCard.tsx   PWA install button + iOS instructions
    QuantityControl.tsx
    StockCard.tsx
    SummaryCard.tsx
    TopBar.tsx
  hooks/
    useLocalStorage.ts
  pages/
    AddCalculatorPage.tsx   Append an item to an existing batch
    CreateStockPage.tsx
    DashboardPage.tsx
    ManageCategoriesPage.tsx
    StockDetailPage.tsx
    StockListPage.tsx
  state/
    AppDataContext.ts       Context + AppData interface
    AppDataProvider.tsx     Single source of truth for stocks + categories
    useAppData.ts           Consumer hook
  types/
    category.ts
    stock.ts
  utils/
    categoryStorage.ts      LocalStorage CRUD for categories
    format.ts
    storage.ts              LocalStorage CRUD for stocks + migration
  App.tsx
  main.tsx
  index.css
```

## Data model

```ts
interface Calculator {
  id: string;
  category: string;        // matches one of the entries in the Category list
  quantity: number;        // bought from supplier
  soldQuantity: number;    // 0 .. quantity
  paidQuantity: number;    // 0 .. soldQuantity
  buyingPrice: number;     // LKR per unit, > 0
  sellingPrice: number;    // LKR per unit, > 0
}

interface StockBatch {
  id: string;
  date: string;            // ISO YYYY-MM-DD
  createdAt: number;       // epoch millis (used for newest-first sort)
  calculators: Calculator[];  // one or more items, unique category per batch
}

interface Category {
  id: string;
  name: string;            // shown in dropdowns and tabs
}

// Derived (never stored):
haveToPay              = soldQuantity - paidQuantity;
stockCost              = quantity     * buyingPrice;
revenuePotential       = quantity     * sellingPrice;
soldRevenue            = soldQuantity * sellingPrice;
profit                 = soldQuantity * (sellingPrice - buyingPrice);
pendingSupplierPayment = haveToPay    * buyingPrice;
```

LocalStorage keys:

| Key                  | Value                                          |
|----------------------|------------------------------------------------|
| `cst.stocks.v1`      | JSON array of `StockBatch`                     |
| `cst.categories.v1`  | JSON array of `Category` (seeded on first run) |

### Migration of legacy data

Previous versions stored a fixed 3-item shape with a `name` field and no
prices. On read, `getStocks()` pipes every record through `migrateStocks()`
which:

- copies the old `name` into the new `category` field,
- defaults `buyingPrice` and `sellingPrice` to `0`,
- writes the upgraded shape back to LocalStorage so future loads are fast.

Old backup JSON files import successfully too — the same migrator runs on the
parsed payload before it replaces the live data. Items with `Rs 0` prices are
simply legacy records that pre-date the financial tracking feature.

### Category cascade-rename

`Calculator.category` is stored as the human-readable name string (not a
foreign key) so backups stay readable and round-trip without a separate
join. When the user renames a category in **Manage Categories**, the
provider also rewrites every calculator that referenced the old name so
the dropdown and the stock records never go out of sync. Deletion is
blocked while a category is still referenced anywhere.

## Installation

Requires Node.js **18+** (Node 20 LTS recommended).

```bash
git clone https://github.com/Thisara-Chamika/Stock-Managing-App.git
cd Stock-Managing-App
npm install
```

## Development

```bash
npm run dev       # start the Vite dev server at http://127.0.0.1:5300
npm run lint      # ESLint
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build locally at http://127.0.0.1:4300
```

### Troubleshooting: `EACCES: permission denied` on Windows

If `npm run dev` fails with something like
`Error: listen EACCES: permission denied 127.0.0.1:5173`, Windows has
reserved that port range (usually because Hyper-V or WSL is installed).

List the reserved ranges in PowerShell:

```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
```

To work around it, simply pick a free port — `vite.config.ts` already
defaults to `5300` (dev) and `4300` (preview) which sit outside the typical
Hyper-V exclusion ranges. If those happen to be reserved on your machine,
either edit `vite.config.ts` or override at the CLI:

```bash
npm run dev -- --port 5400 --host 127.0.0.1
```

As a deeper fix you can also reset the Windows NAT service (admin
PowerShell):

```powershell
net stop winnat
net start winnat
```

## Installable PWA

The app ships as a Progressive Web App with offline support:

- **Manifest** declares `display: standalone`, `orientation: portrait`,
  brand theme color and a full icon set (64, 192, 512, maskable, plus an
  Apple touch icon).
- **Service worker** (Workbox via `vite-plugin-pwa`) precaches every
  static asset, including HTML, JS, CSS, SVG and PNG icons (~246 KB).
- **`registerType: 'autoUpdate'`** so a new build silently replaces the
  cached version after a reload, no manual cache-busting needed.
- An **Install App** card on the Dashboard listens for Chrome / Android's
  `beforeinstallprompt` event and surfaces a Tap-to-Install button.
  On iPhone (which never fires that event) the same card shows the
  *Share → Add to Home Screen* steps inline.

After installation:

- Opens from the home screen icon in full-screen mode (no Safari chrome).
- Works with no network: every page, the create flow, the dashboard,
  category management and backup export still function.

If you want to iterate on the SW locally, flip `devOptions.enabled` to
`true` in `vite.config.ts`.

### Regenerating the PWA icons

The icons under `public/` are generated from `public/favicon.svg`. If you
change the SVG, regenerate the icons with:

```bash
npm run generate-pwa-assets
```

## Deploying to GitHub Pages

1. The code lives at
   [`Thisara-Chamika/Stock-Managing-App`](https://github.com/Thisara-Chamika/Stock-Managing-App).
2. In `vite.config.ts` the production `base` defaults to
   `/Stock-Managing-App/`. If you fork the repo under a different name, set
   the `VITE_BASE` environment variable when building, e.g.

   ```bash
   VITE_BASE=/my-repo-name/ npm run build
   ```

3. Install the deploy helper once: it's already in `devDependencies`.
4. Deploy:

   ```bash
   npm run deploy
   ```

   This runs `npm run build` and pushes the resulting `dist/` folder to a
   `gh-pages` branch using the [`gh-pages`](https://github.com/tschaub/gh-pages)
   CLI.

5. In your repository on GitHub go to **Settings → Pages** and select the
   `gh-pages` branch as the source.  The app will then be live at
   <https://thisara-chamika.github.io/Stock-Managing-App/>.

The app uses a `HashRouter`, so deep links (e.g. `#/stock/abc123`) work on
GitHub Pages without any extra server configuration. A `public/404.html`
fallback is included as belt-and-braces for users who land on an unknown
path.

## Git workflow

The project is structured to support a small team using a feature-branch
workflow on GitHub.

Branch naming convention:

```
feature/create-stock-page
feature/stock-detail-page
feature/local-storage
feature/export-import
feature/delete-stock
feature/mobile-ui
fix/local-storage-bug
fix/calculation-error
```

Commit message examples (Conventional Commits):

```
feat: create stock list page
feat: add stock creation form
feat: implement local storage persistence
feat: add export and import backup feature
fix:  prevent paid quantity exceeding sold quantity
refactor: extract quantity control component
```

## License

MIT — do whatever you like.
