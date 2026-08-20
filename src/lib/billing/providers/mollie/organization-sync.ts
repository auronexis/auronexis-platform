import "server-only";

import {
  hasVerifiedFastSpringSubscription,
  isFastSpringBackedSubscription,
  isMollieBackedSubscription,
} from "@/lib/billing/active-billing";
import { isSubscriptionUsable } from "@/lib/billing/status";
import { isMollieSelfServePlanKey, type MollieSelfServePlanKey } from "@/lib/billing/providers/mollie/checkout";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrganizationSubscription } from "@/types/database";

export type MollieOrganizationSubscriptionSyncInput = {
  organizationId: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  /** Canonical plan key stored as provider_price_id for Mollie. */
  planKey: MollieSelfServePlanKey;
  providerStatus: string | null;
  normalizedStatus: string;
  syncPending: boolean;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
};

export type MollieOrganizationSyncResult =
  | { wrote: true }
  | { wrote: false; reason: string };

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
 * Refuse FastSpring / legacy overwrite. Never steal a paid FastSpring org.
 */
export function assertCanWriteMollieOrganizationSubscription(
  existing: OrganizationSubscription | null,
): void {
  if (!existing) {
    return;
  }

  if (isMollieBackedSubscription(existing)) {
    return;
  }

  if (isFastSpringBackedSubscription(existing)) {
    if (
      hasVerifiedFastSpringSubscription(existing) ||
      isSubscriptionUsable(existing.provider_status ?? existing.status)
    ) {
      throw new Error(
        "Refusing Mollie write — organization already has a FastSpring subscription. No silent migration.",
      );
    }
    throw new Error(
      "Refusing Mollie write — organization_subscriptions row is FastSpring-backed. Clear or migrate deliberately.",
    );
  }

  if (existing.billing_provider === "paddle" || existing.billing_provider === "stripe") {
    throw new Error(
      "Refusing Mollie write — organization_subscriptions row belongs to a legacy provider.",
    );
  }
}

/**
 * Upsert Mollie state into canonical organization_subscriptions.
 * Coexistence: never mutates FastSpring rows; never invents plan keys.
 */
export async function upsertMollieOrganizationSubscription(
  input: MollieOrganizationSubscriptionSyncInput,
): Promise<MollieOrganizationSyncResult> {
  if (!isMollieSelfServePlanKey(input.planKey)) {
    throw new Error("Enterprise and invite-only plans cannot be written via Mollie sync.");
  }

  const existing = await readOrganizationSubscriptionRow(input.organizationId);
  assertCanWriteMollieOrganizationSubscription(existing);

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const providerCustomerId =
    input.providerCustomerId?.startsWith("cst_")
      ? input.providerCustomerId
      : existing && isMollieBackedSubscription(existing)
        ? existing.provider_customer_id
        : input.providerCustomerId;

  const providerSubscriptionId =
    input.providerSubscriptionId?.startsWith("sub_")
      ? input.providerSubscriptionId
      : existing && isMollieBackedSubscription(existing)
        ? existing.provider_subscription_id
        : input.providerSubscriptionId;

  const row = {
    organization_id: input.organizationId,
    billing_provider: "mollie" as const,
    provider_customer_id: providerCustomerId,
    provider_subscription_id: providerSubscriptionId,
    provider_price_id: input.planKey,
    provider_status: input.providerStatus,
    status: input.normalizedStatus,
    sync_pending: input.syncPending,
    cancel_at_period_end: input.cancelAtPeriodEnd ?? existing?.cancel_at_period_end ?? false,
    current_period_start: input.currentPeriodStart ?? existing?.current_period_start ?? null,
    current_period_end: input.currentPeriodEnd ?? existing?.current_period_end ?? null,
    updated_at: now,
  };

  const { error } = await admin.from("organization_subscriptions").upsert(row as never, {
    onConflict: "organization_id",
  });

  if (error) {
    throw new Error(`Failed to upsert Mollie organization subscription: ${error.message}`);
  }

  const planFlag =
    input.normalizedStatus === "active" || input.normalizedStatus === "trialing" ? "paid" : "free";

  const { error: planError } = await admin
    .from("organizations")
    .update({ plan: planFlag } as never)
    .eq("id", input.organizationId);

  if (planError) {
    await admin
      .from("organization_subscriptions")
      .update({ sync_pending: true, updated_at: now } as never)
      .eq("organization_id", input.organizationId)
      .eq("billing_provider", "mollie");
    throw new Error(`Failed to sync organization plan flag: ${planError.message}`);
  }

  return { wrote: true };
}

export async function getMollieOrganizationSubscription(
  organizationId: string,
): Promise<OrganizationSubscription | null> {
  const row = await readOrganizationSubscriptionRow(organizationId);
  if (!row || !isMollieBackedSubscription(row)) {
    return null;
  }
  return row;
}
