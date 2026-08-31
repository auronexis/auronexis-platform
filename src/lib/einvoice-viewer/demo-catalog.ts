/**
 * Certified demo catalog (no filesystem I/O).
 */

export const EINVOICE_VIEWER_DEMO_IDS = ["de-b2b", "eu-rc"] as const;
export type EInvoiceViewerDemoId = (typeof EINVOICE_VIEWER_DEMO_IDS)[number];

export const EINVOICE_VIEWER_DEMO_META: Record<
  EInvoiceViewerDemoId,
  { label: string; filename: string; invoiceNumber: string }
> = {
  "de-b2b": {
    label: "DE B2B – 19% VAT",
    filename: "TEST-EINV-2026-000001.xml",
    invoiceNumber: "TEST-EINV-2026-000001",
  },
  "eu-rc": {
    label: "EU B2B – Reverse Charge",
    filename: "TEST-EINV-RC-2026-000001.xml",
    invoiceNumber: "TEST-EINV-RC-2026-000001",
  },
};

export function resolveEInvoiceViewerDemoId(
  value: string | null | undefined,
): EInvoiceViewerDemoId {
  return value === "eu-rc" ? "eu-rc" : "de-b2b";
}

export function isEInvoiceViewerPreviewAllowed(): boolean {
  // Prefer local/dev. Never expose demo XML surfaces on Vercel production.
  if (process.env.VERCEL_ENV === "production") {
    return false;
  }
  if (process.env.NODE_ENV === "production") {
    return process.env.EINVOICE_VIEWER_DEV_PREVIEW === "1";
  }
  return true;
}
