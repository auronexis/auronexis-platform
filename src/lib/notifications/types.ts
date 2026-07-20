import type { NotificationType } from "@/types/database";
import { formatAppDateTime } from "@/lib/i18n";

export type NotificationEntityType =
  | "client"
  | "risk"
  | "incident"
  | "report"
  | "team"
  | "organization";

export type CreateNotificationInput = {
  organizationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  report_generated: "Report",
  report_published: "Report",
  report_sent: "Report",
  critical_risk: "Risk",
  critical_incident: "Incident",
  portal_user_created: "Portal",
  report_email_failed: "Email",
  sla_warning: "SLA",
  sla_breached: "SLA",
  escalation_warning: "Escalation",
  escalation_triggered: "Escalation",
  subscription_activated: "Billing",
  subscription_payment_failed: "Billing",
  subscription_cancelled: "Billing",
  subscription_trial_ending: "Billing",
  seat_limit_reached: "Seats",
  plan_limit_reached: "Plans",
  billing_limit_approaching: "Billing",
  billing_limit_reached: "Billing",
  invoice_paid: "Billing",
  invoice_failed: "Billing",
};

export function getNotificationHref(
  entityType: string | null | undefined,
  entityId: string | null | undefined,
): string | null {
  if (!entityType || !entityId) {
    return null;
  }

  switch (entityType) {
    case "client":
      return `/clients/${entityId}`;
    case "risk":
      return `/risks/${entityId}`;
    case "incident":
      return `/incidents/${entityId}`;
    case "report":
      return `/reports/${entityId}`;
    case "team":
      return "/settings/team";
    case "organization":
      return "/settings/billing";
    default:
      return null;
  }
}

export function formatNotificationTimestamp(value: string): string {
  return formatAppDateTime(value);
}
