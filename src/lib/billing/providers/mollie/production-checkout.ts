import "server-only";

import { randomUUID } from "node:crypto";

import { SequenceType } from "@mollie/api-client";

import { getPlanByKey } from "@/lib/billing/plans";
import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import {
  formatMollieAmount,
  isMolliePaymentPending,
  isMollieSelfServePlanKey,
  mapMollieSubscriptionStatus,
  type MollieSelfServePlanKey,
} from "@/lib/billing/providers/mollie/checkout";
import { isMollieApiConfigured } from "@/lib/billing/providers/mollie/env";
import {
  MOLLIE_METADATA_CHECKOUT_ATTEMPT_ID,
  MOLLIE_METADATA_ORGANIZATION_ID,
  MOLLIE_METADATA_PLAN_KEY,
  MOLLIE_METADATA_BILLING_SURFACE,
} from "@/lib/billing/providers/mollie/foundation";
import { assertMolliePaymentOpsAllowed, getMollieCredentialMode } from "@/lib/billing/providers/mollie/mode";
import {
  getMollieOrganizationSubscription,
  upsertMollieOrganizationSubscription,
} from "@/lib/billing/providers/mollie/organization-sync";
import { isMollieProductionCheckoutEligible } from "@/lib/billing/providers/mollie/rollout";
import { getAppUrl } from "@/lib/env";

function buildMollieWebhookUrl(): string {
  return `${getAppUrl()}/api/mollie/webhook`;
}

function buildMollieProductionReturnUrl(checkoutAttemptId: string): string {
  return `${getAppUrl()}/settings/billing/mollie/return?attempt=${encodeURIComponent(checkoutAttemptId)}`;
}

function buildIdempotencyKey(organizationId: string, operation: string, attemptId: string): string {
  return `mollie:prod:${organizationId}:${operation}:${attemptId}`.slice(0, 255);
}

/**
 * Idempotent Mollie customer for production canonical billing.
 * Reuses organization_subscriptions.provider_customer_id when present.
 */
export async function getOrCreateMollieOrganizationCustomer(input: {
  organizationId: string;
  organizationName: string;
  ownerEmail: string;
}): Promise<{ customerId: string; created: boolean }> {
  assertMolliePaymentOpsAllowed();

  if (!isMollieProductionCheckoutEligible(input.organizationId)) {
    throw new Error("Organization is not enabled for Mollie production billing.");
  }

  const existing = await getMollieOrganizationSubscription(input.organizationId);
  const existingCustomerId = existing?.provider_customer_id?.trim();
  if (existingCustomerId?.startsWith("cst_")) {
    return { customerId: existingCustomerId, created: false };
  }

  const client = createMollieBillingClient();
  const correlationId = randomUUID();

  const customer = await client.customers.create({
    name: input.organizationName.slice(0, 255) || "Auroranexis Organization",
    email: input.ownerEmail,
    metadata: {
      [MOLLIE_METADATA_ORGANIZATION_ID]: input.organizationId,
      [MOLLIE_METADATA_BILLING_SURFACE]: "production",
      auroranexis_correlation_id: correlationId,
    },
  });

  const customerId = customer.id;
  if (!customerId?.startsWith("cst_")) {
    throw new Error("Mollie customer creation returned an invalid customer id.");
  }

  await upsertMollieOrganizationSubscription({
    organizationId: input.organizationId,
    providerCustomerId: customerId,
    providerSubscriptionId: null,
    planKey: "professional",
    providerStatus: null,
    normalizedStatus: "incomplete",
    syncPending: true,
  });

  return { customerId, created: true };
}

export type MollieProductionCheckoutResult = {
  provider: "mollie";
  mode: "redirect";
  checkoutUrl: string;
  paymentId: string;
  checkoutAttemptId: string;
  planKey: MollieSelfServePlanKey;
  pendingSyncMessage: string;
};

/**
 * Create first payment (sequenceType=first) for Mollie-eligible orgs.
 * Writes pending state to organization_subscriptions — never mollie_test_subscriptions.
 * Amounts come from canonical SUBSCRIPTION_PLANS only.
 */
export async function createMollieProductionFirstPayment(input: {
  organizationId: string;
  organizationName: string;
  ownerEmail: string;
  planKey: MollieSelfServePlanKey;
}): Promise<MollieProductionCheckoutResult> {
  const credentialMode = assertMolliePaymentOpsAllowed();

  if (!isMollieProductionCheckoutEligible(input.organizationId)) {
    throw new Error("Organization is not enabled for Mollie production billing.");
  }

  if (!isMollieSelfServePlanKey(input.planKey)) {
    throw new Error("Enterprise and invite-only plans are not available via Mollie self-serve checkout.");
  }

  const plan = getPlanByKey(input.planKey);
  const checkoutAttemptId = randomUUID();

  const { customerId } = await getOrCreateMollieOrganizationCustomer({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    ownerEmail: input.ownerEmail,
  });

  const existing = await getMollieOrganizationSubscription(input.organizationId);
  // Reuse open first payment when sync still pending (idempotent double-click).
  if (existing?.sync_pending && existing.provider_subscription_id == null) {
    const pendingPaymentHint = existing.provider_status;
    if (pendingPaymentHint === "open" || pendingPaymentHint === "pending") {
      // Cannot recover checkout URL without payment id — create fresh when unknown.
    }
  }

  const amountValue = formatMollieAmount(plan.priceMonthly);
  const client = createMollieBillingClient();

  const payment = await client.customerPayments.create({
    customerId,
    idempotencyKey: buildIdempotencyKey(input.organizationId, "first_payment", checkoutAttemptId),
    amount: { currency: plan.currency, value: amountValue },
    description: `Auroranexis ${plan.name} — first payment`,
    sequenceType: SequenceType.first,
    redirectUrl: buildMollieProductionReturnUrl(checkoutAttemptId),
    webhookUrl: buildMollieWebhookUrl(),
    metadata: {
      [MOLLIE_METADATA_ORGANIZATION_ID]: input.organizationId,
      [MOLLIE_METADATA_PLAN_KEY]: input.planKey,
      [MOLLIE_METADATA_CHECKOUT_ATTEMPT_ID]: checkoutAttemptId,
      [MOLLIE_METADATA_BILLING_SURFACE]: "production",
      auroranexis_billing_purpose: "first_payment",
      auroranexis_credential_mode: credentialMode,
    },
  });

  const checkoutUrl = payment._links?.checkout?.href;
  if (!checkoutUrl) {
    throw new Error("Mollie first payment missing hosted checkout URL.");
  }

  await upsertMollieOrganizationSubscription({
    organizationId: input.organizationId,
    providerCustomerId: customerId,
    providerSubscriptionId: null,
    planKey: input.planKey,
    providerStatus: payment.status,
    normalizedStatus: "incomplete",
    syncPending: true,
  });

  return {
    provider: "mollie",
    mode: "redirect",
    checkoutUrl,
    paymentId: payment.id,
    checkoutAttemptId,
    planKey: input.planKey,
    pendingSyncMessage:
      "Checkout opened. Access updates after Mollie confirms payment via webhook — this may take a moment.",
  };
}

export async function createMollieProductionSubscriptionAfterMandate(input: {
  organizationId: string;
  customerId: string;
  planKey: MollieSelfServePlanKey;
  paymentId: string;
}): Promise<{ subscriptionId: string; mandateId: string }> {
  assertMolliePaymentOpsAllowed();

  const plan = getPlanByKey(input.planKey);
  const amountValue = formatMollieAmount(plan.priceMonthly);
  const client = createMollieBillingClient();

  const mandates = await client.customerMandates.page({ customerId: input.customerId });
  const usableMandate = mandates.find(
    (mandate) => mandate.status === "valid" || mandate.status === "pending",
  );

  if (!usableMandate) {
    throw new Error("No usable Mollie mandate found after paid first payment.");
  }

  const existing = await getMollieOrganizationSubscription(input.organizationId);
  if (existing?.provider_subscription_id?.startsWith("sub_")) {
    await upsertMollieOrganizationSubscription({
      organizationId: input.organizationId,
      providerCustomerId: input.customerId,
      providerSubscriptionId: existing.provider_subscription_id,
      planKey: input.planKey,
      providerStatus: existing.provider_status,
      normalizedStatus: existing.status,
      syncPending: false,
    });
    return {
      subscriptionId: existing.provider_subscription_id,
      mandateId: usableMandate.id,
    };
  }

  const subscription = await client.customerSubscriptions.create({
    customerId: input.customerId,
    idempotencyKey: buildIdempotencyKey(input.organizationId, "subscription", input.paymentId),
    amount: { currency: plan.currency, value: amountValue },
    interval: "1 month",
    description: `Auroranexis ${plan.name} subscription`,
    webhookUrl: buildMollieWebhookUrl(),
    metadata: {
      [MOLLIE_METADATA_ORGANIZATION_ID]: input.organizationId,
      [MOLLIE_METADATA_PLAN_KEY]: input.planKey,
      [MOLLIE_METADATA_BILLING_SURFACE]: "production",
      auroranexis_first_payment_id: input.paymentId,
    },
  });

  const nextPaymentDate =
    typeof subscription.nextPaymentDate === "string" ? subscription.nextPaymentDate : null;

  await upsertMollieOrganizationSubscription({
    organizationId: input.organizationId,
    providerCustomerId: input.customerId,
    providerSubscriptionId: subscription.id,
    planKey: input.planKey,
    providerStatus: subscription.status,
    normalizedStatus: mapMollieSubscriptionStatus(subscription.status),
    syncPending: false,
    currentPeriodEnd: nextPaymentDate,
  });

  return {
    subscriptionId: subscription.id,
    mandateId: usableMandate.id,
  };
}

export function isMollieProductionCheckoutConfigured(): boolean {
  if (!isMollieApiConfigured()) {
    return false;
  }
  const mode = getMollieCredentialMode();
  if (mode === "test") {
    return true;
  }
  if (mode === "live") {
    const liveEnabled =
      process.env.MOLLIE_LIVE_CHARGING_ENABLED?.trim().toLowerCase() === "1" ||
      process.env.MOLLIE_LIVE_CHARGING_ENABLED?.trim().toLowerCase() === "true" ||
      process.env.MOLLIE_LIVE_CHARGING_ENABLED?.trim().toLowerCase() === "yes" ||
      process.env.MOLLIE_LIVE_CHARGING_ENABLED?.trim().toLowerCase() === "on";
    return liveEnabled;
  }
  return false;
}

/** Re-export pending helper for webhook reuse without circular imports. */
export { isMolliePaymentPending };
