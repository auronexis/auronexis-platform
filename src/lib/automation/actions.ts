import { revalidatePath } from "next/cache";
import { recordActivityEvent } from "@/lib/activity/record";
import {
  AUTOMATION_FOOTER,
  calculateAutomationClientHealth,
  type AutomationActionResult,
  type AutomationActionType,
  type AutomationEvent,
} from "@/lib/automation/types";
import { CLIENT_STATUS_LABELS } from "@/lib/clients/types";
import { OPEN_INCIDENT_STATUSES } from "@/lib/incidents/types";
import {
  createNotificationForOwnersAdminsAndAssignee,
  createNotificationForOwnersAndAdmins,
} from "@/lib/notifications/create";
import { OPEN_RISK_STATUSES } from "@/lib/risks/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ClientStatus } from "@/types/database";

function withAutomationFooter(description: string): string {
  return `${description} ${AUTOMATION_FOOTER}`;
}

function buildActivityContent(event: AutomationEvent): {
  action: string;
  title: string;
  description: string;
} {
  const title = event.payload?.title ?? "Operational event";
  const clientName = event.payload?.clientName;

  switch (event.trigger) {
    case "risk_created":
    case "risk_updated":
      return {
        action: "automation_critical_risk",
        title: `Critical risk alert: ${title}`,
        description: withAutomationFooter(
          clientName
            ? `A critical open risk was detected for ${clientName}.`
            : "A critical open risk was detected.",
        ),
      };

    case "incident_created":
    case "incident_updated":
      return {
        action: "automation_critical_incident",
        title: `Critical incident alert: ${title}`,
        description: withAutomationFooter(
          clientName
            ? `A critical open incident was detected for ${clientName}.`
            : "A critical open incident was detected.",
        ),
      };

    case "report_schedule_generated":
      return {
        action: "automation_report_schedule_generated",
        title: `Scheduled report draft generated: ${title}`,
        description: withAutomationFooter(
          "A report draft was generated from an active schedule.",
        ),
      };

    case "report_published":
      return {
        action: "automation_report_published",
        title: `Report published: ${title}`,
        description: withAutomationFooter("Report is visible in the client portal."),
      };

    case "report_exported":
      return {
        action: "automation_report_exported",
        title: `Report export recorded: ${title}`,
        description: withAutomationFooter("A report PDF export was processed."),
      };

    case "sla_warning": {
      const entityLabel = event.entityType === "incident" ? "incident" : "risk";
      return {
        action: "sla_warning",
        title: `SLA warning: ${title}`,
        description: withAutomationFooter(
          clientName
            ? `SLA warning: ${entityLabel} for ${clientName} is approaching breach.`
            : `SLA warning: ${entityLabel} is approaching breach.`,
        ),
      };
    }

    case "sla_breached": {
      const entityLabel = event.entityType === "incident" ? "incident" : "risk";
      return {
        action: "sla_breached",
        title: `SLA breached: ${title}`,
        description: withAutomationFooter(
          clientName
            ? `SLA breached: ${entityLabel} for ${clientName} requires critical response.`
            : "SLA breached: critical response required.",
        ),
      };
    }

    default:
      return {
        action: "automation_event",
        title: `Automation event: ${event.trigger}`,
        description: withAutomationFooter("An operational automation event was processed."),
      };
  }
}

async function executeCreateActivity(event: AutomationEvent): Promise<AutomationActionResult> {
  const content = buildActivityContent(event);

  await recordActivityEvent({
    organizationId: event.organizationId,
    actorUserId: null,
    entityType: event.entityType,
    entityId: event.entityId,
    action: content.action,
    title: content.title,
    description: content.description,
    metadata: {
      automated: true,
      trigger: event.trigger,
      clientId: event.clientId ?? event.payload?.clientId ?? null,
      ...event.payload,
    },
  });

  return {
    action: "create_activity",
    success: true,
    message: content.title,
  };
}

async function countCriticalOpenItems(
  organizationId: string,
  clientId: string,
): Promise<{ criticalRisks: number; criticalIncidents: number }> {
  const admin = createAdminClient();

  const [criticalRisks, criticalIncidents] = await Promise.all([
    admin
      .from("client_risks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .eq("severity", "critical")
      .in("status", OPEN_RISK_STATUSES),
    admin
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .eq("severity", "critical")
      .in("status", OPEN_INCIDENT_STATUSES),
  ]);

  if (criticalRisks.error || criticalIncidents.error) {
    throw new Error("Unable to count critical operational items.");
  }

  return {
    criticalRisks: criticalRisks.count ?? 0,
    criticalIncidents: criticalIncidents.count ?? 0,
  };
}

async function executeUpdateClientHealth(event: AutomationEvent): Promise<AutomationActionResult> {
  const clientId = event.clientId ?? event.payload?.clientId;

  if (!clientId) {
    return {
      action: "update_client_health",
      success: false,
      error: "Missing client ID for health recalculation.",
    };
  }

  const admin = createAdminClient();

  const { data: clientData, error: clientError } = await admin
    .from("clients")
    .select("id, name, status")
    .eq("id", clientId)
    .eq("organization_id", event.organizationId)
    .maybeSingle();

  const client = clientData as { id: string; name: string; status: ClientStatus } | null;

  if (clientError || !client) {
    return {
      action: "update_client_health",
      success: false,
      error: "Client not found for health recalculation.",
    };
  }

  if (client.status === "archived") {
    return {
      action: "update_client_health",
      success: true,
      message: "Skipped archived client.",
    };
  }

  const { criticalRisks, criticalIncidents } = await countCriticalOpenItems(
    event.organizationId,
    clientId,
  );

  const nextStatus = calculateAutomationClientHealth(criticalRisks, criticalIncidents);

  if (nextStatus === client.status) {
    return {
      action: "update_client_health",
      success: true,
      message: `Client health unchanged (${CLIENT_STATUS_LABELS[nextStatus]}).`,
    };
  }

  const { error: updateError } = await admin
    .from("clients")
    .update({ status: nextStatus } as never)
    .eq("id", clientId)
    .eq("organization_id", event.organizationId);

  if (updateError) {
    return {
      action: "update_client_health",
      success: false,
      error: updateError.message,
    };
  }

  await recordActivityEvent({
    organizationId: event.organizationId,
    actorUserId: null,
    entityType: "client",
    entityId: clientId,
    action: "automation_client_health_updated",
    title: `Client health updated: ${CLIENT_STATUS_LABELS[nextStatus]}`,
    description: withAutomationFooter(
      `${client.name} health changed from ${CLIENT_STATUS_LABELS[client.status]} to ${CLIENT_STATUS_LABELS[nextStatus]} based on ${criticalRisks} critical risk(s) and ${criticalIncidents} critical incident(s).`,
    ),
    metadata: {
      automated: true,
      trigger: event.trigger,
      clientId,
      previousStatus: client.status,
      nextStatus,
      criticalRisks,
      criticalIncidents,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/dashboard");

  return {
    action: "update_client_health",
    success: true,
    message: `Client health updated to ${CLIENT_STATUS_LABELS[nextStatus]}.`,
  };
}

async function executeCreateNotification(event: AutomationEvent): Promise<AutomationActionResult> {
  const title = event.payload?.title ?? "Operational event";
  const clientName = event.payload?.clientName;
  const reportId = event.payload?.reportId ?? event.entityId;
  const assignedUserId = event.payload?.assignedUserId;

  switch (event.trigger) {
    case "report_schedule_generated":
      await createNotificationForOwnersAndAdmins(event.organizationId, {
        type: "report_generated",
        title: "Report draft generated",
        message: clientName
          ? `A draft report was generated for ${clientName}: ${title}`
          : `A draft report was generated: ${title}`,
        entityType: "report",
        entityId: reportId,
      });
      break;

    case "report_published":
      await createNotificationForOwnersAndAdmins(event.organizationId, {
        type: "report_published",
        title: "Report published to client portal",
        message: clientName
          ? `${title} is now visible to ${clientName} in the portal.`
          : `${title} is now visible in the client portal.`,
        entityType: "report",
        entityId: reportId,
      });
      break;

    case "report_sent": {
      const recipientEmail = event.payload?.recipientEmail as string | undefined;
      await createNotificationForOwnersAndAdmins(event.organizationId, {
        type: "report_sent",
        title: "Report emailed successfully",
        message: recipientEmail
          ? `"${title}" was emailed to ${recipientEmail}.`
          : clientName
            ? `"${title}" was emailed for ${clientName}.`
            : `"${title}" was emailed successfully.`,
        entityType: "report",
        entityId: reportId,
      });
      break;
    }

    case "risk_created":
    case "risk_updated":
      await createNotificationForOwnersAdminsAndAssignee(
        event.organizationId,
        assignedUserId,
        {
          type: "critical_risk",
          title: "Critical risk created",
          message: clientName
            ? `Critical risk "${title}" was created for ${clientName}.`
            : `Critical risk "${title}" was created.`,
          entityType: "risk",
          entityId: event.entityId,
        },
      );
      break;

    case "incident_created":
    case "incident_updated":
      await createNotificationForOwnersAdminsAndAssignee(
        event.organizationId,
        assignedUserId,
        {
          type: "critical_incident",
          title: "Critical incident created",
          message: clientName
            ? `Critical incident "${title}" was created for ${clientName}.`
            : `Critical incident "${title}" was created.`,
          entityType: "incident",
          entityId: event.entityId,
        },
      );
      break;

    case "sla_warning": {
      const entityLabel = event.entityType === "incident" ? "incident" : "risk";
      await createNotificationForOwnersAdminsAndAssignee(
        event.organizationId,
        assignedUserId,
        {
          type: "sla_warning",
          title: "SLA warning",
          message: clientName
            ? `SLA warning: ${entityLabel} "${title}" for ${clientName} is approaching breach.`
            : `SLA warning: ${entityLabel} approaching breach.`,
          entityType: event.entityType === "incident" ? "incident" : "risk",
          entityId: event.entityId,
        },
      );
      break;
    }

    case "sla_breached":
      await createNotificationForOwnersAdminsAndAssignee(
        event.organizationId,
        assignedUserId,
        {
          type: "sla_breached",
          title: "SLA breached",
          message: clientName
            ? `SLA breached: critical response required for "${title}" (${clientName}).`
            : "SLA breached: critical response required.",
          entityType: event.entityType === "incident" ? "incident" : "risk",
          entityId: event.entityId,
        },
      );
      break;

    default:
      return {
        action: "create_notification",
        success: false,
        error: "No notification configured for this trigger.",
      };
  }

  revalidatePath("/notifications");
  revalidatePath("/", "layout");

  return {
    action: "create_notification",
    success: true,
    message: "Notifications created.",
  };
}

async function executeRefreshDashboardMetrics(
  event: AutomationEvent,
): Promise<AutomationActionResult> {
  revalidatePath("/dashboard");
  revalidatePath("/activity");

  const clientId = event.clientId ?? event.payload?.clientId;
  if (clientId) {
    revalidatePath(`/clients/${clientId}`);
  }

  await recordActivityEvent({
    organizationId: event.organizationId,
    actorUserId: null,
    entityType: event.entityType,
    entityId: event.entityId,
    action: "automation_dashboard_refreshed",
    title: "Dashboard metrics refreshed",
    description: withAutomationFooter("Derived dashboard metrics were refreshed."),
    metadata: {
      automated: true,
      trigger: event.trigger,
      clientId: clientId ?? null,
    },
  });

  return {
    action: "refresh_dashboard_metrics",
    success: true,
    message: "Dashboard cache refreshed.",
  };
}

/** Execute a single automation action. */
export async function executeAutomationAction(
  action: AutomationActionType,
  event: AutomationEvent,
): Promise<AutomationActionResult> {
  try {
    switch (action) {
      case "create_activity":
        return await executeCreateActivity(event);
      case "create_notification":
        return await executeCreateNotification(event);
      case "update_client_health":
        return await executeUpdateClientHealth(event);
      case "refresh_dashboard_metrics":
        return await executeRefreshDashboardMetrics(event);
      default:
        return {
          action,
          success: false,
          error: "Unknown automation action.",
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Automation action failed.";
    console.error(`[automation] ${action} failed:`, message);

    return {
      action,
      success: false,
      error: message,
    };
  }
}
