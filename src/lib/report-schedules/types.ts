import type { ReportSchedule, ReportScheduleFrequency } from "@/types/database";
import { formatAppDate, formatAppDateTime } from "@/lib/i18n";

export type { ReportScheduleFrequency };

export type ReportScheduleWithRelations = ReportSchedule & {
  clients: { name: string } | null;
  users: { full_name: string } | null;
  report_templates: { name: string } | null;
};

export const SCHEDULE_FREQUENCIES: ReportScheduleFrequency[] = ["monthly", "quarterly"];

export const SCHEDULE_FREQUENCY_LABELS: Record<ReportScheduleFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export const SCHEDULE_SELECT_COLUMNS =
  "id, organization_id, client_id, title_template, frequency, day_of_month, assigned_user_id, template_id, is_active, next_run_at, last_run_at, created_at, updated_at";

export const SCHEDULE_LIST_SELECT = `
  ${SCHEDULE_SELECT_COLUMNS},
  clients ( name ),
  users ( full_name ),
  report_templates ( name )
`;

export function formatScheduleDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return formatAppDate(value.includes("T") ? value : `${value}T00:00:00`);
}

export function formatScheduleDateTime(value: string | null | undefined): string {
  return formatAppDateTime(value);
}
