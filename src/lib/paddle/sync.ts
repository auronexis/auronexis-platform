import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSubscriptionUsable } from "@/lib/billing/status";
import { resolveInternalPlanFromPaddlePriceId } from "@/lib/paddle/prices";
import {
  isPaddleCancelScheduledChange,
  mapPaddleSubscriptionStatus,
  mapPaddleTransactionStatus,
} from "@/lib/paddle/status";
import { getPaddleClient } from "@/lib/paddle/client";

export type PaddleSubscriptionSyncInput = {
  organizationId: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string;
  providerPriceId: string | null;
  providerStatus: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  trialEndsAt?: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/** True when the status string is a real Paddle subscription status (not an event-type fragment). */
export function isKnownPaddleSubscriptionStatus(status: string | null | undefined): boolean {
  const normalized = (status ?? "").trim().toLowerCase();
  return (
    normalized === "active" ||
    normalized === "trialing" ||
    normalized === "past_due" ||
    normalized === "paused" ||
    normalized === "canceled" ||
    normalized === "cancelled" ||
    normalized === "incomplete"
  );
}

export function extractOrganizationIdFromCustomData(customData: unknown): string | null {
  const data = asRecord(customData);
  return asString(data.organization_id);
}

export function extractPriceIdFromSubscription(data: Record<string, unknown>): string | null {
  const items = data.items;
  if (!Array.isArray(items) || items.length === 0) {
    return asString(data.price_id) ?? asString(asRecord(data.price).id);
  }
  const first = asRecord(items[0]);
  const price = asRecord(first.price);
  return asString(price.id) ?? asString(first.price_id);
}

export function extractPriceIdFromTransaction(data: Record<string, unknown>): string | null {
  const items = data.items;
  if (Array.isArray(items) && items.length > 0) {
    const first = asRecord(items[0]);
    const price = asRecord(first.price);
    const fromItem = asString(price.id) ?? asString(first.price_id);
    if (fromItem) {
      return fromItem;
    }
  }
  const details = asRecord(data.details);
  const lineItems = details.line_items;
  if (Array.isArray(lineItems) && lineItems.length > 0) {
    const first = asRecord(lineItems[0]);
    const price = asRecord(first.price);
    return asString(price.id) ?? asString(first.price_id);
  }
  return null;
}

/**
 * Upsert organization subscription from verified Paddle state. Fails closed
 * on unknown prices. Stripe is gone from active billing — abandoned Stripe
 * remnants (historical archive only) never block a verified Paddle sync.
 */
export async function upsertPaddleOrganizationSubscription(
  input: PaddleSubscriptionSyncInput,
): Promise<void> {
  if (!isKnownPaddleSubscriptionStatus(input.providerStatus)) {
    throw new Error(
      `Missing or unknown Paddle subscription status "${input.providerStatus ?? ""}" — reconcile required.`,
    );
  }

  if (input.providerPriceId) {
    // Fail closed: unknown price IDs throw before any entitlement write.
    resolveInternalPlanFromPaddlePriceId(input.providerPriceId);
  }

  const normalized = mapPaddleSubscriptionStatus(input.providerStatus);
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("organization_subscriptions")
    .select(
      "provider_customer_id, provider_subscription_id, provider_price_id, billing_provider, status",
    )
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  const existingRow = existing as {
    provider_customer_id: string | null;
    provider_subscription_id: string | null;
    provider_price_id: string | null;
    billing_provider: string | null;
    status: string | null;
  } | null;

  // Never null-out verified provider ids from a partial webhook payload.
  const providerCustomerId =
    input.providerCustomerId ??
    (existingRow?.billing_provider === "paddle" ? existingRow.provider_customer_id : null);
  const providerSubscriptionId =
    asString(input.providerSubscriptionId) ??
    (existingRow?.billing_provider === "paddle" ? existingRow.provider_subscription_id : null) ??
    input.providerSubscriptionId;
  const providerPriceId =
    input.providerPriceId ??
    (existingRow?.billing_provider === "paddle" ? existingRow.provider_price_id : null);

  if (isSubscriptionUsable(normalized) && !providerPriceId) {
    throw new Error(
      "Usable Paddle subscription missing provider_price_id — reconcile required.",
    );
  }

  const row = {
    organization_id: input.organizationId,
    billing_provider: "paddle",
    provider_customer_id: providerCustomerId,
    provider_subscription_id: providerSubscriptionId,
    provider_price_id: providerPriceId,
    provider_status: input.providerStatus,
    status: normalized,
    current_period_start: input.currentPeriodStart ?? null,
    current_period_end: input.currentPeriodEnd ?? null,
    cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
    trial_ends_at: input.trialEndsAt ?? null,
    sync_pending: false,
    // Do not clear Stripe columns — leave historical Stripe IDs if any existed.
    updated_at: now,
  };

  const { error } = await admin.from("organization_subscriptions").upsert(row as never, {
    onConflict: "organization_id",
  });

  if (error) {
    throw new Error(`Failed to upsert Paddle subscription: ${error.message}`);
  }

  const planFlag = normalized === "active" || normalized === "trialing" ? "paid" : "free";
  const { error: planError } = await admin
    .from("organizations")
    .update({ plan: planFlag } as never)
    .eq("id", input.organizationId);

  if (planError) {
    // Subscription row already written — flag for reconcile so plan/entitlements re-sync.
    await admin
      .from("organization_subscriptions")
      .update({ sync_pending: true, updated_at: now } as never)
      .eq("organization_id", input.organizationId);
    throw new Error(`Failed to sync organization plan flag: ${planError.message}`);
  }
}

/**
 * Mark checkout sync pending without overwriting a live usable Paddle subscription.
 * Avoids impossible state: organizations.plan=paid + entitlements inactive.
 */
export async function markOrganizationSyncPending(organizationId: string): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("organization_subscriptions")
    .select("status, billing_provider, provider_subscription_id, sync_pending")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const existingRow = existing as {
    status: string | null;
    billing_provider: string | null;
    provider_subscription_id: string | null;
    sync_pending: boolean | null;
  } | null;

  const hasUsablePaddle =
    existingRow?.billing_provider === "paddle" &&
    isSubscriptionUsable(existingRow.status) &&
    Boolean(existingRow.provider_subscription_id?.startsWith("sub_"));

  if (hasUsablePaddle) {
    const { error } = await admin
      .from("organization_subscriptions")
      .update({ sync_pending: true, updated_at: now } as never)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("[paddle] failed to mark sync pending on live subscription:", error.message);
    }
    return;
  }

  const { error } = await admin.from("organization_subscriptions").upsert(
    {
      organization_id: organizationId,
      billing_provider: "paddle",
      sync_pending: true,
      status: "incomplete",
      provider_status: "pending_sync",
      updated_at: now,
    } as never,
    { onConflict: "organization_id" },
  );

  if (error) {
    console.error("[paddle] failed to mark sync pending:", error.message);
  }
}

export async function upsertPaddleTransaction(input: {
  organizationId: string;
  providerTransactionId: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  providerPriceId: string | null;
  status: string;
  amountTotal: number | null;
  currency: string;
  occurredAt: string | null;
  paidAt: string | null;
  invoiceUrl: string | null;
  amountSubtotal?: number | null;
  amountTax?: number | null;
  invoiceNumber?: string | null;
  productName?: string | null;
  paymentMethodSummary?: string | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
}): Promise<void> {
  const admin = createAdminClient();

  const { data: existingTxn } = await admin
    .from("billing_provider_transactions")
    .select(
      "invoice_url, invoice_number, provider_customer_id, provider_subscription_id, provider_price_id, product_name, payment_method_summary",
    )
    .eq("billing_provider", "paddle")
    .eq("provider_transaction_id", input.providerTransactionId)
    .maybeSingle();

  const existing = existingTxn as {
    invoice_url: string | null;
    invoice_number: string | null;
    provider_customer_id: string | null;
    provider_subscription_id: string | null;
    provider_price_id: string | null;
    product_name: string | null;
    payment_method_summary: string | null;
  } | null;

  const { error } = await admin.from("billing_provider_transactions").upsert(
    {
      organization_id: input.organizationId,
      billing_provider: "paddle",
      provider_transaction_id: input.providerTransactionId,
      provider_customer_id: input.providerCustomerId ?? existing?.provider_customer_id ?? null,
      provider_subscription_id:
        input.providerSubscriptionId ?? existing?.provider_subscription_id ?? null,
      provider_price_id: input.providerPriceId ?? existing?.provider_price_id ?? null,
      status: mapPaddleTransactionStatus(input.status),
      amount_total: input.amountTotal,
      amount_subtotal: input.amountSubtotal ?? null,
      amount_tax: input.amountTax ?? null,
      currency: input.currency.toUpperCase(),
      occurred_at: input.occurredAt,
      paid_at: input.paidAt,
      invoice_url: input.invoiceUrl ?? existing?.invoice_url ?? null,
      invoice_number: input.invoiceNumber ?? existing?.invoice_number ?? null,
      product_name: input.productName ?? existing?.product_name ?? null,
      payment_method_summary:
        input.paymentMethodSummary ?? existing?.payment_method_summary ?? null,
      billing_period_start: input.billingPeriodStart ?? null,
      billing_period_end: input.billingPeriodEnd ?? null,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "billing_provider,provider_transaction_id" },
  );

  if (error) {
    throw new Error(`Failed to upsert Paddle transaction: ${error.message}`);
  }
}

/** Reconcile local state from live Paddle subscription (out-of-order events). */
export async function reconcileSubscriptionFromPaddle(
  subscriptionId: string,
  organizationIdHint?: string | null,
): Promise<string | null> {
  const paddle = getPaddleClient();
  const subscription = await paddle.subscriptions.get(subscriptionId);
  const data = asRecord(subscription);
  const customData = data.customData ?? data.custom_data;
  const organizationId =
    organizationIdHint ?? extractOrganizationIdFromCustomData(customData);

  if (!organizationId) {
    throw new Error("Cannot reconcile Paddle subscription without organization_id.");
  }

  const priceId = extractPriceIdFromSubscription(data);
  const currentBilling = asRecord(data.currentBillingPeriod ?? data.current_billing_period);
  const providerStatus = asString(data.status);
  if (!providerStatus) {
    throw new Error("Live Paddle subscription missing status.");
  }

  await upsertPaddleOrganizationSubscription({
    organizationId,
    providerCustomerId: asString(data.customerId ?? data.customer_id),
    providerSubscriptionId: asString(data.id) ?? subscriptionId,
    providerPriceId: priceId,
    providerStatus,
    currentPeriodStart: asString(currentBilling.startsAt ?? currentBilling.starts_at),
    currentPeriodEnd: asString(currentBilling.endsAt ?? currentBilling.ends_at),
    cancelAtPeriodEnd: isPaddleCancelScheduledChange(
      data.scheduledChange ?? data.scheduled_change,
    ),
    trialEndsAt: asString(asRecord(data.currentTrialPeriod ?? data.current_trial_period).endsAt),
  });

  return organizationId;
}
