import "server-only";

import {
  AI_PLAN_RESTRICTED_MESSAGE,
  AIUserError,
} from "@/lib/ai/errors";
import type { PlanKey } from "@/lib/billing/plans";
import {
  getAIUsageLimit,
  getStartOfCurrentMonthUtc,
  isAIUsageUnlimited,
} from "@/lib/ai/usage/limits";
import { formatLimitReachedMessage } from "@/lib/entitlements/messages";
import { resolveOrganizationEntitlements } from "@/lib/entitlements/resolver";
import { isUnlimited } from "@/lib/entitlements/definitions";
import type { AIUsageSummary } from "@/lib/ai/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";

type UsageRow = {
  provider: string;
  model: string;
  total_tokens: number | null;
  created_at: string;
};

/** Count AI calls for the org in the current calendar month (UTC). */
export async function getOrganizationAIMonthlyUsageCount(organizationId: string): Promise<number> {
  const admin = createAdminClient();
  const monthStart = getStartOfCurrentMonthUtc();

  const { count, error } = await admin
    .from("ai_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("created_at", monthStart);

  if (error) {
    console.error("[AI] Failed to count usage:", error.message);
    return 0;
  }

  return count ?? 0;
}

async function fetchMonthlyUsageRows(organizationId: string): Promise<UsageRow[]> {
  const admin = createAdminClient();
  const monthStart = getStartOfCurrentMonthUtc();

  const { data, error } = await admin
    .from("ai_usage_events")
    .select("provider, model, total_tokens, created_at")
    .eq("organization_id", organizationId)
    .gte("created_at", monthStart)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[AI] Failed to load usage rows:", error.message);
    return [];
  }

  return (data ?? []) as UsageRow[];
}

export async function getAIUsageSummaryForPlan(
  organizationId: string,
  planKey: PlanKey,
): Promise<AIUsageSummary> {
  const [callsThisMonth, rows] = await Promise.all([
    getOrganizationAIMonthlyUsageCount(organizationId),
    fetchMonthlyUsageRows(organizationId),
  ]);

  const limit = getAIUsageLimit(planKey);
  const unlimited = isAIUsageUnlimited(planKey);
  const totalTokensThisMonth = rows.reduce((sum, row) => sum + (row.total_tokens ?? 0), 0);
  const latest = rows[0];

  return {
    callsThisMonth,
    limit,
    unlimitedCredits: unlimited,
    totalTokensThisMonth: rows.length > 0 ? totalTokensThisMonth : null,
    lastProvider: latest?.provider ?? null,
    lastModel: latest?.model ?? null,
    hasUsage: callsThisMonth > 0,
    remainingCalls: unlimited ? limit : Math.max(0, limit - callsThisMonth),
  };
}

/** Session-scoped usage summary — respects RLS for owner/admin reads when using user client. */
export async function getAIUsageSummaryForSession(
  session: SessionContext,
  planKey: PlanKey,
): Promise<AIUsageSummary> {
  if (session.role !== "owner" && session.role !== "admin") {
    return getAIUsageSummaryForPlan(session.organization.id, planKey);
  }

  const supabase = await createClient();
  const monthStart = getStartOfCurrentMonthUtc();
  const limit = getAIUsageLimit(planKey);
  const unlimited = isAIUsageUnlimited(planKey);

  const { data, error } = await supabase
    .from("ai_usage_events")
    .select("provider, model, total_tokens, created_at")
    .eq("organization_id", session.organization.id)
    .gte("created_at", monthStart)
    .order("created_at", { ascending: false });

  if (error) {
    return getAIUsageSummaryForPlan(session.organization.id, planKey);
  }

  const rows = (data ?? []) as UsageRow[];
  const totalTokensThisMonth = rows.reduce((sum, row) => sum + (row.total_tokens ?? 0), 0);
  const latest = rows[0];

  return {
    callsThisMonth: rows.length,
    limit,
    unlimitedCredits: unlimited,
    totalTokensThisMonth: rows.length > 0 ? totalTokensThisMonth : null,
    lastProvider: latest?.provider ?? null,
    lastModel: latest?.model ?? null,
    hasUsage: rows.length > 0,
    remainingCalls: unlimited ? limit : Math.max(0, limit - rows.length),
  };
}

export async function assertWithinAIUsageLimit(
  organizationId: string,
  _planKey: PlanKey,
): Promise<void> {
  const entitlements = await resolveOrganizationEntitlements(organizationId);

  if (!entitlements.isPaidAccess) {
    throw new AIUserError(AI_PLAN_RESTRICTED_MESSAGE, "plan_restricted");
  }

  const limit = entitlements.aiCreditsPerMonth;

  if (limit === 0) {
    throw new AIUserError(AI_PLAN_RESTRICTED_MESSAGE, "plan_restricted");
  }

  if (isUnlimited(limit)) {
    return;
  }

  const used = await getOrganizationAIMonthlyUsageCount(organizationId);

  if (used >= limit) {
    throw new AIUserError(formatLimitReachedMessage("aiCreditsPerMonth"), "rate_limit");
  }
}
