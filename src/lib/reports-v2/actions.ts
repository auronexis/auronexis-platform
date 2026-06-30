"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { assertPermissionSafe } from "@/lib/authorization/guards";
import {
  archiveReport,
  createNewVersion,
  generateReportV2,
  publishReport,
} from "@/lib/reports-v2/publish";
import { canManageReportLifecycle, canPublishReport } from "@/lib/reports/guards";

export type ReportV2ActionState = {
  error?: string;
  success?: string;
};

export async function generateReportV2Action(reportId: string): Promise<ReportV2ActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "reports.write");
  if (denied) {
    return denied;
  }

  if (!canManageReportLifecycle(session)) {
    return { error: "You cannot generate reports." };
  }

  const result = await generateReportV2(session, reportId);
  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to generate report." };
  }

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath(`/clients/${result.data?.client_id ?? ""}`);
  return { success: "Report generated." };
}

export async function publishReportV2Action(reportId: string): Promise<ReportV2ActionState> {
  const session = await requireSession();
  if (!canPublishReport(session)) {
    return { error: "You cannot publish reports." };
  }

  const result = await publishReport(session, reportId);
  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to publish report." };
  }

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath("/", "layout");
  if (result.data.client_id) {
    revalidatePath(`/clients/${result.data.client_id}`);
  }
  redirect(`/reports/${reportId}`);
}

export async function archiveReportV2Action(reportId: string): Promise<ReportV2ActionState> {
  const session = await requireSession();
  if (!canManageReportLifecycle(session)) {
    return { error: "You cannot archive reports." };
  }

  const result = await archiveReport(session, reportId);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/dashboard");
  redirect("/reports");
}

export async function createReportVersionAction(reportId: string): Promise<ReportV2ActionState> {
  const session = await requireSession();
  const denied = assertPermissionSafe(session.role, "reports.write");
  if (denied) {
    return denied;
  }

  const result = await createNewVersion(session, reportId);
  if (result.error || !result.data) {
    return { error: result.error ?? "Unable to create version." };
  }

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  return { success: `Version ${result.data.version} created.` };
}
