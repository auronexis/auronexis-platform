import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type {
  ReportStatusV2,
  ReportsOverviewMetrics,
  ReportV2View,
  SafeResult,
} from "@/lib/reports-v2/types";
import { REPORT_V2_LIST_SELECT } from "@/lib/reports-v2/types";

function mapReport(row: Record<string, unknown>): ReportV2View {
  return row as ReportV2View;
}

export async function listReportsV2(
  session: SessionContext,
  options: { status?: ReportStatusV2 | ReportStatusV2[]; clientId?: string; limit?: number } = {},
): Promise<SafeResult<ReportV2View[]>> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("reports")
      .select(REPORT_V2_LIST_SELECT)
      .eq("organization_id", session.organization.id)
      .order("updated_at", { ascending: false });

    if (options.clientId) {
      query = query.eq("client_id", options.clientId);
    }

    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      query = query.in("status", statuses);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data ?? []).map((row) => mapReport(row as Record<string, unknown>)), error: null };
  } catch (error) {
    console.warn("[reports-v2] listReportsV2 failed:", error);
    return { data: [], error: "Unable to load reports." };
  }
}

export async function getReportByIdV2(
  session: SessionContext,
  reportId: string,
): Promise<SafeResult<ReportV2View>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reports")
      .select(REPORT_V2_LIST_SELECT)
      .eq("id", reportId)
      .eq("organization_id", session.organization.id)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data ? mapReport(data as Record<string, unknown>) : null, error: null };
  } catch (error) {
    console.warn("[reports-v2] getReportByIdV2 failed:", error);
    return { data: null, error: "Unable to load report." };
  }
}

export async function getReportsOverviewMetrics(
  session: SessionContext,
): Promise<SafeResult<ReportsOverviewMetrics>> {
  try {
    const supabase = await createClient();
    const organizationId = session.organization.id;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [publishedResult, draftResult, scoreResult, latestResult] = await Promise.all([
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "published")
        .gte("published_at", monthStart.toISOString()),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "draft"),
      supabase
        .from("reports")
        .select("health_score, sla_score")
        .eq("organization_id", organizationId)
        .in("status", ["generated", "published"]),
      supabase
        .from("reports")
        .select("id, title, published_at, client_id, updated_at")
        .eq("organization_id", organizationId)
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const scores = (scoreResult.data ?? []) as Array<{ health_score: number | null; sla_score: number | null }>;
    const healthScores = scores.map((row) => row.health_score).filter((v): v is number => v != null);
    const slaScores = scores.map((row) => row.sla_score).filter((v): v is number => v != null);

    const average = (values: number[]) =>
      values.length > 0 ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;

    return {
      data: {
        publishedThisMonth: publishedResult.count ?? 0,
        draftCount: draftResult.count ?? 0,
        averageHealthScore: average(healthScores),
        averageSlaScore: average(slaScores),
        latestReport: (latestResult.data as ReportsOverviewMetrics["latestReport"]) ?? null,
      },
      error: null,
    };
  } catch (error) {
    console.warn("[reports-v2] getReportsOverviewMetrics failed:", error);
    return {
      data: {
        publishedThisMonth: 0,
        draftCount: 0,
        averageHealthScore: null,
        averageSlaScore: null,
        latestReport: null,
      },
      error: null,
    };
  }
}

/** Portal-safe published reports — newest version per series only. */
export async function listPortalPublishedReportsV2(
  organizationId: string,
  clientId: string,
): Promise<SafeResult<ReportV2View[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reports")
      .select(
        "id, organization_id, client_id, title, reporting_period_start, reporting_period_end, status, summary, executive_summary, health_score, sla_score, published_at, sent_at, version, root_report_id, created_at, updated_at",
      )
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false });

    if (error) {
      return { data: [], error: error.message };
    }

    const rows = (data ?? []) as ReportV2View[];
    const byRoot = new Map<string, ReportV2View>();

    for (const row of rows) {
      const root = row.root_report_id ?? row.id;
      const existing = byRoot.get(root);
      if (!existing || row.version > existing.version) {
        byRoot.set(root, row);
      }
    }

    return {
      data: [...byRoot.values()].sort((a, b) =>
        (b.published_at ?? b.updated_at).localeCompare(a.published_at ?? a.updated_at),
      ),
      error: null,
    };
  } catch (error) {
    console.warn("[reports-v2] listPortalPublishedReportsV2 failed:", error);
    return { data: [], error: null };
  }
}
