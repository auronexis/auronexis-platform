"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { dispatchAutomation } from "@/lib/automation";
import { requireSession } from "@/lib/auth/session";
import { assertCanUseFeature } from "@/lib/plans/guards";
import { canManageReportSchedules } from "@/lib/report-schedules/guards";
import { getReportScheduleRecordById } from "@/lib/report-schedules/queries";
import {
  applyReportTemplate,
} from "@/lib/report-templates/types";
import { getReportTemplateRecordById } from "@/lib/report-templates/queries";
import {
  calculateNextRunAt,
  getReportingPeriodForFrequency,
} from "@/lib/report-schedules/schedule";
import { AuthorizationError } from "@/lib/rbac/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database, ReportScheduleFrequency } from "@/types/database";

type ReportScheduleInsert = Database["public"]["Tables"]["report_schedules"]["Insert"];
type ReportScheduleUpdate = Database["public"]["Tables"]["report_schedules"]["Update"];
type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];

export type ReportScheduleActionState = {
  error?: string;
  success?: string;
};

const scheduleSchema = z
  .object({
    clientId: z.string().uuid("Select a client."),
    titleTemplate: z.string().trim().min(2, "Title template is required."),
    frequency: z.enum(["monthly", "quarterly"] as const),
    dayOfMonth: z
      .string()
      .optional()
      .transform((value) => {
        if (!value || value.trim().length === 0) {
          return null;
        }

        return Number(value);
      }),
    assignedUserId: z
      .string()
      .optional()
      .transform((value) => (!value || value.trim().length === 0 ? null : value))
      .refine((value) => value === null || z.string().uuid().safeParse(value).success, {
        message: "Select a valid assignee.",
      }),
    templateId: z
      .string()
      .optional()
      .transform((value) => (!value || value.trim().length === 0 ? null : value))
      .refine((value) => value === null || z.string().uuid().safeParse(value).success, {
        message: "Select a valid template.",
      }),
  })
  .superRefine((data, ctx) => {
    if (data.frequency === "monthly") {
      if (data.dayOfMonth === null || Number.isNaN(data.dayOfMonth)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Day of month is required for monthly schedules.",
          path: ["dayOfMonth"],
        });
        return;
      }

      if (data.dayOfMonth < 1 || data.dayOfMonth > 28) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Day of month must be between 1 and 28.",
          path: ["dayOfMonth"],
        });
      }
    }
  });

function parseScheduleForm(formData: FormData) {
  return scheduleSchema.safeParse({
    clientId: formData.get("clientId"),
    titleTemplate: formData.get("titleTemplate"),
    frequency: formData.get("frequency"),
    dayOfMonth: formData.get("dayOfMonth"),
    assignedUserId: formData.get("assignedUserId"),
    templateId: formData.get("templateId"),
  });
}

async function verifyClientInOrg(organizationId: string, clientId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .maybeSingle();

  return Boolean(data);
}

async function verifyUserInOrg(organizationId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .eq("organization_id", organizationId)
    .eq("is_disabled", false)
    .maybeSingle();

  return Boolean(data as { id: string } | null);
}

async function verifyTemplateInOrg(
  organizationId: string,
  templateId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("report_templates")
    .select("id")
    .eq("id", templateId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  return Boolean(data);
}

function buildScheduleFields(parsed: z.infer<typeof scheduleSchema>, fromDate = new Date()) {
  const frequency = parsed.frequency as ReportScheduleFrequency;
  const dayOfMonth = frequency === "monthly" ? parsed.dayOfMonth : null;

  return {
    client_id: parsed.clientId,
    title_template: parsed.titleTemplate,
    frequency,
    day_of_month: dayOfMonth,
    assigned_user_id: parsed.assignedUserId,
    template_id: parsed.templateId,
    next_run_at: calculateNextRunAt(frequency, dayOfMonth, fromDate),
  };
}

/** Create a report schedule — Owner/Admin only. */
export async function createReportScheduleAction(
  _prevState: ReportScheduleActionState,
  formData: FormData,
): Promise<ReportScheduleActionState> {
  const session = await requireSession();

  if (!canManageReportSchedules(session)) {
    throw new AuthorizationError();
  }

  await assertCanUseFeature(session.organization.id, "report_scheduling");

  const parsed = parseScheduleForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid schedule data." };
  }

  if (!(await verifyClientInOrg(session.organization.id, parsed.data.clientId))) {
    return { error: "Selected client is not valid." };
  }

  if (
    parsed.data.assignedUserId &&
    !(await verifyUserInOrg(session.organization.id, parsed.data.assignedUserId))
  ) {
    return { error: "Selected assignee is not valid." };
  }

  if (
    parsed.data.templateId &&
    !(await verifyTemplateInOrg(session.organization.id, parsed.data.templateId))
  ) {
    return { error: "Selected template is not valid." };
  }

  const supabase = await createClient();
  const payload: ReportScheduleInsert = {
    organization_id: session.organization.id,
    is_active: true,
    ...buildScheduleFields(parsed.data),
  };

  const { data, error } = await supabase
    .from("report_schedules")
    .insert(payload as never)
    .select("id")
    .single();

  const created = data as { id: string } | null;

  if (error || !created) {
    return { error: "Unable to create report schedule." };
  }

  revalidatePath("/reports/schedules");
  redirect(`/reports/schedules/${created.id}`);
}

/** Update a report schedule — Owner/Admin only. */
export async function updateReportScheduleAction(
  scheduleId: string,
  _prevState: ReportScheduleActionState,
  formData: FormData,
): Promise<ReportScheduleActionState> {
  const session = await requireSession();

  if (!canManageReportSchedules(session)) {
    throw new AuthorizationError();
  }

  await assertCanUseFeature(session.organization.id, "report_scheduling");

  const existing = await getReportScheduleRecordById(session, scheduleId);

  if (!existing) {
    return { error: "Report schedule not found." };
  }

  const parsed = parseScheduleForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid schedule data." };
  }

  if (!(await verifyClientInOrg(session.organization.id, parsed.data.clientId))) {
    return { error: "Selected client is not valid." };
  }

  if (
    parsed.data.assignedUserId &&
    !(await verifyUserInOrg(session.organization.id, parsed.data.assignedUserId))
  ) {
    return { error: "Selected assignee is not valid." };
  }

  if (
    parsed.data.templateId &&
    !(await verifyTemplateInOrg(session.organization.id, parsed.data.templateId))
  ) {
    return { error: "Selected template is not valid." };
  }

  const supabase = await createClient();
  const updatePayload: ReportScheduleUpdate = buildScheduleFields(parsed.data);

  const { error } = await supabase
    .from("report_schedules")
    .update(updatePayload as never)
    .eq("id", scheduleId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to update report schedule." };
  }

  revalidatePath("/reports/schedules");
  revalidatePath(`/reports/schedules/${scheduleId}`);
  return { success: "Schedule updated." };
}

/** Activate or deactivate a report schedule — Owner/Admin only. */
export async function setReportScheduleActiveAction(
  scheduleId: string,
  isActive: boolean,
): Promise<ReportScheduleActionState> {
  const session = await requireSession();

  if (!canManageReportSchedules(session)) {
    throw new AuthorizationError();
  }

  await assertCanUseFeature(session.organization.id, "report_scheduling");

  const existing = await getReportScheduleRecordById(session, scheduleId);

  if (!existing) {
    return { error: "Report schedule not found." };
  }

  const supabase = await createClient();
  const updatePayload: ReportScheduleUpdate = { is_active: isActive };

  const { error } = await supabase
    .from("report_schedules")
    .update(updatePayload as never)
    .eq("id", scheduleId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to update schedule status." };
  }

  revalidatePath("/reports/schedules");
  revalidatePath(`/reports/schedules/${scheduleId}`);
  return { success: isActive ? "Schedule activated." : "Schedule deactivated." };
}

const GENERATED_SUMMARY = "Draft generated from report schedule.";

/** Generate a draft report from a schedule — Owner/Admin only. */
export async function generateReportDraftAction(scheduleId: string): Promise<void> {
  const session = await requireSession();

  if (!canManageReportSchedules(session)) {
    throw new AuthorizationError();
  }

  await assertCanUseFeature(session.organization.id, "report_scheduling");

  const schedule = await getReportScheduleRecordById(session, scheduleId);

  if (!schedule) {
    throw new Error("Report schedule not found.");
  }

  const assignedUserId = schedule.assigned_user_id ?? session.user.id;

  if (!(await verifyUserInOrg(session.organization.id, assignedUserId))) {
    throw new Error("Schedule assignee is not valid.");
  }

  const now = new Date();
  const period = getReportingPeriodForFrequency(schedule.frequency, now);
  const supabase = await createClient();

  let executiveSummary = GENERATED_SUMMARY;
  let keyWins: string | null = null;
  let keyRisks: string | null = null;
  let nextActions: string | null = null;

  if (schedule.template_id) {
    const template = await getReportTemplateRecordById(session, schedule.template_id);

    if (template) {
      const content = applyReportTemplate(template);
      executiveSummary = content.executive_summary ?? GENERATED_SUMMARY;
      keyWins = content.key_wins;
      keyRisks = content.key_risks;
      nextActions = content.next_actions;
    }
  }

  const reportPayload: ReportInsert = {
    organization_id: session.organization.id,
    client_id: schedule.client_id,
    title: schedule.title_template,
    reporting_period_start: period.start,
    reporting_period_end: period.end,
    status: "draft",
    executive_summary: executiveSummary,
    key_wins: keyWins,
    key_risks: keyRisks,
    next_actions: nextActions,
    assigned_user_id: assignedUserId,
  };

  const { data, error } = await supabase
    .from("reports")
    .insert(reportPayload as never)
    .select("id")
    .single();

  const created = data as { id: string } | null;

  if (error || !created) {
    throw new Error("Unable to generate report draft.");
  }

  const scheduleUpdate: ReportScheduleUpdate = {
    last_run_at: now.toISOString(),
    next_run_at: calculateNextRunAt(schedule.frequency, schedule.day_of_month, now),
  };

  const { error: scheduleError } = await supabase
    .from("report_schedules")
    .update(scheduleUpdate as never)
    .eq("id", scheduleId)
    .eq("organization_id", session.organization.id);

  if (scheduleError) {
    throw new Error("Report created but schedule could not be updated.");
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: created.id,
    action: "report_schedule_generated",
    title: `Report draft generated: ${schedule.title_template}`,
    description: GENERATED_SUMMARY,
    metadata: {
      scheduleId: schedule.id,
      clientId: schedule.client_id,
      reportId: created.id,
      templateId: schedule.template_id,
    },
  });

  await dispatchAutomation({
    trigger: "report_schedule_generated",
    organizationId: session.organization.id,
    entityType: "report",
    entityId: created.id,
    clientId: schedule.client_id,
    actorUserId: session.user.id,
    payload: {
      title: schedule.title_template,
      clientId: schedule.client_id,
      reportId: created.id,
      scheduleId: schedule.id,
    },
  });

  revalidatePath("/reports");
  revalidatePath("/reports/schedules");
  revalidatePath(`/reports/schedules/${scheduleId}`);
  revalidatePath("/activity");
  redirect(`/reports/${created.id}`);
}
