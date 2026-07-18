import "server-only";

import type { BillingEventRecord, CustomerInvoiceView } from "@/lib/billing/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/tenancy/context";

/**
 * @deprecated Stripe invoice mirror retired — Paddle is the sole active billing
 * provider. Use listOrganizationBillingTransactions from "@/lib/paddle/transactions"
 * for active billing history. Always returns an empty list.
 */
export async function listCustomerInvoices(
  _session: SessionContext,
  _limit = 24,
): Promise<CustomerInvoiceView[]> {
  return [];
}

export async function recordBillingEvent(input: BillingEventRecord): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("billing_events").insert({
    organization_id: input.organizationId,
    event_type: input.eventType,
    stripe_event_id: input.stripeEventId ?? null,
    payload: input.payload ?? {},
  } as never);

  if (error) {
    if (error.code === "23505") {
      return;
    }
    console.error("[billing] failed to record billing event:", error.message);
  }
}

/**
 * @deprecated Stripe invoice-ignore diagnostics retired along with the Stripe
 * checkout path. Always returns an empty set.
 */
export async function listIgnoredStripeInvoiceIds(_organizationId: string): Promise<Set<string>> {
  return new Set();
}

/** Legacy Stripe invoice mirror count — archive only, not used for active billing. */
export async function countCustomerInvoices(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("customer_invoices")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    return 0;
  }
  return count ?? 0;
}

export async function countRecentBillingEvents(organizationId: string, days = 7): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("billing_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", since);

  if (error) {
    return 0;
  }
  return count ?? 0;
}
