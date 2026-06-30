"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordActivityEvent } from "@/lib/activity/record";
import { dispatchAutomation } from "@/lib/automation";
import { fireWorkflowEngine } from "@/lib/automation/engine-v2/dispatch-hook";
import { requireSession } from "@/lib/auth/session";
import { assertPermissionSafe } from "@/lib/authorization/guards";
import {
  canEditReport,
  canManageReportLifecycle,
  canPublishReport,
} from "@/lib/reports/guards";
import { getReportById } from "@/lib/reports/queries";
import { EDITABLE_REPORT_STATUSES, STAFF_REPORT_STATUSES } from "@/lib/reports/types";
import { AuthorizationError } from "@/lib/rbac/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database, ReportStatus } from "@/types/database";

type ReportInsert = Database["public"]["Tables"]["reports"]["Insert"];
type ReportUpdate = Database["public"]["Tables"]["reports"]["Update"];

export type ReportActionState = {
  error?: string;
  success?: string;
};

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional();

const reportFieldsSchema = z
  .object({
    title: z.string().trim().min(2, "Report title is required."),
    clientId: z.string().uuid("Select a client."),
    reportingPeriodStart: z.string().trim().min(1, "Reporting period start is required."),
    reportingPeriodEnd: z.string().trim().min(1, "Reporting period end is required."),
    status: z.enum(["draft", "ready", "published", "sent", "archived"] as const),
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
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  return Boolean(data);
}

async function verifyUserInOrg(
  organizationId: string,
  userId: string,
): Promise<boolean> {
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

function assertEditableStatusAllowed(status: ReportStatus): void {
  if (!EDITABLE_REPORT_STATUSES.includes(status)) {
    throw new AuthorizationError("Use lifecycle actions to change report status.");
  }
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
      throw new AuthorizationError("You cannot set this report status.");
    }
  } else {
    assertEditableStatusAllowed(parsed.data.status);
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

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: created.id,
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
    throw new AuthorizationError();
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
      throw new AuthorizationError("You cannot set this report status.");
    }

    if (parsed.data.assignedUserId && parsed.data.assignedUserId !== session.user.id) {
      throw new AuthorizationError();
    }
  } else {
    assertEditableStatusAllowed(parsed.data.status);
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
    parsed.data.status === "ready" && existing.status === "draft"
      ? "report_marked_ready"
      : "updated";

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: reportId,
    action,
    title:
      action === "report_marked_ready"
        ? `Report marked ready: ${parsed.data.title}`
        : `Report updated: ${parsed.data.title}`,
    metadata: { reportId, title: parsed.data.title, status: parsed.data.status },
  });

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/activity");
  return { success: "Report updated." };
}

/** Mark a report as ready — Owner/Admin only. */
export async function markReportReadyAction(reportId: string): Promise<void> {
  const session = await requireSession();

  if (!canManageReportLifecycle(session)) {
    throw new AuthorizationError();
  }

  const existing = await getReportById(session, reportId);

  if (!existing) {
    throw new Error("Report not found.");
  }

  if (existing.status !== "draft") {
    throw new Error("Only draft reports can be marked ready.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({ status: "ready" } as never)
    .eq("id", reportId)
    .eq("organization_id", session.organization.id);

  if (error) {
    throw new Error("Unable to mark report as ready.");
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: reportId,
    action: "report_marked_ready",
    title: `Report marked ready: ${existing.title}`,
    metadata: { reportId, title: existing.title, clientId: existing.client_id },
  });

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/activity");
  redirect(`/reports/${reportId}`);
}

/** Publish a report to the client portal — Owner/Admin only. */
export async function publishReportAction(reportId: string): Promise<void> {
  const session = await requireSession();

  if (!canPublishReport(session)) {
    throw new AuthorizationError();
  }

  const existing = await getReportById(session, reportId);

  if (!existing) {
    throw new Error("Report not found.");
  }

  if (existing.status !== "ready") {
    throw new Error("Only ready reports can be published.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({ status: "published" } as never)
    .eq("id", reportId)
    .eq("organization_id", session.organization.id);

  if (error) {
    throw new Error("Unable to publish report.");
  }

  await recordActivityEvent({
    organizationId: session.organization.id,
    actorUserId: session.user.id,
    entityType: "report",
    entityId: reportId,
    action: "report_published",
    title: `Report published: ${existing.title}`,
    description: "Visible in the client portal.",
    metadata: { reportId, title: existing.title, clientId: existing.client_id },
  });

  await dispatchAutomation({
    trigger: "report_published",
    organizationId: session.organization.id,
    entityType: "report",
    entityId: reportId,
    clientId: existing.client_id,
    actorUserId: session.user.id,
    payload: {
      title: existing.title,
      reportId,
      clientId: existing.client_id,
      clientName: existing.clients?.name,
    },
  });

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/activity");
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  redirect(`/reports/${reportId}`);
}

/** Mark a report as sent — Owner/Admin only (published → sent). */
export async function markReportSentAction(reportId: string): Promise<void> {
  const session = await requireSession();

  if (!canManageReportLifecycle(session)) {
    throw new AuthorizationError();
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
    status: "sent",
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
    throw new AuthorizationError();
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
