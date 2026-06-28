import { dispatchAutomation } from "@/lib/automation";
import {
  calculateSlaDueDate,
  calculateSlaStatus,
  type SlaEntityType,
} from "@/lib/sla/calculations";
import { recordActivityEvent } from "@/lib/activity/record";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SlaPolicy } from "@/types/database";

type SlaAlertLevel = "none" | "warning" | "breached";

type SlaTransitionEntity = {
  entityType: SlaEntityType;
  entityId: string;
  clientId: string;
  title: string;
  clientName: string | null;
  createdAt: string;
  assignedUserId?: string | null;
  clientSlaPolicyId: string | null;
  policyHours: number | null;
};

async function hasSlaNotification(
  organizationId: string,
  entityType: SlaEntityType,
  entityId: string,
  type: "sla_warning" | "sla_breached",
): Promise<boolean> {
  const admin = createAdminClient();

  const { count, error } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("type", type)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);

  if (error) {
    console.error("[sla] notification lookup failed:", error.message);
    return true;
  }

  return (count ?? 0) > 0;
}

async function hasSlaActivityEvent(
  organizationId: string,
  entityType: SlaEntityType,
  entityId: string,
  action: "sla_warning" | "sla_breached" | "sla_resolved",
): Promise<boolean> {
  const admin = createAdminClient();

  const { count, error } = await admin
    .from("activity_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("action", action);

  if (error) {
    console.error("[sla] activity lookup failed:", error.message);
    return true;
  }

  return (count ?? 0) > 0;
}

async function getLastSlaAlertLevel(
  organizationId: string,
  entityType: SlaEntityType,
  entityId: string,
): Promise<SlaAlertLevel> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("activity_events")
    .select("action")
    .eq("organization_id", organizationId)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .in("action", ["sla_warning", "sla_breached"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[sla] alert level lookup failed:", error.message);
    return "none";
  }

  const action = (data?.[0] as { action: string } | undefined)?.action;

  if (action === "sla_breached") {
    return "breached";
  }

  if (action === "sla_warning") {
    return "warning";
  }

  return "none";
}

async function dispatchSlaWarning(
  organizationId: string,
  entity: SlaTransitionEntity,
  slaDueAt: Date | null,
): Promise<void> {
  if (
    (await hasSlaNotification(organizationId, entity.entityType, entity.entityId, "sla_warning")) ||
    (await hasSlaActivityEvent(organizationId, entity.entityType, entity.entityId, "sla_warning"))
  ) {
    return;
  }

  await dispatchAutomation({
    trigger: "sla_warning",
    organizationId,
    entityType: entity.entityType,
    entityId: entity.entityId,
    clientId: entity.clientId,
    payload: {
      title: entity.title,
      clientName: entity.clientName ?? undefined,
      assignedUserId: entity.assignedUserId ?? undefined,
      slaStatus: "warning",
      slaDueAt: slaDueAt?.toISOString(),
    },
  });
}

async function dispatchSlaBreached(
  organizationId: string,
  entity: SlaTransitionEntity,
  slaDueAt: Date | null,
): Promise<void> {
  if (
    (await hasSlaNotification(organizationId, entity.entityType, entity.entityId, "sla_breached")) ||
    (await hasSlaActivityEvent(organizationId, entity.entityType, entity.entityId, "sla_breached"))
  ) {
    return;
  }

  await dispatchAutomation({
    trigger: "sla_breached",
    organizationId,
    entityType: entity.entityType,
    entityId: entity.entityId,
    clientId: entity.clientId,
    payload: {
      title: entity.title,
      clientName: entity.clientName ?? undefined,
      assignedUserId: entity.assignedUserId ?? undefined,
      slaStatus: "breached",
      slaDueAt: slaDueAt?.toISOString(),
    },
  });
}

/** Evaluate a single open entity and dispatch automation only on SLA status transitions. */
export async function evaluateSlaTransitionsForEntity(
  organizationId: string,
  entity: SlaTransitionEntity,
): Promise<void> {
  if (!entity.policyHours) {
    return;
  }

  const slaDueAt = calculateSlaDueDate(entity.createdAt, entity.policyHours);
  const currentStatus = calculateSlaStatus(slaDueAt, entity.policyHours);
  const lastAlertLevel = await getLastSlaAlertLevel(
    organizationId,
    entity.entityType,
    entity.entityId,
  );

  if (currentStatus === "warning" && lastAlertLevel === "none") {
    await dispatchSlaWarning(organizationId, entity, slaDueAt);
    return;
  }

  if (currentStatus === "breached" && lastAlertLevel !== "breached") {
    await dispatchSlaBreached(organizationId, entity, slaDueAt);
  }
}

/** Record SLA resolved activity when a previously breached entity is closed. */
export async function recordSlaResolvedIfNeeded(input: {
  organizationId: string;
  entityType: SlaEntityType;
  entityId: string;
  clientId: string;
  title: string;
  actorUserId: string | null;
}): Promise<void> {
  const hadBreach =
    (await hasSlaNotification(input.organizationId, input.entityType, input.entityId, "sla_breached")) ||
    (await hasSlaActivityEvent(input.organizationId, input.entityType, input.entityId, "sla_breached"));

  if (!hadBreach) {
    return;
  }

  if (await hasSlaActivityEvent(input.organizationId, input.entityType, input.entityId, "sla_resolved")) {
    return;
  }

  await recordActivityEvent({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: "sla_resolved",
    title: `SLA resolved: ${input.title}`,
    description: "Operational item closed after an SLA breach.",
    metadata: {
      clientId: input.clientId,
      entityId: input.entityId,
    },
  });
}

export async function resolvePolicyForClient(
  clientSlaPolicyId: string | null,
  policiesById: Map<string, SlaPolicy>,
  defaultPolicy: SlaPolicy | null,
): Promise<SlaPolicy | null> {
  if (clientSlaPolicyId) {
    return policiesById.get(clientSlaPolicyId) ?? defaultPolicy;
  }

  return defaultPolicy;
}
