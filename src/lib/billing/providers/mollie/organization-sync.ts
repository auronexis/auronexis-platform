import "server-only";

import {
  hasVerifiedFastSpringSubscription,
  isFastSpringBackedSubscription,
  isMollieBackedSubscription,
} from "@/lib/billing/active-billing";
import { isSubscriptionUsable } from "@/lib/billing/status";
import {
  isMollieSelfServePlanKey,
  type MollieSelfServePlanKey,
} from "@/lib/billing/providers/mollie/checkout";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrganizationSubscription } from "@/types/database";

const ORGANIZATION_SUBSCRIPTION_MOLLIE_SELECT =
  "id, organization_id, billing_provider, provider_customer_id, provider_subscription_id, provider_price_id, provider_status, sync_pending, status, cancel_at_period_end, current_period_start, current_period_end, pending_plan, pending_plan_effective_at, pending_plan_change_type, provider_change_reference, stripe_customer_id, stripe_subscription_id, stripe_price_id, trial_ends_at, created_at, updated_at";

export type MollieOrganizationSubscriptionSyncInput = {
  organizationId: string;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  /** Canonical plan key stored as provider_price_id for Mollie (authoritative current). */
  planKey: MollieSelfServePlanKey;
  providerStatus: string | null;
  normalizedStatus: string;
  syncPending: boolean;
  cancelAtPeriodEnd?: boolean;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  /** When true, clears any scheduled pending plan change. */
  clearPendingPlanChange?: boolean;
  pendingPlan?: MollieSelfServePlanKey | null;
  pendingPlanEffectiveAt?: string | null;
  pendingPlanChangeType?: "upgrade" | "downgrade" | null;
  providerChangeReference?: string | null;
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
    .select(ORGANIZATION_SUBSCRIPTION_MOLLIE_SELECT)
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

function resolvePendingFields(
  input: MollieOrganizationSubscriptionSyncInput,
  existing: OrganizationSubscription | null,
): {
  pending_plan: string | null;
  pending_plan_effective_at: string | null;
  pending_plan_change_type: string | null;
  provider_change_reference: string | null;
} {
  if (input.clearPendingPlanChange) {
    return {
      pending_plan: null,
      pending_plan_effective_at: null,
      pending_plan_change_type: null,
      provider_change_reference: null,
    };
  }

  if (input.pendingPlan !== undefined) {
    return {
      pending_plan: input.pendingPlan,
      pending_plan_effective_at: input.pendingPlanEffectiveAt ?? null,
      pending_plan_change_type: input.pendingPlanChangeType ?? null,
      provider_change_reference: input.providerChangeReference ?? null,
    };
  }

  return {
    pending_plan: existing?.pending_plan ?? null,
    pending_plan_effective_at: existing?.pending_plan_effective_at ?? null,
    pending_plan_change_type: existing?.pending_plan_change_type ?? null,
    provider_change_reference: existing?.provider_change_reference ?? null,
  };
}

/**
 * Upsert Mollie state into canonical organization_subscriptions.
 * Coexistence: never mutates FastSpring rows; never invents plan keys.
 * provider_price_id is the authoritative current plan for entitlements.
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

  const providerCustomerId = input.providerCustomerId?.startsWith("cst_")
    ? input.providerCustomerId
    : existing && isMollieBackedSubscription(existing)
      ? existing.provider_customer_id
      : input.providerCustomerId;

  const providerSubscriptionId = input.providerSubscriptionId?.startsWith("sub_")
    ? input.providerSubscriptionId
    : existing && isMollieBackedSubscription(existing)
      ? existing.provider_subscription_id
      : input.providerSubscriptionId;

  const pending = resolvePendingFields(input, existing);

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
    pending_plan: pending.pending_plan,
    pending_plan_effective_at: pending.pending_plan_effective_at,
    pending_plan_change_type: pending.pending_plan_change_type,
    provider_change_reference: pending.provider_change_reference,
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

/**
 * Schedule a Mollie plan change without flipping authoritative provider_price_id.
 * Remote Mollie amount must already have been updated by the caller.
 */
export async function scheduleMolliePendingPlanChange(input: {
  organizationId: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  currentPlanKey: MollieSelfServePlanKey;
  pendingPlanKey: MollieSelfServePlanKey;
  pendingPlanChangeType: "upgrade" | "downgrade";
  pendingPlanEffectiveAt: string | null;
  providerChangeReference: string;
  providerStatus: string | null;
  normalizedStatus: string;
  currentPeriodEnd?: string | null;
}): Promise<MollieOrganizationSyncResult> {
  return upsertMollieOrganizationSubscription({
    organizationId: input.organizationId,
    providerCustomerId: input.providerCustomerId,
    providerSubscriptionId: input.providerSubscriptionId,
    planKey: input.currentPlanKey,
    providerStatus: input.providerStatus,
    normalizedStatus: input.normalizedStatus,
    syncPending: false,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: input.currentPeriodEnd,
    pendingPlan: input.pendingPlanKey,
    pendingPlanEffectiveAt: input.pendingPlanEffectiveAt,
    pendingPlanChangeType: input.pendingPlanChangeType,
    providerChangeReference: input.providerChangeReference,
  });
}

/**
 * Apply a scheduled pending plan after Mollie confirms a successful cycle payment.
 * No-op when no pending plan is scheduled.
 */
export async function applyMolliePendingPlanChangeIfReady(input: {
  organizationId: string;
  providerCustomerId: string;
  providerSubscriptionId: string;
  providerStatus: string | null;
  normalizedStatus: string;
  currentPeriodEnd?: string | null;
}): Promise<{
  applied: boolean;
  planKey: MollieSelfServePlanKey | null;
  previousPlanKey?: string | null;
  changeType?: "upgrade" | "downgrade" | null;
  providerChangeReference?: string | null;
}> {
  const existing = await readOrganizationSubscriptionRow(input.organizationId);
  if (!existing || !isMollieBackedSubscription(existing)) {
    return { applied: false, planKey: null };
  }

  if (existing.cancel_at_period_end) {
    const current =
      existing.provider_price_id && isMollieSelfServePlanKey(existing.provider_price_id)
        ? existing.provider_price_id
        : null;
    return { applied: false, planKey: current };
  }

  const pending = existing.pending_plan;
  if (!pending || !isMollieSelfServePlanKey(pending)) {
    const current =
      existing.provider_price_id && isMollieSelfServePlanKey(existing.provider_price_id)
        ? existing.provider_price_id
        : null;
    return { applied: false, planKey: current };
  }

  const previousPlanKey = existing.provider_price_id;
  const changeType =
    existing.pending_plan_change_type === "upgrade" ||
    existing.pending_plan_change_type === "downgrade"
      ? existing.pending_plan_change_type
      : null;
  const providerChangeReference = existing.provider_change_reference;

  await upsertMollieOrganizationSubscription({
    organizationId: input.organizationId,
    providerCustomerId: input.providerCustomerId,
    providerSubscriptionId: input.providerSubscriptionId,
    planKey: pending,
    providerStatus: input.providerStatus,
    normalizedStatus: input.normalizedStatus,
    syncPending: false,
    currentPeriodEnd: input.currentPeriodEnd,
    clearPendingPlanChange: true,
  });

  return {
    applied: true,
    planKey: pending,
    previousPlanKey,
    changeType,
    providerChangeReference,
  };
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
