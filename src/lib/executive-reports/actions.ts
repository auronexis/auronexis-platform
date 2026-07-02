"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { ACTION_DENIED_MESSAGE } from "@/lib/authorization/guards";
import { generateExecutiveReport } from "@/lib/executive-reports/generator";
import { canEditReport } from "@/lib/reports/guards";
import { getReportById } from "@/lib/reports/queries";
import { canAccessModule } from "@/lib/rbac/permissions";

export type ExecutiveReportActionState = {
  error?: string;
  success?: string;
};

/** Generate executive report snapshot for a report — never throws to caller. */
export async function generateExecutiveReportAction(
  reportId: string,
): Promise<ExecutiveReportActionState> {
  try {
    const session = await requireSession();

    if (!canAccessModule(session.role, "reports", "read")) {
      return { error: ACTION_DENIED_MESSAGE };
    }

    const report = await getReportById(session, reportId);
    if (!report) {
      return { error: "Report not found." };
    }

    if (!canEditReport(session, report)) {
      return { error: ACTION_DENIED_MESSAGE };
    }

    const result = await generateExecutiveReport({
      session,
      reportId,
      published: report.status === "published",
    });

    if (!result) {
      return { error: "Unable to generate executive report." };
    }

    revalidatePath(`/reports/${reportId}`);
    return { success: "Executive report generated." };
  } catch (error) {
    console.warn("[executive-reports] generateExecutiveReportAction failed:", error);
    return { error: "Unable to generate executive report." };
  }
}
