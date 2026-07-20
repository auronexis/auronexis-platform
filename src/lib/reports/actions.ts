"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { fireWorkflowEngine } from "@/lib/automation/engine-v2/dispatch-hook";
import { requireSession } from "@/lib/auth/session";
import { assertPermissionSafe, ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import {
  canEditReport,
  canManageReportLifecycle,
} from "@/lib/reports/guards";
import { getReportById } from "@/lib/reports/queries";
import { EDITABLE_REPORT_STATUSES, STAFF_REPORT_STATUSES } from "@/lib/reports/types";
import { clientBelongsToOrganization, userBelongsToOrganization } from "@/lib/clients/queries";
import { createClient } from "@/lib/supabase/server";
import { optionalText } from "@/lib/validation/form-fields";
import type { Database, ReportStatus } from "@/types/database";

type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];
type ReportUpdate = Database["public"]["Tables"]["reports"]["Update"];

export type ReportActionState = {
  error?: string;
  success?: string;
};

const reportFieldsSchema = z
  .object({
    title: z.string().trim().min(2, "Report title is required."),
    clientId: z.string().uuid("Select a client."),
    reportingPeriodStart: z.string().trim().min(1, "Reporting period start is required."),
    reportingPeriodEnd: z.string().trim().min(1, "Reporting period end is required."),
    status: z.enum(["draft", "generated", "published", "archived"] as const),
    executiveSummary: optionalText,
    keyWins: optionalText,
    keyRisks: optionalText,
    nextActions: optionalText,
    assignedUserId: z.string().uuid("Select an assignee.").optional(),
  })
  .refine((data) => data.reportingPeriodEnd >= data.reportingPeriodStart, {
    message: "Reporting period end must be on or after the start date.",
    path: ["reportingPeriodEnd"],
  });

function parseReportForm(formData: FormData) {
  return reportFieldsSchema.safeParse({
    title: formData.get("title"),
    clientId: formData.get("clientId"),
    reportingPeriodStart: formData.get("reportingPeriodStart"),
    reportingPeriodEnd: formData.get("reportingPeriodEnd"),
    status: formData.get("status") ?? "draft",
    executiveSummary: formData.get("executiveSummary"),
    keyWins: formData.get("keyWins"),
    keyRisks: formData.get("keyRisks"),
    nextActions: formData.get("nextActions"),
    assignedUserId: formData.get("assignedUserId") || undefined,
  });
}

async function verifyClientInOrg(
  organizationId: string,
  clientId: string,
): Promise<boolean> {
  return clientBelongsToOrganization(organizationId, clientId);
}

async function verifyUserInOrg(
  organizationId: string,
  userId: string,
): Promise<boolean> {
  return userBelongsToOrganization(organizationId, userId);
}

function editableStatusError(status: ReportStatus): { error: string } | null {
  if (!EDITABLE_REPORT_STATUSES.includes(status)) {
    return { error: "Use lifecycle actions to change report status." };
  }

  return null;
}

function buildReportPayload(parsed: z.infer<typeof reportFieldsSchema>) {
  return {
    client_id: parsed.clientId,
    title: parsed.title,
    reporting_period_start: parsed.reportingPeriodStart,
    reporting_period_end: parsed.reportingPeriodEnd,
    status: parsed.status,
    executive_summary: parsed.executiveSummary ?? null,
    key_wins: parsed.keyWins ?? null,
    key_risks: parsed.keyRisks ?? null,
    next_actions: parsed.nextActions ?? null,
  };
}

/** Create a report — Owner/Admin or Staff (self-assigned). */
export async function createReportAction(
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "reports.write");
  if (denied) {
    return denied;
  }

  const parsed = parseReportForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid report data." };
  }

  const assignedUserId =
    session.role === "staff" ? session.user.id : parsed.data.assignedUserId;

  if (!assignedUserId) {
    return { error: "Select an assignee." };
  }

  if (session.role === "staff") {
    if (!STAFF_REPORT_STATUSES.includes(parsed.data.status)) {
      return { error: "You cannot set this report status." };
    }
  } else {
    const statusError = editableStatusError(parsed.data.status);
    if (statusError) {
      return statusError;
    }
  }

  if (!(await verifyClientInOrg(session.organization.id, parsed.data.clientId))) {
    return { error: "Selected client is not valid." };
  }

  if (!(await verifyUserInOrg(session.organization.id, assignedUserId))) {
    return { error: "Selected assignee is not valid." };
  }

  const supabase = await createClient();
  const insertPayload: ReportInsert = {
    organization_id: session.organization.id,
    assigned_user_id: assignedUserId,
    ...buildReportPayload(parsed.data),
  };

  const { data, error } = await supabase
    .from("reports")
    .insert(insertPayload as never)
    .select("id")
    .single();

  const created = data as { id: string } | null;

  if (error || !created) {
    return { error: "Unable to create report." };
  }

  await supabase
    .from("reports")
    .update({ root_report_id: created.id } as never)
    .eq("id", created.id)
    .eq("organization_id", session.organization.id);

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: created.id,
    eventType: "report.created",
    action: "created",
    title: `Report created: ${parsed.data.title}`,
    metadata: { reportId: created.id, title: parsed.data.title },
  });

  await fireWorkflowEngine({
    trigger: "report_drafted",
    organizationId: session.organization.id,
    entityType: "report",
    entityId: created.id,
    clientId: parsed.data.clientId,
    actorUserId: session.user.id,
    payload: {
      title: parsed.data.title,
      status: parsed.data.status,
      clientId: parsed.data.clientId,
    },
  });

  revalidatePath("/reports");
  revalidatePath("/activity");
  redirect(`/reports/${created.id}`);
}

/** Update a report — Owner/Admin or assigned Staff. */
export async function updateReportAction(
  reportId: string,
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "reports.write");
  if (denied) {
    return denied;
  }

  const existing = await getReportById(session, reportId);

  if (!existing) {
    return { error: "Report not found." };
  }

  if (!canEditReport(session, existing)) {
    return { error: ACTION_DENIED_MESSAGE };
  }

  const parsed = parseReportForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid report data." };
  }

  if (!(await verifyClientInOrg(session.organization.id, parsed.data.clientId))) {
    return { error: "Selected client is not valid." };
  }

  let assignedUserId = existing.assigned_user_id;

  if (session.role === "staff") {
    if (!STAFF_REPORT_STATUSES.includes(parsed.data.status)) {
      return { error: "You cannot set this report status." };
    }

    if (parsed.data.assignedUserId && parsed.data.assignedUserId !== session.user.id) {
      return { error: ACTION_DENIED_MESSAGE };
    }
  } else {
    const statusError = editableStatusError(parsed.data.status);
    if (statusError) {
      return statusError;
    }
    assignedUserId = parsed.data.assignedUserId ?? existing.assigned_user_id;

    if (!(await verifyUserInOrg(session.organization.id, assignedUserId))) {
      return { error: "Selected assignee is not valid." };
    }
  }

  if (!EDITABLE_REPORT_STATUSES.includes(existing.status)) {
    return { error: "This report can no longer be edited." };
  }

  const updatePayload: ReportUpdate = {
    ...buildReportPayload(parsed.data),
    assigned_user_id: assignedUserId,
  };

  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update(updatePayload as never)
    .eq("id", reportId)
    .eq("organization_id", session.organization.id);

  if (error) {
    return { error: "Unable to update report." };
  }

  const action =
    parsed.data.status === "generated" && existing.status === "draft"
      ? "report_generated"
      : "updated";

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: reportId,
    eventType: action === "report_generated" ? "report.generated" : "report.updated",
    action,
    title:
      action === "report_generated"
        ? `Report generated: ${parsed.data.title}`
        : `Report updated: ${parsed.data.title}`,
    metadata: { reportId, title: parsed.data.title, status: parsed.data.status },
  });

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/activity");
  return { success: "Report updated." };
}

/** Mark a report as generated — delegates to Reports Engine V2. */
export async function markReportReadyAction(reportId: string): Promise<void> {
  const { generateReportV2Action } = await import("@/lib/reports-v2/actions");
  const result = await generateReportV2Action(reportId);
  if (result.error) {
    throw new Error(result.error);
  }
  redirect(`/reports/${reportId}`);
}

/** Publish a report to the client portal — delegates to Reports Engine V2. */
export async function publishReportAction(reportId: string): Promise<void> {
  const { publishReportV2Action } = await import("@/lib/reports-v2/actions");
  const result = await publishReportV2Action(reportId);
  if (result?.error) {
    throw new Error(result.error);
  }
}

/** Record email delivery timestamp while keeping published status. */
export async function markReportSentAction(reportId: string): Promise<void> {
  const session = await requireSession();

  if (!canManageReportLifecycle(session)) {
    throw new Error(ACTION_DENIED_MESSAGE);
  }

  const existing = await getReportById(session, reportId);

  if (!existing) {
    throw new Error("Report not found.");
  }

  if (existing.status !== "published") {
    throw new Error("Only published reports can be marked as sent.");
  }

  const supabase = await createClient();
  const updatePayload: ReportUpdate = {
    sent_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("reports")
    .update(updatePayload as never)
    .eq("id", reportId)
    .eq("organization_id", session.organization.id);

  if (error) {
    throw new Error("Unable to mark report as sent.");
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: reportId,
    action: "report_marked_sent",
    title: `Report marked sent: ${existing.title}`,
    metadata: { reportId, title: existing.title, clientId: existing.client_id },
  });

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/activity");
  redirect(`/reports/${reportId}`);
}

/** Archive a report — Owner/Admin only. */
export async function archiveReportAction(reportId: string): Promise<void> {
  const session = await requireSession();

  if (!canManageReportLifecycle(session)) {
    throw new Error(ACTION_DENIED_MESSAGE);
  }

  const existing = await getReportById(session, reportId);

  if (!existing) {
    throw new Error("Report not found.");
  }

  const supabase = await createClient();
  const updatePayload: ReportUpdate = { status: "archived" };

  const { error } = await supabase
    .from("reports")
    .update(updatePayload as never)
    .eq("id", reportId)
    .eq("organization_id", session.organization.id);

  if (error) {
    throw new Error("Unable to archive report.");
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: reportId,
    action: "report_archived",
    title: `Report archived: ${existing.title}`,
    metadata: { reportId, title: existing.title, clientId: existing.client_id },
  });

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/activity");
  redirect("/reports");
}
