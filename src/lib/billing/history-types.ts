/**
 * Neutral billing-history display type for the invoice/transaction history UI.
 * Provider-agnostic on purpose — populated from billing_provider_transactions,
 * which stores Mollie (active) and legacy provider historical rows.
 * Auroranexis sales invoices are linked separately via salesInvoiceId.
 */

/** Normalized transaction lifecycle status as persisted on billing_provider_transactions. */
export type BillingHistoryStatus =
  | "paid"
  | "payment_failed"
  | "canceled"
  | "pending"
  | "unknown";

export type BillingHistoryItem = {
  id: string;
  providerTransactionId: string;
  date: string | null;
  productName: string | null;
  status: BillingHistoryStatus;
  statusLabel: string;
  subtotalCents: number | null;
  taxCents: number | null;
  totalCents: number | null;
  currency: string;
  /** Coarse paid/unpaid flag for filtering — derived from `status`, not stored separately. */
  paymentStatus: "paid" | "unpaid";
  invoiceNumber: string | null;
  /** Auroranexis sales_invoices.id when an issued invoice exists for this payment. */
  salesInvoiceId: string | null;
  /** True when an Auroranexis sales invoice PDF can be downloaded. */
  hasSalesInvoicePdf: boolean;
  /** Stored Mollie/provider payment receipt URL (not a tax invoice). */
  paymentReceiptUrl: string | null;
  /** True when a Mollie/provider payment receipt URL is available. */
  hasPaymentReceipt: boolean;
  /**
   * @deprecated Prefer hasPaymentReceipt — historically meant Mollie receipt URL.
   * Kept for compatibility with openInvoicePdfAction callers.
   */
  invoicePdfUrl: string | null;
  /**
   * @deprecated Prefer hasPaymentReceipt / hasSalesInvoicePdf.
   * Historically true when a Mollie receipt URL existed.
   */
  hasPdfAvailable: boolean;
};

const STATUS_LABELS: Record<BillingHistoryStatus, string> = {
  paid: "Paid",
  payment_failed: "Payment failed",
  canceled: "Canceled",
  pending: "Pending",
  unknown: "Unknown",
};

/** Customer-safe label for a normalized billing-history status. */
export function getBillingHistoryStatusLabel(status: string | null | undefined): string {
  return STATUS_LABELS[normalizeBillingHistoryStatus(status)];
}

/** Narrow an arbitrary persisted status string to the known display set — never throws. */
export function normalizeBillingHistoryStatus(
  status: string | null | undefined,
): BillingHistoryStatus {
  switch ((status ?? "").trim().toLowerCase()) {
    case "paid":
      return "paid";
    case "payment_failed":
      return "payment_failed";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "pending":
      return "pending";
    default:
      return "unknown";
  }
}

export function derivePaymentStatus(status: BillingHistoryStatus): "paid" | "unpaid" {
  return status === "paid" ? "paid" : "unpaid";
}

/** Mollie/provider payment receipt URL availability (not Auroranexis tax PDF). */
export function hasPaymentReceiptForStatus(
  status: BillingHistoryStatus,
  receiptUrl?: string | null,
): boolean {
  return status === "paid" && Boolean(receiptUrl?.trim());
}

/** @deprecated Use hasPaymentReceiptForStatus — name historically meant Mollie receipt. */
export function hasPdfAvailableForStatus(
  status: BillingHistoryStatus,
  invoiceUrl?: string | null,
): boolean {
  return hasPaymentReceiptForStatus(status, invoiceUrl);
}

/** Authenticated download path for an issued Auroranexis sales invoice PDF. */
export function buildSalesInvoicePdfDownloadPath(salesInvoiceId: string): string {
  return `/api/billing/sales-invoices/${encodeURIComponent(salesInvoiceId)}/pdf`;
}
