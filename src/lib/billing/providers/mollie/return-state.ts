import "server-only";

import { resolveSubscriptionUsability } from "@/lib/billing/subscription-management";
import { createMollieBillingClient } from "@/lib/billing/providers/mollie/client";
import { isMolliePaymentPaid } from "@/lib/billing/providers/mollie/lifecycle-status";
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
    };

function readMetadataOrganizationId(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }
  const value = (metadata as Record<string, unknown>)[MOLLIE_METADATA_ORGANIZATION_ID];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
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
 * Re-fetch reconciled billing state for the Mollie return page.
 * Never grants entitlements from query params — informational only.
 */
export async function resolveMollieProductionReturnPageState(input: {
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
