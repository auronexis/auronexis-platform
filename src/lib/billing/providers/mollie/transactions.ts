import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type MollieTransactionSyncInput = {
  organizationId: string;
  providerTransactionId: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  providerPriceId: string | null;
  status: string;
  amountTotal: number | null;
  amountSubtotal?: number | null;
  currency: string | null;
  occurredAt: string | null;
  paidAt: string | null;
  invoiceUrl?: string | null;
  productName: string | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
};

/**
 * Persist authoritative Mollie payment rows for billing history.
 * Idempotent on (billing_provider, provider_transaction_id).
 */
export async function upsertMollieBillingTransaction(
  input: MollieTransactionSyncInput,
): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { error } = await admin.from("billing_provider_transactions").upsert(
    {
      organization_id: input.organizationId,
      billing_provider: "mollie",
      provider_transaction_id: input.providerTransactionId,
      provider_customer_id: input.providerCustomerId,
      provider_subscription_id: input.providerSubscriptionId,
      provider_price_id: input.providerPriceId,
      status: input.status,
      amount_total: input.amountTotal,
      amount_subtotal: input.amountSubtotal ?? input.amountTotal,
      currency: (input.currency ?? "eur").toLowerCase(),
      occurred_at: input.occurredAt,
      paid_at: input.paidAt,
      invoice_url: input.invoiceUrl ?? null,
      product_name: input.productName,
      billing_period_start: input.billingPeriodStart ?? null,
      billing_period_end: input.billingPeriodEnd ?? null,
      updated_at: now,
    } as never,
    { onConflict: "billing_provider,provider_transaction_id" },
  );

  if (error) {
    throw new Error(`Failed to upsert Mollie billing transaction: ${error.message}`);
  }
}
