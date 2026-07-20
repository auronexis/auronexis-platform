import "server-only";

import { recordBillingEvent } from "@/lib/billing/invoices";
import { getOrganizationSubscription, ORGANIZATION_SUBSCRIPTION_SELECT } from "@/lib/billing/queries";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import { selectPreferredSubscriptionRow } from "@/lib/billing/subscription-selection";
import { isStaleStripeAbandonedCheckout, hasVerifiedPaddleSubscription } from "@/lib/billing/active-billing";
import { isSubscriptionUsable } from "@/lib/billing/status";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationSubscription } from "@/types/database";

export type BillingMaintenanceActionResult = {
  success: boolean;
  message: string;
  details?: string[];
};

async function listAllOrganizationSubscriptions(
  organizationId: string,
): Promise<OrganizationSubscription[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_subscriptions")
    .select(ORGANIZATION_SUBSCRIPTION_SELECT)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as OrganizationSubscription[];
}

export async function loadBillingMaintenanceContext(session: SessionContext): Promise<{
  preferredSubscription: OrganizationSubscription | null;
  allSubscriptions: OrganizationSubscription[];
  ignoredStripeInvoiceIds: Set<string>;
}> {
  const activeProvider = getActiveBillingProvider();
  const allSubscriptions = await listAllOrganizationSubscriptions(session.organization.id);
  const preferredSubscription =
    selectPreferredSubscriptionRow(allSubscriptions, activeProvider) ??
    (await getOrganizationSubscription(session));

  return {
    preferredSubscription,
    allSubscriptions,
    ignoredStripeInvoiceIds: new Set<string>(),
  };
}

/**
 * Neutralize abandoned Stripe checkout remnants so they cannot block Paddle.
 * Never deletes rows, never calls Stripe, never clears historical stripe_customer_id.
 */
export async function neutralizeStaleStripeCheckoutRemnants(
  session: SessionContext,
): Promise<BillingMaintenanceActionResult> {
  if (getActiveBillingProvider() !== "paddle") {
    return {
      success: false,
      message: "Stale Stripe neutralization is only available when BILLING_PROVIDER=paddle.",
    };
  }

  const allSubscriptions = await listAllOrganizationSubscriptions(session.organization.id);
  const candidates = allSubscriptions.filter((row) => {
    if (!isStaleStripeAbandonedCheckout(row)) {
      return false;
    }
    if (isSubscriptionUsable(row.status)) {
      return false;
    }
    if (hasVerifiedPaddleSubscription(row)) {
      return false;
    }
    return true;
  });

  if (candidates.length === 0) {
    return {
      success: true,
      message: "No stale Stripe abandoned-checkout rows found for this organization.",
      details: [],
    };
  }

  const admin = createAdminClient();
  const details: string[] = [];

  for (const row of candidates) {
    const { error } = await admin
      .from("organization_subscriptions")
      .update({
        status: "inactive",
        sync_pending: false,
        provider_status: "abandoned_stripe_checkout",
        // Keep billing_provider=stripe and stripe_customer_id for audit history.
        // Clear copied Stripe ids from neutral provider columns so they are not
        // mistaken for Paddle customer/subscription ids.
        provider_customer_id: null,
        provider_subscription_id: null,
        provider_price_id: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", row.id)
      .eq("organization_id", session.organization.id);

    if (error) {
      details.push(`Failed to neutralize ${row.id}: ${error.message}`);
      continue;
    }

    details.push(
      `Neutralized subscription row ${row.id} (status→inactive, sync_pending→false; stripe_customer_id preserved).`,
    );
  }

  await recordBillingEvent({
    organizationId: session.organization.id,
    eventType: "billing_maintenance.stale_stripe_neutralized",
    payload: {
      candidateCount: candidates.length,
      details,
    },
  });

  return {
    success: details.every((line) => !line.startsWith("Failed")),
    message:
      details.filter((line) => line.startsWith("Failed")).length === 0
        ? `Neutralized ${candidates.length} stale Stripe checkout remnant(s).`
        : "Some stale Stripe rows could not be neutralized.",
    details,
  };
}

export { listAllOrganizationSubscriptions };
