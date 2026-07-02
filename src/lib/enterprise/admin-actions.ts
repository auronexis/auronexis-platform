import "server-only";

import type { PlanKey } from "@/lib/billing/plans";
import { recordEnterpriseActivitySafe } from "@/lib/enterprise/activity";
import type { PlanOverrideInput } from "@/lib/enterprise/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrganizationPlanOverride } from "@/types/database";

function isPlatformAdminConfigured(): boolean {
  return Boolean(process.env.PLATFORM_ADMIN_USER_IDS?.trim());
}

function isPlatformAdminUser(userId: string): boolean {
  const configured = process.env.PLATFORM_ADMIN_USER_IDS?.split(",").map((id) => id.trim()) ?? [];
  return configured.includes(userId);
}

function assertPlatformAdmin(actorUserId: string): void {
  if (!isPlatformAdminConfigured() || !isPlatformAdminUser(actorUserId)) {
    throw new Error("Platform admin approval is not available.");
  }
}

/** Platform-admin only — creates or updates org plan override via service role. */
export async function createOrUpdatePlanOverrideAction(
  input: PlanOverrideInput,
  actorUserId: string,
): Promise<OrganizationPlanOverride> {
  assertPlatformAdmin(actorUserId);

  const admin = createAdminClient();
  const payload = {
    organization_id: input.organizationId,
    plan: input.plan,
    status: input.status ?? "active",
    seats_limit: input.seatsLimit ?? null,
    clients_limit: input.clientsLimit ?? null,
    monitoring_limit: input.monitoringLimit ?? null,
    api_enabled: input.apiEnabled ?? false,
    webhooks_enabled: input.webhooksEnabled ?? false,
    ai_enabled: input.aiEnabled ?? false,
    portal_branding_enabled: input.portalBrandingEnabled ?? false,
    custom_domain_enabled: input.customDomainEnabled ?? false,
    priority_support_enabled: input.prioritySupportEnabled ?? false,
    notes: input.notes ?? null,
    created_by: input.createdBy ?? actorUserId,
  };

  const { data, error } = await admin
    .from("organization_plan_overrides")
    .upsert(payload as never, { onConflict: "organization_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save plan override.");
  }

  await recordEnterpriseActivitySafe({
    organizationId: input.organizationId,
    actorUserId,
    eventType: "enterprise.override_updated",
    title: `Enterprise plan override updated (${input.plan})`,
    metadata: { plan: input.plan, status: input.status ?? "active" },
  });

  return data as OrganizationPlanOverride;
}

/** Platform-admin only — approve request and provision override. */
export async function approveEnterpriseRequestAction(input: {
  organizationId: string;
  requestId: string;
  actorUserId: string;
  override?: Partial<Omit<PlanOverrideInput, "organizationId">>;
}): Promise<void> {
  assertPlatformAdmin(input.actorUserId);

  const admin = createAdminClient();
  const { data: request, error: requestError } = await admin
    .from("enterprise_requests")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("id", input.requestId)
    .maybeSingle();

  if (requestError || !request) {
    throw new Error("Enterprise request not found.");
  }

  const now = new Date().toISOString();
  await admin
    .from("enterprise_requests")
    .update({
      status: "approved",
      handled_by: input.actorUserId,
      handled_at: now,
    } as never)
    .eq("id", input.requestId);

  await createOrUpdatePlanOverrideAction(
    {
      organizationId: input.organizationId,
      plan: (input.override?.plan ?? "enterprise") as PlanKey,
      status: "active",
      seatsLimit: input.override?.seatsLimit ?? request.requested_seats,
      clientsLimit: input.override?.clientsLimit ?? request.requested_clients,
      apiEnabled: input.override?.apiEnabled ?? true,
      webhooksEnabled: input.override?.webhooksEnabled ?? true,
      aiEnabled: input.override?.aiEnabled ?? true,
      prioritySupportEnabled: input.override?.prioritySupportEnabled ?? true,
      portalBrandingEnabled: input.override?.portalBrandingEnabled ?? true,
      customDomainEnabled: input.override?.customDomainEnabled ?? false,
      notes: input.override?.notes ?? request.notes,
      createdBy: input.actorUserId,
    },
    input.actorUserId,
  );

  await recordEnterpriseActivitySafe({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    eventType: "enterprise.request_approved",
    title: "Enterprise plan request approved",
    metadata: { requestId: input.requestId },
  });
}

/** Platform-admin only — reject enterprise request. */
export async function rejectEnterpriseRequestAction(input: {
  organizationId: string;
  requestId: string;
  actorUserId: string;
  reason?: string;
}): Promise<void> {
  assertPlatformAdmin(input.actorUserId);

  const admin = createAdminClient();
  const { error } = await admin
    .from("enterprise_requests")
    .update({
      status: "rejected",
      handled_by: input.actorUserId,
      handled_at: new Date().toISOString(),
      notes: input.reason ?? null,
    } as never)
    .eq("organization_id", input.organizationId)
    .eq("id", input.requestId);

  if (error) {
    throw new Error(error.message);
  }

  await recordEnterpriseActivitySafe({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    eventType: "enterprise.request_rejected",
    title: "Enterprise plan request rejected",
    metadata: { requestId: input.requestId },
  });
}

export { getEffectiveLimits, applyPlanOverride } from "@/lib/enterprise/limits";
