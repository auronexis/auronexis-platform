import "server-only";

import { safeGetPlanByKey } from "@/lib/billing/plans";
import { resolveSubscriptionUsability } from "@/lib/billing/subscription-management";
import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import { isMollieSelfServePlanKey } from "@/lib/billing/providers/mollie/checkout";
import {
  isMolliePaymentPaid,
  isMolliePaymentTerminalFailure,
} from "@/lib/billing/providers/mollie/lifecycle-status";
import { MOLLIE_METADATA_ORGANIZATION_ID } from "@/lib/billing/providers/mollie/foundation";
import { getMollieOrganizationSubscription } from "@/lib/billing/providers/mollie/organization-sync";
import { createAdminClient } from "@/lib/supabase/admin";

export type MollieReturnPageState =
  | {
      kind: "success";
      statusLabel: string;
      syncPending: boolean;
    }
  | {
      kind: "processing";
      statusLabel: string;
      syncPending: boolean;
    }
  | {
      kind: "activation_failed";
      statusLabel: string;
      paymentId: string | null;
      syncPending: boolean;
    }
  | {
      kind: "awaiting_confirmation";
      statusLabel: string;
      syncPending: boolean;
    }
  | {
      kind: "upgrade_success";
      statusLabel: string;
      syncPending: boolean;
      appliedPlanKey: string;
      appliedPlanName: string;
    }
  | {
      kind: "upgrade_confirming";
      statusLabel: string;
      syncPending: boolean;
      targetPlanKey: string | null;
      currentPlanKey: string | null;
    }
  | {
      kind: "upgrade_payment_failed";
      statusLabel: string;
      syncPending: boolean;
      paymentStatus: string | null;
    };

function readMetadataOrganizationId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }
  const value = (metadata as Record<string, unknown>)[MOLLIE_METADATA_ORGANIZATION_ID];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function isBusinessOrHigherPlan(planKey: string | null | undefined): boolean {
  if (!planKey || !isMollieSelfServePlanKey(planKey)) {
    return false;
  }
  const plan = safeGetPlanByKey(planKey);
  const business = safeGetPlanByKey("business");
  return Boolean(plan && business && plan.order >= business.order);
}

async function findLatestPaidFirstPaymentForOrg(
  organizationId: string,
  customerId: string,
): Promise<string | null> {
  const client = createMollieBillingClient();
  const payments = await client.customerPayments.page({ customerId });

  for (const payment of payments) {
    if (payment.sequenceType !== "first" || !isMolliePaymentPaid(payment.status)) {
      continue;
    }
    const orgMeta = readMetadataOrganizationId(payment.metadata);
    if (orgMeta === organizationId) {
      return payment.id;
    }
  }

  return null;
}

/**
 * Upgrade return UX — non-authoritative.
 * Never maps normal webhook delay to activation_failed / contact-support.
 */
async function resolveUpgradeReturnPageState(input: {
  organizationId: string;
}): Promise<MollieReturnPageState> {
  const subscription = await getMollieOrganizationSubscription(input.organizationId);
  const rawStatus = subscription?.provider_status ?? subscription?.status ?? null;
  const syncPending = subscription?.sync_pending ?? false;
  const isUsable = resolveSubscriptionUsability(subscription, rawStatus);
  const currentPlanKey = subscription?.provider_price_id ?? null;
  const upgradePaymentId = subscription?.upgrade_payment_id ?? null;
  const upgradeTargetPlan = subscription?.upgrade_target_plan ?? null;

  // Authoritative upgraded plan already applied (webhook won the race).
  if (isUsable && !upgradePaymentId && isBusinessOrHigherPlan(currentPlanKey)) {
    const plan = safeGetPlanByKey(currentPlanKey!);
    return {
      kind: "upgrade_success",
      statusLabel: `${plan?.name ?? currentPlanKey} active`,
      syncPending,
      appliedPlanKey: currentPlanKey!,
      appliedPlanName: plan?.name ?? currentPlanKey!,
    };
  }

  if (
    isUsable &&
    upgradeTargetPlan &&
    currentPlanKey === upgradeTargetPlan &&
    isMollieSelfServePlanKey(currentPlanKey)
  ) {
    const plan = safeGetPlanByKey(currentPlanKey);
    return {
      kind: "upgrade_success",
      statusLabel: `${plan?.name ?? currentPlanKey} active`,
      syncPending,
      appliedPlanKey: currentPlanKey,
      appliedPlanName: plan?.name ?? currentPlanKey,
    };
  }

  // In-flight upgrade payment — only terminal Mollie failure is a hard failure.
  if (upgradePaymentId?.startsWith("tr_")) {
    try {
      const client = createMollieBillingClient();
      const payment = await client.payments.get(upgradePaymentId);
      if (isMolliePaymentTerminalFailure(payment.status)) {
        return {
          kind: "upgrade_payment_failed",
          statusLabel: "Upgrade payment was not completed",
          syncPending,
          paymentStatus: String(payment.status),
        };
      }
    } catch {
      // Provider re-fetch errors stay in confirming — never false support error.
    }
  }

  return {
    kind: "upgrade_confirming",
    statusLabel: "Payment received — confirming upgrade",
    syncPending,
    targetPlanKey: upgradeTargetPlan,
    currentPlanKey,
  };
}

async function resolvePurchaseReturnPageState(input: {
  organizationId: string;
}): Promise<MollieReturnPageState> {
  const subscription = await getMollieOrganizationSubscription(input.organizationId);
  const rawStatus = subscription?.provider_status ?? subscription?.status ?? null;
  const syncPending = subscription?.sync_pending ?? false;
  const isUsable = resolveSubscriptionUsability(subscription, rawStatus);

  if (isUsable && !syncPending) {
    return {
      kind: "success",
      statusLabel: subscription?.cancel_at_period_end ? "Active — cancellation scheduled" : "Active",
      syncPending,
    };
  }

  if (syncPending && subscription?.status === "incomplete") {
    return {
      kind: "processing",
      statusLabel: "Payment received — activating subscription",
      syncPending,
    };
  }

  const customerId = subscription?.provider_customer_id ?? null;
  if (customerId?.startsWith("cst_")) {
    const paidPaymentId = await findLatestPaidFirstPaymentForOrg(
      input.organizationId,
      customerId,
    );

    if (paidPaymentId) {
      const admin = createAdminClient();
      const { data: txn } = await admin
        .from("billing_provider_transactions")
        .select("status")
        .eq("billing_provider", "mollie")
        .eq("provider_transaction_id", paidPaymentId)
        .maybeSingle();

      if (txn && (txn as { status?: string }).status === "paid" && !isUsable) {
        return {
          kind: "activation_failed",
          statusLabel: "Payment confirmed — subscription activation needs recovery",
          paymentId: paidPaymentId,
          syncPending,
        };
      }
    }
  }

  return {
    kind: "awaiting_confirmation",
    statusLabel: subscription?.status ?? "Awaiting payment confirmation",
    syncPending,
  };
}

/**
 * Re-fetch reconciled billing state for the Mollie return page.
 * Never grants entitlements from query params — informational only.
 */
export async function resolveMollieProductionReturnPageState(input: {
  organizationId: string;
  purpose?: string | null;
}): Promise<MollieReturnPageState> {
  if (input.purpose === "upgrade") {
    try {
      return await resolveUpgradeReturnPageState({ organizationId: input.organizationId });
    } catch {
      return {
        kind: "upgrade_confirming",
        statusLabel: "Payment received — confirming upgrade",
        syncPending: false,
        targetPlanKey: null,
        currentPlanKey: null,
      };
    }
  }

  try {
    return await resolvePurchaseReturnPageState({ organizationId: input.organizationId });
  } catch {
    return {
      kind: "awaiting_confirmation",
      statusLabel: "Awaiting payment confirmation",
      syncPending: false,
    };
  }
}
