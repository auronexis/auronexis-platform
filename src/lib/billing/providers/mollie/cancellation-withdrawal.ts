import "server-only";

import { getPlanByKey } from "@/lib/billing/plans";
import {
  formatMollieAmount,
  isMollieSelfServePlanKey,
  type MollieSelfServePlanKey,
} from "@/lib/billing/providers/mollie/checkout";
import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import {
  MOLLIE_METADATA_BILLING_SURFACE,
  MOLLIE_METADATA_ORGANIZATION_ID,
  MOLLIE_METADATA_PLAN_KEY,
} from "@/lib/billing/providers/mollie/foundation";
import { buildMollieIdempotencyKey } from "@/lib/billing/providers/mollie/idempotency-key";
import {
  isMollieSubscriptionEntitlementGranting,
  resolveMollieStoredSubscriptionStatus,
} from "@/lib/billing/providers/mollie/lifecycle-status";
import { assertMolliePaymentOpsAllowed } from "@/lib/billing/providers/mollie/mode";
import {
  getMollieOrganizationSubscription,
  upsertMollieOrganizationSubscription,
} from "@/lib/billing/providers/mollie/organization-sync";
import {
  SUBSCRIPTION_CANCELLATION_WITHDRAW_ALREADY_MESSAGE,
  SUBSCRIPTION_CANCELLATION_WITHDRAW_EXPIRED_MESSAGE,
  SUBSCRIPTION_CANCELLATION_WITHDRAW_NOT_SCHEDULED_MESSAGE,
  isSubscriptionPaidThroughPeriodEnd,
} from "@/lib/billing/subscription-management";
import { getAppUrl } from "@/lib/env";

export type MollieSubscriptionCancellationWithdrawResult = {
  withdrawn: true;
  alreadyWithdrawn: boolean;
  planKey: MollieSelfServePlanKey;
  providerSubscriptionId: string;
  previousProviderSubscriptionId: string | null;
  renewalAt: string | null;
  mandateId: string | null;
};

function buildMollieWebhookUrl(): string {
  return `${getAppUrl()}/api/mollie/webhook`;
}

function toMollieStartDate(isoOrDate: string): string {
  const parsed = new Date(isoOrDate);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid billing period end — cannot schedule renewal start date.");
  }
  return parsed.toISOString().slice(0, 10);
}

/**
 * Withdraw a scheduled Mollie cancellation before current_period_end.
 *
 * Mollie has no reactivate API for a canceled sub_ id
 * (`MOLLIE_SUPPORTS_SUBSCRIPTION_REACTIVATION = false`).
 *
 * Strategy: recreate a NEW subscription using the existing customer + valid mandate with
 * `startDate = current_period_end` so Mollie does NOT charge immediately. Next renewal
 * aligns with the already-paid period boundary.
 *
 * Idempotent: already withdrawn / active replacement → success no-op.
 * Rejects after period end.
 */
export async function withdrawMollieOrganizationSubscriptionCancellation(input: {
  organizationId: string;
}): Promise<MollieSubscriptionCancellationWithdrawResult> {
  assertMolliePaymentOpsAllowed();

  const existing = await getMollieOrganizationSubscription(input.organizationId);
  if (!existing?.provider_customer_id?.startsWith("cst_")) {
    throw new Error("Mollie customer mapping missing — refusing cancellation withdrawal.");
  }
  if (existing.billing_provider !== "mollie") {
    throw new Error("Cancellation withdrawal is only available for Mollie-billed workspaces.");
  }

  const planKey: MollieSelfServePlanKey = isMollieSelfServePlanKey(existing.provider_price_id ?? "")
    ? (existing.provider_price_id as MollieSelfServePlanKey)
    : "professional";

  const periodEnd = existing.current_period_end;
  const paidThrough = isSubscriptionPaidThroughPeriodEnd({
    cancelAtPeriodEnd: existing.cancel_at_period_end,
    currentPeriodEnd: periodEnd,
  });

  // Already restored — treat as successful no-op (double-click / retry safe).
  if (!existing.cancel_at_period_end) {
    if (existing.provider_subscription_id?.startsWith("sub_")) {
      console.info("[billing][subscription-withdraw] already withdrawn (no-op)", {
        organizationId: input.organizationId,
        subscriptionId: existing.provider_subscription_id,
      });
      return {
        withdrawn: true,
        alreadyWithdrawn: true,
        planKey,
        providerSubscriptionId: existing.provider_subscription_id,
        previousProviderSubscriptionId: null,
        renewalAt: periodEnd,
        mandateId: null,
      };
    }
    throw new Error(SUBSCRIPTION_CANCELLATION_WITHDRAW_ALREADY_MESSAGE);
  }

  if (!paidThrough || !periodEnd) {
    throw new Error(
      periodEnd
        ? SUBSCRIPTION_CANCELLATION_WITHDRAW_EXPIRED_MESSAGE
        : SUBSCRIPTION_CANCELLATION_WITHDRAW_NOT_SCHEDULED_MESSAGE,
    );
  }

  const periodEndMs = new Date(periodEnd).getTime();
  if (Number.isNaN(periodEndMs) || periodEndMs <= Date.now()) {
    throw new Error(SUBSCRIPTION_CANCELLATION_WITHDRAW_EXPIRED_MESSAGE);
  }

  const customerId = existing.provider_customer_id;
  const previousSubscriptionId = existing.provider_subscription_id?.startsWith("sub_")
    ? existing.provider_subscription_id
    : null;

  const client = createMollieBillingClient();
  const plan = getPlanByKey(planKey);
  const amountValue = formatMollieAmount(plan.priceMonthly);
  const startDate = toMollieStartDate(periodEnd);

  const mandates = await client.customerMandates.page({ customerId });
  const usableMandate = mandates.find(
    (mandate) => mandate.status === "valid" || mandate.status === "pending",
  );
  if (!usableMandate) {
    throw new Error(
      "No usable Mollie mandate on file — cannot restore renewal without a new checkout.",
    );
  }

  // Adopt any existing active/pending subscription for this customer (duplicate protection).
  const remoteSubscriptions = await client.customerSubscriptions.page({ customerId });
  const activeReplacement = remoteSubscriptions.find(
    (subscription) =>
      subscription.id !== previousSubscriptionId &&
      isMollieSubscriptionEntitlementGranting(subscription.status),
  );

  if (activeReplacement) {
    await upsertMollieOrganizationSubscription({
      organizationId: input.organizationId,
      providerCustomerId: customerId,
      providerSubscriptionId: activeReplacement.id,
      planKey,
      providerStatus: activeReplacement.status,
      normalizedStatus: resolveMollieStoredSubscriptionStatus({
        providerStatus: activeReplacement.status,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: periodEnd,
      }),
      syncPending: false,
      cancelAtPeriodEnd: false,
      currentPeriodStart: existing.current_period_start,
      currentPeriodEnd: periodEnd,
      clearPendingPlanChange: true,
    });

    console.info("[billing][subscription-withdraw] adopted existing active Mollie subscription", {
      organizationId: input.organizationId,
      previousSubscriptionId,
      subscriptionId: activeReplacement.id,
      startDate,
    });

    return {
      withdrawn: true,
      alreadyWithdrawn: true,
      planKey,
      providerSubscriptionId: activeReplacement.id,
      previousProviderSubscriptionId: previousSubscriptionId,
      renewalAt: periodEnd,
      mandateId: usableMandate.id,
    };
  }

  // Recreate with future startDate — Mollie charges on startDate, not immediately.
  const attemptId = `withdraw:${previousSubscriptionId ?? "none"}:${startDate}`;
  const created = await client.customerSubscriptions.create({
    customerId,
    idempotencyKey: buildMollieIdempotencyKey({
      surface: "prod",
      organizationId: input.organizationId,
      operation: "withdraw_cancel",
      attemptId,
    }),
    amount: { currency: plan.currency, value: amountValue },
    interval: "1 month",
    startDate,
    mandateId: usableMandate.id,
    description: `Auroranexis ${plan.name} subscription`,
    webhookUrl: buildMollieWebhookUrl(),
    metadata: {
      [MOLLIE_METADATA_ORGANIZATION_ID]: input.organizationId,
      [MOLLIE_METADATA_PLAN_KEY]: planKey,
      [MOLLIE_METADATA_BILLING_SURFACE]: "production",
      auroranexis_cancellation_withdrawn: "true",
      auroranexis_previous_subscription_id: previousSubscriptionId ?? "",
      auroranexis_renewal_start: startDate,
    },
  });

  // Preserve paid-through period bounds; do not invent a new period start at "now".
  // Pending Mollie subscription (awaiting startDate) still maps to local active paid-through.
  await upsertMollieOrganizationSubscription({
    organizationId: input.organizationId,
    providerCustomerId: customerId,
    providerSubscriptionId: created.id,
    planKey,
    providerStatus: created.status,
    normalizedStatus: "active",
    syncPending: false,
    cancelAtPeriodEnd: false,
    currentPeriodStart: existing.current_period_start,
    currentPeriodEnd: periodEnd,
    clearPendingPlanChange: true,
  });

  console.info("[billing][subscription-withdraw] cancellation withdrawn — subscription recreated", {
    organizationId: input.organizationId,
    previousSubscriptionId,
    subscriptionId: created.id,
    startDate,
    mandateId: usableMandate.id,
    immediateCharge: false,
  });

  return {
    withdrawn: true,
    alreadyWithdrawn: false,
    planKey,
    providerSubscriptionId: created.id,
    previousProviderSubscriptionId: previousSubscriptionId,
    renewalAt: periodEnd,
    mandateId: usableMandate.id,
  };
}
