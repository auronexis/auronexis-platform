import "server-only";

import {
  listIgnoredStripeInvoiceIds,
  recordBillingEvent,
  syncCustomerInvoiceFromStripe,
} from "@/lib/billing/invoices";
import { getOrganizationSubscription } from "@/lib/billing/queries";
import { getActiveBillingProvider } from "@/lib/billing/provider";
import { selectPreferredSubscriptionRow } from "@/lib/billing/subscription-selection";
import {
  hasVerifiedPaddleSubscription,
  isStaleStripeAbandonedCheckout,
} from "@/lib/billing/active-billing";
import { isSubscriptionUsable } from "@/lib/billing/status";
import { maskStripeId } from "@/lib/billing/hygiene";
import { ensureSubscriptionCustomer } from "@/lib/stripe/customers";
import { syncOrganizationPlan, syncSubscriptionById } from "@/lib/stripe/subscriptions";
import { getStripeClient } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationSubscription } from "@/types/database";

const SUBSCRIPTION_SELECT =
  "id, organization_id, stripe_customer_id, stripe_subscription_id, stripe_price_id, billing_provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status, sync_pending, status, current_period_start, current_period_end, cancel_at_period_end, trial_ends_at, created_at, updated_at";

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
    .select(SUBSCRIPTION_SELECT)
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as OrganizationSubscription[];
}

async function resolveStripeCustomerId(
  session: SessionContext,
  subscription: OrganizationSubscription | null,
): Promise<string | null> {
  if (subscription?.stripe_customer_id) {
    return subscription.stripe_customer_id;
  }

  const ensured = await ensureSubscriptionCustomer({
    organizationId: session.organization.id,
    organizationName: session.organization.name,
    email: session.email,
    status: subscription?.status,
    stripeSubscriptionId: subscription?.stripe_subscription_id,
  });

  return ensured.stripeCustomerId;
}

/** Refresh billing from Stripe — customer repair, subscription sync, invoice sync. */
export async function refreshBillingFromStripe(
  session: SessionContext,
): Promise<BillingMaintenanceActionResult> {
  const organizationId = session.organization.id;
  const details: string[] = [];
  const subscription = await getOrganizationSubscription(session);

  const ensured = await ensureSubscriptionCustomer({
    organizationId,
    organizationName: session.organization.name,
    email: session.email,
    status: subscription?.status,
    stripeSubscriptionId: subscription?.stripe_subscription_id,
    stripeCustomerIdHint: subscription?.stripe_customer_id,
  });

  if (ensured.stripeCustomerId) {
    details.push(`Stripe customer ${maskStripeId(ensured.stripeCustomerId)} verified.`);
  } else {
    details.push("No Stripe customer could be resolved — subscription may be inactive.");
  }

  if (subscription?.stripe_subscription_id) {
    await syncSubscriptionById(organizationId, subscription.stripe_subscription_id);
    await syncOrganizationPlan(organizationId, subscription.status);
    details.push(`Subscription ${maskStripeId(subscription.stripe_subscription_id)} re-synced.`);
  } else {
    details.push("No stripe_subscription_id on preferred row — subscription sync skipped.");
  }

  const invoiceResult = await resyncInvoicesFromStripe(session);
  details.push(...(invoiceResult.details ?? []));

  await recordBillingEvent({
    organizationId,
    eventType: "billing_maintenance.refresh_from_stripe",
    payload: { details },
  });

  return {
    success: true,
    message: "Billing refreshed from Stripe.",
    details,
  };
}

/** Re-sync the preferred subscription row from Stripe. Never cancels in Stripe. */
export async function resyncCurrentSubscriptionFromStripe(
  session: SessionContext,
): Promise<BillingMaintenanceActionResult> {
  const organizationId = session.organization.id;
  const subscription = await getOrganizationSubscription(session);

  if (!subscription?.stripe_subscription_id) {
    return {
      success: false,
      message: "No stripe_subscription_id on the preferred subscription row.",
    };
  }

  await syncSubscriptionById(organizationId, subscription.stripe_subscription_id);
  await syncOrganizationPlan(organizationId, subscription.status);

  await recordBillingEvent({
    organizationId,
    eventType: "billing_maintenance.resync_subscription",
    payload: {
      stripeSubscriptionId: subscription.stripe_subscription_id,
    },
  });

  return {
    success: true,
    message: "Current subscription re-synced from Stripe.",
    details: [maskStripeId(subscription.stripe_subscription_id)],
  };
}

/** Pull recent invoices from Stripe for the workspace customer. */
export async function resyncInvoicesFromStripe(
  session: SessionContext,
): Promise<BillingMaintenanceActionResult> {
  const organizationId = session.organization.id;
  const subscription = await getOrganizationSubscription(session);
  const customerId = await resolveStripeCustomerId(session, subscription);

  if (!customerId) {
    return {
      success: false,
      message: "No Stripe customer ID available to list invoices.",
    };
  }

  const stripe = getStripeClient();
  const listed = await stripe.invoices.list({
    customer: customerId,
    limit: 24,
  });

  let synced = 0;
  for (const invoice of listed.data) {
    await syncCustomerInvoiceFromStripe(organizationId, invoice);
    synced += 1;
  }

  await recordBillingEvent({
    organizationId,
    eventType: "billing_maintenance.resync_invoices",
    payload: { customerId: maskStripeId(customerId), syncedCount: synced },
  });

  return {
    success: true,
    message: `Re-synced ${synced} invoice(s) from Stripe.`,
    details: [`Stripe customer ${maskStripeId(customerId)}`, `${synced} invoices upserted`],
  };
}

const STRIPE_TERMINAL_INVOICE_STATUSES = new Set(["void", "uncollectible"]);

/** Remove local invoice mirror rows only when Stripe confirms void/uncollectible. */
export async function clearStaleLocalInvoicesFromStripe(
  session: SessionContext,
): Promise<BillingMaintenanceActionResult> {
  const organizationId = session.organization.id;
  const admin = createAdminClient();
  const stripe = getStripeClient();

  const { data, error } = await admin
    .from("customer_invoices")
    .select("id, stripe_invoice_id, status")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const removed: string[] = [];
  const updated: string[] = [];

  for (const row of (data ?? []) as Array<{
    id: string;
    stripe_invoice_id: string;
    status: string;
  }>) {
    const stripeInvoice = await stripe.invoices.retrieve(row.stripe_invoice_id);
    const stripeStatus = stripeInvoice.status ?? "draft";

    if (STRIPE_TERMINAL_INVOICE_STATUSES.has(stripeStatus)) {
      await syncCustomerInvoiceFromStripe(organizationId, stripeInvoice);

      const { error: deleteError } = await admin
        .from("customer_invoices")
        .delete()
        .eq("id", row.id);

      if (!deleteError) {
        removed.push(maskStripeId(row.stripe_invoice_id));
      }
    } else if (stripeStatus !== row.status) {
      await syncCustomerInvoiceFromStripe(organizationId, stripeInvoice);
      updated.push(`${maskStripeId(row.stripe_invoice_id)} → ${stripeStatus}`);
    }
  }

  await recordBillingEvent({
    organizationId,
    eventType: "billing_maintenance.clear_stale_invoices",
    payload: { removed, updated },
  });

  if (removed.length === 0 && updated.length === 0) {
    return {
      success: true,
      message: "No stale local invoice rows required cleanup.",
    };
  }

  return {
    success: true,
    message: `Cleaned ${removed.length} stale invoice row(s); updated ${updated.length}.`,
    details: [...removed.map((id) => `Removed ${id}`), ...updated],
  };
}

/** Mark an open invoice as ignored for checkout blocking — diagnostic-only relief. */
export async function markInvoiceIgnoredForCheckout(
  session: SessionContext,
  stripeInvoiceId: string,
): Promise<BillingMaintenanceActionResult> {
  const trimmed = stripeInvoiceId.trim();
  if (!trimmed) {
    return { success: false, message: "Invoice ID is required." };
  }

  await recordBillingEvent({
    organizationId: session.organization.id,
    eventType: "billing_maintenance.invoice_ignored",
    payload: { stripeInvoiceId: trimmed, reason: "admin_diagnostic_ignore" },
  });

  return {
    success: true,
    message: `Invoice ${maskStripeId(trimmed)} marked as ignored for checkout diagnostics.`,
  };
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
  const ignoredStripeInvoiceIds = await listIgnoredStripeInvoiceIds(session.organization.id);

  return {
    preferredSubscription,
    allSubscriptions,
    ignoredStripeInvoiceIds,
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
