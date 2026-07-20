import { cache } from "react";
import { sessionHasPermission } from "@/lib/authorization/guards";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { AppUser } from "@/types/database";
import type {
  ClientRiskView,
  CriticalRiskAlert,
  RiskActivityView,
  RiskHeatmap,
  RiskHeatmapCell,
  RiskSeverity,
  RiskStatus,
  RiskSummary,
  SafeResult,
} from "@/lib/risks/types";
import {
  CLIENT_RISK_LIST_SELECT,
  OPEN_RISK_STATUSES,
} from "@/lib/risks/types";

type ListRisksOptions = {
  status?: RiskStatus | RiskStatus[];
  severity?: RiskSeverity;
  clientId?: string;
  category?: string;
  ownerUserId?: string;
  minRiskScore?: number;
  limit?: number;
};

function mapRisk(row: Record<string, unknown>): ClientRiskView {
  return row as ClientRiskView;
}

/** List client risks for the organization — safe, never throws. */
export async function listRisks(
  session: SessionContext,
  options: ListRisksOptions = {},
): Promise<ClientRiskView[]> {
  if (!sessionHasPermission(session, "risks.read")) {
    return [];
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("client_risks")
      .select(CLIENT_RISK_LIST_SELECT)
      .eq("organization_id", session.organization.id)
      .order("detected_at", { ascending: false });

    if (options.clientId) {
      query = query.eq("client_id", options.clientId);
    }

    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status];
      query = query.in("status", statuses);
    }

    if (options.severity) {
      query = query.eq("severity", options.severity);
    }

    if (options.category) {
      query = query.eq("category", options.category);
    }

    if (options.ownerUserId) {
      query = query.eq("owner_user_id", options.ownerUserId);
    }

    if (options.minRiskScore) {
      query = query.gte("risk_score", options.minRiskScore);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("[risks] listRisks failed:", error.message);
      return [];
    }

    return (data ?? []).map((row) => mapRisk(row as Record<string, unknown>));
  } catch (error) {
    console.warn("[risks] listRisks failed:", error);
    return [];
  }
}

export async function listClientRisks(
  session: SessionContext,
  clientId: string,
  options: Omit<ListRisksOptions, "clientId"> = {},
): Promise<ClientRiskView[]> {
  return listRisks(session, { ...options, clientId });
}

export const getRiskById = cache(async function getRiskById(
  session: SessionContext,
  riskId: string,
): Promise<ClientRiskView | null> {
  if (!sessionHasPermission(session, "risks.read")) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("client_risks")
      .select(CLIENT_RISK_LIST_SELECT)
      .eq("id", riskId)
      .eq("organization_id", session.organization.id)
      .maybeSingle();

    if (error) {
      console.warn("[risks] getRiskById failed:", error.message);
      return null;
    }

    return data ? mapRisk(data as Record<string, unknown>) : null;
  } catch (error) {
    console.warn("[risks] getRiskById failed:", error);
    return null;
  }
});

export async function listOpenRisks(session: SessionContext): Promise<ClientRiskView[]> {
  return listRisks(session, { status: [...OPEN_RISK_STATUSES] });
}

export async function listCriticalRisks(
  session: SessionContext,
  limit = 10,
): Promise<ClientRiskView[]> {
  return listRisks(session, {
    status: [...OPEN_RISK_STATUSES],
    severity: "critical",
    limit,
  });
}

export async function getRiskSummary(session: SessionContext): Promise<SafeResult<RiskSummary>> {
  const empty: RiskSummary = {
    openCount: 0,
    criticalCount: 0,
    highCount: 0,
    dueSoonCount: 0,
    acknowledgedCount: 0,
    mitigatedCount: 0,
    resolvedCount: 0,
    dismissedCount: 0,
    highScoreCount: 0,
    overdueCount: 0,
    mitigationRate: 0,
    averageRiskScore: null,
  };

  if (!sessionHasPermission(session, "risks.read")) {
    return { data: empty, error: null };
  }

  try {
    const supabase = await createClient();
    const organizationId = session.organization.id;
    const now = new Date().toISOString();
    const dueSoonCutoff = new Date();
    dueSoonCutoff.setDate(dueSoonCutoff.getDate() + 7);

    const { data: openRows, error: openRowsError } = await supabase
      .from("client_risks")
      .select("status, severity, due_at, risk_score, likelihood, impact_score")
      .eq("organization_id", organizationId)
      .in("status", OPEN_RISK_STATUSES);

    if (openRowsError) {
      throw new Error(openRowsError.message);
    }

    const [
      acknowledgedResult,
      mitigatedResult,
      resolvedResult,
      dismissedResult,
    ] = await Promise.all([
      supabase
        .from("client_risks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "acknowledged"),
      supabase
        .from("client_risks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "mitigated"),
      supabase
        .from("client_risks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "resolved"),
      supabase
        .from("client_risks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "dismissed"),
    ]);

    const rows = (openRows ?? []) as Array<{
      status: RiskStatus;
      severity: RiskSeverity;
      due_at: string | null;
      risk_score: number | null;
    }>;

    let criticalCount = 0;
    let highCount = 0;
    let dueSoonCount = 0;
    let highScoreCount = 0;
    let overdueCount = 0;
    let mitigatedOpenCount = 0;
    let scoreTotal = 0;
    let scoreCount = 0;

    for (const row of rows) {
      if (row.severity === "critical") {
        criticalCount += 1;
      } else if (row.severity === "high") {
        highCount += 1;
      }

      const score = row.risk_score ?? 0;
      if (score >= 12) {
        highScoreCount += 1;
      }

      if (typeof row.risk_score === "number") {
        scoreTotal += row.risk_score;
        scoreCount += 1;
      }

      if (row.due_at) {
        if (row.due_at <= dueSoonCutoff.toISOString()) {
          dueSoonCount += 1;
        }
        if (row.due_at < now) {
          overdueCount += 1;
        }
      }

      if (row.status === "mitigated") {
        mitigatedOpenCount += 1;
      }
    }

    const openCount = rows.length;
    const mitigationDenominator = openCount + (resolvedResult.count ?? 0);
    const mitigationRate =
      mitigationDenominator > 0
        ? Math.round(((mitigatedOpenCount + (mitigatedResult.count ?? 0)) / mitigationDenominator) * 100)
        : 0;

    return {
      data: {
        openCount,
        criticalCount,
        highCount,
        dueSoonCount,
        acknowledgedCount: acknowledgedResult.count ?? 0,
        mitigatedCount: mitigatedResult.count ?? 0,
        resolvedCount: resolvedResult.count ?? 0,
        dismissedCount: dismissedResult.count ?? 0,
        highScoreCount,
        overdueCount,
        mitigationRate,
        averageRiskScore: scoreCount > 0 ? Math.round((scoreTotal / scoreCount) * 10) / 10 : null,
      },
      error: null,
    };
  } catch (error) {
    console.warn("[risks] getRiskSummary failed:", error);
    return { data: empty, error: "Unable to load risk summary." };
  }
}

/** Dashboard metrics — uses client_risks engine. */
export async function getRiskDashboardMetrics(session: SessionContext): Promise<{
  openRiskCount: number;
  criticalRisks: CriticalRiskAlert[];
}> {
  try {
    const supabase = await createClient();
    const organizationId = session.organization.id;

    const { count } = await supabase
      .from("client_risks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", OPEN_RISK_STATUSES);

    const { data } = await supabase
      .from("client_risks")
      .select("id, title, severity, status, due_at, clients ( name )")
      .eq("organization_id", organizationId)
      .eq("severity", "critical")
      .in("status", OPEN_RISK_STATUSES)
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(5);

    return {
      openRiskCount: count ?? 0,
      criticalRisks: (data ?? []) as CriticalRiskAlert[],
    };
  } catch (error) {
    console.warn("[risks] getRiskDashboardMetrics failed:", error);
    return { openRiskCount: 0, criticalRisks: [] };
  }
}

/** Active organization members for owner assignment. */
export async function listOrgUsers(session: SessionContext): Promise<AppUser[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, full_name, email, role, organization_id, auth_user_id, is_disabled, created_at, updated_at",
      )
      .eq("organization_id", session.organization.id)
      .eq("is_disabled", false)
      .order("full_name", { ascending: true });

    if (error) {
      console.warn("[risks] listOrgUsers failed:", error.message);
      return [];
    }

    return (data ?? []) as AppUser[];
  } catch {
    return [];
  }
}

/** Lightweight metrics for reports engine. */
export async function getClientRiskMetricsForReport(
  session: SessionContext,
  clientId: string,
): Promise<{
  openCount: number;
  criticalCount: number;
  criticalHighCount: number;
  averageRiskScore: number | null;
  topRisks: Array<{ title: string; severity: RiskSeverity; risk_score: number | null }>;
}> {
  try {
    const supabase = await createClient();
    const organizationId = session.organization.id;

    const { count: openCount } = await supabase
      .from("client_risks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .in("status", OPEN_RISK_STATUSES);

    const { count: criticalCount } = await supabase
      .from("client_risks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .in("status", OPEN_RISK_STATUSES)
      .eq("severity", "critical");

    const { data: scoreRows } = await supabase
      .from("client_risks")
      .select("risk_score")
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .in("status", OPEN_RISK_STATUSES);

    const scores = ((scoreRows ?? []) as Array<{ risk_score: number | null }>)
      .map((row) => row.risk_score)
      .filter((value): value is number => typeof value === "number");

    const { data } = await supabase
      .from("client_risks")
      .select("title, severity, risk_score")
      .eq("organization_id", organizationId)
      .eq("client_id", clientId)
      .in("status", OPEN_RISK_STATUSES)
      .order("risk_score", { ascending: false, nullsFirst: false })
      .limit(3);

    const rows = (data ?? []) as Array<{
      title: string;
      severity: RiskSeverity;
      risk_score: number | null;
    }>;

    return {
      openCount: openCount ?? 0,
      criticalCount: criticalCount ?? 0,
      criticalHighCount: rows.filter((row) => row.severity === "critical" || row.severity === "high").length,
      averageRiskScore:
        scores.length > 0
          ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10
          : null,
      topRisks: rows,
    };
  } catch {
    return {
      openCount: 0,
      criticalCount: 0,
      criticalHighCount: 0,
      averageRiskScore: null,
      topRisks: [],
    };
  }
}

const RISK_ACTIVITY_SELECT = `
  id,
  organization_id,
  risk_id,
  actor_user_id,
  event_type,
  message,
  metadata,
  created_at,
  actor:users!risk_activity_actor_user_id_fkey ( full_name )
`;

/** Risk timeline entries for detail view. */
export async function getRiskActivity(
  session: SessionContext,
  riskId: string,
): Promise<RiskActivityView[]> {
  if (!sessionHasPermission(session, "risks.read")) {
    return [];
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("risk_activity")
      .select(RISK_ACTIVITY_SELECT)
      .eq("organization_id", session.organization.id)
      .eq("risk_id", riskId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[risks] getRiskActivity failed:", error.message);
      return [];
    }

    return (data ?? []) as RiskActivityView[];
  } catch (error) {
    console.warn("[risks] getRiskActivity failed:", error);
    return [];
  }
}

/** 5×5 likelihood × impact matrix for open risks. */
export async function getRiskHeatmap(session: SessionContext): Promise<RiskHeatmap> {
  const empty: RiskHeatmap = { cells: [], maxCount: 0 };

  if (!sessionHasPermission(session, "risks.read")) {
    return empty;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("client_risks")
      .select("likelihood, impact_score")
      .eq("organization_id", session.organization.id)
      .in("status", OPEN_RISK_STATUSES);

    if (error) {
      console.warn("[risks] getRiskHeatmap failed:", error.message);
      return empty;
    }

    const counts = new Map<string, number>();
    for (const row of (data ?? []) as Array<{ likelihood: number; impact_score: number }>) {
      const likelihood = Math.min(5, Math.max(1, row.likelihood ?? 3));
      const impact = Math.min(5, Math.max(1, row.impact_score ?? 3));
      const key = `${likelihood}:${impact}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const cells: RiskHeatmapCell[] = [];
    let maxCount = 0;

    for (let likelihood = 1; likelihood <= 5; likelihood += 1) {
      for (let impact = 1; impact <= 5; impact += 1) {
        const count = counts.get(`${likelihood}:${impact}`) ?? 0;
        maxCount = Math.max(maxCount, count);
        cells.push({ likelihood, impact, count });
      }
    }

    return { cells, maxCount };
  } catch (error) {
    console.warn("[risks] getRiskHeatmap failed:", error);
    return empty;
  }
}

/** Client-level open risk score summary. */
export async function getClientRiskScoreSummary(
  session: SessionContext,
  clientId: string,
): Promise<{
  openCount: number;
  averageRiskScore: number | null;
  highestScore: number | null;
}> {
  try {
    const risks = await listClientRisks(session, clientId, { status: [...OPEN_RISK_STATUSES] });
    const scores = risks
      .map((risk) => risk.risk_score)
      .filter((value): value is number => typeof value === "number");

    return {
      openCount: risks.length,
      averageRiskScore:
        scores.length > 0
          ? Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10
          : null,
      highestScore: scores.length > 0 ? Math.max(...scores) : null,
    };
  } catch {
    return { openCount: 0, averageRiskScore: null, highestScore: null };
  }
}
