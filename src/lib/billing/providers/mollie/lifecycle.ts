import "server-only";

import { getPlanByKey } from "@/lib/billing/plans";
import {
  formatMollieAmount,
  isMollieSelfServePlanKey,
  mapMollieSubscriptionStatus,
  type MollieSelfServePlanKey,
} from "@/lib/billing/providers/mollie/checkout";
import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import {
  MOLLIE_METADATA_BILLING_SURFACE,
  MOLLIE_METADATA_ORGANIZATION_ID,
  MOLLIE_METADATA_PLAN_KEY,
} from "@/lib/billing/providers/mollie/foundation";
import { assertMolliePaymentOpsAllowed } from "@/lib/billing/providers/mollie/mode";
import {
  getMollieOrganizationSubscription,
  scheduleMolliePendingPlanChange,
  upsertMollieOrganizationSubscription,
} from "@/lib/billing/providers/mollie/organization-sync";

export type MolliePlanChangeResult = {
  previousPlanKey: string;
  targetPlanKey: MollieSelfServePlanKey;
  changeType: "upgrade" | "downgrade";
  /** Authoritative local plan remains previous until provider-confirmed apply. */
  authoritativePlanKey: string;
  pendingPlanKey: MollieSelfServePlanKey;
  pendingPlanEffectiveAt: string | null;
  providerChangeReference: string;
};

/**
 * Professional ↔ Business plan change for Mollie-backed orgs.
 *
 * Mollie semantics: customerSubscriptions.update changes the amount for the
 * next billing cycle — it does not invent mid-cycle proration charges
 * (no invented proration).
 *
 * Local invariant: provider_price_id (authoritative current plan) is NOT
 * switched to the target on click. We schedule pending_plan and apply only
 * after a successful provider-confirmed renewal/payment webhook.
 *
 * Never cancel+create (would double-bill). Fails closed for enterprise,
 * missing mandate/subscription, or an existing conflicting pending change.
 */
export async function changeMollieOrganizationPlan(input: {
  organizationId: string;
  targetPlanKey: MollieSelfServePlanKey;
}): Promise<MolliePlanChangeResult> {
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
  if (!isMollieSelfServePlanKey(previousPlanKey)) {
    throw new Error("Current Mollie plan mapping is invalid — refusing plan change.");
  }
  if (previousPlanKey === input.targetPlanKey) {
    throw new Error("This is your organization's current plan.");
  }

  if (existing.pending_plan) {
    if (existing.pending_plan === input.targetPlanKey) {
      throw new Error(
        "A plan change to this target is already scheduled. It applies after Mollie confirms the next billing cycle.",
      );
    }
    throw new Error(
      "A plan change is already scheduled for this subscription. Wait for it to take effect or contact support.",
    );
  }

  const currentPlan = getPlanByKey(previousPlanKey);
  const targetPlan = getPlanByKey(input.targetPlanKey);
  const changeType: "upgrade" | "downgrade" =
    targetPlan.order > currentPlan.order ? "upgrade" : "downgrade";

  const client = createMollieBillingClient();

  // In-place amount update only — never cancel+create (double-bill safeguard).
  // Amount applies on the next Mollie cycle; local entitlements stay on previousPlanKey.
  const updated = await client.customerSubscriptions.update(existing.provider_subscription_id, {
    customerId: existing.provider_customer_id,
    amount: { currency: targetPlan.currency, value: formatMollieAmount(targetPlan.priceMonthly) },
    description: `Auroranexis ${targetPlan.name} subscription`,
    metadata: {
      [MOLLIE_METADATA_PLAN_KEY]: input.targetPlanKey,
      [MOLLIE_METADATA_ORGANIZATION_ID]: input.organizationId,
      [MOLLIE_METADATA_BILLING_SURFACE]: "production",
      auroranexis_pending_plan_change: changeType,
      auroranexis_previous_plan_key: previousPlanKey,
    },
  });

  const nextPaymentDate =
    typeof updated.nextPaymentDate === "string" && updated.nextPaymentDate.length > 0
      ? updated.nextPaymentDate
      : existing.current_period_end;

  const pendingEffectiveAt = nextPaymentDate
    ? nextPaymentDate.includes("T")
      ? nextPaymentDate
      : `${nextPaymentDate}T00:00:00.000Z`
    : null;

  await scheduleMolliePendingPlanChange({
    organizationId: input.organizationId,
    providerCustomerId: existing.provider_customer_id,
    providerSubscriptionId: updated.id,
    /** Keep authoritative current plan until provider confirms. */
    currentPlanKey: previousPlanKey,
    pendingPlanKey: input.targetPlanKey,
    pendingPlanChangeType: changeType,
    pendingPlanEffectiveAt: pendingEffectiveAt,
    providerChangeReference: updated.id,
    providerStatus: updated.status,
    normalizedStatus: mapMollieSubscriptionStatus(updated.status),
    currentPeriodEnd: pendingEffectiveAt,
  });

  return {
    previousPlanKey,
    targetPlanKey: input.targetPlanKey,
    changeType,
    authoritativePlanKey: previousPlanKey,
    pendingPlanKey: input.targetPlanKey,
    pendingPlanEffectiveAt: pendingEffectiveAt,
    providerChangeReference: updated.id,
  };
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
    clearPendingPlanChange: true,
  });

  return { canceledAtPeriodEnd: false };
}
