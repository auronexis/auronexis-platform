import type { ActivityEntityType } from "@/lib/activity/types";
import type { EscalationRule } from "@/types/database";

export type EscalationTriggerType =
  | "sla_warning"
  | "sla_breached"
  | "critical_risk"
  | "critical_incident"
  | "report_overdue";

export const ESCALATION_TRIGGER_TYPES: EscalationTriggerType[] = [
  "sla_warning",
  "sla_breached",
  "critical_risk",
  "critical_incident",
  "report_overdue",
];

export const ESCALATION_TRIGGER_LABELS: Record<EscalationTriggerType, string> = {
  sla_warning: "SLA warning",
  sla_breached: "SLA breached",
  critical_risk: "Critical risk",
  critical_incident: "Critical incident",
  report_overdue: "Report overdue",
};

export type EscalationContext = {
  organizationId: string;
  triggerType: EscalationTriggerType;
  entityType: ActivityEntityType;
  entityId: string;
  clientId?: string;
  clientName?: string;
  title?: string;
  assignedUserId?: string | null;
  /** Timestamp when the trigger condition became true — used for delay_minutes. */
  triggerAt?: Date;
};

export type EscalationDashboardMetrics = {
  activeRulesCount: number;
  escalationsTodayCount: number;
  outstandingCount: number;
  recentEscalations: RecentEscalationItem[];
};

export type RecentEscalationItem = {
  id: string;
  entityType: ActivityEntityType;
  entityId: string;
  entityTitle: string;
  triggerType: EscalationTriggerType;
  ruleName: string;
  clientName: string | null;
  executedAt: string;
  status: "escalated" | "acknowledged";
  href: string;
};

export type EscalationRuleView = EscalationRule;
