import "server-only";

import {
  extractOrganizationIdFromCustomData,
  extractPriceIdFromSubscription,
  extractPriceIdFromTransaction,
  reconcileSubscriptionFromPaddle,
  upsertPaddleOrganizationSubscription,
  upsertPaddleTransaction,
} from "@/lib/paddle/sync";

const HANDLED_EVENT_TYPES = new Set([
  "subscription.created",
  "subscription.activated",
  "subscription.updated",
  "subscription.canceled",
  "subscription.paused",
  "subscription.resumed",
  "subscription.trialing",
  "subscription.past_due",
  "transaction.completed",
  "transaction.paid",
  "transaction.payment_failed",
  "transaction.updated",
  "customer.created",
  "customer.updated",
]);

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export type PaddleWebhookHandleResult = {
  handled: boolean;
  ignored: boolean;
  organizationId: string | null;
};

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
      const priceId = extractPriceIdFromSubscription(data);
      const currentBilling = asRecord(data.currentBillingPeriod ?? data.current_billing_period);
      await upsertPaddleOrganizationSubscription({
        organizationId,
        providerCustomerId: asString(data.customerId ?? data.customer_id),
        providerSubscriptionId: subscriptionId,
        providerPriceId: priceId,
        providerStatus: asString(data.status) ?? eventType.replace("subscription.", ""),
        currentPeriodStart: asString(currentBilling.startsAt ?? currentBilling.starts_at),
        currentPeriodEnd: asString(currentBilling.endsAt ?? currentBilling.ends_at),
        cancelAtPeriodEnd: Boolean(data.scheduledChange ?? data.scheduled_change),
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

async function persistTransaction(
  organizationId: string,
  data: Record<string, unknown>,
  transactionId: string,
): Promise<void> {
  const totals = asRecord(data.details);
  const totalsInner = asRecord(totals.totals);
  const amount =
    asNumber(totalsInner.grandTotal ?? totalsInner.grand_total ?? totalsInner.total) ??
    asNumber(data.amount);

  await upsertPaddleTransaction({
    organizationId,
    providerTransactionId: transactionId,
    providerCustomerId: asString(data.customerId ?? data.customer_id),
    providerSubscriptionId: asString(data.subscriptionId ?? data.subscription_id),
    providerPriceId: extractPriceIdFromTransaction(data),
    status: asString(data.status) ?? "unknown",
    amountTotal: amount,
    currency: asString(data.currencyCode ?? data.currency_code) ?? "EUR",
    occurredAt: asString(data.billedAt ?? data.billed_at ?? data.createdAt ?? data.created_at),
    paidAt:
      asString(data.status) === "completed" || asString(data.status) === "paid"
        ? asString(data.updatedAt ?? data.updated_at) ?? new Date().toISOString()
        : null,
    invoiceUrl: asString(data.invoiceUrl ?? data.invoice_url),
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
