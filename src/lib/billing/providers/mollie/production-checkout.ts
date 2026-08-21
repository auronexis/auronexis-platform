import "server-only";

import { randomUUID } from "node:crypto";

import { SequenceType } from "@mollie/api-client";

import {
  hasVerifiedFastSpringSubscription,
  hasVerifiedMollieSubscription,
  isFastSpringBackedSubscription,
  isMollieBackedSubscription,
} from "@/lib/billing/active-billing";
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
import {
  isMollieLiveChargingEnabled,
  isMollieProductionCheckoutEligible,
} from "@/lib/billing/providers/mollie/rollout";
import { isSubscriptionUsable } from "@/lib/billing/status";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/env";
import type { OrganizationSubscription } from "@/types/database";

function buildMollieWebhookUrl(): string {
  return `${getAppUrl()}/api/mollie/webhook`;
}

function buildMollieProductionReturnUrl(checkoutAttemptId: string): string {
  return `${getAppUrl()}/settings/billing/mollie/return?attempt=${encodeURIComponent(checkoutAttemptId)}`;
}

function buildIdempotencyKey(organizationId: string, operation: string, attemptId: string): string {
  return `mollie:prod:${organizationId}:${operation}:${attemptId}`.slice(0, 255);
}

async function readOrganizationSubscriptionRow(
  organizationId: string,
): Promise<OrganizationSubscription | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("organization_subscriptions")
    .select(
      "id, organization_id, billing_provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status, sync_pending, status, cancel_at_period_end, current_period_start, current_period_end, stripe_customer_id, stripe_subscription_id, stripe_price_id, trial_ends_at, created_at, updated_at",
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to read organization subscription: ${error.message}`);
  }

  return (data as OrganizationSubscription | null) ?? null;
}

/**
 * Server-side coexistence: refuse Mollie first payment when FastSpring owns the org.
 */
function assertNoFastSpringConflict(row: OrganizationSubscription | null): void {
  if (!row || !isFastSpringBackedSubscription(row)) {
    return;
  }
  if (hasVerifiedFastSpringSubscription(row) || isSubscriptionUsable(row.provider_status ?? row.status)) {
    throw new Error(
      "Refusing Mollie checkout — organization already has a FastSpring subscription (provider_conflict).",
    );
  }
  throw new Error(
    "Refusing Mollie checkout — organization_subscriptions row is FastSpring-backed (existing_subscription).",
  );
}

/**
 * Duplicate purchase protection: refuse a second first payment when an active
 * or suspended Mollie subscription already exists (use plan change / support instead).
 */
function assertNoDuplicateMollieSubscription(row: OrganizationSubscription | null): void {
  if (!row || !isMollieBackedSubscription(row)) {
    return;
  }
  if (!hasVerifiedMollieSubscription(row)) {
    return;
  }
  const status = (row.provider_status ?? row.status ?? "").toLowerCase();
  if (status === "active" || isSubscriptionUsable(status)) {
    throw new Error(
      "A Mollie subscription already exists for this workspace. Use plan change instead of a new checkout (duplicate_mollie).",
    );
  }
  if (status === "suspended" || status === "past_due") {
    throw new Error(
      "A Mollie subscription already exists for this workspace. Resolve payment issues instead of starting a second subscription (existing_subscription).",
    );
  }
}

/**
 * Reuse an open first-payment checkout URL for the customer (double-click / tab retry).
 * Avoids creating a second Mollie payment when sync is still pending.
 */
async function findReusableOpenFirstPayment(input: {
  customerId: string;
  organizationId: string;
}): Promise<{ paymentId: string; checkoutUrl: string; checkoutAttemptId: string } | null> {
  const client = createMollieBillingClient();
  const payments = await client.customerPayments.page({ customerId: input.customerId });

  for (const payment of payments) {
    if (payment.sequenceType !== SequenceType.first) {
      continue;
    }
    if (!isMolliePaymentPending(payment.status)) {
      continue;
    }
    const checkoutUrl = payment._links?.checkout?.href;
    if (!checkoutUrl) {
      continue;
    }
    const metadata = payment.metadata as Record<string, unknown> | null;
    const orgMeta = metadata?.[MOLLIE_METADATA_ORGANIZATION_ID];
    if (typeof orgMeta === "string" && orgMeta !== input.organizationId) {
      continue;
    }
    const attemptMeta = metadata?.[MOLLIE_METADATA_CHECKOUT_ATTEMPT_ID];
    const checkoutAttemptId =
      typeof attemptMeta === "string" && attemptMeta.length > 0 ? attemptMeta : randomUUID();

    return {
      paymentId: payment.id,
      checkoutUrl,
      checkoutAttemptId,
    };
  }

  return null;
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

  const existing = await getMollieOrganizationSubscription(input.organizationId);
  const existingCustomerId = existing?.provider_customer_id?.trim();
  if (existingCustomerId?.startsWith("cst_")) {
    return { customerId: existingCustomerId, created: false };
  }

  // New customer: allowlist/default-for-new OR existing Mollie ownership (rollback-safe recovery).
  if (!existing && !isMollieProductionCheckoutEligible(input.organizationId)) {
    throw new Error("Organization is not enabled for Mollie production billing.");
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
  reusedOpenPayment?: boolean;
};

/**
 * Create first payment (sequenceType=first) for Mollie-eligible orgs.
 * Writes pending state to organization_subscriptions — never mollie_test_subscriptions.
 * Amounts come from canonical SUBSCRIPTION_PLANS only.
 *
 * Duplicate protection: reuses open first payments; refuses when active/suspended sub_ exists.
 */
export async function createMollieProductionFirstPayment(input: {
  organizationId: string;
  organizationName: string;
  ownerEmail: string;
  planKey: MollieSelfServePlanKey;
}): Promise<MollieProductionCheckoutResult> {
  const credentialMode = assertMolliePaymentOpsAllowed();

  const orgRow = await readOrganizationSubscriptionRow(input.organizationId);
  assertNoFastSpringConflict(orgRow);
  assertNoDuplicateMollieSubscription(orgRow);

  const isOwnedMollie = isMollieBackedSubscription(orgRow);
  if (!isOwnedMollie && !isMollieProductionCheckoutEligible(input.organizationId)) {
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

  // Idempotent double-click / multi-tab: reuse open first payment checkout URL.
  const reusable = await findReusableOpenFirstPayment({
    customerId,
    organizationId: input.organizationId,
  });
  if (reusable) {
    await upsertMollieOrganizationSubscription({
      organizationId: input.organizationId,
      providerCustomerId: customerId,
      providerSubscriptionId: null,
      planKey: input.planKey,
      providerStatus: "open",
      normalizedStatus: "incomplete",
      syncPending: true,
    });

    return {
      provider: "mollie",
      mode: "redirect",
      checkoutUrl: reusable.checkoutUrl,
      paymentId: reusable.paymentId,
      checkoutAttemptId: reusable.checkoutAttemptId,
      planKey: input.planKey,
      pendingSyncMessage:
        "Checkout opened. Access updates after Mollie confirms payment via webhook — this may take a moment.",
      reusedOpenPayment: true,
    };
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
    return isMollieLiveChargingEnabled();
  }
  return false;
}

/** Re-export pending helper for webhook reuse without circular imports. */
export { isMolliePaymentPending };
