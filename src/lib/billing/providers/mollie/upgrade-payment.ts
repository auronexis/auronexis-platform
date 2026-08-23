import "server-only";

import { randomUUID } from "node:crypto";

import { SequenceType } from "@mollie/api-client";

import { getPlanByKey } from "@/lib/billing/plans";
import {
  UPGRADE_CHECKOUT_UNAVAILABLE_MESSAGE,
  UPGRADE_PAYMENT_IN_PROGRESS_MESSAGE,
  UPGRADE_PAYMENT_SYNC_NEEDED_MESSAGE,
} from "@/lib/billing/plan-change";
import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import {
  formatMollieAmount,
  isMolliePaymentPending,
  isMollieSelfServePlanKey,
  type MollieSelfServePlanKey,
} from "@/lib/billing/providers/mollie/checkout";
import {
  MOLLIE_METADATA_BILLING_SURFACE,
  MOLLIE_METADATA_ORGANIZATION_ID,
  MOLLIE_METADATA_PLAN_KEY,
} from "@/lib/billing/providers/mollie/foundation";
import {
  isMolliePaymentPaid,
  isMolliePaymentTerminalFailure,
  mapMollieSubscriptionStatus,
} from "@/lib/billing/providers/mollie/lifecycle-status";
import { assertMolliePaymentOpsAllowed } from "@/lib/billing/providers/mollie/mode";
import {
  getMollieOrganizationSubscription,
  upsertMollieOrganizationSubscription,
} from "@/lib/billing/providers/mollie/organization-sync";
import {
  calculateMollieUpgradeProration,
  type MollieUpgradeProration,
} from "@/lib/billing/providers/mollie/upgrade-proration";
import { getAppUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrganizationSubscription } from "@/types/database";

export const MOLLIE_BILLING_PURPOSE_INITIAL_PURCHASE = "initial_purchase";
export const MOLLIE_BILLING_PURPOSE_UPGRADE_ADJUSTMENT = "upgrade_adjustment";
export const MOLLIE_BILLING_PURPOSE_RENEWAL = "renewal";

export {
  UPGRADE_CHECKOUT_UNAVAILABLE_MESSAGE,
  UPGRADE_PAYMENT_IN_PROGRESS_MESSAGE,
  UPGRADE_PAYMENT_SYNC_NEEDED_MESSAGE,
};
export type { MollieUpgradeProration };

function buildMollieWebhookUrl(): string {
  return `${getAppUrl()}/api/mollie/webhook`;
}

function buildMollieUpgradeReturnUrl(attemptId: string): string {
  return `${getAppUrl()}/settings/billing/mollie/return?attempt=${encodeURIComponent(attemptId)}&purpose=upgrade`;
}

function buildIdempotencyKey(organizationId: string, operation: string, attemptId: string): string {
  return `mollie:prod:${organizationId}:${operation}:${attemptId}`.slice(0, 255);
}

function logUpgradeStage(
  stage: string,
  details: Record<string, string | number | boolean | null | undefined>,
): void {
  console.info(`[billing][upgrade] ${stage}`, details);
}

export type MollieUpgradePaymentCheckoutResult = {
  checkoutUrl: string;
  paymentId: string;
  checkoutAttemptId: string;
  proration: MollieUpgradeProration;
  pendingSyncMessage: string;
  reusedOpenPayment?: boolean;
};

async function persistUpgradePaymentAttempt(input: {
  organizationId: string;
  paymentId: string;
  targetPlanKey: MollieSelfServePlanKey;
}): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("organization_subscriptions")
    .update({
      upgrade_payment_id: input.paymentId,
      upgrade_target_plan: input.targetPlanKey,
      updated_at: now,
    } as never)
    .eq("organization_id", input.organizationId)
    .eq("billing_provider", "mollie");

  if (error) {
    throw new Error(`Failed to persist upgrade payment attempt: ${error.message}`);
  }
}

export async function clearMollieUpgradePaymentAttempt(organizationId: string): Promise<void> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  await admin
    .from("organization_subscriptions")
    .update({
      upgrade_payment_id: null,
      upgrade_target_plan: null,
      updated_at: now,
    } as never)
    .eq("organization_id", organizationId)
    .eq("billing_provider", "mollie");
}

async function resolveOpenUpgradePaymentCheckout(input: {
  paymentId: string;
  organizationId: string;
  targetPlanKey: MollieSelfServePlanKey;
}): Promise<{ paymentId: string; checkoutUrl: string; checkoutAttemptId: string } | null> {
  if (!input.paymentId.startsWith("tr_")) {
    return null;
  }

  const client = createMollieBillingClient();
  const payment = await client.payments.get(input.paymentId);
  const metadata =
    payment.metadata && typeof payment.metadata === "object"
      ? (payment.metadata as Record<string, unknown>)
      : null;
  const purpose = metadata?.auroranexis_billing_purpose;
  const orgMeta = metadata?.[MOLLIE_METADATA_ORGANIZATION_ID];
  const planMeta = metadata?.[MOLLIE_METADATA_PLAN_KEY];

  if (
    purpose !== MOLLIE_BILLING_PURPOSE_UPGRADE_ADJUSTMENT ||
    orgMeta !== input.organizationId ||
    planMeta !== input.targetPlanKey
  ) {
    return null;
  }

  if (isMolliePaymentPaid(payment.status)) {
    throw new Error(UPGRADE_PAYMENT_SYNC_NEEDED_MESSAGE);
  }

  if (isMolliePaymentTerminalFailure(payment.status)) {
    await clearMollieUpgradePaymentAttempt(input.organizationId);
    logUpgradeStage("upgrade_attempt_create", {
      organizationId: input.organizationId,
      clearedStalePaymentId: input.paymentId,
      status: String(payment.status),
    });
    return null;
  }

  if (!isMolliePaymentPending(payment.status)) {
    return null;
  }

  const checkoutUrl = payment._links?.checkout?.href;
  if (!checkoutUrl) {
    await clearMollieUpgradePaymentAttempt(input.organizationId);
    return null;
  }

  const attemptMeta = metadata?.auroranexis_checkout_attempt_id;
  const checkoutAttemptId =
    typeof attemptMeta === "string" && attemptMeta.length > 0 ? attemptMeta : randomUUID();
  return { paymentId: payment.id, checkoutUrl, checkoutAttemptId };
}

async function findReusableOpenUpgradePayment(input: {
  customerId: string;
  organizationId: string;
  targetPlanKey: MollieSelfServePlanKey;
}): Promise<{ paymentId: string; checkoutUrl: string; checkoutAttemptId: string } | null> {
  const client = createMollieBillingClient();
  const payments = await client.customerPayments.page({ customerId: input.customerId });

  for (const payment of payments) {
    const metadata = payment.metadata as Record<string, unknown> | null;
    const purpose = metadata?.auroranexis_billing_purpose;
    if (purpose !== MOLLIE_BILLING_PURPOSE_UPGRADE_ADJUSTMENT) {
      continue;
    }
    const orgMeta = metadata?.[MOLLIE_METADATA_ORGANIZATION_ID];
    const planMeta = metadata?.[MOLLIE_METADATA_PLAN_KEY];
    if (orgMeta !== input.organizationId || planMeta !== input.targetPlanKey) {
      continue;
    }
    if (!isMolliePaymentPending(payment.status)) {
      continue;
    }
    const checkoutUrl = payment._links?.checkout?.href;
    if (!checkoutUrl) {
      continue;
    }
    const attemptMeta = metadata?.auroranexis_checkout_attempt_id;
    const checkoutAttemptId =
      typeof attemptMeta === "string" && attemptMeta.length > 0 ? attemptMeta : randomUUID();
    return { paymentId: payment.id, checkoutUrl, checkoutAttemptId };
  }

  return null;
}

/**
 * Ensure period boundaries exist for proration. Recovered active subscriptions may
 * lack local bounds even when Mollie nextPaymentDate is available — refresh generically.
 */
async function resolveUpgradePeriodBounds(existing: OrganizationSubscription): Promise<{
  currentPeriodStart: string;
  currentPeriodEnd: string;
}> {
  if (existing.current_period_start && existing.current_period_end) {
    return {
      currentPeriodStart: existing.current_period_start,
      currentPeriodEnd: existing.current_period_end,
    };
  }

  if (
    !existing.provider_customer_id?.startsWith("cst_") ||
    !existing.provider_subscription_id?.startsWith("sub_")
  ) {
    throw new Error(
      "Billing period boundaries are unavailable — refusing prorated upgrade. Contact support.",
    );
  }

  const client = createMollieBillingClient();
  const remote = await client.customerSubscriptions.get(existing.provider_subscription_id, {
    customerId: existing.provider_customer_id,
  });
  const nextPaymentDate =
    typeof remote.nextPaymentDate === "string" && remote.nextPaymentDate.length > 0
      ? remote.nextPaymentDate
      : null;
  if (!nextPaymentDate) {
    throw new Error(
      "Billing period boundaries are unavailable — refusing prorated upgrade. Contact support.",
    );
  }

  const periodEnd = nextPaymentDate.includes("T")
    ? nextPaymentDate
    : `${nextPaymentDate}T00:00:00.000Z`;
  const endMs = Date.parse(periodEnd);
  const periodStart =
    existing.current_period_start ??
    new Date(endMs - 30 * 24 * 60 * 60 * 1000).toISOString();

  await upsertMollieOrganizationSubscription({
    organizationId: existing.organization_id,
    providerCustomerId: existing.provider_customer_id,
    providerSubscriptionId: existing.provider_subscription_id,
    planKey: (existing.provider_price_id && isMollieSelfServePlanKey(existing.provider_price_id)
      ? existing.provider_price_id
      : "professional") as MollieSelfServePlanKey,
    providerStatus: remote.status ?? existing.provider_status,
    normalizedStatus: mapMollieSubscriptionStatus(remote.status ?? existing.provider_status),
    syncPending: false,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
  });

  logUpgradeStage("upgrade_proration", {
    organizationId: existing.organization_id,
    refreshedPeriodBounds: true,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
  });

  return { currentPeriodStart: periodStart, currentPeriodEnd: periodEnd };
}

/**
 * Create a dedicated one-off Mollie payment for prorated upgrade difference.
 * Business entitlements activate only after webhook confirms payment paid.
 * Recovered active Professional subscriptions are eligible (no org-id special case).
 */
export async function createMollieUpgradePaymentCheckout(input: {
  organizationId: string;
  targetPlanKey: MollieSelfServePlanKey;
}): Promise<MollieUpgradePaymentCheckoutResult> {
  assertMolliePaymentOpsAllowed();

  if (!isMollieSelfServePlanKey(input.targetPlanKey)) {
    throw new Error("Enterprise plan changes are manual-only.");
  }

  logUpgradeStage("upgrade_validate", {
    organizationId: input.organizationId,
    targetPlanKey: input.targetPlanKey,
  });

  const existing = await getMollieOrganizationSubscription(input.organizationId);
  if (!existing?.provider_subscription_id?.startsWith("sub_")) {
    throw new Error("No active Mollie subscription to upgrade.");
  }
  if (!existing.provider_customer_id?.startsWith("cst_")) {
    throw new Error("Mollie customer mapping missing — refusing upgrade.");
  }
  if (existing.cancel_at_period_end) {
    throw new Error("Upgrades are unavailable while cancellation is scheduled.");
  }
  if (existing.pending_plan) {
    throw new Error(
      "A plan change is already scheduled. Wait for it to take effect or cancel it first.",
    );
  }

  const previousPlanKey = existing.provider_price_id ?? "";
  if (!isMollieSelfServePlanKey(previousPlanKey)) {
    throw new Error("Current Mollie plan mapping is invalid — refusing upgrade.");
  }
  if (previousPlanKey === input.targetPlanKey) {
    throw new Error("This is your organization's current plan.");
  }

  const previousPlan = getPlanByKey(previousPlanKey);
  const targetPlan = getPlanByKey(input.targetPlanKey);
  if (targetPlan.order <= previousPlan.order) {
    throw new Error("Use scheduled plan change for downgrades.");
  }

  // In-flight attempt: reuse open checkout, clear terminal failures, refuse paid-awaiting-sync.
  if (existing.upgrade_payment_id) {
    const tracked = await resolveOpenUpgradePaymentCheckout({
      paymentId: existing.upgrade_payment_id,
      organizationId: input.organizationId,
      targetPlanKey: input.targetPlanKey,
    });
    if (tracked) {
      const periodBounds = await resolveUpgradePeriodBounds(existing);
      const proration = calculateMollieUpgradeProration({
        previousPlanKey,
        targetPlanKey: input.targetPlanKey,
        currentPeriodStart: periodBounds.currentPeriodStart,
        currentPeriodEnd: periodBounds.currentPeriodEnd,
      });
      logUpgradeStage("upgrade_payment_redirect", {
        organizationId: input.organizationId,
        paymentId: tracked.paymentId,
        reusedOpenPayment: true,
        netDueCents: proration.netDueCents,
      });
      return {
        checkoutUrl: tracked.checkoutUrl,
        paymentId: tracked.paymentId,
        checkoutAttemptId: tracked.checkoutAttemptId,
        proration,
        pendingSyncMessage:
          "Upgrade checkout opened. Your plan updates after Mollie confirms payment — this may take a moment.",
        reusedOpenPayment: true,
      };
    }
  }

  const periodBounds = await resolveUpgradePeriodBounds(existing);
  const proration = calculateMollieUpgradeProration({
    previousPlanKey,
    targetPlanKey: input.targetPlanKey,
    currentPeriodStart: periodBounds.currentPeriodStart,
    currentPeriodEnd: periodBounds.currentPeriodEnd,
  });

  logUpgradeStage("upgrade_proration", {
    organizationId: input.organizationId,
    previousPlanKey,
    targetPlanKey: input.targetPlanKey,
    netDueCents: proration.netDueCents,
    remainingMs: proration.remainingMs,
    totalPeriodMs: proration.totalPeriodMs,
  });

  if (proration.netDueCents <= 0) {
    throw new Error("No prorated amount due for this upgrade — contact support.");
  }

  const reusable = await findReusableOpenUpgradePayment({
    customerId: existing.provider_customer_id,
    organizationId: input.organizationId,
    targetPlanKey: input.targetPlanKey,
  });
  if (reusable) {
    await persistUpgradePaymentAttempt({
      organizationId: input.organizationId,
      paymentId: reusable.paymentId,
      targetPlanKey: input.targetPlanKey,
    });
    logUpgradeStage("upgrade_payment_redirect", {
      organizationId: input.organizationId,
      paymentId: reusable.paymentId,
      reusedOpenPayment: true,
      netDueCents: proration.netDueCents,
    });
    return {
      checkoutUrl: reusable.checkoutUrl,
      paymentId: reusable.paymentId,
      checkoutAttemptId: reusable.checkoutAttemptId,
      proration,
      pendingSyncMessage:
        "Upgrade checkout opened. Your plan updates after Mollie confirms payment — this may take a moment.",
      reusedOpenPayment: true,
    };
  }

  // After clearing a terminal in-flight id, refuse only when a non-reusable tracked id remains.
  if (existing.upgrade_payment_id) {
    const refreshed = await getMollieOrganizationSubscription(input.organizationId);
    if (refreshed?.upgrade_payment_id) {
      throw new Error(UPGRADE_PAYMENT_IN_PROGRESS_MESSAGE);
    }
  }

  const checkoutAttemptId = randomUUID();
  const client = createMollieBillingClient();
  const amountValue = formatMollieAmount(proration.netDueCents / 100);

  logUpgradeStage("upgrade_attempt_create", {
    organizationId: input.organizationId,
    checkoutAttemptId,
    netDueCents: proration.netDueCents,
  });

  let payment;
  try {
    payment = await client.customerPayments.create({
      customerId: existing.provider_customer_id,
      idempotencyKey: buildIdempotencyKey(input.organizationId, "upgrade_adjustment", checkoutAttemptId),
      amount: { currency: proration.currency, value: amountValue },
      description: `Auroranexis upgrade adjustment — ${previousPlan.name} to ${targetPlan.name}`,
      sequenceType: SequenceType.oneoff,
      redirectUrl: buildMollieUpgradeReturnUrl(checkoutAttemptId),
      webhookUrl: buildMollieWebhookUrl(),
      metadata: {
        [MOLLIE_METADATA_ORGANIZATION_ID]: input.organizationId,
        [MOLLIE_METADATA_PLAN_KEY]: input.targetPlanKey,
        [MOLLIE_METADATA_BILLING_SURFACE]: "production",
        auroranexis_billing_purpose: MOLLIE_BILLING_PURPOSE_UPGRADE_ADJUSTMENT,
        auroranexis_checkout_attempt_id: checkoutAttemptId,
        auroranexis_previous_plan_key: previousPlanKey,
        auroranexis_provider_subscription_id: existing.provider_subscription_id,
        auroranexis_proration_net_due_cents: String(proration.netDueCents),
      },
    });
  } catch (providerError) {
    logUpgradeStage("upgrade_payment_create", {
      organizationId: input.organizationId,
      result: "provider_error",
      message: providerError instanceof Error ? providerError.message : String(providerError),
    });
    throw new Error(UPGRADE_CHECKOUT_UNAVAILABLE_MESSAGE);
  }

  logUpgradeStage("upgrade_payment_create", {
    organizationId: input.organizationId,
    paymentId: payment.id,
    result: "created",
  });

  const checkoutUrl = payment._links?.checkout?.href;
  if (!checkoutUrl) {
    throw new Error("Mollie upgrade payment missing hosted checkout URL.");
  }

  await persistUpgradePaymentAttempt({
    organizationId: input.organizationId,
    paymentId: payment.id,
    targetPlanKey: input.targetPlanKey,
  });

  logUpgradeStage("upgrade_payment_redirect", {
    organizationId: input.organizationId,
    paymentId: payment.id,
    checkoutAttemptId,
    reusedOpenPayment: false,
  });

  return {
    checkoutUrl,
    paymentId: payment.id,
    checkoutAttemptId,
    proration,
    pendingSyncMessage:
      "Upgrade checkout opened. Your plan updates after Mollie confirms payment — this may take a moment.",
  };
}

export { calculateMollieUpgradeProration };
