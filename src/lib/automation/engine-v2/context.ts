import type { WorkflowEngineEvent, WorkflowExecutionContext } from "@/lib/automation/engine-v2/types";

const FIELD_ALIASES: Record<string, string[]> = {
  client_id: ["client", "clientId", "client_id"],
  owner_id: ["owner", "ownerId", "owner_id", "ownerUserId"],
  assignee_id: ["assignee", "assigneeId", "assignedUserId"],
  customer_health: ["customer_health", "clientStatus", "status"],
  trigger_type: ["trigger_type", "trigger"],
};

export function buildExecutionContext(event: WorkflowEngineEvent): WorkflowExecutionContext {
  const payload = event.payload ?? {};

  const context: WorkflowExecutionContext = {
    severity: payload.severity ?? null,
    status: payload.status ?? null,
    priority: payload.priority ?? null,
    client_id: event.clientId ?? payload.clientId ?? null,
    owner_id: payload.ownerUserId ?? payload.ownerId ?? null,
    assignee_id: payload.assignedUserId ?? payload.assigneeId ?? null,
    risk_score: payload.riskScore ?? null,
    incident_count: payload.incidentCount ?? null,
    sla_status: payload.slaStatus ?? null,
    profitability_margin: payload.profitabilityMargin ?? null,
    customer_health: payload.customerHealth ?? payload.clientStatus ?? null,
    workspace_health: payload.workspaceHealth ?? null,
    report_age_days: payload.reportAgeDays ?? null,
    entity_type: event.entityType,
    trigger_type: event.trigger,
    organization: event.organizationId,
    client: event.clientId ?? payload.clientId ?? null,
    owner: payload.ownerUserId ?? payload.ownerId ?? null,
    tags: payload.tags ?? [],
    title: payload.title ?? null,
  };

  for (const [key, value] of Object.entries(payload)) {
    if (context[key] === undefined) {
      context[key] = value;
    }
  }

  return context;
}

export function resolveContextField(
  field: string,
  context: WorkflowExecutionContext,
): unknown {
  const aliases = FIELD_ALIASES[field] ?? [field];
  for (const alias of aliases) {
    if (context[alias] !== undefined && context[alias] !== null && context[alias] !== "") {
      return context[alias];
    }
  }
  return undefined;
}
