import "server-only";

import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import { assertMolliePaymentOpsAllowed } from "@/lib/billing/providers/mollie/mode";
import { getMollieOrganizationSubscription } from "@/lib/billing/providers/mollie/organization-sync";
import { isMollieSelfServePlanKey } from "@/lib/billing/providers/mollie/checkout";
import { resolveSubscriptionUsability } from "@/lib/billing/subscription-management";
import { buildUpgradeActivatedTemplateKey } from "@/lib/billing/plan-change";
import {
  getOrganizationNameForBillingEmail,
  sendUpgradeActivatedEmail,
} from "@/lib/email/plan-change";
import { createAdminClient } from "@/lib/supabase/admin";

export type MollieUpgradeEmailReplayResult =
  | {
      replayed: true;
      emailSent: boolean;
      emailSkipped: boolean;
      organizationId: string;
      paymentId: string;
      previousPlanKey: string;
      appliedPlanKey: string;
      templateKey: string;
    }
  | {
      replayed: false;
      reason: string;
      organizationId: string;
    };

/**
 * Operator replay for a missing upgrade-activation email after a paid Business upgrade.
 * Verifies Business active + paid upgrade transaction. Never mutates subscription or charge.
 * Idempotent via transactional_email_deliveries — safe to rerun.
 */
export async function replayMollieUpgradeActivatedEmail(input: {
  organizationId: string;
  paymentId: string;
}): Promise<MollieUpgradeEmailReplayResult> {
  assertMolliePaymentOpsAllowed();

  const organizationId = input.organizationId.trim();
  const paymentId = input.paymentId.trim();

  if (!paymentId.startsWith("tr_")) {
    return {
      replayed: false,
      reason: "payment_id_invalid",
      organizationId,
    };
  }

  const subscription = await getMollieOrganizationSubscription(organizationId);
  if (!subscription) {
    return { replayed: false, reason: "subscription_missing", organizationId };
  }

  const rawStatus = subscription.provider_status ?? subscription.status ?? null;
  const isUsable = resolveSubscriptionUsability(subscription, rawStatus);
  const appliedPlanKey = subscription.provider_price_id ?? null;

  if (!isUsable || !appliedPlanKey || !isMollieSelfServePlanKey(appliedPlanKey)) {
    return { replayed: false, reason: "subscription_not_active_paid", organizationId };
  }

  if (appliedPlanKey !== "business") {
    return {
      replayed: false,
      reason: "applied_plan_not_upgrade_target",
      organizationId,
    };
  }

  const providerSubscriptionId = subscription.provider_subscription_id;
  if (!providerSubscriptionId?.startsWith("sub_")) {
    return { replayed: false, reason: "provider_subscription_missing", organizationId };
  }

  const admin = createAdminClient();
  const { data: txn, error: txnError } = await admin
    .from("billing_provider_transactions")
    .select("status, provider_price_id, product_name, organization_id")
    .eq("billing_provider", "mollie")
    .eq("provider_transaction_id", paymentId)
    .maybeSingle();

  if (txnError || !txn) {
    return { replayed: false, reason: "upgrade_transaction_missing", organizationId };
  }

  const row = txn as {
    status?: string;
    provider_price_id?: string | null;
    product_name?: string | null;
    organization_id?: string;
  };

  if (row.organization_id !== organizationId) {
    return { replayed: false, reason: "transaction_org_mismatch", organizationId };
  }

  if (row.status !== "paid") {
    return { replayed: false, reason: "transaction_not_paid", organizationId };
  }

  const productName = (row.product_name ?? "").toLowerCase();
  const looksLikeUpgrade =
    productName.includes("upgrade") ||
    (row.provider_price_id != null && row.provider_price_id === appliedPlanKey);

  if (!looksLikeUpgrade) {
    return { replayed: false, reason: "transaction_not_upgrade_adjustment", organizationId };
  }

  let previousPlanKey = "professional";
  let receiptUrl: string | null = null;
  try {
    const client = createMollieBillingClient();
    const payment = await client.payments.get(paymentId);
    receiptUrl = payment._links?.checkout?.href ?? null;
    const meta =
      payment.metadata && typeof payment.metadata === "object"
        ? (payment.metadata as Record<string, unknown>)
        : null;
    const fromMeta = meta?.auroranexis_previous_plan_key;
    if (typeof fromMeta === "string" && isMollieSelfServePlanKey(fromMeta)) {
      previousPlanKey = fromMeta;
    }
  } catch {
    // Mollie re-fetch optional — fall back to professional for Pro→Business self-serve.
  }

  if (previousPlanKey === appliedPlanKey) {
    return { replayed: false, reason: "previous_plan_equals_applied", organizationId };
  }

  const templateKey = buildUpgradeActivatedTemplateKey({
    organizationId,
    providerSubscriptionId,
    providerPaymentId: paymentId,
    previousPlanKey,
    appliedPlanKey,
  });

  const organizationName = await getOrganizationNameForBillingEmail(organizationId);
  const emailResult = await sendUpgradeActivatedEmail({
    organizationId,
    organizationName,
    previousPlanKey,
    appliedPlanKey,
    providerSubscriptionId,
    providerPaymentId: paymentId,
    receiptUrl,
    renewalAt: subscription.current_period_end ?? null,
  });

  console.info("[billing][operator-recovery] replay-upgrade-email", {
    organizationIdPrefix: organizationId.slice(0, 8),
    paymentIdPrefix: paymentId.slice(0, 12),
    sent: emailResult.sent,
    skipped: emailResult.skipped,
    failed: emailResult.failed,
  });

  return {
    replayed: true,
    emailSent: emailResult.sent,
    emailSkipped: emailResult.skipped,
    organizationId,
    paymentId,
    previousPlanKey,
    appliedPlanKey,
    templateKey,
  };
}
