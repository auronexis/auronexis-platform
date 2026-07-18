/**
 * Neutral billing-history display type for the invoice/transaction history UI.
 * Provider-agnostic on purpose — currently populated from Paddle transactions only.
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
  /** True when we can attempt paddle.transactions.getInvoicePDF for this row. */
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

/** Only completed/paid transactions have a Paddle-generated invoice to fetch. */
export function hasPdfAvailableForStatus(status: BillingHistoryStatus): boolean {
  return status === "paid";
}
