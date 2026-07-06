import type { CustomerInvoiceView } from "@/lib/billing/types";

export type BillingStatusTone = "success" | "warning" | "danger" | "neutral";

const USABLE_STATUSES = new Set(["active", "trialing"]);

const PAYMENT_PROBLEM_STATUSES = new Set([
  "past_due",
  "unpaid",
  "payment_failed",
  "requires_payment_method",
]);

const PAYMENT_PENDING_STATUSES = new Set([
  "incomplete",
  "incomplete_expired",
  "pending",
  "processing",
]);

const INACTIVE_STATUSES = new Set([
  "canceled",
  "cancelled",
  "inactive",
]);

/** Normalize Stripe / local subscription status strings for comparisons. */
export function normalizeSubscriptionStatus(status: string | null | undefined): string {
  const normalized = status?.trim().toLowerCase();
  if (!normalized) {
    return "inactive";
  }
  return normalized;
}

export function isSubscriptionUsable(status: string | null | undefined): boolean {
  return USABLE_STATUSES.has(normalizeSubscriptionStatus(status));
}

export function isSubscriptionInactive(status: string | null | undefined): boolean {
  const normalized = normalizeSubscriptionStatus(status);
  return INACTIVE_STATUSES.has(normalized) || normalized === "inactive";
}

export function isPaymentProblem(status: string | null | undefined): boolean {
  return PAYMENT_PROBLEM_STATUSES.has(normalizeSubscriptionStatus(status));
}

export function isPaymentPending(status: string | null | undefined): boolean {
  return PAYMENT_PENDING_STATUSES.has(normalizeSubscriptionStatus(status));
}

/** Customer-safe subscription status label for billing UI. */
export function getBillingStatusLabel(status: string | null | undefined): string {
  switch (normalizeSubscriptionStatus(status)) {
    case "active":
      return "Active";
    case "trialing":
      return "Trial";
    case "past_due":
      return "Payment overdue";
    case "unpaid":
      return "Payment unpaid";
    case "payment_failed":
      return "Payment failed";
    case "requires_payment_method":
      return "Payment method required";
    case "incomplete":
      return "Payment pending";
    case "incomplete_expired":
      return "Checkout expired";
    case "pending":
    case "processing":
      return "Payment processing";
    case "canceled":
    case "cancelled":
      return "Canceled";
    case "paused":
      return "Paused";
    case "inactive":
      return "No active subscription";
    default:
      return status?.trim() ? "Unknown billing status" : "No active subscription";
  }
}

export function getBillingStatusTone(status: string | null | undefined): BillingStatusTone {
  const normalized = normalizeSubscriptionStatus(status);

  if (USABLE_STATUSES.has(normalized)) {
    return "success";
  }

  if (PAYMENT_PROBLEM_STATUSES.has(normalized)) {
    return "danger";
  }

  if (PAYMENT_PENDING_STATUSES.has(normalized)) {
    return "warning";
  }

  return "neutral";
}

/** Payment summary label derived from subscription status (not invoice rows). */
export function getPaymentSummaryLabel(status: string | null | undefined): string {
  if (isSubscriptionUsable(status)) {
    return "Paid";
  }

  if (isPaymentProblem(status)) {
    return "Payment failed";
  }

  if (isPaymentPending(status)) {
    return "Payment pending";
  }

  if (isSubscriptionInactive(status)) {
    return "No payment on file";
  }

  return "No payment on file";
}

export function getPaymentSummaryTone(status: string | null | undefined): BillingStatusTone {
  if (isSubscriptionUsable(status)) {
    return "success";
  }

  if (isPaymentProblem(status)) {
    return "danger";
  }

  if (isPaymentPending(status)) {
    return "warning";
  }

  return "neutral";
}

export function billingStatusToneToBadge(
  tone: BillingStatusTone,
): "green" | "amber" | "red" | "slate" {
  switch (tone) {
    case "success":
      return "green";
    case "warning":
      return "amber";
    case "danger":
      return "red";
    default:
      return "slate";
  }
}

export function formatMoneyFromCents(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amountCents / 100);
}

export function shortenStripeId(value: string, visible = 10): string {
  if (value.length <= visible + 3) {
    return value;
  }
  return `${value.slice(0, visible)}…`;
}

/** Customer-safe invoice status for billing tables. */
export function getInvoiceDisplayLabel(invoice: CustomerInvoiceView): string {
  if (invoice.status === "open" && invoice.amountPaid === 0) {
    return "Open / unpaid";
  }

  if (invoice.status === "paid") {
    return "Paid";
  }

  if (invoice.status === "open") {
    return "Open";
  }

  if (invoice.status === "draft") {
    return invoice.isFuture ? "Upcoming" : "Draft";
  }

  if (invoice.status === "uncollectible") {
    return "Uncollectible";
  }

  if (invoice.status === "void") {
    return "Void";
  }

  return invoice.statusLabel;
}

export function getInvoiceStatusTone(invoice: CustomerInvoiceView): BillingStatusTone {
  if (invoice.status === "paid") {
    return "success";
  }

  if (invoice.status === "open") {
    return invoice.amountPaid > 0 ? "warning" : "warning";
  }

  if (invoice.status === "uncollectible") {
    return "danger";
  }

  if (invoice.status === "void") {
    return "neutral";
  }

  return "neutral";
}

export function findLatestOpenInvoice(
  invoices: CustomerInvoiceView[],
): CustomerInvoiceView | null {
  return (
    invoices.find(
      (invoice) =>
        invoice.status === "open" ||
        invoice.status === "draft" ||
        (invoice.status === "open" && invoice.amountPaid === 0),
    ) ?? null
  );
}

/** Whether the billing portal action should be offered in customer UI. */
export function canOpenBillingPortal(input: {
  canManage: boolean;
  portalAvailable: boolean;
  isUsable: boolean;
  hasPaymentProblem: boolean;
  isPaymentPending: boolean;
  stripeCustomerId: string | null | undefined;
}): boolean {
  if (!input.canManage || !input.portalAvailable) {
    return false;
  }

  if (input.isUsable || input.hasPaymentProblem || input.isPaymentPending) {
    return true;
  }

  return Boolean(input.stripeCustomerId);
}

export function isUnpaidInvoice(invoice: CustomerInvoiceView): boolean {
  return invoice.status === "open" || invoice.status === "draft" || invoice.status === "uncollectible";
}
