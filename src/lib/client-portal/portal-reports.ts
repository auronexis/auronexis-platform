import "server-only";

import type { ClientPortalSessionContext, PortalReportListItem, PortalReportView } from "@/lib/client-portal/types";
import { PORTAL_REPORT_SELECT } from "@/lib/client-portal/types";
import { getPortalExecutiveReport } from "@/lib/executive-reports/queries";
import type { ExecutiveReportSnapshot } from "@/lib/executive-reports/types";
import { listPortalPublishedReportsV2 } from "@/lib/reports-v2/queries";
import { PORTAL_VISIBLE_REPORT_STATUSES } from "@/lib/reports/types";
import { createClient } from "@/lib/supabase/server";

function mapReportListItem(row: Record<string, unknown>): PortalReportListItem {
  return {
    id: String(row.id),
    title: String(row.title),
    reporting_period_start: String(row.reporting_period_start),
    reporting_period_end: String(row.reporting_period_end),
    sent_at: (row.sent_at as string | null) ?? null,
    status: String(row.status),
    updated_at: String(row.updated_at),
    published_at: (row.published_at as string | null) ?? null,
    summary: (row.portal_summary as string | null) ?? (row.summary as string | null) ?? null,
    health_score: row.health_score == null ? null : Number(row.health_score),
    sla_score: row.sla_score == null ? null : Number(row.sla_score),
    version: Number(row.version ?? 1),
  };
}

/** Published reports for portal — newest version per series — never throws. */
export async function getPortalPublishedReports(
  session: ClientPortalSessionContext,
): Promise<PortalReportListItem[]> {
  try {
    const { data } = await listPortalPublishedReportsV2(
      session.organization.id,
      session.client.id,
    );

    return (data ?? []).map((report) =>
      mapReportListItem({
        ...report,
        portal_summary: null,
      } as Record<string, unknown>),
    );
  } catch {
    return [];
  }
}

/** Published report detail with optional executive snapshot — never throws. */
export async function getPortalReportDetail(
  session: ClientPortalSessionContext,
  reportId: string,
): Promise<{ report: PortalReportView | null; executiveSnapshot: ExecutiveReportSnapshot | null }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reports")
      .select(PORTAL_REPORT_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("client_id", session.client.id)
      .eq("id", reportId)
      .in("status", PORTAL_VISIBLE_REPORT_STATUSES)
      .maybeSingle();

    if (error || !data) {
      return { report: null, executiveSnapshot: null };
    }

    const row = data as Record<string, unknown>;
    const report: PortalReportView = {
      id: String(row.id),
      title: String(row.title),
      reporting_period_start: String(row.reporting_period_start),
      reporting_period_end: String(row.reporting_period_end),
      status: String(row.status),
      executive_summary: (row.executive_summary as string | null) ?? null,
      summary: (row.portal_summary as string | null) ?? (row.summary as string | null) ?? null,
      key_wins: (row.key_wins as string | null) ?? null,
      key_risks: (row.key_risks as string | null) ?? null,
      next_actions: (row.next_actions as string | null) ?? null,
      sent_at: (row.sent_at as string | null) ?? null,
      published_at: (row.published_at as string | null) ?? null,
      health_score: row.health_score == null ? null : Number(row.health_score),
      sla_score: row.sla_score == null ? null : Number(row.sla_score),
      version: Number(row.version ?? 1),
      updated_at: String(row.updated_at),
    };

    const executiveSnapshot = await getPortalExecutiveReport(
      session.organization.id,
      session.client.id,
      reportId,
    );

    return { report, executiveSnapshot };
  } catch {
    return { report: null, executiveSnapshot: null };
  }
}
