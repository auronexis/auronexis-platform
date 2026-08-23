import "server-only";

import { getPlanByKey } from "@/lib/billing/plans";
import {
  mapMollieSubscriptionStatus,
  resolveMollieStoredSubscriptionStatus,
  type MollieNormalizedSubscriptionStatus,
} from "@/lib/billing/providers/mollie/lifecycle-status";
import {
  formatMollieAmount,
  isMollieSelfServePlanKey,
  type MollieSelfServePlanKey,
} from "@/lib/billing/providers/mollie/checkout";
import {
  MOLLIE_METADATA_BILLING_SURFACE,
  MOLLIE_METADATA_ORGANIZATION_ID,
  MOLLIE_METADATA_PLAN_KEY,
} from "@/lib/billing/providers/mollie/foundation";
import { assertMolliePaymentOpsAllowed } from "@/lib/billing/providers/mollie/mode";
import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import {
  PLAN_CHANGE_CANCEL_ALREADY_MESSAGE,
  SUBSCRIPTION_CANCEL_ALREADY_MESSAGE,
} from "@/lib/billing/subscription-management";
import { clearMollieUpgradePaymentAttempt } from "@/lib/billing/providers/mollie/upgrade-payment";
import { resolveMollieBillingPeriodUpdate } from "@/lib/billing/providers/mollie/billing-period";
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
 * Schedule a Mollie downgrade for the next billing cycle (Business → Professional).
 *
 * Upgrades require immediate prorated payment via createMollieUpgradePaymentCheckout.
 * Mollie customerSubscriptions.update changes amount for the next cycle only.
 * Downgrade path: no invented proration — amount applies on next Mollie cycle.
 *
 * Local invariant: provider_price_id stays on current plan until provider-confirmed apply.
 */
export async function scheduleMollieOrganizationDowngrade(input: {
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

  if (existing.cancel_at_period_end) {
    throw new Error("Plan changes are unavailable while cancellation is scheduled.");
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
  if (targetPlan.order >= currentPlan.order) {
    throw new Error("Upgrades require immediate prorated payment — use upgrade checkout.");
  }
  const changeType = "downgrade" as const;

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

/** @deprecated Use scheduleMollieOrganizationDowngrade for downgrades; upgrades use upgrade-payment checkout. */
export async function changeMollieOrganizationPlan(input: {
  organizationId: string;
  targetPlanKey: MollieSelfServePlanKey;
}): Promise<MolliePlanChangeResult> {
  const current = await getMollieOrganizationSubscription(input.organizationId);
  const previousPlanKey = current?.provider_price_id ?? "";
  if (!isMollieSelfServePlanKey(previousPlanKey)) {
    throw new Error("Current Mollie plan mapping is invalid.");
  }
  const currentPlan = getPlanByKey(previousPlanKey);
  const targetPlan = getPlanByKey(input.targetPlanKey);
  if (targetPlan.order > currentPlan.order) {
    throw new Error("Upgrades require immediate prorated payment — use upgrade checkout.");
  }
  return scheduleMollieOrganizationDowngrade(input);
}

export type MollieUpgradeApplyResult = {
  applied: boolean;
  previousPlanKey: MollieSelfServePlanKey | null;
  appliedPlanKey: MollieSelfServePlanKey | null;
  providerChangeReference: string | null;
  providerUpdateFailed: boolean;
};

/**
 * After prorated upgrade payment is paid: update Mollie recurring amount and flip
 * authoritative provider_price_id. Recoverable when provider update fails after payment.
 */
export async function applyMollieUpgradeAfterPayment(input: {
  organizationId: string;
  paymentId: string;
  targetPlanKey: MollieSelfServePlanKey;
  providerSubscriptionId: string;
}): Promise<MollieUpgradeApplyResult> {
  const existing = await getMollieOrganizationSubscription(input.organizationId);
  if (!existing?.provider_customer_id?.startsWith("cst_")) {
    throw new Error("Mollie customer mapping missing — refusing upgrade apply.");
  }

  const previousPlanKey = existing.provider_price_id ?? "";
  if (!isMollieSelfServePlanKey(previousPlanKey)) {
    throw new Error("Current plan mapping invalid — refusing upgrade apply.");
  }
  if (previousPlanKey === input.targetPlanKey) {
    await clearMollieUpgradePaymentAttempt(input.organizationId);
    return {
      applied: true,
      previousPlanKey,
      appliedPlanKey: input.targetPlanKey,
      providerChangeReference: input.paymentId,
      providerUpdateFailed: false,
    };
  }

  const targetPlan = getPlanByKey(input.targetPlanKey);
  const client = createMollieBillingClient();
  let providerUpdateFailed = false;

  try {
    await client.customerSubscriptions.update(input.providerSubscriptionId, {
      customerId: existing.provider_customer_id,
      amount: {
        currency: targetPlan.currency,
        value: formatMollieAmount(targetPlan.priceMonthly),
      },
      description: `Auroranexis ${targetPlan.name} subscription`,
      metadata: {
        [MOLLIE_METADATA_PLAN_KEY]: input.targetPlanKey,
        [MOLLIE_METADATA_ORGANIZATION_ID]: input.organizationId,
        [MOLLIE_METADATA_BILLING_SURFACE]: "production",
        auroranexis_upgrade_payment_id: input.paymentId,
        auroranexis_previous_plan_key: previousPlanKey,
      },
    });
  } catch (providerError) {
    providerUpdateFailed = true;
    console.error("[billing][upgrade] provider subscription update failed after payment", {
      organizationId: input.organizationId,
      paymentId: input.paymentId,
      message: providerError instanceof Error ? providerError.message : String(providerError),
    });
  }

  const remote = await client.customerSubscriptions.get(input.providerSubscriptionId, {
    customerId: existing.provider_customer_id,
  });
  const nextPaymentDate =
    typeof remote.nextPaymentDate === "string" ? remote.nextPaymentDate : existing.current_period_end;

  const period = resolveMollieBillingPeriodUpdate({
    existingStart: existing.current_period_start,
    existingEnd: existing.current_period_end,
    nextPaymentDate,
    mode: "sync",
  });

  await upsertMollieOrganizationSubscription({
    organizationId: input.organizationId,
    providerCustomerId: existing.provider_customer_id,
    providerSubscriptionId: remote.id,
    planKey: input.targetPlanKey,
    providerStatus: remote.status,
    normalizedStatus: resolveMollieStoredSubscriptionStatus({
      providerStatus: remote.status,
      cancelAtPeriodEnd: existing.cancel_at_period_end,
      currentPeriodEnd: period.currentPeriodEnd,
    }),
    syncPending: providerUpdateFailed,
    currentPeriodStart: period.currentPeriodStart,
    currentPeriodEnd: period.currentPeriodEnd,
    clearPendingPlanChange: true,
    clearUpgradePaymentAttempt: true,
    providerChangeReference: input.paymentId,
  });

  return {
    applied: true,
    previousPlanKey,
    appliedPlanKey: input.targetPlanKey,
    providerChangeReference: input.paymentId,
    providerUpdateFailed,
  };
}

export type MolliePlanChangeCancelResult = {
  currentPlanKey: MollieSelfServePlanKey;
  canceledPendingPlanKey: MollieSelfServePlanKey;
  changeType: "upgrade" | "downgrade";
  providerChangeReference: string;
  alreadyCanceled: boolean;
};

export type MollieSubscriptionCancelResult = {
  canceledAtPeriodEnd: true;
  accessUntil: string | null;
  planKey: MollieSelfServePlanKey;
  providerSubscriptionId: string;
  alreadyScheduled: boolean;
};

function verifyMollieSubscriptionAmount(
  amountValue: string | undefined,
  expectedPlanKey: MollieSelfServePlanKey,
): boolean {
  const plan = getPlanByKey(expectedPlanKey);
  return amountValue === formatMollieAmount(plan.priceMonthly);
}

/**
 * Cancel a scheduled Mollie plan change by restoring the provider subscription amount
 * to the authoritative current plan. Local pending fields clear only after provider verify.
 */
export async function cancelMollieScheduledPlanChange(input: {
  organizationId: string;
}): Promise<MolliePlanChangeCancelResult> {
  assertMolliePaymentOpsAllowed();

  const existing = await getMollieOrganizationSubscription(input.organizationId);
  if (!existing?.provider_subscription_id?.startsWith("sub_")) {
    throw new Error("No active Mollie subscription to change.");
  }
  if (!existing.provider_customer_id?.startsWith("cst_")) {
    throw new Error("Mollie customer mapping missing — refusing plan change cancel.");
  }

  if (!existing.pending_plan) {
    throw new Error(PLAN_CHANGE_CANCEL_ALREADY_MESSAGE);
  }

  const pendingPlanKey = existing.pending_plan;
  if (!isMollieSelfServePlanKey(pendingPlanKey)) {
    throw new Error("Scheduled plan change mapping is invalid — contact support.");
  }

  const currentPlanKey = existing.provider_price_id ?? "";
  if (!isMollieSelfServePlanKey(currentPlanKey)) {
    throw new Error("Current Mollie plan mapping is invalid — refusing plan change cancel.");
  }

  const changeType =
    existing.pending_plan_change_type === "upgrade" ||
    existing.pending_plan_change_type === "downgrade"
      ? existing.pending_plan_change_type
      : getPlanByKey(pendingPlanKey).order > getPlanByKey(currentPlanKey).order
        ? "upgrade"
        : "downgrade";

  const client = createMollieBillingClient();

  const currentPlan = getPlanByKey(currentPlanKey);
  const updated = await client.customerSubscriptions.update(existing.provider_subscription_id, {
    customerId: existing.provider_customer_id,
    amount: { currency: currentPlan.currency, value: formatMollieAmount(currentPlan.priceMonthly) },
    description: `Auroranexis ${currentPlan.name} subscription`,
    metadata: {
      [MOLLIE_METADATA_PLAN_KEY]: currentPlanKey,
      [MOLLIE_METADATA_ORGANIZATION_ID]: input.organizationId,
      [MOLLIE_METADATA_BILLING_SURFACE]: "production",
    },
  });

  if (!verifyMollieSubscriptionAmount(updated.amount?.value, currentPlanKey)) {
    console.error("[billing][plan-change-cancel] provider amount verification failed", {
      organizationId: input.organizationId,
      subscriptionId: updated.id,
    });
    throw new Error("Mollie did not confirm the restored plan amount — pending change kept.");
  }

  const normalizedStatus = resolveMollieStoredSubscriptionStatus({
    providerStatus: updated.status,
    cancelAtPeriodEnd: existing.cancel_at_period_end,
    currentPeriodEnd: existing.current_period_end,
  });

  await upsertMollieOrganizationSubscription({
    organizationId: input.organizationId,
    providerCustomerId: existing.provider_customer_id,
    providerSubscriptionId: updated.id,
    planKey: currentPlanKey,
    providerStatus: updated.status,
    normalizedStatus,
    syncPending: false,
    cancelAtPeriodEnd: existing.cancel_at_period_end,
    clearPendingPlanChange: true,
    providerChangeReference: updated.id,
  });

  console.info("[billing][plan-change-cancel] scheduled change canceled", {
    organizationId: input.organizationId,
    currentPlanKey,
    canceledPendingPlanKey: pendingPlanKey,
  });

  return {
    currentPlanKey,
    canceledPendingPlanKey: pendingPlanKey,
    changeType,
    providerChangeReference: updated.id,
    alreadyCanceled: false,
  };
}

/**
 * Cancel Mollie subscription with paid-through semantics.
 * Mollie API cancel is immediate (no future charges); local cancel_at_period_end preserves access
 * until current_period_end. Mandates and customers are not revoked.
 */
export async function cancelMollieOrganizationSubscription(input: {
  organizationId: string;
}): Promise<MollieSubscriptionCancelResult> {
  assertMolliePaymentOpsAllowed();

  const existing = await getMollieOrganizationSubscription(input.organizationId);
  if (!existing?.provider_subscription_id?.startsWith("sub_")) {
    throw new Error("No Mollie subscription to cancel.");
  }
  if (!existing.provider_customer_id?.startsWith("cst_")) {
    throw new Error("Mollie customer mapping missing — refusing cancel.");
  }

  if (existing.cancel_at_period_end) {
    throw new Error(SUBSCRIPTION_CANCEL_ALREADY_MESSAGE);
  }

  const client = createMollieBillingClient();
  await client.customerSubscriptions.get(existing.provider_subscription_id, {
    customerId: existing.provider_customer_id,
  });

  const canceled = await client.customerSubscriptions.cancel(existing.provider_subscription_id, {
    customerId: existing.provider_customer_id,
  });

  const planKey: MollieSelfServePlanKey = isMollieSelfServePlanKey(existing.provider_price_id ?? "")
    ? (existing.provider_price_id as MollieSelfServePlanKey)
    : "professional";

  const remote = await client.customerSubscriptions.get(existing.provider_subscription_id, {
    customerId: existing.provider_customer_id,
  });
  const remoteNextPayment =
    typeof remote.nextPaymentDate === "string" && remote.nextPaymentDate.length > 0
      ? remote.nextPaymentDate.includes("T")
        ? remote.nextPaymentDate
        : `${remote.nextPaymentDate}T00:00:00.000Z`
      : null;
  const accessUntil = existing.current_period_end ?? remoteNextPayment;
  const normalizedStatus: MollieNormalizedSubscriptionStatus = resolveMollieStoredSubscriptionStatus({
    providerStatus: canceled.status,
    cancelAtPeriodEnd: true,
    currentPeriodEnd: accessUntil,
  });

  await upsertMollieOrganizationSubscription({
    organizationId: input.organizationId,
    providerCustomerId: existing.provider_customer_id,
    providerSubscriptionId: canceled.id,
    planKey,
    providerStatus: canceled.status,
    normalizedStatus,
    syncPending: false,
    cancelAtPeriodEnd: true,
    currentPeriodEnd: accessUntil,
    clearPendingPlanChange: true,
  });

  console.info("[billing][subscription-cancel] cancellation scheduled at period end", {
    organizationId: input.organizationId,
    accessUntil,
    subscriptionId: canceled.id,
  });

  return {
    canceledAtPeriodEnd: true,
    accessUntil,
    planKey,
    providerSubscriptionId: canceled.id,
    alreadyScheduled: false,
  };
}

/**
 * Finalize paid-through cancellation after current_period_end passes.
 * Idempotent when not cancel_at_period_end or still paid-through.
 */
export async function finalizeMollieSubscriptionIfExpired(input: {
  organizationId: string;
}): Promise<{
  expired: boolean;
  providerSubscriptionId: string | null;
  accessUntil: string | null;
  planKey: MollieSelfServePlanKey | null;
}> {
  const existing = await getMollieOrganizationSubscription(input.organizationId);
  if (!existing?.cancel_at_period_end) {
    return {
      expired: false,
      providerSubscriptionId: existing?.provider_subscription_id ?? null,
      accessUntil: null,
      planKey: null,
    };
  }

  const accessUntil = existing.current_period_end ?? null;
  const stillPaidThrough = resolveMollieStoredSubscriptionStatus({
    providerStatus: existing.provider_status,
    cancelAtPeriodEnd: true,
    currentPeriodEnd: accessUntil,
  }) === "active";

  if (stillPaidThrough) {
    return {
      expired: false,
      providerSubscriptionId: existing.provider_subscription_id,
      accessUntil,
      planKey: isMollieSelfServePlanKey(existing.provider_price_id ?? "")
        ? (existing.provider_price_id as MollieSelfServePlanKey)
        : null,
    };
  }

  const planKey: MollieSelfServePlanKey = isMollieSelfServePlanKey(existing.provider_price_id ?? "")
    ? (existing.provider_price_id as MollieSelfServePlanKey)
    : "professional";

  await upsertMollieOrganizationSubscription({
    organizationId: input.organizationId,
    providerCustomerId: existing.provider_customer_id,
    providerSubscriptionId: existing.provider_subscription_id,
    planKey,
    providerStatus: existing.provider_status,
    normalizedStatus: "canceled",
    syncPending: false,
    cancelAtPeriodEnd: false,
    clearPendingPlanChange: true,
  });

  console.info("[billing][subscription-expire] paid-through access ended", {
    organizationId: input.organizationId,
    accessUntil,
    subscriptionId: existing.provider_subscription_id,
  });

  return {
    expired: true,
    providerSubscriptionId: existing.provider_subscription_id,
    accessUntil,
    planKey,
  };
}
