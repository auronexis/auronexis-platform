import type { AnalyticsEventProps } from "@/lib/analytics/events";

export type CustomerSuccessAnalyticsEvent =
  | "customer_success_page_viewed"
  | "client_success_viewed"
  | "success_playbook_suggested"
  | "success_playbook_started"
  | "success_playbook_assigned"
  | "success_playbook_completed"
  | "success_playbook_cancelled"
  | "success_task_started"
  | "success_task_completed"
  | "success_task_overdue"
  | "client_health_changed"
  | "client_recovery_detected"
  | "client_recovery_failed"
  | "customer_success_summary_viewed";

export function buildCustomerSuccessAnalyticsProps(
  extra?: AnalyticsEventProps,
): AnalyticsEventProps {
  return { ...extra };
}
