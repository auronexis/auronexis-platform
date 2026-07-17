import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveInternalPlanFromPaddlePriceId } from "@/lib/paddle/prices";
import {
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

/** Upsert organization subscription from verified Paddle state. Fails closed on unknown prices. */
export async function upsertPaddleOrganizationSubscription(
  input: PaddleSubscriptionSyncInput,
): Promise<void> {
  if (input.providerPriceId) {
    // Fail closed: unknown price IDs throw before any entitlement write.
    resolveInternalPlanFromPaddlePriceId(input.providerPriceId);
  }

  const normalized = mapPaddleSubscriptionStatus(input.providerStatus);
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing } = await admin
    .from("organization_subscriptions")
    .select("id, billing_provider")
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  const existingProvider = (existing as { billing_provider?: string } | null)?.billing_provider;
  if (existingProvider === "stripe") {
    console.error("[paddle] refusing to overwrite Stripe-backed subscription", {
      organizationId: input.organizationId,
    });
    throw new Error(
      "Organization already has a Stripe subscription. Paddle sync refused to overwrite Stripe records.",
    );
  }

  const row = {
    organization_id: input.organizationId,
    billing_provider: "paddle",
    provider_customer_id: input.providerCustomerId,
    provider_subscription_id: input.providerSubscriptionId,
    provider_price_id: input.providerPriceId,
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
  await admin
    .from("organizations")
    .update({ plan: planFlag } as never)
    .eq("id", input.organizationId);
}

export async function markOrganizationSyncPending(organizationId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("organization_subscriptions").upsert(
    {
      organization_id: organizationId,
      billing_provider: "paddle",
      sync_pending: true,
      status: "incomplete",
      provider_status: "pending_sync",
      updated_at: new Date().toISOString(),
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
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("billing_provider_transactions").upsert(
    {
      organization_id: input.organizationId,
      billing_provider: "paddle",
      provider_transaction_id: input.providerTransactionId,
      provider_customer_id: input.providerCustomerId,
      provider_subscription_id: input.providerSubscriptionId,
      provider_price_id: input.providerPriceId,
      status: mapPaddleTransactionStatus(input.status),
      amount_total: input.amountTotal,
      currency: input.currency.toUpperCase(),
      occurred_at: input.occurredAt,
      paid_at: input.paidAt,
      invoice_url: input.invoiceUrl,
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

  await upsertPaddleOrganizationSubscription({
    organizationId,
    providerCustomerId: asString(data.customerId ?? data.customer_id),
    providerSubscriptionId: asString(data.id) ?? subscriptionId,
    providerPriceId: priceId,
    providerStatus: asString(data.status) ?? "inactive",
    currentPeriodStart: asString(currentBilling.startsAt ?? currentBilling.starts_at),
    currentPeriodEnd: asString(currentBilling.endsAt ?? currentBilling.ends_at),
    cancelAtPeriodEnd: Boolean(data.scheduledChange ?? data.scheduled_change),
    trialEndsAt: asString(asRecord(data.currentTrialPeriod ?? data.current_trial_period).endsAt),
  });

  return organizationId;
}
