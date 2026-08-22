import "server-only";

import { randomUUID } from "node:crypto";

import { SequenceType } from "@mollie/api-client";

import { getPlanByKey } from "@/lib/billing/plans";
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
import { assertMolliePaymentOpsAllowed } from "@/lib/billing/providers/mollie/mode";
import { getMollieOrganizationSubscription } from "@/lib/billing/providers/mollie/organization-sync";
import { getAppUrl } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const MOLLIE_BILLING_PURPOSE_INITIAL_PURCHASE = "initial_purchase";
export const MOLLIE_BILLING_PURPOSE_UPGRADE_ADJUSTMENT = "upgrade_adjustment";
export const MOLLIE_BILLING_PURPOSE_RENEWAL = "renewal";

export type MollieUpgradeProration = {
  previousPlanKey: MollieSelfServePlanKey;
  targetPlanKey: MollieSelfServePlanKey;
  periodStart: string;
  periodEnd: string;
  remainingMs: number;
  totalPeriodMs: number;
  previousPriceCents: number;
  targetPriceCents: number;
  netDueCents: number;
  currency: string;
  formattedNetDue: string;
};

function buildMollieWebhookUrl(): string {
  return `${getAppUrl()}/api/mollie/webhook`;
}

function buildMollieUpgradeReturnUrl(attemptId: string): string {
  return `${getAppUrl()}/settings/billing/mollie/return?attempt=${encodeURIComponent(attemptId)}&purpose=upgrade`;
}

function buildIdempotencyKey(organizationId: string, operation: string, attemptId: string): string {
  return `mollie:prod:${organizationId}:${operation}:${attemptId}`.slice(0, 255);
}

/**
 * Proration: (target_price - current_price) * (remaining_time / total_period_time)
 * using minor units. Fails closed when period bounds are unavailable.
 */
export function calculateMollieUpgradeProration(input: {
  previousPlanKey: MollieSelfServePlanKey;
  targetPlanKey: MollieSelfServePlanKey;
  currentPeriodStart: string | null | undefined;
  currentPeriodEnd: string | null | undefined;
  referenceDate?: Date;
}): MollieUpgradeProration {
  if (!input.currentPeriodStart || !input.currentPeriodEnd) {
    throw new Error(
      "Billing period boundaries are unavailable — refusing prorated upgrade. Contact support.",
    );
  }

  const periodStartMs = Date.parse(input.currentPeriodStart);
  const periodEndMs = Date.parse(input.currentPeriodEnd);
  if (!Number.isFinite(periodStartMs) || !Number.isFinite(periodEndMs) || periodEndMs <= periodStartMs) {
    throw new Error("Billing period boundaries are invalid — refusing prorated upgrade.");
  }

  const now = input.referenceDate ?? new Date();
  const remainingMs = Math.max(0, periodEndMs - now.getTime());
  const totalPeriodMs = periodEndMs - periodStartMs;

  const previousPlan = getPlanByKey(input.previousPlanKey);
  const targetPlan = getPlanByKey(input.targetPlanKey);
  const previousPriceCents = previousPlan.priceMonthly * 100;
  const targetPriceCents = targetPlan.priceMonthly * 100;

  const priceDeltaCents = targetPriceCents - previousPriceCents;
  const netDueCents = Math.max(
    0,
    Math.round((priceDeltaCents * remainingMs) / totalPeriodMs),
  );

  return {
    previousPlanKey: input.previousPlanKey,
    targetPlanKey: input.targetPlanKey,
    periodStart: input.currentPeriodStart,
    periodEnd: input.currentPeriodEnd,
    remainingMs,
    totalPeriodMs,
    previousPriceCents,
    targetPriceCents,
    netDueCents,
    currency: targetPlan.currency,
    formattedNetDue: formatMollieAmount(netDueCents / 100),
  };
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
 * Create a dedicated one-off Mollie payment for prorated upgrade difference.
 * Business entitlements activate only after webhook confirms payment paid.
 */
export async function createMollieUpgradePaymentCheckout(input: {
  organizationId: string;
  targetPlanKey: MollieSelfServePlanKey;
}): Promise<MollieUpgradePaymentCheckoutResult> {
  assertMolliePaymentOpsAllowed();

  if (!isMollieSelfServePlanKey(input.targetPlanKey)) {
    throw new Error("Enterprise plan changes are manual-only.");
  }

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
  if (existing.upgrade_payment_id) {
    throw new Error(
      "An upgrade payment is already in progress. Complete or wait for it to expire before retrying.",
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

  const proration = calculateMollieUpgradeProration({
    previousPlanKey,
    targetPlanKey: input.targetPlanKey,
    currentPeriodStart: existing.current_period_start,
    currentPeriodEnd: existing.current_period_end,
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

  const checkoutAttemptId = randomUUID();
  const client = createMollieBillingClient();
  const amountValue = formatMollieAmount(proration.netDueCents / 100);

  const payment = await client.customerPayments.create({
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

  const checkoutUrl = payment._links?.checkout?.href;
  if (!checkoutUrl) {
    throw new Error("Mollie upgrade payment missing hosted checkout URL.");
  }

  await persistUpgradePaymentAttempt({
    organizationId: input.organizationId,
    paymentId: payment.id,
    targetPlanKey: input.targetPlanKey,
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
