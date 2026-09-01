/** Deterministic, filesystem-safe download name for archived original XML bytes. */

export function sanitizeInvoiceNumberForFilename(invoiceNumber: string): string {
  const trimmed = invoiceNumber.trim();
  const safe = trimmed.replaceAll(/[^A-Za-z0-9._-]/g, "_").slice(0, 80);
  return safe.length > 0 ? safe : "invoice";
}

export function buildArchivedEInvoiceDownloadFilename(input: {
  invoiceNumber: string;
  sha256Hex: string;
}): string {
  const number = sanitizeInvoiceNumberForFilename(input.invoiceNumber);
  const prefix = input.sha256Hex.slice(0, 12);
  return `archived-einvoice-${number}-${prefix}.xml`;
}

export function buildImmutableStorageObjectName(sha256Hex: string): string {
  return `${sha256Hex}.xml`;
}
