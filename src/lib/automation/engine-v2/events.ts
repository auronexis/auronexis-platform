import type { WorkflowEngineEvent, WorkflowEngineTrigger } from "@/lib/automation/engine-v2/types";

/** Map legacy platform event names to builder trigger types. */
export function normalizeWorkflowTrigger(trigger: string): WorkflowEngineTrigger | null {
  const map: Record<string, WorkflowEngineTrigger> = {
    client_created: "client_created",
    client_archived: "client_archived",
    risk_created: "risk_created",
    risk_updated: "risk_updated",
    incident_created: "incident_created",
    incident_updated: "incident_updated",
    report_created: "report_drafted",
    report_drafted: "report_drafted",
    report_published: "report_published",
    report_sent: "report_sent",
    sla_warning: "sla_warning",
    sla_breached: "sla_breached",
    customer_health_changed: "customer_health_changed",
    manual_trigger: "manual_trigger",
  };

  return map[trigger] ?? null;
}

export function buildWorkflowEngineEvent(input: {
  trigger: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  clientId?: string | null;
  actorUserId?: string | null;
  eventId?: string;
  payload?: Record<string, unknown>;
}): WorkflowEngineEvent | null {
  const normalized = normalizeWorkflowTrigger(input.trigger);
  if (!normalized) return null;

  return {
    trigger: normalized,
    organizationId: input.organizationId,
    entityType: input.entityType,
    entityId: input.entityId,
    clientId: input.clientId ?? null,
    actorUserId: input.actorUserId ?? null,
    eventId: input.eventId,
    payload: input.payload ?? {},
  };
}

export function buildTriggerHash(
  workflowId: string,
  event: WorkflowEngineEvent,
): string {
  const parts = [
    workflowId,
    event.trigger,
    event.entityType,
    event.entityId,
    event.eventId ?? "",
    event.clientId ?? "",
  ];
  return parts.join(":");
}
