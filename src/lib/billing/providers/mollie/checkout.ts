import "server-only";

import { randomUUID } from "node:crypto";

import { PaymentStatus, SequenceType } from "@mollie/api-client";

import { getPlanByKey, type PlanKey } from "@/lib/billing/plans";
import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import { getOrCreateMollieCustomer } from "@/lib/billing/providers/mollie/customer";
import {
  MOLLIE_METADATA_CHECKOUT_ATTEMPT_ID,
  MOLLIE_METADATA_ORGANIZATION_ID,
  MOLLIE_METADATA_PLAN_KEY,
} from "@/lib/billing/providers/mollie/foundation";
import { assertMollieTestModeOnly, getMollieCredentialMode } from "@/lib/billing/providers/mollie/mode";
import {
  getMollieTestSubscriptionForOrg,
  upsertMollieTestSubscription,
} from "@/lib/billing/providers/mollie/sync";
import { getAppUrl } from "@/lib/env";
import { isMollieApiConfigured } from "@/lib/billing/providers/mollie/env";

/** Self-serve plans eligible for Mollie TEST checkout — enterprise is manual-only. */
export const MOLLIE_SELF_SERVE_PLAN_KEYS = ["professional", "business"] as const satisfies readonly PlanKey[];

export type MollieSelfServePlanKey = (typeof MOLLIE_SELF_SERVE_PLAN_KEYS)[number];

export function isMollieSelfServePlanKey(value: string): value is MollieSelfServePlanKey {
  return (MOLLIE_SELF_SERVE_PLAN_KEYS as readonly string[]).includes(value);
}

export function formatMollieAmount(value: number): string {
  return value.toFixed(2);
}

/** Only paid status proceeds to mandate/subscription creation. */
export function isMolliePaymentPaid(status: string | PaymentStatus | null | undefined): boolean {
  return status === PaymentStatus.paid || status === "paid";
}

export function isMolliePaymentTerminalFailure(
  status: string | PaymentStatus | null | undefined,
): boolean {
  return (
    status === PaymentStatus.failed ||
    status === PaymentStatus.canceled ||
    status === PaymentStatus.expired ||
    status === "failed" ||
    status === "canceled" ||
    status === "expired"
  );
}

export function isMolliePaymentPending(
  status: string | PaymentStatus | null | undefined,
): boolean {
  return (
    status === PaymentStatus.open ||
    status === PaymentStatus.pending ||
    status === "open" ||
    status === "pending"
  );
}

export function mapMollieSubscriptionStatus(
  status: string | null | undefined,
): "active" | "canceled" | "inactive" | "past_due" {
  switch ((status ?? "").toLowerCase()) {
    case "active":
      return "active";
    case "canceled":
    case "cancelled":
      return "canceled";
    case "suspended":
    case "completed":
      return "past_due";
    default:
      return "inactive";
  }
}

function buildMollieWebhookUrl(): string {
  return `${getAppUrl()}/api/mollie/webhook`;
}

function buildMollieReturnUrl(checkoutAttemptId: string): string {
  return `${getAppUrl()}/settings/billing/mollie-test/return?attempt=${encodeURIComponent(checkoutAttemptId)}`;
}

function buildIdempotencyKey(organizationId: string, operation: string, attemptId: string): string {
  return `mollie:${organizationId}:${operation}:${attemptId}`.slice(0, 255);
}

export type MollieFirstPaymentResult = {
  paymentId: string;
  checkoutUrl: string;
  checkoutAttemptId: string;
  customerId: string;
};

/**
 * Create a first payment (sequenceType=first) for mandate authorization.
 * TEST mode only. Canonical amount/currency from SUBSCRIPTION_PLANS.
 */
export async function createMollieFirstPayment(input: {
  organizationId: string;
  organizationName: string;
  ownerEmail: string;
  planKey: MollieSelfServePlanKey;
}): Promise<MollieFirstPaymentResult> {
  assertMollieTestModeOnly();

  if (!isMollieSelfServePlanKey(input.planKey)) {
    throw new Error("Enterprise and invite-only plans are not available via Mollie self-serve checkout.");
  }

  const plan = getPlanByKey(input.planKey);
  const checkoutAttemptId = randomUUID();

  const { customerId } = await getOrCreateMollieCustomer({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    ownerEmail: input.ownerEmail,
  });

  const existing = await getMollieTestSubscriptionForOrg(input.organizationId);
  if (existing?.first_payment_id?.startsWith("tr_") && existing.sync_pending) {
    const client = createMollieBillingClient();
    const prior = await client.payments.get(existing.first_payment_id);
    if (prior._links?.checkout?.href && isMolliePaymentPending(prior.status)) {
      return {
        paymentId: prior.id,
        checkoutUrl: prior._links.checkout.href,
        checkoutAttemptId: existing.checkout_attempt_id ?? checkoutAttemptId,
        customerId,
      };
    }
  }

  const amountValue = formatMollieAmount(plan.priceMonthly);
  const client = createMollieBillingClient();

  const payment = await client.customerPayments.create({
    customerId,
    idempotencyKey: buildIdempotencyKey(input.organizationId, "first_payment", checkoutAttemptId),
    amount: { currency: plan.currency, value: amountValue },
    description: `Auroranexis ${plan.name} — first payment (TEST)`,
    sequenceType: SequenceType.first,
    redirectUrl: buildMollieReturnUrl(checkoutAttemptId),
    webhookUrl: buildMollieWebhookUrl(),
    metadata: {
      [MOLLIE_METADATA_ORGANIZATION_ID]: input.organizationId,
      [MOLLIE_METADATA_PLAN_KEY]: input.planKey,
      [MOLLIE_METADATA_CHECKOUT_ATTEMPT_ID]: checkoutAttemptId,
      auroranexis_billing_purpose: "first_payment",
    },
  });

  const checkoutUrl = payment._links?.checkout?.href;
  if (!checkoutUrl) {
    throw new Error("Mollie first payment missing hosted checkout URL.");
  }

  await upsertMollieTestSubscription({
    organization_id: input.organizationId,
    plan_key: input.planKey,
    provider_customer_id: customerId,
    first_payment_id: payment.id,
    checkout_attempt_id: checkoutAttemptId,
    amount_value: amountValue,
    amount_currency: plan.currency,
    provider_price_id: input.planKey,
    sync_pending: true,
    status: "incomplete",
  });

  return {
    paymentId: payment.id,
    checkoutUrl,
    checkoutAttemptId,
    customerId,
  };
}

export type MollieSubscriptionCreateResult = {
  subscriptionId: string;
  mandateId: string;
};

/**
 * After paid first payment, confirm mandate then create Mollie subscription.
 */
export async function createMollieSubscriptionAfterMandate(input: {
  organizationId: string;
  customerId: string;
  planKey: MollieSelfServePlanKey;
  paymentId: string;
}): Promise<MollieSubscriptionCreateResult> {
  assertMollieTestModeOnly();

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

  const existing = await getMollieTestSubscriptionForOrg(input.organizationId);
  if (existing?.provider_subscription_id?.startsWith("sub_")) {
    // Idempotent re-entry (webhook race): keep existing sub mapping, clear sync_pending.
    const mandateId = existing.mandate_id ?? usableMandate.id;
    await upsertMollieTestSubscription({
      organization_id: input.organizationId,
      plan_key: input.planKey,
      provider_customer_id: input.customerId,
      provider_subscription_id: existing.provider_subscription_id,
      mandate_id: mandateId,
      first_payment_id: input.paymentId,
      provider_price_id: input.planKey,
      provider_status: existing.provider_status,
      status: existing.status,
      amount_value: amountValue,
      amount_currency: plan.currency,
      sync_pending: false,
      last_reconciled_at: new Date().toISOString(),
    });
    return {
      subscriptionId: existing.provider_subscription_id,
      mandateId,
    };
  }

  const subscription = await client.customerSubscriptions.create({
    customerId: input.customerId,
    idempotencyKey: buildIdempotencyKey(input.organizationId, "subscription", input.paymentId),
    amount: { currency: plan.currency, value: amountValue },
    interval: "1 month",
    description: `Auroranexis ${plan.name} subscription (TEST)`,
    webhookUrl: buildMollieWebhookUrl(),
    metadata: {
      [MOLLIE_METADATA_ORGANIZATION_ID]: input.organizationId,
      [MOLLIE_METADATA_PLAN_KEY]: input.planKey,
      auroranexis_first_payment_id: input.paymentId,
    },
  });

  await upsertMollieTestSubscription({
    organization_id: input.organizationId,
    plan_key: input.planKey,
    provider_customer_id: input.customerId,
    provider_subscription_id: subscription.id,
    mandate_id: usableMandate.id,
    first_payment_id: input.paymentId,
    provider_price_id: input.planKey,
    provider_status: subscription.status,
    status: mapMollieSubscriptionStatus(subscription.status),
    amount_value: amountValue,
    amount_currency: plan.currency,
    sync_pending: false,
    last_reconciled_at: new Date().toISOString(),
  });

  return {
    subscriptionId: subscription.id,
    mandateId: usableMandate.id,
  };
}

export type MollieTestCheckoutPayload = {
  mode: "test";
  provider: "mollie";
  planKey: MollieSelfServePlanKey;
  planName: string;
  amountValue: string;
  currency: string;
  checkoutUrl: string;
  paymentId: string;
  checkoutAttemptId: string;
};

export function isMollieTestCheckoutConfigured(): boolean {
  return isMollieApiConfigured() && getMollieCredentialMode() === "test";
}

export async function createMollieTestCheckoutPayload(input: {
  organizationId: string;
  organizationName: string;
  ownerEmail: string;
  planKey: MollieSelfServePlanKey;
}): Promise<MollieTestCheckoutPayload> {
  assertMollieTestModeOnly();

  const plan = getPlanByKey(input.planKey);
  const result = await createMollieFirstPayment(input);

  return {
    mode: "test",
    provider: "mollie",
    planKey: input.planKey,
    planName: plan.name,
    amountValue: formatMollieAmount(plan.priceMonthly),
    currency: plan.currency,
    checkoutUrl: result.checkoutUrl,
    paymentId: result.paymentId,
    checkoutAttemptId: result.checkoutAttemptId,
  };
}

export type MollieTestDiagnostics = {
  credentialMode: "test" | "live" | "missing" | "invalid";
  customerMapped: boolean;
  customerIdPrefix: string | null;
  firstPaymentIdPrefix: string | null;
  mandateIdPrefix: string | null;
  subscriptionIdPrefix: string | null;
  planKey: string | null;
  providerStatus: string | null;
  normalizedStatus: string | null;
  syncPending: boolean | null;
  lastReconciledAt: string | null;
};

export async function getMollieTestDiagnostics(
  organizationId: string,
): Promise<MollieTestDiagnostics> {
  const mode = getMollieCredentialMode();
  const credentialMode =
    mode === "test" ? "test" : mode === "live" ? "live" : isMollieApiConfigured() ? "invalid" : "missing";

  const row = await getMollieTestSubscriptionForOrg(organizationId);

  return {
    credentialMode,
    customerMapped: Boolean(row?.provider_customer_id?.startsWith("cst_")),
    customerIdPrefix: row?.provider_customer_id?.slice(0, 8) ?? null,
    firstPaymentIdPrefix: row?.first_payment_id?.slice(0, 8) ?? null,
    mandateIdPrefix: row?.mandate_id?.slice(0, 8) ?? null,
    subscriptionIdPrefix: row?.provider_subscription_id?.slice(0, 8) ?? null,
    planKey: row?.plan_key ?? null,
    providerStatus: row?.provider_status ?? null,
    normalizedStatus: row?.status ?? null,
    syncPending: row?.sync_pending ?? null,
    lastReconciledAt: row?.last_reconciled_at ?? null,
  };
}
