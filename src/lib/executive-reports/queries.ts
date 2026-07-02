import "server-only";

import {
  EXECUTIVE_REPORT_SNAPSHOT_SELECT,
  mapExecutiveReportSnapshotRow,
  type ExecutiveReportDashboardMetrics,
  type ExecutiveReportSnapshot,
} from "@/lib/executive-reports/types";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";

/** Fetch latest executive snapshot for a report — never throws. */
export async function getExecutiveReport(
  session: SessionContext,
  reportId: string,
): Promise<ExecutiveReportSnapshot | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("executive_report_snapshots")
      .select(EXECUTIVE_REPORT_SNAPSHOT_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("report_id", reportId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapExecutiveReportSnapshotRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** List executive snapshot history for a report — never throws. */
export async function listExecutiveReports(
  session: SessionContext,
  reportId: string,
  limit = 10,
): Promise<ExecutiveReportSnapshot[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("executive_report_snapshots")
      .select(EXECUTIVE_REPORT_SNAPSHOT_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("report_id", reportId)
      .order("generated_at", { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return (data ?? []).map((row) => mapExecutiveReportSnapshotRow(row as Record<string, unknown>));
  } catch {
    return [];
  }
}

/** Dashboard KPIs for executive reports — never throws. */
export async function getExecutiveReportDashboardMetrics(
  session: SessionContext,
): Promise<ExecutiveReportDashboardMetrics> {
  try {
    const supabase = await createClient();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [snapshotsResult, publishedResult] = await Promise.all([
      supabase
        .from("executive_report_snapshots")
        .select("metadata, generated_at")
        .eq("organization_id", session.organization.id)
        .gte("generated_at", monthStart.toISOString())
        .order("generated_at", { ascending: false })
        .limit(200),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", session.organization.id)
        .eq("status", "published"),
    ]);

    const rows = (snapshotsResult.data ?? []) as Array<{
      metadata: Record<string, unknown> | null;
    }>;

    const generatedThisMonth = rows.length;
    const published = publishedResult.count ?? 0;

    const confidenceValues = rows
      .map((row) => row.metadata?.averageConfidence)
      .filter((value): value is number => typeof value === "number");
    const healthValues = rows
      .map((row) => row.metadata?.healthScore)
      .filter((value): value is number => typeof value === "number");
    const complianceValues = rows
      .map((row) => row.metadata?.complianceScore)
      .filter((value): value is number => typeof value === "number");

    const average = (values: number[]) =>
      values.length > 0
        ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
        : null;

    return {
      generatedThisMonth,
      published,
      averageConfidence: average(confidenceValues),
      averageHealth: average(healthValues),
      averageCompliance: average(complianceValues),
    };
  } catch {
    return {
      generatedThisMonth: 0,
      published: 0,
      averageConfidence: null,
      averageHealth: null,
      averageCompliance: null,
    };
  }
}

/** Portal-safe executive snapshot for a published report — never throws. */
export async function getPortalExecutiveReport(
  organizationId: string,
  clientId: string,
  reportId: string,
): Promise<ExecutiveReportSnapshot | null> {
  try {
    const supabase = await createClient();
    const { data: report } = await supabase
      .from("reports")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .eq("id", reportId)
      .eq("status", "published")
      .maybeSingle();

    if (!report) {
      return null;
    }

    const { data, error } = await supabase
      .from("executive_report_snapshots")
      .select(EXECUTIVE_REPORT_SNAPSHOT_SELECT)
      .eq("organization_id", organizationId)
      .eq("report_id", reportId)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapExecutiveReportSnapshotRow(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Latest published executive overview for portal client — never throws. */
export async function getPortalExecutiveOverview(
  organizationId: string,
  clientId: string,
): Promise<ExecutiveReportSnapshot | null> {
  try {
    const supabase = await createClient();
    const { data: report } = await supabase
      .from("reports")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (!report) {
      return null;
    }

    return getPortalExecutiveReport(organizationId, clientId, String((report as { id: string }).id));
  } catch {
    return null;
  }
}
