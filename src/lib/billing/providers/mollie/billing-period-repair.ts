import "server-only";

import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import {
  isValidMollieBillingPeriod,
  resolveMollieBillingPeriodRepair,
} from "@/lib/billing/providers/mollie/billing-period";
import {
  isMollieSelfServePlanKey,
  type MollieSelfServePlanKey,
} from "@/lib/billing/providers/mollie/checkout";
import { mapMollieSubscriptionStatus } from "@/lib/billing/providers/mollie/lifecycle-status";
import { assertMolliePaymentOpsAllowed } from "@/lib/billing/providers/mollie/mode";
import {
  getMollieOrganizationSubscription,
  upsertMollieOrganizationSubscription,
} from "@/lib/billing/providers/mollie/organization-sync";
import { createAdminClient } from "@/lib/supabase/admin";

export type MollieBillingPeriodRepairOperatorResult =
  | {
      repaired: true;
      alreadyValid: boolean;
      organizationId: string;
      subscriptionId: string;
      previousPeriodStart: string | null;
      previousPeriodEnd: string | null;
      currentPeriodStart: string;
      currentPeriodEnd: string;
      source: "existing" | "evidence";
    }
  | {
      repaired: false;
      reason: string;
      organizationId: string;
      previousPeriodStart?: string | null;
      previousPeriodEnd?: string | null;
      nextPaymentDate?: string | null;
      evidenceStarts?: string[];
    };

async function loadPeriodStartEvidence(input: {
  organizationId: string;
  subscriptionId: string;
  customerId: string;
}): Promise<string[]> {
  const evidence: string[] = [];
  const admin = createAdminClient();

  const { data: transactions } = await admin
    .from("billing_provider_transactions")
    .select("billing_period_start, paid_at, occurred_at, provider_subscription_id")
    .eq("organization_id", input.organizationId)
    .eq("billing_provider", "mollie")
    .order("paid_at", { ascending: true });

  for (const row of transactions ?? []) {
    const txn = row as {
      billing_period_start: string | null;
      paid_at: string | null;
      occurred_at: string | null;
      provider_subscription_id: string | null;
    };
    if (
      txn.provider_subscription_id &&
      txn.provider_subscription_id !== input.subscriptionId
    ) {
      continue;
    }
    if (txn.billing_period_start) {
      evidence.push(txn.billing_period_start);
    }
    if (txn.paid_at) {
      evidence.push(txn.paid_at);
    }
    if (txn.occurred_at) {
      evidence.push(txn.occurred_at);
    }
  }

  try {
    const client = createMollieBillingClient();
    const payments = await client.customerPayments.page({ customerId: input.customerId });
    for (const payment of payments) {
      if (payment.status !== "paid") {
        continue;
      }
      if (payment.subscriptionId && payment.subscriptionId !== input.subscriptionId) {
        // Still allow first payments that created the mandate (no subscriptionId yet).
        if (payment.sequenceType !== "first") {
          continue;
        }
      }
      if (typeof payment.paidAt === "string" && payment.paidAt.length > 0) {
        evidence.push(payment.paidAt);
      }
      if (typeof payment.createdAt === "string" && payment.createdAt.length > 0) {
        evidence.push(payment.createdAt);
      }
    }
  } catch (error) {
    console.error("[billing][period-repair] payment evidence fetch failed", {
      organizationId: input.organizationId,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return evidence;
}

/**
 * Idempotent operator repair for collapsed Mollie billing periods (e.g. start === end).
 * Uses Mollie nextPaymentDate as end and evidence (never nextPaymentDate) as start.
 * Does not create payments, charges, refunds, or subscriptions.
 */
export async function repairMollieOrganizationBillingPeriod(input: {
  organizationId: string;
}): Promise<MollieBillingPeriodRepairOperatorResult> {
  assertMolliePaymentOpsAllowed();

  const existing = await getMollieOrganizationSubscription(input.organizationId);
  if (!existing) {
    return {
      repaired: false,
      reason: "missing_mollie_organization_subscription",
      organizationId: input.organizationId,
    };
  }

  if (
    !existing.provider_customer_id?.startsWith("cst_") ||
    !existing.provider_subscription_id?.startsWith("sub_")
  ) {
    return {
      repaired: false,
      reason: "missing_provider_ids",
      organizationId: input.organizationId,
      previousPeriodStart: existing.current_period_start,
      previousPeriodEnd: existing.current_period_end,
    };
  }

  if (
    isValidMollieBillingPeriod(existing.current_period_start, existing.current_period_end)
  ) {
    return {
      repaired: true,
      alreadyValid: true,
      organizationId: input.organizationId,
      subscriptionId: existing.provider_subscription_id,
      previousPeriodStart: existing.current_period_start,
      previousPeriodEnd: existing.current_period_end,
      currentPeriodStart: existing.current_period_start!,
      currentPeriodEnd: existing.current_period_end!,
      source: "existing",
    };
  }

  const client = createMollieBillingClient();
  const remote = await client.customerSubscriptions.get(existing.provider_subscription_id, {
    customerId: existing.provider_customer_id,
  });
  const nextPaymentDate =
    typeof remote.nextPaymentDate === "string" && remote.nextPaymentDate.length > 0
      ? remote.nextPaymentDate
      : null;

  const evidenceStarts = [
    existing.current_period_start,
    typeof remote.startDate === "string" ? remote.startDate : null,
    typeof remote.createdAt === "string" ? remote.createdAt : null,
    ...(await loadPeriodStartEvidence({
      organizationId: input.organizationId,
      subscriptionId: existing.provider_subscription_id,
      customerId: existing.provider_customer_id,
    })),
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  const repair = resolveMollieBillingPeriodRepair({
    existingStart: existing.current_period_start,
    existingEnd: existing.current_period_end,
    nextPaymentDate,
    evidenceStarts,
  });

  if (!repair.repaired) {
    return {
      repaired: false,
      reason: repair.reason,
      organizationId: input.organizationId,
      previousPeriodStart: existing.current_period_start,
      previousPeriodEnd: existing.current_period_end,
      nextPaymentDate,
      evidenceStarts,
    };
  }

  const planKey: MollieSelfServePlanKey =
    existing.provider_price_id && isMollieSelfServePlanKey(existing.provider_price_id)
      ? existing.provider_price_id
      : "professional";

  await upsertMollieOrganizationSubscription({
    organizationId: input.organizationId,
    providerCustomerId: existing.provider_customer_id,
    providerSubscriptionId: existing.provider_subscription_id,
    planKey,
    providerStatus: remote.status ?? existing.provider_status,
    normalizedStatus: mapMollieSubscriptionStatus(remote.status ?? existing.provider_status),
    syncPending: false,
    currentPeriodStart: repair.currentPeriodStart,
    currentPeriodEnd: repair.currentPeriodEnd,
  });

  console.info("[billing][period-repair] repaired", {
    organizationId: input.organizationId,
    subscriptionId: existing.provider_subscription_id,
    source: repair.source,
    previousPeriodStart: existing.current_period_start,
    previousPeriodEnd: existing.current_period_end,
    currentPeriodStart: repair.currentPeriodStart,
    currentPeriodEnd: repair.currentPeriodEnd,
  });

  return {
    repaired: true,
    alreadyValid: repair.alreadyValid,
    organizationId: input.organizationId,
    subscriptionId: existing.provider_subscription_id,
    previousPeriodStart: existing.current_period_start,
    previousPeriodEnd: existing.current_period_end,
    currentPeriodStart: repair.currentPeriodStart,
    currentPeriodEnd: repair.currentPeriodEnd,
    source: repair.source,
  };
}
