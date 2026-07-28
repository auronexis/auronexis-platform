import "server-only";

import { isSubscriptionUsable } from "@/lib/billing/status";
import type { NormalizedSubscriptionStatus } from "@/lib/billing/provider-types";
import {
  isEntitlementDrivingFastSpringPlan,
  mapFastSpringProductPath,
} from "@/lib/fastspring/products";
import { createAdminClient } from "@/lib/supabase/admin";

export type FastSpringSubscriptionSyncInput = {
  organizationId: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string;
  /** FastSpring product path (e.g. professional, founding-member). */
  providerPriceId: string | null;
  providerStatus: string | null;
  normalizedStatus: NormalizedSubscriptionStatus;
  cancelAtPeriodEnd?: boolean;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

/**
 * Upsert FastSpring subscription state for a deterministically matched org.
 * FastSpring is the sole active billing provider — this always writes for a
 * matched organization. Historical Paddle rows (if any) are overwritten,
 * since Paddle no longer drives entitlements, checkout, or portal access.
 *
 * Safety:
 * - Never invent entitlements for unknown product paths.
 * - pilot / founding product paths are stored on provider_price_id but do not
 *   flip organizations.plan to paid (InternalPlan only).
 */
export async function upsertFastSpringOrganizationSubscription(
  input: FastSpringSubscriptionSyncInput,
): Promise<{ wrote: boolean; reason?: string }> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: existing, error: readError } = await admin
    .from("organization_subscriptions")
    .select(
      "billing_provider, status, provider_status, provider_customer_id, provider_subscription_id, provider_price_id",
    )
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (readError) {
    throw new Error(`Failed to read organization subscription: ${readError.message}`);
  }

  const existingRow = existing as {
    billing_provider: string | null;
    status: string | null;
    provider_status: string | null;
    provider_customer_id: string | null;
    provider_subscription_id: string | null;
    provider_price_id: string | null;
  } | null;

  const mappedPlan = mapFastSpringProductPath(input.providerPriceId);
  if (input.providerPriceId && !mappedPlan) {
    throw new Error(
      `Unknown FastSpring product path "${input.providerPriceId}" — refusing entitlement write.`,
    );
  }

  if (isSubscriptionUsable(input.normalizedStatus) && !input.providerPriceId) {
    throw new Error(
      "Usable FastSpring subscription missing product path — refusing entitlement write.",
    );
  }

  const providerCustomerId =
    input.providerCustomerId ??
    (existingRow?.billing_provider === "fastspring" ? existingRow.provider_customer_id : null);
  const providerSubscriptionId =
    asString(input.providerSubscriptionId) ??
    (existingRow?.billing_provider === "fastspring"
      ? existingRow.provider_subscription_id
      : null) ??
    input.providerSubscriptionId;
  const providerPriceId =
    input.providerPriceId ??
    (existingRow?.billing_provider === "fastspring" ? existingRow.provider_price_id : null);

  const row = {
    organization_id: input.organizationId,
    billing_provider: "fastspring",
    provider_customer_id: providerCustomerId,
    provider_subscription_id: providerSubscriptionId,
    provider_price_id: providerPriceId,
    provider_status: input.providerStatus,
    status: input.normalizedStatus,
    cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
    sync_pending: false,
    updated_at: now,
  };

  const { error } = await admin.from("organization_subscriptions").upsert(row as never, {
    onConflict: "organization_id",
  });

  if (error) {
    throw new Error(`Failed to upsert FastSpring subscription: ${error.message}`);
  }

  // Only InternalPlan product paths drive organizations.plan paid/free.
  if (isEntitlementDrivingFastSpringPlan(mappedPlan)) {
    const planFlag =
      input.normalizedStatus === "active" || input.normalizedStatus === "trialing"
        ? "paid"
        : "free";
    const { error: planError } = await admin
      .from("organizations")
      .update({ plan: planFlag } as never)
      .eq("id", input.organizationId);

    if (planError) {
      await admin
        .from("organization_subscriptions")
        .update({ sync_pending: true, updated_at: now } as never)
        .eq("organization_id", input.organizationId);
      throw new Error(`Failed to sync organization plan flag: ${planError.message}`);
    }
  }

  return { wrote: true };
}

export type FastSpringTransactionSyncInput = {
  organizationId: string;
  providerTransactionId: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  providerPriceId: string | null;
  status: string;
  amountTotal: number | null;
  currency: string | null;
  occurredAt: string | null;
  paidAt: string | null;
  invoiceUrl: string | null;
  invoiceNumber: string | null;
  productName: string | null;
};

export async function upsertFastSpringTransaction(
  input: FastSpringTransactionSyncInput,
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin.from("billing_provider_transactions").upsert(
    {
      organization_id: input.organizationId,
      billing_provider: "fastspring",
      provider_transaction_id: input.providerTransactionId,
      provider_customer_id: input.providerCustomerId,
      provider_subscription_id: input.providerSubscriptionId,
      provider_price_id: input.providerPriceId,
      status: input.status,
      amount_total: input.amountTotal,
      currency: (input.currency ?? "usd").toLowerCase(),
      occurred_at: input.occurredAt,
      paid_at: input.paidAt,
      invoice_url: input.invoiceUrl,
      invoice_number: input.invoiceNumber,
      product_name: input.productName,
      updated_at: now,
    } as never,
    { onConflict: "billing_provider,provider_transaction_id" },
  );

  if (error) {
    throw new Error(`Failed to upsert FastSpring transaction: ${error.message}`);
  }
}
