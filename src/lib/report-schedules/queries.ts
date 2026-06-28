import { createClient } from "@/lib/supabase/server";
import type { ReportScheduleWithRelations } from "@/lib/report-schedules/types";
import { SCHEDULE_LIST_SELECT } from "@/lib/report-schedules/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ReportSchedule } from "@/types/database";

/** Next active report schedules ordered by upcoming run date. */
export async function getUpcomingReportSchedules(
  session: SessionContext,
  limit = 5,
): Promise<ReportScheduleWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("report_schedules")
    .select(SCHEDULE_LIST_SELECT)
    .eq("organization_id", session.organization.id)
    .eq("is_active", true)
    .not("next_run_at", "is", null)
    .order("next_run_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ReportScheduleWithRelations[];
}

/** List report schedules for the current organization. */
export async function listReportSchedules(
  session: SessionContext,
): Promise<ReportScheduleWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("report_schedules")
    .select(SCHEDULE_LIST_SELECT)
    .eq("organization_id", session.organization.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ReportScheduleWithRelations[];
}

/** Load a single report schedule by id within the current organization. */
export async function getReportScheduleById(
  session: SessionContext,
  scheduleId: string,
): Promise<ReportScheduleWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("report_schedules")
    .select(SCHEDULE_LIST_SELECT)
    .eq("id", scheduleId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ReportScheduleWithRelations | null) ?? null;
}

export async function getReportScheduleRecordById(
  session: SessionContext,
  scheduleId: string,
): Promise<ReportSchedule | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("report_schedules")
    .select("*")
    .eq("id", scheduleId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ReportSchedule | null) ?? null;
}
