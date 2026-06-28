import type { ActivityEntityType } from "@/lib/activity/types";
import type {
  ClientStatus,
  IncidentSeverity,
  IncidentStatus,
  RiskSeverity,
  RiskStatus,
} from "@/types/database";

export const AUTOMATION_ENGINE_LABEL = "Automation Engine";

export const AUTOMATION_FOOTER = "Generated automatically by Automation Engine";

export type AutomationTrigger =
  | "risk_created"
  | "risk_updated"
  | "incident_created"
  | "incident_updated"
  | "report_created"
  | "report_exported"
  | "report_schedule_generated"
  | "report_published"
  | "report_sent"
  | "sla_warning"
  | "sla_breached";

export type AutomationActionType =
  | "create_activity"
  | "create_notification"
  | "update_client_health"
  | "refresh_dashboard_metrics";

export type AutomationEventPayload = {
  title?: string;
  severity?: RiskSeverity | IncidentSeverity;
  status?: RiskStatus | IncidentStatus;
  clientId?: string;
  clientName?: string;
  reportId?: string;
  scheduleId?: string;
  filename?: string;
  assignedUserId?: string;
  previousClientStatus?: ClientStatus;
  [key: string]: unknown;
};

export type AutomationEvent = {
  trigger: AutomationTrigger;
  organizationId: string;
  entityType: ActivityEntityType;
  entityId: string;
  clientId?: string;
  actorUserId?: string | null;
  payload?: AutomationEventPayload;
};

export type AutomationActionResult = {
  action: AutomationActionType;
  success: boolean;
  message?: string;
  error?: string;
};

export type AutomationRunResult = {
  trigger: AutomationTrigger;
  actions: AutomationActionResult[];
};

/** Derive client health status from open critical risk/incident counts. */
export function calculateAutomationClientHealth(
  criticalRiskCount: number,
  criticalIncidentCount: number,
): ClientStatus {
  if (criticalRiskCount >= 2 || criticalIncidentCount >= 2) {
    return "critical";
  }

  if (criticalRiskCount >= 1 || criticalIncidentCount >= 1) {
    return "watch";
  }

  return "active";
}

export function isCriticalOpenRisk(
  severity: RiskSeverity | undefined,
  status: RiskStatus | undefined,
): boolean {
  return severity === "critical" && (status === "open" || status === "in_progress");
}

export function isCriticalOpenIncident(
  severity: IncidentSeverity | undefined,
  status: IncidentStatus | undefined,
): boolean {
  return severity === "critical" && (status === "open" || status === "investigating");
}
