import type { AutomationActionType, AutomationEvent } from "@/lib/automation/types";
import {
  isCriticalOpenIncident,
  isCriticalOpenRisk,
} from "@/lib/automation/types";
import type { IncidentSeverity, IncidentStatus } from "@/types/database";
import type { RiskSeverity, RiskStatus } from "@/types/database";

function isCriticalRiskEvent(event: AutomationEvent): boolean {
  const severity = event.payload?.severity as RiskSeverity | undefined;
  const status = event.payload?.status as RiskStatus | undefined;
  return isCriticalOpenRisk(severity, status);
}

function isCriticalIncidentEvent(event: AutomationEvent): boolean {
  const severity = event.payload?.severity as IncidentSeverity | undefined;
  const status = event.payload?.status as IncidentStatus | undefined;
  return isCriticalOpenIncident(severity, status);
}

/** Resolve which automation actions should run for an operational event. */
export function resolveAutomationActions(event: AutomationEvent): AutomationActionType[] {
  switch (event.trigger) {
    case "risk_created": {
      const actions: AutomationActionType[] = ["update_client_health"];

      if (isCriticalRiskEvent(event)) {
        actions.unshift("create_notification", "create_activity");
      }

      return actions;
    }

    case "risk_updated": {
      const actions: AutomationActionType[] = ["update_client_health"];

      if (isCriticalRiskEvent(event)) {
        actions.unshift("create_activity");
      }

      return actions;
    }

    case "incident_created": {
      const actions: AutomationActionType[] = ["update_client_health"];

      if (isCriticalIncidentEvent(event)) {
        actions.unshift("create_notification", "create_activity");
      }

      return actions;
    }

    case "incident_updated": {
      const actions: AutomationActionType[] = ["update_client_health"];

      if (isCriticalIncidentEvent(event)) {
        actions.unshift("create_activity");
      }

      return actions;
    }

    case "report_schedule_generated":
      return ["create_notification", "create_activity", "refresh_dashboard_metrics"];

    case "report_published":
      return ["create_notification"];

    case "report_sent":
      return ["create_notification"];

    case "sla_warning":
      return ["create_notification", "create_activity"];

    case "sla_breached":
      return ["create_notification", "create_activity"];

    case "report_exported":
      return ["create_activity"];

    case "report_created":
      return [];

    default:
      return [];
  }
}
