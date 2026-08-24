import "server-only";

import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import {
  isMolliePaymentPaid,
  isMollieSubscriptionEntitlementGranting,
  mapMollieSubscriptionStatus,
} from "@/lib/billing/providers/mollie/lifecycle-status";
import { MOLLIE_METADATA_ORGANIZATION_ID, MOLLIE_METADATA_PLAN_KEY } from "@/lib/billing/providers/mollie/foundation";
import { assertMolliePaymentOpsAllowed } from "@/lib/billing/providers/mollie/mode";
import {
  classifyMollieProductionPayment,
  isStaleMollieOrganizationSubscription,
  resolveMolliePaidTransactionProductName,
} from "@/lib/billing/providers/mollie/payment-classification";
import {
  getMollieOrganizationSubscription,
  upsertMollieOrganizationSubscription,
} from "@/lib/billing/providers/mollie/organization-sync";
import { createMollieProductionSubscriptionAfterMandate } from "@/lib/billing/providers/mollie/production-checkout";
import { upsertMollieBillingTransaction } from "@/lib/billing/providers/mollie/transactions";
import {
  isMollieSelfServePlanKey,
  type MollieSelfServePlanKey,
} from "@/lib/billing/providers/mollie/checkout";
import { getPlanByKey } from "@/lib/billing/plans";
import { resolveSubscriptionUsability } from "@/lib/billing/subscription-management";
import { getOrganizationNameForBillingEmail } from "@/lib/email/plan-change";
import { sendPurchaseActivatedEmail } from "@/lib/email/purchase";
import { createAdminClient } from "@/lib/supabase/admin";

export type MolliePaidPurchaseRecoveryResult =
  | {
      recovered: true;
      alreadyActive: boolean;
      subscriptionId: string;
      paymentId: string;
      emailSent: boolean;
    }
  | {
      recovered: false;
      reason: string;
    };

function readMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function parsePaymentAmountCents(amountValue: string | undefined): number | null {
  if (!amountValue) {
    return null;
  }
  const parsed = Number.parseFloat(amountValue);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.round(parsed * 100);
}

/**
 * Operator-safe recovery for paid fresh purchases that failed post-webhook activation.
 * Idempotent — safe to run twice. Does not create a third payment.
 */
export async function recoverMolliePaidFreshPurchase(input: {
  organizationId: string;
  paymentId: string;
}): Promise<MolliePaidPurchaseRecoveryResult> {
  assertMolliePaymentOpsAllowed();

  if (!input.paymentId.startsWith("tr_")) {
    return { recovered: false, reason: "invalid_payment_id" };
  }

  const client = createMollieBillingClient();
  const payment = await client.payments.get(input.paymentId);
  const metadata =
    payment.metadata && typeof payment.metadata === "object"
      ? (payment.metadata as Record<string, unknown>)
      : null;

  const metadataOrgId = readMetadataString(metadata, MOLLIE_METADATA_ORGANIZATION_ID);
  if (metadataOrgId !== input.organizationId) {
    return { recovered: false, reason: "organization_metadata_mismatch" };
  }

  if (!isMolliePaymentPaid(payment.status)) {
    return { recovered: false, reason: "payment_not_paid" };
  }

  const billingPurpose =
    typeof metadata?.auroranexis_billing_purpose === "string"
      ? metadata.auroranexis_billing_purpose
      : null;
  const paymentKind = classifyMollieProductionPayment({
    sequenceType: payment.sequenceType,
    billingPurpose,
  });

  if (paymentKind !== "initial_purchase") {
    return { recovered: false, reason: "not_initial_purchase_payment" };
  }

  const orgRow = await getMollieOrganizationSubscription(input.organizationId);
  const customerId = payment.customerId ?? orgRow?.provider_customer_id ?? null;
  if (!customerId?.startsWith("cst_")) {
    return { recovered: false, reason: "missing_customer" };
  }

  const planKeyRaw = readMetadataString(metadata, MOLLIE_METADATA_PLAN_KEY);
  const planKey: MollieSelfServePlanKey =
    planKeyRaw && isMollieSelfServePlanKey(planKeyRaw)
      ? planKeyRaw
      : orgRow?.provider_price_id && isMollieSelfServePlanKey(orgRow.provider_price_id)
        ? orgRow.provider_price_id
        : "professional";

  const currentStatus = orgRow?.provider_status ?? orgRow?.status ?? null;
  const alreadyUsable = resolveSubscriptionUsability(orgRow, currentStatus);
  const existingSubId = orgRow?.provider_subscription_id ?? null;

  if (alreadyUsable && existingSubId?.startsWith("sub_") && !isStaleMollieOrganizationSubscription(orgRow)) {
    const subscription = await client.customerSubscriptions.get(existingSubId, { customerId });
    if (isMollieSubscriptionEntitlementGranting(subscription.status)) {
      await recordRecoveryTransaction({
        organizationId: input.organizationId,
        payment,
        customerId,
        subscriptionId: existingSubId,
        planKey,
        paymentKind,
      });

      const emailSent = await sendRecoveryPurchaseEmailIfNeeded({
        organizationId: input.organizationId,
        planKey,
        providerSubscriptionId: existingSubId,
        providerPaymentId: payment.id,
        receiptUrl: payment._links?.checkout?.href ?? null,
      });

      return {
        recovered: true,
        alreadyActive: true,
        subscriptionId: existingSubId,
        paymentId: payment.id,
        emailSent,
      };
    }
  }

  if (isStaleMollieOrganizationSubscription(orgRow)) {
    await upsertMollieOrganizationSubscription({
      organizationId: input.organizationId,
      providerCustomerId: customerId,
      providerSubscriptionId: null,
      planKey,
      providerStatus: payment.status,
      normalizedStatus: "incomplete",
      syncPending: true,
      resetStaleSubscriptionState: true,
    });
  }

  const subscriptionResult = await createMollieProductionSubscriptionAfterMandate({
    organizationId: input.organizationId,
    customerId,
    planKey,
    paymentId: payment.id,
  });

  const refreshed = await getMollieOrganizationSubscription(input.organizationId);
  const refreshedStatus = refreshed?.provider_status ?? refreshed?.status ?? null;
  const postUsable = resolveSubscriptionUsability(refreshed, refreshedStatus);

  if (!postUsable || refreshed?.sync_pending) {
    return {
      recovered: false,
      reason: "post_recovery_activation_failed",
    };
  }

  await recordRecoveryTransaction({
    organizationId: input.organizationId,
    payment,
    customerId,
    subscriptionId: subscriptionResult.subscriptionId,
    planKey,
    paymentKind,
  });

  const emailSent = await sendRecoveryPurchaseEmailIfNeeded({
    organizationId: input.organizationId,
    planKey,
    providerSubscriptionId: subscriptionResult.subscriptionId,
    providerPaymentId: payment.id,
    receiptUrl: payment._links?.checkout?.href ?? null,
  });

  return {
    recovered: true,
    alreadyActive: false,
    subscriptionId: subscriptionResult.subscriptionId,
    paymentId: payment.id,
    emailSent,
  };
}

async function recordRecoveryTransaction(input: {
  organizationId: string;
  payment: {
    id: string;
    amount?: { value?: string; currency?: string } | null;
    _links?: { checkout?: { href?: string } };
  };
  customerId: string;
  subscriptionId: string;
  planKey: MollieSelfServePlanKey;
  paymentKind: ReturnType<typeof classifyMollieProductionPayment>;
}): Promise<void> {
  const plan = getPlanByKey(input.planKey);
  const paidAt = new Date().toISOString();

  await upsertMollieBillingTransaction({
    organizationId: input.organizationId,
    providerTransactionId: input.payment.id,
    providerCustomerId: input.customerId,
    providerSubscriptionId: input.subscriptionId,
    providerPriceId: input.planKey,
    status: "paid",
    amountTotal: parsePaymentAmountCents(input.payment.amount?.value),
    currency: input.payment.amount?.currency ?? null,
    occurredAt: paidAt,
    paidAt,
    invoiceUrl: input.payment._links?.checkout?.href ?? null,
    productName: resolveMolliePaidTransactionProductName({
      paymentKind: input.paymentKind,
      planName: plan.name,
    }),
  });
}

async function sendRecoveryPurchaseEmailIfNeeded(input: {
  organizationId: string;
  planKey: string;
  providerSubscriptionId: string;
  providerPaymentId: string;
  receiptUrl: string | null;
}): Promise<boolean> {
  const admin = createAdminClient();
  const templateKey = `purchase_activated:${input.providerSubscriptionId}:${input.providerPaymentId}`;
  const { data: existing } = await admin
    .from("transactional_email_deliveries")
    .select("id")
    .eq("template_key", templateKey)
    .maybeSingle();

  if (existing) {
    return false;
  }

  const organizationName = await getOrganizationNameForBillingEmail(input.organizationId);
  await sendPurchaseActivatedEmail({
    organizationId: input.organizationId,
    organizationName,
    planKey: input.planKey,
    providerSubscriptionId: input.providerSubscriptionId,
    providerPaymentId: input.providerPaymentId,
    receiptUrl: input.receiptUrl,
  });

  return true;
}

/**
 * Operator report helper — surfaces duplicate paid first payments without auto-refund.
 */
export async function analyzeMollieDuplicatePaidFirstPayments(input: {
  organizationId: string;
  customerId: string;
}): Promise<
  Array<{
    paymentId: string;
    paidAt: string | null;
    amount: string | null;
    productLabel: string;
  }>
> {
  assertMolliePaymentOpsAllowed();

  const client = createMollieBillingClient();
  const payments = await client.customerPayments.page({ customerId: input.customerId });
  const matches: Array<{
    paymentId: string;
    paidAt: string | null;
    amount: string | null;
    productLabel: string;
  }> = [];

  for (const payment of payments) {
    if (payment.sequenceType !== "first" || !isMolliePaymentPaid(payment.status)) {
      continue;
    }
    const metadata =
      payment.metadata && typeof payment.metadata === "object"
        ? (payment.metadata as Record<string, unknown>)
        : null;
    const orgMeta = readMetadataString(metadata, MOLLIE_METADATA_ORGANIZATION_ID);
    if (orgMeta !== input.organizationId) {
      continue;
    }

    const planKey = readMetadataString(metadata, MOLLIE_METADATA_PLAN_KEY) ?? "professional";
    const planName = getPlanByKey(
      isMollieSelfServePlanKey(planKey) ? planKey : "professional",
    ).name;

    matches.push({
      paymentId: payment.id,
      paidAt: payment.paidAt ?? payment.createdAt ?? null,
      amount: payment.amount?.value ?? null,
      productLabel: resolveMolliePaidTransactionProductName({
        paymentKind: "initial_purchase",
        planName,
      }),
    });
  }

  return matches;
}

export function describeMollieProviderSubscriptionTerminality(
  providerStatus: string | null | undefined,
): "active" | "terminal" {
  return isMollieSubscriptionEntitlementGranting(providerStatus) ? "active" : "terminal";
}

export function mapRecoveryProviderStatusLabel(providerStatus: string | null | undefined): string {
  return mapMollieSubscriptionStatus(providerStatus);
}
