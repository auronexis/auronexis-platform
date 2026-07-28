import "server-only";

import { trackBillingLifecycleEvent } from "@/lib/analytics/billing-lifecycle";
import { invalidateBillingCache } from "@/lib/billing/cache";
import {
  isFastSpringHandledEventType,
  isFastSpringOrderEventType,
  isFastSpringSubscriptionEventType,
} from "@/lib/fastspring/events";
import { resolveFastSpringOrganizationId } from "@/lib/fastspring/org-matching";
import {
  extractOrderSnapshot,
  extractSubscriptionSnapshot,
  occurredAtFromEventCreated,
} from "@/lib/fastspring/parse";
import {
  mapFastSpringOrderEventToTransactionStatus,
  resolveFastSpringSubscriptionStatus,
} from "@/lib/fastspring/status";
import {
  upsertFastSpringOrganizationSubscription,
  upsertFastSpringTransaction,
} from "@/lib/fastspring/sync";
import type { FastSpringWebhookEventEnvelope } from "@/lib/fastspring/types";

export type FastSpringWebhookHandleResult = {
  handled: boolean;
  ignored: boolean;
  organizationId: string | null;
  reason?: string;
};

/**
 * Process one verified FastSpring webhook event.
 * Call only after HMAC signature verification.
 */
export async function handleFastSpringWebhookEvent(
  event: FastSpringWebhookEventEnvelope,
): Promise<FastSpringWebhookHandleResult> {
  if (!isFastSpringHandledEventType(event.type)) {
    return {
      handled: false,
      ignored: true,
      organizationId: null,
      reason: "unknown_event",
    };
  }

  if (isFastSpringSubscriptionEventType(event.type)) {
    return handleSubscriptionEvent(event);
  }

  if (isFastSpringOrderEventType(event.type)) {
    return handleOrderEvent(event);
  }

  return {
    handled: false,
    ignored: true,
    organizationId: null,
    reason: "unhandled_event",
  };
}

async function handleSubscriptionEvent(
  event: FastSpringWebhookEventEnvelope,
): Promise<FastSpringWebhookHandleResult> {
  const snapshot = extractSubscriptionSnapshot(event.data);
  if (!snapshot.subscriptionId) {
    throw new Error("FastSpring subscription event missing subscription id.");
  }

  const { organizationId, matchMethod } = await resolveFastSpringOrganizationId({
    tags: snapshot.tags,
    customLookupId: snapshot.customLookupId,
    subscriptionId: snapshot.subscriptionId,
    accountId: snapshot.accountId,
  });

  if (!organizationId) {
    console.warn("[fastspring] subscription event could not be mapped to an organization", {
      eventType: event.type,
      eventIdPrefix: event.id.slice(0, 12),
      subscriptionIdPrefix: snapshot.subscriptionId.slice(0, 8),
      hasAccountId: Boolean(snapshot.accountId),
      hasTags: Object.keys(snapshot.tags).length > 0,
    });
    return {
      handled: true,
      ignored: true,
      organizationId: null,
      reason: "unmapped_organization",
    };
  }

  const normalizedStatus = resolveFastSpringSubscriptionStatus({
    eventType: event.type,
    state: snapshot.state,
    active: snapshot.active,
  });

  if (!normalizedStatus) {
    console.warn("[fastspring] subscription event missing mappable status — no write", {
      eventType: event.type,
      eventIdPrefix: event.id.slice(0, 12),
      matchMethod,
    });
    return {
      handled: true,
      ignored: true,
      organizationId,
      reason: "unmappable_status",
    };
  }

  const cancelAtPeriodEnd =
    event.type === "subscription.canceled" && snapshot.state !== "deactivated";

  const result = await upsertFastSpringOrganizationSubscription({
    organizationId,
    providerCustomerId: snapshot.accountId,
    providerSubscriptionId: snapshot.subscriptionId,
    providerPriceId: snapshot.productPath,
    providerStatus: snapshot.state ?? event.type,
    normalizedStatus,
    cancelAtPeriodEnd,
  });

  if (!result.wrote) {
    return {
      handled: true,
      ignored: true,
      organizationId,
      reason: result.reason ?? "subscription_write_skipped",
    };
  }

  // Charge events also create transaction ledger rows when an order id is present.
  if (
    event.type === "subscription.charge.completed" ||
    event.type === "subscription.charge.failed"
  ) {
    const order = extractOrderSnapshot(event.data);
    const transactionId =
      order.orderId ??
      `${snapshot.subscriptionId}:${event.id}`;
    await upsertFastSpringTransaction({
      organizationId,
      providerTransactionId: transactionId,
      providerCustomerId: snapshot.accountId ?? order.accountId,
      providerSubscriptionId: snapshot.subscriptionId,
      providerPriceId: snapshot.productPath ?? order.productPath,
      status: mapFastSpringOrderEventToTransactionStatus(event.type),
      amountTotal: order.totalInCents,
      currency: order.currency ?? snapshot.currency,
      occurredAt: occurredAtFromEventCreated(event.created),
      paidAt:
        event.type === "subscription.charge.completed"
          ? occurredAtFromEventCreated(event.created)
          : null,
      invoiceUrl: order.invoiceUrl,
      invoiceNumber: order.reference,
      productName: snapshot.productPath ?? order.productPath,
    });

    void trackBillingLifecycleEvent(
      event.type === "subscription.charge.completed" ? "invoice_paid" : "invoice_failed",
      { source: "fastspring_webhook", result: "success" },
    );
  }

  if (event.type === "subscription.canceled") {
    void trackBillingLifecycleEvent("subscription_cancelled", {
      source: "fastspring_webhook",
      result: "success",
    });
  }

  return { handled: true, ignored: false, organizationId };
}

async function handleOrderEvent(
  event: FastSpringWebhookEventEnvelope,
): Promise<FastSpringWebhookHandleResult> {
  const order = extractOrderSnapshot(event.data);
  if (!order.orderId) {
    throw new Error("FastSpring order event missing order id.");
  }

  const { organizationId } = await resolveFastSpringOrganizationId({
    tags: order.tags,
    customLookupId: order.customLookupId,
    accountId: order.accountId,
  });

  if (!organizationId) {
    console.warn("[fastspring] order event could not be mapped to an organization", {
      eventType: event.type,
      eventIdPrefix: event.id.slice(0, 12),
      orderIdPrefix: order.orderId.slice(0, 8),
      hasAccountId: Boolean(order.accountId),
      hasTags: Object.keys(order.tags).length > 0,
    });
    return {
      handled: true,
      ignored: true,
      organizationId: null,
      reason: "unmapped_organization",
    };
  }

  await upsertFastSpringTransaction({
    organizationId,
    providerTransactionId: order.orderId,
    providerCustomerId: order.accountId,
    providerSubscriptionId: null,
    providerPriceId: order.productPath,
    status: mapFastSpringOrderEventToTransactionStatus(event.type),
    amountTotal: order.totalInCents,
    currency: order.currency,
    occurredAt: occurredAtFromEventCreated(event.created),
    paidAt:
      event.type === "order.completed" ? occurredAtFromEventCreated(event.created) : null,
    invoiceUrl: order.invoiceUrl,
    invoiceNumber: order.reference,
    productName: order.productPath,
  });

  if (event.type === "order.completed" || event.type === "order.failed") {
    void trackBillingLifecycleEvent(event.type === "order.completed" ? "invoice_paid" : "invoice_failed", {
      source: "fastspring_webhook",
      result: "success",
    });
  }

  return { handled: true, ignored: false, organizationId };
}

export function invalidateCachesAfterFastSpringWebhook(
  organizationId: string | null,
): void {
  if (organizationId) {
    invalidateBillingCache(organizationId);
  }
}
