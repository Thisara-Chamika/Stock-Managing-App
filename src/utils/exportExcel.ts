/**
 * Excel report exporter (.xlsx).
 *
 * Builds a single "Stock Report" sheet that opens with a compact summary
 * block followed by one row per calculator item across every stock batch.
 * Built with the `xlsx` (SheetJS) library which produces a real .xlsx file
 * with proper data types so the user can sort / pivot in Excel without
 * extra cleanup.
 */

import * as XLSX from 'xlsx';

import type { StockBatch } from '@/types/stock';
import { pendingSupplierPayment, profit, soldRevenue, stockCost } from '@/types/stock';
import { markBackupNow } from '@/utils/backupMeta';
import { downloadBlob, fileDateYmd } from '@/utils/download';
import { summarizeAllStocks } from '@/utils/storage';

export interface ExportExcelOptions {
  stocks: StockBatch[];
}

const SHEET_NAME = 'Stock Report';
const SUMMARY_TITLE = 'Calculator Stock Report — Summary';

interface DetailRow {
  'Stock Date': string;
  Category: string;
  Quantity: number;
  'Sold Quantity': number;
  'Paid Quantity': number;
  'Buying Price': number;
  'Selling Price': number;
  'Stock Cost': number;
  'Sold Revenue': number;
  Profit: number;
  'Pending Supplier Payment': number;
}

const DETAIL_HEADERS: (keyof DetailRow)[] = [
  'Stock Date',
  'Category',
  'Quantity',
  'Sold Quantity',
  'Paid Quantity',
  'Buying Price',
  'Selling Price',
  'Stock Cost',
  'Sold Revenue',
  'Profit',
  'Pending Supplier Payment',
];

/** Trigger an .xlsx download.  Also marks "last backup" so Settings stays accurate. */
export function exportExcel({ stocks }: ExportExcelOptions): void {
  const totals = summarizeAllStocks(stocks);
  const exportedAt = new Date();

  // ----- Build summary header block (array of arrays) -----
  const summaryBlock: (string | number)[][] = [
    [SUMMARY_TITLE],
    [`Generated: ${exportedAt.toISOString()}`],
    [],
    ['Metric', 'Value'],
    ['Total Stocks', totals.totalStocks],
    ['Total Quantity', totals.quantity],
    ['Total Sold Quantity', totals.sold],
    ['Total Paid Quantity', totals.paid],
    ['Total Pending Quantity', totals.pendingQty],
    ['Total Inventory Cost', totals.totalCost],
    ['Total Revenue Potential', totals.totalRevenuePotential],
    ['Total Sold Revenue', totals.totalSoldRevenue],
    ['Total Profit', totals.totalProfit],
    ['Total Pending Supplier Payment', totals.totalPendingPayment],
    [],
    ['Stock Details'],
  ];

  // Sheet is built from the summary array.  We'll then append the detail
  // table (with its own header row) starting on the next free row.
  const sheet = XLSX.utils.aoa_to_sheet(summaryBlock);

  const detailRows = buildDetailRows(stocks);
  XLSX.utils.sheet_add_json(sheet, detailRows, {
    header: DETAIL_HEADERS,
    origin: { r: summaryBlock.length, c: 0 },
  });

  // Reasonable column widths so the user doesn't see "#####".
  sheet['!cols'] = [
    { wch: 14 }, // Stock Date
    { wch: 24 }, // Category
    { wch: 10 }, // Quantity
    { wch: 14 }, // Sold Quantity
    { wch: 14 }, // Paid Quantity
    { wch: 14 }, // Buying Price
    { wch: 14 }, // Selling Price
    { wch: 14 }, // Stock Cost
    { wch: 14 }, // Sold Revenue
    { wch: 12 }, // Profit
    { wch: 24 }, // Pending Supplier Payment
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, SHEET_NAME);

  // SheetJS returns an ArrayBuffer; wrap it in a Blob with the official
  // .xlsx MIME type so the browser opens the right Save dialog.
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  downloadBlob(blob, `calculator-stock-report-${fileDateYmd()}.xlsx`);
  markBackupNow();
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function buildDetailRows(stocks: StockBatch[]): DetailRow[] {
  const rows: DetailRow[] = [];
  for (const batch of stocks) {
    if (batch.calculators.length === 0) continue;
    for (const calc of batch.calculators) {
      rows.push({
        'Stock Date': batch.date,
        Category: calc.category || '—',
        Quantity: calc.quantity,
        'Sold Quantity': calc.soldQuantity,
        'Paid Quantity': calc.paidQuantity,
        'Buying Price': calc.buyingPrice,
        'Selling Price': calc.sellingPrice,
        'Stock Cost': stockCost(calc),
        'Sold Revenue': soldRevenue(calc),
        Profit: profit(calc),
        'Pending Supplier Payment': pendingSupplierPayment(calc),
      });
    }
  }
  return rows;
}
