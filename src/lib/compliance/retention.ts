import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { RetentionDataCategory, RetentionPeriod } from "@/lib/compliance/types";
import { RETENTION_CATEGORY_LABELS } from "@/lib/compliance/types";

const DEFAULT_RETENTION: Record<RetentionDataCategory, RetentionPeriod> = {
  ai_logs: "90d",
  reports: "3y",
  audit_events: "7y",
  connector_sync_history: "1y",
  executions: "1y",
  api_logs: "1y",
  invoices: "7y",
  notifications: "1y",
  knowledge_entries: "3y",
  portal_activity: "1y",
};

export async function ensureDefaultRetentionRules(organizationId: string): Promise<void> {
  const admin = createAdminClient();
  for (const [category, period] of Object.entries(DEFAULT_RETENTION) as Array<
    [RetentionDataCategory, RetentionPeriod]
  >) {
    await admin.from("retention_rules").upsert(
      {
        organization_id: organizationId,
        data_category: category,
        retention_period: period,
        simulation_only: true,
        enabled: true,
      } as never,
      { onConflict: "organization_id,data_category" },
    );
  }
}

export async function getRetentionCoveragePercent(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("retention_rules")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("enabled", true);

  const configured = count ?? 0;
  const total = Object.keys(RETENTION_CATEGORY_LABELS).length;
  return Math.round((configured / total) * 100);
}

export async function listRetentionRules(organizationId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("retention_rules")
    .select("*")
    .eq("organization_id", organizationId)
    .order("data_category", { ascending: true });
  return (data ?? []).map((row) => {
    const rule = row as { data_category: RetentionDataCategory; retention_period: RetentionPeriod; simulation_only: boolean; enabled: boolean };
    return {
      ...rule,
      label: RETENTION_CATEGORY_LABELS[rule.data_category],
    };
  });
}

export function simulateRetentionImpact(
  category: RetentionDataCategory,
  period: RetentionPeriod,
): { category: RetentionDataCategory; period: RetentionPeriod; simulatedRecords: number; note: string } {
  const simulatedRecords = period === "forever" ? 0 : Math.floor(Math.random() * 500) + 50;
  return {
    category,
    period,
    simulatedRecords,
    note: "Simulation only — automatic deletion is not enabled in v1.",
  };
}
