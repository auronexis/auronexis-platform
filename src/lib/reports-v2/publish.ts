import { recordActivityEvent } from "@/lib/activity/record";
import { dispatchAutomation } from "@/lib/automation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ReportV2View, SafeResult } from "@/lib/reports-v2/types";
import { REPORT_V2_SELECT } from "@/lib/reports-v2/types";
import { generateReport } from "@/lib/reports-v2/generator";
import { generateExecutiveReport } from "@/lib/executive-reports/generator";
import { getReportByIdV2 } from "@/lib/reports-v2/queries";

async function loadReport(
  session: SessionContext,
  reportId: string,
): Promise<ReportV2View | null> {
  const result = await getReportByIdV2(session, reportId);
  return result.data;
}

/** Generate report metrics and move draft → generated. */
export async function generateReportV2(
  session: SessionContext,
  reportId: string,
): Promise<SafeResult<ReportV2View>> {
  try {
    const report = await loadReport(session, reportId);
    if (!report) {
      return { data: null, error: "Report not found." };
    }

    if (report.status !== "draft") {
      return { data: null, error: "Only draft reports can be generated." };
    }

    const generated = await generateReport({
      session,
      reportId: report.id,
      clientId: report.client_id,
      clientName: report.clients?.name ?? "Client",
      clientStatus: report.clients?.status ?? "active",
      periodStart: report.reporting_period_start,
      periodEnd: report.reporting_period_end,
    });

    if (!generated.data) {
      return { data: null, error: generated.error ?? "Generation failed." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("reports")
      .update({
        status: "generated",
        summary: generated.data.summaryParagraph,
        executive_summary: generated.data.executiveSummary.paragraph,
        health_score: generated.data.metrics.healthScore,
        sla_score: generated.data.metrics.slaScore,
      } as never)
      .eq("id", reportId)
      .eq("organization_id", session.organization.id);

    if (error) {
      return { data: null, error: error.message };
    }

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "report",
      entityId: reportId,
      eventType: "report.generated",
      action: "generated",
      title: `Report generated: ${report.title}`,
      metadata: {
        reportId,
        healthScore: generated.data.metrics.healthScore,
        slaScore: generated.data.metrics.slaScore,
      },
    });

    await generateExecutiveReport({
      session,
      reportId,
      actorUserId: session.user.id,
    }).catch(() => undefined);

    const refreshed = await loadReport(session, reportId);
    return { data: refreshed, error: null };
  } catch (error) {
    console.warn("[reports-v2] generateReportV2 failed:", error);
    return { data: null, error: "Unable to generate report." };
  }
}

/** Publish report to client portal. */
export async function publishReport(
  session: SessionContext,
  reportId: string,
): Promise<SafeResult<ReportV2View>> {
  try {
    const report = await loadReport(session, reportId);
    if (!report) {
      return { data: null, error: "Report not found." };
    }

    if (report.status !== "generated" && report.status !== "draft") {
      return { data: null, error: "Only generated reports can be published." };
    }

    const supabase = await createClient();
    const publishedAt = new Date().toISOString();
    const { error } = await supabase
      .from("reports")
      .update({
        status: "published",
        published_at: publishedAt,
      } as never)
      .eq("id", reportId)
      .eq("organization_id", session.organization.id);

    if (error) {
      return { data: null, error: error.message };
    }

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "report",
      entityId: reportId,
      eventType: "report.published",
      action: "published",
      title: `Report published: ${report.title}`,
      description: "Visible in the client portal.",
      metadata: { reportId, clientId: report.client_id, version: report.version },
    });

    await dispatchAutomation({
      trigger: "report_published",
      organizationId: session.organization.id,
      entityType: "report",
      entityId: reportId,
      clientId: report.client_id,
      actorUserId: session.user.id,
      payload: {
        title: report.title,
        reportId,
        clientId: report.client_id,
        clientName: report.clients?.name,
      },
    });

    await generateExecutiveReport({
      session,
      reportId,
      actorUserId: session.user.id,
      published: true,
    }).catch(() => undefined);

    const refreshed = await loadReport(session, reportId);
    return { data: refreshed, error: null };
  } catch (error) {
    console.warn("[reports-v2] publishReport failed:", error);
    return { data: null, error: "Unable to publish report." };
  }
}

/** Archive a report. */
export async function archiveReport(
  session: SessionContext,
  reportId: string,
): Promise<SafeResult<ReportV2View>> {
  try {
    const report = await loadReport(session, reportId);
    if (!report) {
      return { data: null, error: "Report not found." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("reports")
      .update({ status: "archived" } as never)
      .eq("id", reportId)
      .eq("organization_id", session.organization.id);

    if (error) {
      return { data: null, error: error.message };
    }

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "report",
      entityId: reportId,
      eventType: "report.archived",
      action: "archived",
      title: `Report archived: ${report.title}`,
      metadata: { reportId },
    });

    const refreshed = await loadReport(session, reportId);
    return { data: refreshed, error: null };
  } catch (error) {
    console.warn("[reports-v2] archiveReport failed:", error);
    return { data: null, error: "Unable to archive report." };
  }
}

/** Duplicate a report as a new draft version. */
export async function duplicateReport(
  session: SessionContext,
  reportId: string,
): Promise<SafeResult<ReportV2View>> {
  return createNewVersion(session, reportId);
}

/** Create a new version in the same report series. */
export async function createNewVersion(
  session: SessionContext,
  reportId: string,
): Promise<SafeResult<ReportV2View>> {
  try {
    const report = await loadReport(session, reportId);
    if (!report) {
      return { data: null, error: "Report not found." };
    }

    const rootId = report.root_report_id ?? report.id;
    const admin = createAdminClient();
    const { data: versions } = await admin
      .from("reports")
      .select("version")
      .eq("organization_id", session.organization.id)
      .eq("root_report_id", rootId)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = ((versions?.[0] as { version: number } | undefined)?.version ?? report.version) + 1;

    const { data, error } = await admin
      .from("reports")
      .insert({
        organization_id: session.organization.id,
        client_id: report.client_id,
        assigned_user_id: report.assigned_user_id,
        title: report.title,
        reporting_period_start: report.reporting_period_start,
        reporting_period_end: report.reporting_period_end,
        status: "draft",
        executive_summary: report.executive_summary,
        key_wins: report.key_wins,
        key_risks: report.key_risks,
        next_actions: report.next_actions,
        root_report_id: rootId,
        version: nextVersion,
      } as never)
      .select(REPORT_V2_SELECT)
      .single();

    if (error || !data) {
      return { data: null, error: error?.message ?? "Unable to create version." };
    }

    const created = data as ReportV2View;

    await recordActivityEvent({
      organizationId: session.organization.id,
      actorUserId: session.user.id,
      entityType: "report",
      entityId: created.id,
      eventType: "report.versioned",
      action: "versioned",
      title: `Report version ${nextVersion} created: ${report.title}`,
      metadata: { reportId: created.id, rootReportId: rootId, version: nextVersion },
    });

    return { data: created, error: null };
  } catch (error) {
    console.warn("[reports-v2] createNewVersion failed:", error);
    return { data: null, error: "Unable to create report version." };
  }
}
