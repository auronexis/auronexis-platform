import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { ReportVersion, ReportV2View, SafeResult } from "@/lib/reports-v2/types";
import { REPORT_V2_SELECT } from "@/lib/reports-v2/types";

function mapVersion(row: Record<string, unknown>): ReportVersion {
  return {
    id: String(row.id),
    version: Number(row.version ?? 1),
    status: row.status as ReportVersion["status"],
    title: String(row.title),
    publishedAt: (row.published_at as string | null) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function getReportHistory(
  session: SessionContext,
  reportId: string,
): Promise<SafeResult<ReportVersion[]>> {
  try {
    const supabase = await createClient();
    const { data: report } = await supabase
      .from("reports")
      .select("root_report_id, id")
      .eq("id", reportId)
      .eq("organization_id", session.organization.id)
      .maybeSingle();

    if (!report) {
      return { data: [], error: null };
    }

    const rootId = (report as { root_report_id: string | null; id: string }).root_report_id
      ?? (report as { id: string }).id;

    const { data, error } = await supabase
      .from("reports")
      .select("id, version, status, title, published_at, created_at, updated_at")
      .eq("organization_id", session.organization.id)
      .eq("root_report_id", rootId)
      .order("version", { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data ?? []).map((row) => mapVersion(row as Record<string, unknown>)), error: null };
  } catch (error) {
    console.warn("[reports-v2] getReportHistory failed:", error);
    return { data: [], error: "Unable to load report history." };
  }
}

export async function getLatestVersion(
  session: SessionContext,
  rootReportId: string,
): Promise<SafeResult<ReportV2View>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reports")
      .select(REPORT_V2_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("root_report_id", rootReportId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as ReportV2View | null) ?? null, error: null };
  } catch (error) {
    console.warn("[reports-v2] getLatestVersion failed:", error);
    return { data: null, error: "Unable to load latest version." };
  }
}

export async function getLatestPublishedPortalReport(
  session: SessionContext,
  clientId: string,
): Promise<SafeResult<ReportV2View>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reports")
      .select(REPORT_V2_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("client_id", clientId)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("version", { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    const rows = (data ?? []) as ReportV2View[];
    if (rows.length === 0) {
      return { data: null, error: null };
    }

    const byRoot = new Map<string, ReportV2View>();
    for (const row of rows) {
      const root = row.root_report_id ?? row.id;
      const existing = byRoot.get(root);
      if (!existing || row.version > existing.version) {
        byRoot.set(root, row);
      }
    }

    const latest = [...byRoot.values()].sort((a, b) => {
      const aDate = a.published_at ?? a.updated_at;
      const bDate = b.published_at ?? b.updated_at;
      return bDate.localeCompare(aDate);
    })[0];

    return { data: latest ?? null, error: null };
  } catch (error) {
    console.warn("[reports-v2] getLatestPublishedPortalReport failed:", error);
    return { data: null, error: null };
  }
}
