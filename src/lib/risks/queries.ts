import { sessionHasPermission } from "@/lib/authorization/guards";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import type { AppUser } from "@/types/database";
import type {
  ClientRiskView,
  CriticalRiskAlert,
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

export async function getRiskById(
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
}

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
  };

  if (!sessionHasPermission(session, "risks.read")) {
    return { data: empty, error: null };
  }

  try {
    const supabase = await createClient();
    const organizationId = session.organization.id;
    const dueSoonCutoff = new Date();
    dueSoonCutoff.setDate(dueSoonCutoff.getDate() + 7);

    const [
      openResult,
      criticalResult,
      highResult,
      dueSoonResult,
      acknowledgedResult,
      mitigatedResult,
      resolvedResult,
      dismissedResult,
    ] = await Promise.all([
      supabase
        .from("client_risks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .in("status", OPEN_RISK_STATUSES),
      supabase
        .from("client_risks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("severity", "critical")
        .in("status", OPEN_RISK_STATUSES),
      supabase
        .from("client_risks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("severity", "high")
        .in("status", OPEN_RISK_STATUSES),
      supabase
        .from("client_risks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .in("status", OPEN_RISK_STATUSES)
        .not("due_at", "is", null)
        .lte("due_at", dueSoonCutoff.toISOString()),
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

    return {
      data: {
        openCount: openResult.count ?? 0,
        criticalCount: criticalResult.count ?? 0,
        highCount: highResult.count ?? 0,
        dueSoonCount: dueSoonResult.count ?? 0,
        acknowledgedCount: acknowledgedResult.count ?? 0,
        mitigatedCount: mitigatedResult.count ?? 0,
        resolvedCount: resolvedResult.count ?? 0,
        dismissedCount: dismissedResult.count ?? 0,
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
  criticalHighCount: number;
  topRisks: Array<{ title: string; severity: RiskSeverity }>;
}> {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("client_risks")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", session.organization.id)
      .eq("client_id", clientId)
      .in("status", OPEN_RISK_STATUSES);

    const { data } = await supabase
      .from("client_risks")
      .select("title, severity")
      .eq("organization_id", session.organization.id)
      .eq("client_id", clientId)
      .in("status", OPEN_RISK_STATUSES)
      .in("severity", ["critical", "high"])
      .order("detected_at", { ascending: false })
      .limit(3);

    const rows = (data ?? []) as Array<{ title: string; severity: RiskSeverity }>;

    return {
      openCount: count ?? 0,
      criticalHighCount: rows.length,
      topRisks: rows,
    };
  } catch {
    return { openCount: 0, criticalHighCount: 0, topRisks: [] };
  }
}
