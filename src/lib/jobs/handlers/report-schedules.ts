import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { calculateNextRunAt, getReportingPeriodForFrequency } from "@/lib/report-schedules/schedule";
import type { ReportScheduleFrequency } from "@/types/database";

const GENERATED_SUMMARY = "Draft generated from report schedule (cron).";

/** Process all due report schedules across organizations. */
export async function processDueReportSchedules(): Promise<Record<string, unknown>> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: schedules, error } = await admin
    .from("report_schedules")
    .select(
      "id, organization_id, client_id, title_template, frequency, day_of_month, assigned_user_id, template_id, is_active, next_run_at",
    )
    .eq("is_active", true)
    .not("next_run_at", "is", null)
    .lte("next_run_at", today);

  if (error) {
    throw new Error(error.message);
  }

  let processed = 0;
  let skipped = 0;

  for (const schedule of (schedules ?? []) as Array<Record<string, unknown>>) {
    const organizationId = schedule.organization_id as string;
    const scheduleId = schedule.id as string;
    const now = new Date();
    const period = getReportingPeriodForFrequency(
      schedule.frequency as ReportScheduleFrequency,
      now,
    );

    const reportPayload = {
      organization_id: organizationId,
      client_id: schedule.client_id,
      title: schedule.title_template,
      reporting_period_start: period.start,
      reporting_period_end: period.end,
      status: "draft",
      executive_summary: GENERATED_SUMMARY,
      assigned_user_id: (schedule.assigned_user_id as string | null) ?? null,
    };

    const { data: created, error: insertError } = await admin
      .from("reports")
      .insert(reportPayload as never)
      .select("id")
      .single();

    if (insertError || !created) {
      skipped += 1;
      continue;
    }

    const nextRun = calculateNextRunAt(
      schedule.frequency as ReportScheduleFrequency,
      (schedule.day_of_month as number | null) ?? 1,
      now,
    );

    await admin
      .from("report_schedules")
      .update({
        last_run_at: now.toISOString(),
        next_run_at: nextRun,
      } as never)
      .eq("id", scheduleId);

    processed += 1;
  }

  return { processed, skipped, dueCount: schedules?.length ?? 0 };
}
