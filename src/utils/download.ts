/**
 * Tiny helper for triggering a "Save File" browser dialog from in-memory
 * data.  All export utilities (PDF / Excel / JSON) funnel through here so
 * the link lifecycle, MIME types and URL revocation stay in one spot.
 */

/** Trigger a download for the given Blob with the chosen filename. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    // Always revoke even if click() throws so we don't leak object URLs.
    URL.revokeObjectURL(url);
  }
}

/**
 * Filename-friendly date "YYYY-MM-DD" in the user's local timezone.  All
 * three exporters use the same format so files sort naturally side-by-side
 * in the user's Downloads folder.
 */
export function fileDateYmd(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
