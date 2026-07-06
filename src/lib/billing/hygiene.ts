import type { PlanKey } from "@/lib/billing/plans";
import {
  getBillingStatusLabel,
  getInvoiceDisplayLabel,
  isSubscriptionInactive,
  normalizeSubscriptionStatus,
} from "@/lib/billing/status";
import type { CustomerInvoiceView } from "@/lib/billing/types";
import type {
  BillingEvent,
  OrganizationSubscription,
  StripeWebhookEvent,
} from "@/types/database";

export type BillingHygieneSeverity = "info" | "warning" | "danger";

export type BillingHygieneFlag = {
  code: string;
  severity: BillingHygieneSeverity;
  message: string;
  entityType: "subscription" | "invoice" | "webhook" | "billing_event" | "organization";
  entityId?: string;
};

export type BillingRowKind = "production" | "stale" | "demo" | "internal" | "inconsistent" | "unknown";

const STALE_SUBSCRIPTION_AGE_MS = 90 * 24 * 60 * 60 * 1000;

const BILLABLE_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "incomplete"]);

/** Customer-safe webhook processing label for diagnostics UI. */
export function getWebhookEventStatusLabel(
  status: StripeWebhookEvent["status"] | string | null | undefined,
): string {
  switch (status) {
    case "processed":
      return "Processed webhook";
    case "duplicate":
      return "Duplicate webhook";
    case "failed":
      return "Failed webhook";
    case "processing":
      return "Processing webhook";
    default:
      return status?.trim() ? `Webhook: ${status}` : "Unknown webhook status";
  }
}

/** Subscription row classification — identification only, never deletes data. */
export function classifySubscriptionRow(
  subscription: OrganizationSubscription | null,
  options?: { mappedPlanKey?: PlanKey | null; devPlanOverride?: boolean },
): BillingRowKind {
  if (!subscription) {
    return "internal";
  }

  const status = normalizeSubscriptionStatus(subscription.status);

  if (options?.devPlanOverride) {
    return "demo";
  }

  if (
    BILLABLE_STATUSES.has(status) &&
    (!subscription.stripe_customer_id || !subscription.stripe_subscription_id)
  ) {
    return "inconsistent";
  }

  if (
    isSubscriptionInactive(status) &&
    !subscription.stripe_subscription_id &&
    !subscription.stripe_customer_id
  ) {
    return "internal";
  }

  if (isStaleSubscriptionRow(subscription)) {
    return "stale";
  }

  if (subscription.stripe_price_id && options?.mappedPlanKey === null) {
    return "inconsistent";
  }

  if (subscription.stripe_customer_id || subscription.stripe_subscription_id) {
    return "production";
  }

  return "unknown";
}

export function isStaleSubscriptionRow(subscription: OrganizationSubscription): boolean {
  const status = normalizeSubscriptionStatus(subscription.status);

  if (!isSubscriptionInactive(status)) {
    return false;
  }

  if (subscription.stripe_subscription_id) {
    return false;
  }

  const updatedAt = subscription.updated_at ? new Date(subscription.updated_at).getTime() : 0;
  if (!updatedAt) {
    return false;
  }

  return Date.now() - updatedAt > STALE_SUBSCRIPTION_AGE_MS;
}

export function classifyInvoiceRow(invoice: CustomerInvoiceView): BillingRowKind {
  if (invoice.status === "void") {
    return "stale";
  }

  if (invoice.status === "draft" && invoice.isFuture) {
    return "internal";
  }

  if (invoice.status === "open" || invoice.status === "paid") {
    return "production";
  }

  if (invoice.status === "uncollectible") {
    return "stale";
  }

  return "unknown";
}

export function classifyWebhookEventRow(event: StripeWebhookEvent): BillingRowKind {
  if (event.status === "duplicate") {
    return "internal";
  }

  if (event.status === "failed") {
    return "inconsistent";
  }

  return "production";
}

export function getSubscriptionHygieneLabel(subscription: OrganizationSubscription | null): string {
  if (!subscription) {
    return "No subscription row";
  }

  return getBillingStatusLabel(subscription.status);
}

export function getInvoiceHygieneLabel(invoice: CustomerInvoiceView): string {
  return getInvoiceDisplayLabel(invoice);
}

export function collectSubscriptionHygieneFlags(
  subscription: OrganizationSubscription | null,
  options?: { mappedPlanKey?: PlanKey | null; devPlanOverride?: boolean },
): BillingHygieneFlag[] {
  const flags: BillingHygieneFlag[] = [];

  if (!subscription) {
    flags.push({
      code: "subscription_missing",
      severity: "info",
      message: "No organization_subscriptions row exists for this workspace.",
      entityType: "subscription",
    });
    return flags;
  }

  const kind = classifySubscriptionRow(subscription, options);

  if (kind === "demo") {
    flags.push({
      code: "dev_plan_override",
      severity: "info",
      message: "Development plan override is active — Stripe rows may not reflect live billing.",
      entityType: "subscription",
      entityId: subscription.id,
    });
  }

  if (kind === "stale") {
    flags.push({
      code: "stale_subscription_row",
      severity: "info",
      message:
        "Subscription row appears stale (inactive/canceled with no Stripe subscription id for 90+ days).",
      entityType: "subscription",
      entityId: subscription.id,
    });
  }

  if (kind === "internal") {
    flags.push({
      code: "internal_placeholder_row",
      severity: "info",
      message: "Placeholder subscription row with no Stripe customer or subscription identifiers.",
      entityType: "subscription",
      entityId: subscription.id,
    });
  }

  if (subscription.stripe_price_id && options?.mappedPlanKey === null) {
    flags.push({
      code: "unmapped_price_id",
      severity: "warning",
      message: "stripe_price_id does not map to a known self-serve plan definition.",
      entityType: "subscription",
      entityId: subscription.id,
    });
  }

  return flags;
}

export function collectBillingSanityWarnings(input: {
  subscription: OrganizationSubscription | null;
  invoices: CustomerInvoiceView[];
  webhookEvents: StripeWebhookEvent[];
}): BillingHygieneFlag[] {
  const warnings: BillingHygieneFlag[] = [];
  const subscription = input.subscription;
  const status = normalizeSubscriptionStatus(subscription?.status);

  if (status === "active" && subscription) {
    if (!subscription.stripe_customer_id) {
      warnings.push({
        code: "active_missing_customer",
        severity: "danger",
        message: "Subscription status is active but stripe_customer_id is missing.",
        entityType: "subscription",
        entityId: subscription.id,
      });
    }

    if (!subscription.stripe_subscription_id) {
      warnings.push({
        code: "active_missing_subscription",
        severity: "danger",
        message: "Subscription status is active but stripe_subscription_id is missing.",
        entityType: "subscription",
        entityId: subscription.id,
      });
    }
  }

  for (const invoice of input.invoices) {
    if (invoice.status === "open" && invoice.amountPaid === 0) {
      warnings.push({
        code: "open_invoice_unpaid",
        severity: "info",
        message: `Invoice ${invoice.stripeInvoiceId} is open with no payment yet — normal for SEPA or pending checkout.`,
        entityType: "invoice",
        entityId: invoice.id,
      });
    }
  }

  const subscriptionCanceled = isSubscriptionInactive(status);

  if (subscriptionCanceled) {
    for (const invoice of input.invoices) {
      if (invoice.status === "open") {
        warnings.push({
          code: "canceled_with_open_invoice",
          severity: "warning",
          message: `Subscription is ${getBillingStatusLabel(status).toLowerCase()} but invoice ${invoice.stripeInvoiceId} remains open.`,
          entityType: "invoice",
          entityId: invoice.id,
        });
      }
    }
  }

  for (const event of input.webhookEvents) {
    if (event.error_message) {
      warnings.push({
        code: "webhook_error_message",
        severity: "warning",
        message: `Webhook ${event.stripe_event_id} (${event.event_type}) recorded an error.`,
        entityType: "webhook",
        entityId: event.id,
      });
    }
  }

  return warnings;
}

export function summarizeBillingEventPayload(payload: Record<string, unknown>): string {
  const keys = Object.keys(payload).slice(0, 6);
  if (keys.length === 0) {
    return "Empty payload";
  }

  return keys
    .map((key) => {
      const value = payload[key];
      if (value === null || value === undefined) {
        return `${key}: —`;
      }
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return `${key}: ${String(value)}`;
      }
      return `${key}: [object]`;
    })
    .join(" · ");
}

export function maskStripeId(value: string | null | undefined, visible = 12): string {
  if (!value) {
    return "—";
  }

  if (value.length <= visible + 3) {
    return value;
  }

  return `${value.slice(0, visible)}…`;
}

export type BillingEventDiagnosticView = {
  id: string;
  eventType: string;
  stripeEventId: string | null;
  createdAt: string;
  payloadSummary: string;
  rowKind: BillingRowKind;
};

export function mapBillingEventDiagnostic(row: BillingEvent): BillingEventDiagnosticView {
  const payload = (row.payload ?? {}) as Record<string, unknown>;

  return {
    id: row.id,
    eventType: row.event_type,
    stripeEventId: row.stripe_event_id,
    createdAt: row.created_at,
    payloadSummary: summarizeBillingEventPayload(payload),
    rowKind: row.event_type.includes("test") ? "demo" : "production",
  };
}

export type BillingWebhookEventDiagnosticView = {
  id: string;
  stripeEventId: string;
  eventType: string;
  status: StripeWebhookEvent["status"];
  statusLabel: string;
  organizationId: string | null;
  retryCount: number;
  errorMessage: string | null;
  receivedAt: string;
  processedAt: string | null;
  rowKind: BillingRowKind;
};

export function mapWebhookEventDiagnostic(row: StripeWebhookEvent): BillingWebhookEventDiagnosticView {
  return {
    id: row.id,
    stripeEventId: row.stripe_event_id,
    eventType: row.event_type,
    status: row.status,
    statusLabel: getWebhookEventStatusLabel(row.status),
    organizationId: row.organization_id,
    retryCount: row.retry_count,
    errorMessage: row.error_message,
    receivedAt: row.received_at,
    processedAt: row.processed_at,
    rowKind: classifyWebhookEventRow(row),
  };
}
