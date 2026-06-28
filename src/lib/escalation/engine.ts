import { revalidatePath } from "next/cache";
import { recordActivityEvent } from "@/lib/activity/record";
import type { ActivityEntityType } from "@/lib/activity/types";
import { AUTOMATION_FOOTER } from "@/lib/automation/types";
import type { AutomationEvent } from "@/lib/automation/types";
import {
  isCriticalOpenIncident,
  isCriticalOpenRisk,
} from "@/lib/automation/types";
import {
  createNotificationForOwnersAndAdmins,
  createNotificationForOwnersAdminsAndAssignee,
  createNotificationForUser,
} from "@/lib/notifications/create";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EscalationRule } from "@/types/database";
import type { IncidentSeverity, IncidentStatus, RiskSeverity, RiskStatus } from "@/types/database";
import type { EscalationContext, EscalationTriggerType } from "@/lib/escalation/types";
import { ESCALATION_TRIGGER_LABELS } from "@/lib/escalation/types";

const ESCALATION_RULE_SELECT =
  "id, organization_id, name, trigger_type, severity, delay_minutes, notify_owner, notify_assigned_user, create_activity, create_notification, enabled, created_at, updated_at";

function withEscalationFooter(description: string): string {
  return `${description} ${AUTOMATION_FOOTER}`;
}

function mapAutomationEventToEscalationTrigger(
  event: AutomationEvent,
): EscalationTriggerType | null {
  switch (event.trigger) {
    case "sla_warning":
      return "sla_warning";
    case "sla_breached":
      return "sla_breached";
    case "risk_created":
    case "risk_updated": {
      const severity = event.payload?.severity as RiskSeverity | undefined;
      const status = event.payload?.status as RiskStatus | undefined;
      return isCriticalOpenRisk(severity, status) ? "critical_risk" : null;
    }
    case "incident_created":
    case "incident_updated": {
      const severity = event.payload?.severity as IncidentSeverity | undefined;
      const status = event.payload?.status as IncidentStatus | undefined;
      return isCriticalOpenIncident(severity, status) ? "critical_incident" : null;
    }
    default:
      return null;
  }
}

function automationEventToContext(
  event: AutomationEvent,
  triggerType: EscalationTriggerType,
): EscalationContext {
  return {
    organizationId: event.organizationId,
    triggerType,
    entityType: event.entityType,
    entityId: event.entityId,
    clientId: event.clientId ?? (event.payload?.clientId as string | undefined),
    clientName: event.payload?.clientName as string | undefined,
    title: event.payload?.title as string | undefined,
    assignedUserId: event.payload?.assignedUserId as string | null | undefined,
    triggerAt: new Date(),
  };
}

function resolveNotificationType(triggerType: EscalationTriggerType): "escalation_warning" | "escalation_triggered" {
  return triggerType === "sla_warning" ? "escalation_warning" : "escalation_triggered";
}

function buildEscalationActivityContent(
  rule: EscalationRule,
  context: EscalationContext,
): { title: string; description: string } {
  const triggerLabel = ESCALATION_TRIGGER_LABELS[context.triggerType];
  const entityTitle = context.title ?? "Operational item";
  const clientSuffix = context.clientName ? ` for ${context.clientName}` : "";

  return {
    title: `Escalation: ${rule.name}`,
    description: withEscalationFooter(
      `${triggerLabel} escalation "${rule.name}" triggered for ${entityTitle}${clientSuffix}.`,
    ),
  };
}

function buildEscalationNotificationContent(
  rule: EscalationRule,
  context: EscalationContext,
): { title: string; message: string } {
  const triggerLabel = ESCALATION_TRIGGER_LABELS[context.triggerType];
  const entityTitle = context.title ?? "Operational item";
  const clientSuffix = context.clientName ? ` (${context.clientName})` : "";

  return {
    title: context.triggerType === "sla_warning" ? "Escalation warning" : "Escalation triggered",
    message: `${triggerLabel}: "${rule.name}" — ${entityTitle}${clientSuffix}`,
  };
}

function resolveEntityHref(entityType: ActivityEntityType, entityId: string): string | null {
  switch (entityType) {
    case "risk":
      return `/risks/${entityId}`;
    case "incident":
      return `/incidents/${entityId}`;
    case "report":
      return `/reports/schedules`;
    case "client":
      return `/clients/${entityId}`;
    default:
      return null;
  }
}

async function loadEnabledRules(
  organizationId: string,
  triggerType: EscalationTriggerType,
): Promise<EscalationRule[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("escalation_rules")
    .select(ESCALATION_RULE_SELECT)
    .eq("organization_id", organizationId)
    .eq("trigger_type", triggerType)
    .eq("enabled", true);

  if (error) {
    console.error("[escalation] rule lookup failed:", error.message);
    return [];
  }

  return (data ?? []) as EscalationRule[];
}

async function claimExecution(
  organizationId: string,
  rule: EscalationRule,
  context: EscalationContext,
): Promise<boolean> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("escalation_executions")
    .insert({
      organization_id: organizationId,
      escalation_rule_id: rule.id,
      trigger_type: context.triggerType,
      entity_type: context.entityType,
      entity_id: context.entityId,
    } as never)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return false;
    }

    console.error("[escalation] execution claim failed:", error.message);
    return false;
  }

  return Boolean(data);
}

async function executeEscalationActivity(
  rule: EscalationRule,
  context: EscalationContext,
): Promise<void> {
  const content = buildEscalationActivityContent(rule, context);

  await recordActivityEvent({
    organizationId: context.organizationId,
    actorUserId: null,
    entityType: context.entityType,
    entityId: context.entityId,
    action: "escalation_triggered",
    title: content.title,
    description: content.description,
    metadata: {
      automated: true,
      escalationRuleId: rule.id,
      escalationRuleName: rule.name,
      trigger: context.triggerType,
      entityType: context.entityType,
      entityId: context.entityId,
      clientId: context.clientId ?? null,
    },
  });
}

async function executeEscalationNotifications(
  rule: EscalationRule,
  context: EscalationContext,
): Promise<void> {
  const notificationType = resolveNotificationType(context.triggerType);
  const content = buildEscalationNotificationContent(rule, context);
  const entityType =
    context.entityType === "financial" || context.entityType === "team" || context.entityType === "organization"
      ? null
      : context.entityType;

  const notificationInput = {
    type: notificationType,
    title: content.title,
    message: content.message,
    entityType,
    entityId: context.entityId,
  };

  if (rule.notify_owner && rule.notify_assigned_user) {
    await createNotificationForOwnersAdminsAndAssignee(
      context.organizationId,
      context.assignedUserId,
      notificationInput,
    );
  } else if (rule.notify_owner) {
    await createNotificationForOwnersAndAdmins(context.organizationId, notificationInput);
  } else if (rule.notify_assigned_user && context.assignedUserId) {
    await createNotificationForUser({
      organizationId: context.organizationId,
      userId: context.assignedUserId,
      ...notificationInput,
    });
  }

  revalidatePath("/notifications");
}

function isDelayElapsed(rule: EscalationRule, context: EscalationContext): boolean {
  if (rule.delay_minutes <= 0) {
    return true;
  }

  const triggerAt = context.triggerAt ?? new Date();
  const eligibleAt = new Date(triggerAt.getTime() + rule.delay_minutes * 60_000);
  return Date.now() >= eligibleAt.getTime();
}

/** Execute matching enabled escalation rules for a trigger context. */
export async function processEscalationRules(context: EscalationContext): Promise<void> {
  const rules = await loadEnabledRules(context.organizationId, context.triggerType);

  if (rules.length === 0) {
    return;
  }

  for (const rule of rules) {
    if (rule.severity && context.triggerType.startsWith("critical")) {
      // Reserved for future severity filtering — v1 rules do not set severity.
    }

    if (!isDelayElapsed(rule, context)) {
      continue;
    }

    const claimed = await claimExecution(context.organizationId, rule, context);

    if (!claimed) {
      continue;
    }

    if (rule.create_activity) {
      await executeEscalationActivity(rule, context);
    }

    if (rule.create_notification) {
      await executeEscalationNotifications(rule, context);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/activity");

  const href = resolveEntityHref(context.entityType, context.entityId);
  if (href) {
    revalidatePath(href);
  }
}

/** Map automation events to escalation triggers and process matching rules. */
export async function processEscalationForAutomationEvent(event: AutomationEvent): Promise<void> {
  const triggerType = mapAutomationEventToEscalationTrigger(event);

  if (!triggerType) {
    return;
  }

  await processEscalationRules(automationEventToContext(event, triggerType));
}
