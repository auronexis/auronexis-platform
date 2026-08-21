import "server-only";

import { getPlanByKey } from "@/lib/billing/plans";
import {
  formatMollieAmount,
  isMollieSelfServePlanKey,
  mapMollieSubscriptionStatus,
  type MollieSelfServePlanKey,
} from "@/lib/billing/providers/mollie/checkout";
import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import { assertMolliePaymentOpsAllowed } from "@/lib/billing/providers/mollie/mode";
import {
  getMollieOrganizationSubscription,
  upsertMollieOrganizationSubscription,
} from "@/lib/billing/providers/mollie/organization-sync";

/**
 * Professional ↔ Business plan change for Mollie-backed orgs.
 * Updates Mollie subscription amount from canonical catalog — no invented proration.
 * Never cancel+create (would double-bill). Fails closed for enterprise or missing mandate/subscription.
 */
export async function changeMollieOrganizationPlan(input: {
  organizationId: string;
  targetPlanKey: MollieSelfServePlanKey;
}): Promise<{ previousPlanKey: string; targetPlanKey: MollieSelfServePlanKey }> {
  assertMolliePaymentOpsAllowed();

  if (!isMollieSelfServePlanKey(input.targetPlanKey)) {
    throw new Error("Enterprise plan changes are manual-only.");
  }

  const existing = await getMollieOrganizationSubscription(input.organizationId);
  if (!existing?.provider_subscription_id?.startsWith("sub_")) {
    throw new Error("No active Mollie subscription to change.");
  }
  if (!existing.provider_customer_id?.startsWith("cst_")) {
    throw new Error("Mollie customer mapping missing — refusing plan change.");
  }

  const previousPlanKey = existing.provider_price_id ?? "unknown";
  if (previousPlanKey === input.targetPlanKey) {
    throw new Error("This is your organization's current plan.");
  }

  const plan = getPlanByKey(input.targetPlanKey);
  const client = createMollieBillingClient();

  // In-place amount update only — never cancel+create (double-bill safeguard).
  const updated = await client.customerSubscriptions.update(existing.provider_subscription_id, {
    customerId: existing.provider_customer_id,
    amount: { currency: plan.currency, value: formatMollieAmount(plan.priceMonthly) },
    description: `Auroranexis ${plan.name} subscription`,
    metadata: {
      auroranexis_plan_key: input.targetPlanKey,
      auroranexis_organization_id: input.organizationId,
      auroranexis_billing_surface: "production",
    },
  });

  await upsertMollieOrganizationSubscription({
    organizationId: input.organizationId,
    providerCustomerId: existing.provider_customer_id,
    providerSubscriptionId: updated.id,
    planKey: input.targetPlanKey,
    providerStatus: updated.status,
    normalizedStatus: mapMollieSubscriptionStatus(updated.status),
    syncPending: false,
    cancelAtPeriodEnd: false,
  });

  return { previousPlanKey, targetPlanKey: input.targetPlanKey };
}

/**
 * Cancel Mollie subscription immediately via Mollie API.
 * The installed Mollie SDK cancel endpoint does not support defer-to-period-end
 * (MOLLIE_SUPPORTS_CANCEL_AT_PERIOD_END = false); we refuse to invent local
 * period-end cancel theatre without provider support.
 *
 * Reactivation is not supported by Mollie for canceled subscriptions
 * (MOLLIE_SUPPORTS_SUBSCRIPTION_REACTIVATION = false) — recovery requires a
 * new first-payment checkout with duplicate-subscription safeguards.
 */
export async function cancelMollieOrganizationSubscription(input: {
  organizationId: string;
}): Promise<{ canceledAtPeriodEnd: false }> {
  assertMolliePaymentOpsAllowed();

  const existing = await getMollieOrganizationSubscription(input.organizationId);
  if (!existing?.provider_subscription_id?.startsWith("sub_")) {
    throw new Error("No Mollie subscription to cancel.");
  }
  if (!existing.provider_customer_id?.startsWith("cst_")) {
    throw new Error("Mollie customer mapping missing — refusing cancel.");
  }

  const client = createMollieBillingClient();
  const canceled = await client.customerSubscriptions.cancel(existing.provider_subscription_id, {
    customerId: existing.provider_customer_id,
  });

  const planKey: MollieSelfServePlanKey = isMollieSelfServePlanKey(existing.provider_price_id ?? "")
    ? (existing.provider_price_id as MollieSelfServePlanKey)
    : "professional";

  await upsertMollieOrganizationSubscription({
    organizationId: input.organizationId,
    providerCustomerId: existing.provider_customer_id,
    providerSubscriptionId: canceled.id,
    planKey,
    providerStatus: canceled.status,
    normalizedStatus: mapMollieSubscriptionStatus(canceled.status),
    syncPending: false,
    cancelAtPeriodEnd: false,
  });

  return { canceledAtPeriodEnd: false };
}
