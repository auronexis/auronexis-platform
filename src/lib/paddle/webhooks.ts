import "server-only";

import { trackBillingLifecycleEvent } from "@/lib/analytics/billing-lifecycle";
import { invalidateBillingCache } from "@/lib/billing/cache";
import { PADDLE_WEBHOOK_EVENT_TYPES } from "@/lib/billing/commercial-events";
import {
  extractOrganizationIdFromCustomData,
  extractPriceIdFromSubscription,
  extractPriceIdFromTransaction,
  isKnownPaddleSubscriptionStatus,
  reconcileSubscriptionFromPaddle,
  upsertPaddleOrganizationSubscription,
  upsertPaddleTransaction,
} from "@/lib/paddle/sync";
import { isPaddleCancelScheduledChange } from "@/lib/paddle/status";
import { parsePaddleMoneyToCents } from "@/lib/paddle/money";

const HANDLED_EVENT_TYPES = new Set<string>(PADDLE_WEBHOOK_EVENT_TYPES);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export type PaddleWebhookHandleResult = {
  handled: boolean;
  ignored: boolean;
  organizationId: string | null;
};

/**
 * Emit privacy-safe commercial analytics after a verified webhook outcome.
 * Fail-silent — must never affect billing state.
 */
export async function emitPaddleWebhookCommercialEvent(eventType: string): Promise<void> {
  try {
    switch (eventType) {
      case "transaction.completed":
      case "transaction.paid":
        await trackBillingLifecycleEvent("invoice_paid", {
          result: "success",
          source: "paddle_webhook",
          event_type: eventType,
        });
        break;
      case "transaction.payment_failed":
        await trackBillingLifecycleEvent("invoice_failed", {
          result: "failure",
          source: "paddle_webhook",
          event_type: eventType,
        });
        break;
      case "subscription.canceled":
        await trackBillingLifecycleEvent("subscription_cancelled", {
          result: "cancelled",
          source: "paddle_webhook",
          event_type: eventType,
        });
        break;
      case "subscription.activated":
      case "subscription.created":
        await trackBillingLifecycleEvent("subscription_checkout_completed", {
          result: "success",
          source: "paddle_webhook",
          event_type: eventType,
        });
        break;
      default:
        break;
    }
  } catch {
    // Commercial analytics must never break webhook processing.
  }
}

/**
 * Process a verified Paddle Billing event entity.
 * Call only after signature verification.
 */
export async function handlePaddleWebhookEvent(event: {
  eventId?: string;
  event_id?: string;
  eventType?: string;
  event_type?: string;
  occurredAt?: string;
  occurred_at?: string;
  data: unknown;
}): Promise<PaddleWebhookHandleResult> {
  const eventType = asString(event.eventType ?? event.event_type) ?? "";
  const data = asRecord(event.data);

  if (!HANDLED_EVENT_TYPES.has(eventType)) {
    return { handled: false, ignored: true, organizationId: null };
  }

  if (eventType.startsWith("customer.")) {
    // Customer records are stored via subscription/transaction sync custom data.
    return { handled: true, ignored: false, organizationId: null };
  }

  if (eventType.startsWith("subscription.")) {
    const subscriptionId = asString(data.id);
    if (!subscriptionId) {
      throw new Error("Paddle subscription event missing id.");
    }

    const organizationId =
      extractOrganizationIdFromCustomData(data.customData ?? data.custom_data) ??
      (await findOrganizationByProviderSubscription(subscriptionId));

    if (!organizationId) {
      // Out-of-order: fetch live state if custom data missing locally
      const reconciledOrg = await reconcileSubscriptionFromPaddle(subscriptionId);
      return { handled: true, ignored: false, organizationId: reconciledOrg };
    }

    try {
      const providerStatus = asString(data.status);
      if (!providerStatus || !isKnownPaddleSubscriptionStatus(providerStatus)) {
        // Partial / event-type-only payloads must not write inactive locally.
        await reconcileSubscriptionFromPaddle(subscriptionId, organizationId);
        return { handled: true, ignored: false, organizationId };
      }

      const priceId = extractPriceIdFromSubscription(data);
      const currentBilling = asRecord(data.currentBillingPeriod ?? data.current_billing_period);
      await upsertPaddleOrganizationSubscription({
        organizationId,
        providerCustomerId: asString(data.customerId ?? data.customer_id),
        providerSubscriptionId: subscriptionId,
        providerPriceId: priceId,
        providerStatus,
        currentPeriodStart: asString(currentBilling.startsAt ?? currentBilling.starts_at),
        currentPeriodEnd: asString(currentBilling.endsAt ?? currentBilling.ends_at),
        cancelAtPeriodEnd: isPaddleCancelScheduledChange(
          data.scheduledChange ?? data.scheduled_change,
        ),
        trialEndsAt: asString(
          asRecord(data.currentTrialPeriod ?? data.current_trial_period).endsAt ??
            asRecord(data.currentTrialPeriod ?? data.current_trial_period).ends_at,
        ),
      });
    } catch (error) {
      // Out-of-order / partial payload — reconcile from live Paddle state.
      console.warn("[paddle] subscription event upsert failed — reconciling", {
        eventType,
        message: error instanceof Error ? error.message : String(error),
      });
      await reconcileSubscriptionFromPaddle(subscriptionId, organizationId);
    }

    return { handled: true, ignored: false, organizationId };
  }

  if (eventType.startsWith("transaction.")) {
    const transactionId = asString(data.id);
    if (!transactionId) {
      throw new Error("Paddle transaction event missing id.");
    }

    const customData = data.customData ?? data.custom_data;
    const organizationId = extractOrganizationIdFromCustomData(customData);
    const subscriptionId = asString(data.subscriptionId ?? data.subscription_id);

    if (!organizationId && subscriptionId) {
      const reconciledOrg = await reconcileSubscriptionFromPaddle(subscriptionId);
      if (reconciledOrg) {
        await persistTransaction(reconciledOrg, data, transactionId);
        return { handled: true, ignored: false, organizationId: reconciledOrg };
      }
    }

    if (!organizationId) {
      throw new Error("Paddle transaction missing organization_id custom data.");
    }

    await persistTransaction(organizationId, data, transactionId);

    if (
      (eventType === "transaction.completed" || eventType === "transaction.paid") &&
      subscriptionId
    ) {
      await reconcileSubscriptionFromPaddle(subscriptionId, organizationId);
    }

    return { handled: true, ignored: false, organizationId };
  }

  return { handled: false, ignored: true, organizationId: null };
}

/** Card brand + last4 only — never persist full card numbers or PANs. */
function extractPaymentMethodSummary(data: Record<string, unknown>): string | null {
  const payments = data.payments;
  if (!Array.isArray(payments) || payments.length === 0) {
    return null;
  }

  const firstPayment = asRecord(payments[0]);
  const methodDetails = asRecord(firstPayment.methodDetails ?? firstPayment.method_details);
  const type = asString(methodDetails.type);
  const card = asRecord(methodDetails.card);
  const brand = asString(card.type);
  const last4 = asString(card.last4);

  if (brand && last4) {
    return `${brand} •••• ${last4}`;
  }

  return type;
}

/** Best-effort product/price name for invoice history display — never invents a name. */
function extractProductName(data: Record<string, unknown>): string | null {
  const items = data.items;
  if (Array.isArray(items) && items.length > 0) {
    const first = asRecord(items[0]);
    const price = asRecord(first.price);
    const fromPrice = asString(price.name) ?? asString(price.description);
    if (fromPrice) {
      return fromPrice;
    }
  }

  const details = asRecord(data.details);
  const lineItems = details.lineItems ?? details.line_items;
  if (Array.isArray(lineItems) && lineItems.length > 0) {
    const first = asRecord(lineItems[0]);
    const product = asRecord(first.product);
    const price = asRecord(first.price);
    return asString(product.name) ?? asString(price.name) ?? asString(price.description);
  }

  return null;
}

async function persistTransaction(
  organizationId: string,
  data: Record<string, unknown>,
  transactionId: string,
): Promise<void> {
  const details = asRecord(data.details);
  const totals = asRecord(details.totals);
  const billingPeriod = asRecord(data.billingPeriod ?? data.billing_period);

  const total =
    parsePaddleMoneyToCents(totals.grandTotal ?? totals.grand_total ?? totals.total) ??
    parsePaddleMoneyToCents(data.amount);
  const subtotal = parsePaddleMoneyToCents(totals.subtotal);
  const tax = parsePaddleMoneyToCents(totals.tax);

  const invoiceNumber = asString(
    data.invoiceNumber ?? data.invoice_number ?? data.invoiceId ?? data.invoice_id,
  );

  await upsertPaddleTransaction({
    organizationId,
    providerTransactionId: transactionId,
    providerCustomerId: asString(data.customerId ?? data.customer_id),
    providerSubscriptionId: asString(data.subscriptionId ?? data.subscription_id),
    providerPriceId: extractPriceIdFromTransaction(data),
    status: asString(data.status) ?? "unknown",
    amountTotal: total,
    amountSubtotal: subtotal,
    amountTax: tax,
    currency: asString(data.currencyCode ?? data.currency_code) ?? "EUR",
    occurredAt: asString(data.billedAt ?? data.billed_at ?? data.createdAt ?? data.created_at),
    paidAt:
      asString(data.status) === "completed" || asString(data.status) === "paid"
        ? asString(data.updatedAt ?? data.updated_at) ?? new Date().toISOString()
        : null,
    invoiceUrl: asString(data.invoiceUrl ?? data.invoice_url),
    invoiceNumber,
    productName: extractProductName(data),
    paymentMethodSummary: extractPaymentMethodSummary(data),
    billingPeriodStart: asString(billingPeriod.startsAt ?? billingPeriod.starts_at),
    billingPeriodEnd: asString(billingPeriod.endsAt ?? billingPeriod.ends_at),
  });
}

async function findOrganizationByProviderSubscription(
  subscriptionId: string,
): Promise<string | null> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data } = await admin
    .from("organization_subscriptions")
    .select("organization_id")
    .eq("provider_subscription_id", subscriptionId)
    .maybeSingle();
  return asString((data as { organization_id?: string } | null)?.organization_id);
}

/** Invalidate usage caches after a successful webhook that may change entitlements/usage. */
export function invalidateCachesAfterWebhook(organizationId: string | null): void {
  if (!organizationId) return;
  try {
    invalidateBillingCache(organizationId);
  } catch {
    // Cache invalidation must never break webhooks.
  }
}
