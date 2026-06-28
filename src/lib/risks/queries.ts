import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/types/database";
import type { SessionContext } from "@/lib/tenancy/context";
import type { CriticalRiskAlert, RiskWithRelations } from "@/lib/risks/types";
import { OPEN_RISK_STATUSES, RISK_LIST_SELECT, RISK_SELECT_COLUMNS } from "@/lib/risks/types";

type ListRisksOptions = {
  includeArchived?: boolean;
};

/** List risks for the current organization with client and owner names. */
export async function listRisks(
  session: SessionContext,
  options: ListRisksOptions = {},
): Promise<RiskWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("risks")
    .select(RISK_LIST_SELECT)
    .eq("organization_id", session.organization.id)
    .order("updated_at", { ascending: false });

  if (!options.includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RiskWithRelations[];
}

/** Load a single risk by id within the current organization. */
export async function getRiskById(
  session: SessionContext,
  riskId: string,
): Promise<RiskWithRelations | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("risks")
    .select(RISK_LIST_SELECT)
    .eq("id", riskId)
    .eq("organization_id", session.organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as RiskWithRelations | null) ?? null;
}

/** Active organization members for owner assignment. */
export async function listOrgUsers(session: SessionContext): Promise<AppUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, role, organization_id, auth_user_id, is_disabled, created_at, updated_at")
    .eq("organization_id", session.organization.id)
    .eq("is_disabled", false)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AppUser[];
}

/** Dashboard metrics for open and critical risks. */
export async function getRiskDashboardMetrics(session: SessionContext): Promise<{
  openRiskCount: number;
  criticalRisks: CriticalRiskAlert[];
}> {
  const supabase = await createClient();
  const organizationId = session.organization.id;

  const { count, error: countError } = await supabase
    .from("risks")
    .select(RISK_SELECT_COLUMNS, { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("status", OPEN_RISK_STATUSES);

  if (countError) {
    throw new Error(countError.message);
  }

  const { data, error } = await supabase
    .from("risks")
    .select("id, title, severity, status, due_date, clients ( name )")
    .eq("organization_id", organizationId)
    .eq("severity", "critical")
    .in("status", OPEN_RISK_STATUSES)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(5);

  if (error) {
    throw new Error(error.message);
  }

  return {
    openRiskCount: count ?? 0,
    criticalRisks: (data ?? []) as CriticalRiskAlert[],
  };
}
