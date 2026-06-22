/**
 * PDF report exporter.
 *
 * Produces a print-ready summary of every stock batch plus a "Business
 * Summary" section at the top, using jsPDF + jspdf-autotable.  The layout
 * is intentionally simple (Helvetica, A4 portrait) so it renders correctly
 * on mobile PDF viewers without any custom fonts.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { StockBatch } from '@/types/stock';
import { profit } from '@/types/stock';
import { markBackupNow } from '@/utils/backupMeta';
import { downloadBlob, fileDateYmd } from '@/utils/download';
import { formatDisplayDate, formatMoney } from '@/utils/format';
import { summarizeAllStocks } from '@/utils/storage';

export interface ExportPdfOptions {
  stocks: StockBatch[];
  /** Optional human-friendly title; defaults to "Calculator Stock Report". */
  title?: string;
}

/** Trigger a PDF download.  Also marks "last backup" so Settings stays accurate. */
export function exportPdf({ stocks, title = 'Calculator Stock Report' }: ExportPdfOptions): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;

  const totals = summarizeAllStocks(stocks);
  const exportedAt = new Date();

  // ------------------------------------------------------------------ Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, margin, margin + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated: ${formatPdfDateTime(exportedAt)}`, margin, margin + 22);

  // Underline rule
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.6);
  doc.line(margin, margin + 30, pageWidth - margin, margin + 30);

  // ------------------------------------------------------- Business Summary
  const summaryRows: Array<[string, string]> = [
    ['Total Stocks', String(totals.totalStocks)],
    ['Total Quantity', String(totals.quantity)],
    ['Total Sold Quantity', String(totals.sold)],
    ['Total Paid Quantity', String(totals.paid)],
    ['Total Pending Quantity', String(totals.pendingQty)],
    ['Total Inventory Cost', formatMoney(totals.totalCost)],
    ['Total Revenue Potential', formatMoney(totals.totalRevenuePotential)],
    ['Total Sold Revenue', formatMoney(totals.totalSoldRevenue)],
    ['Total Profit', formatMoney(totals.totalProfit)],
    ['Total Pending Supplier Payment', formatMoney(totals.totalPendingPayment)],
  ];

  autoTable(doc, {
    startY: margin + 44,
    head: [['Business Summary', 'Value']],
    body: summaryRows,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 6, textColor: [30, 41, 59] },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 240 },
      1: { halign: 'right' },
    },
  });

  // ---------------------------------------------------------- Stock Details
  const detailRows = buildStockDetailRows(stocks);
  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  const detailsStartY = (lastTable?.finalY ?? margin + 44) + 24;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Stock Details', margin, detailsStartY - 8);

  if (detailRows.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('No stock batches recorded yet.', margin, detailsStartY + 10);
  } else {
    autoTable(doc, {
      startY: detailsStartY,
      head: [
        [
          'Date',
          'Category',
          'Qty',
          'Sold',
          'Paid',
          'Buying',
          'Selling',
          'Profit',
        ],
      ],
      body: detailRows,
      margin: { left: margin, right: margin },
      theme: 'striped',
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 100 },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
      },
      // Use auto page breaks; ensure header repeats on each new page.
      showHead: 'everyPage',
    });
  }

  // ------------------------------------------------------------------ Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    const footerY = pageHeight - margin / 2;
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
    doc.text('Calculator Stock Tracker', margin, footerY);
  }

  const blob = doc.output('blob');
  downloadBlob(blob, `calculator-stock-report-${fileDateYmd()}.pdf`);
  markBackupNow();
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Flatten every calculator across every batch into one row per item so the
 * table reads top-to-bottom in chronological-ish order (newest first, the
 * order they're stored in).
 */
function buildStockDetailRows(stocks: StockBatch[]): string[][] {
  const rows: string[][] = [];
  for (const batch of stocks) {
    if (batch.calculators.length === 0) {
      rows.push([
        formatDisplayDate(batch.date),
        '—',
        '0',
        '0',
        '0',
        formatMoney(0),
        formatMoney(0),
        formatMoney(0),
      ]);
      continue;
    }
    for (const calc of batch.calculators) {
      rows.push([
        formatDisplayDate(batch.date),
        calc.category || '—',
        String(calc.quantity),
        String(calc.soldQuantity),
        String(calc.paidQuantity),
        formatMoney(calc.buyingPrice),
        formatMoney(calc.sellingPrice),
        formatMoney(profit(calc)),
      ]);
    }
  }
  return rows;
}

function formatPdfDateTime(d: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()] ?? ''} ${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
