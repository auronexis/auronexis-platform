import "server-only";

import type { PlanKey } from "@/lib/billing/plans";
import { getAIUsageLimit } from "@/lib/ai/usage/limits";
import { getPlanLimit } from "@/lib/plans/features";
import type { UsageMetricKey } from "@/lib/billing/types";
import { sanitizeBillingMetadata, validateMetricKey, validateUsageQuantity } from "@/lib/billing/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRateLimitForPlan } from "@/lib/api/rate-limit/limits";

export function getBillingPeriodBounds(reference = new Date()): {
  periodStart: string;
  periodEnd: string;
} {
  const periodStart = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 1));
  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
  };
}

export function getPreviousBillingPeriodBounds(reference = new Date()): {
  periodStart: string;
  periodEnd: string;
} {
  const previous = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() - 1, 1));
  return getBillingPeriodBounds(previous);
}

const MONTHLY_USAGE_LIMITS: Record<PlanKey, Partial<Record<UsageMetricKey, number | null>>> = {
  starter: {
    ai_generations: 0,
    ai_tokens: 0,
    api_requests: 10_000,
    automation_executions: 0,
    connector_syncs: 0,
    workflow_executions: 0,
    reports_generated: 50,
    reports_published: 25,
    storage_mb: 100,
    portal_users: 10,
    email_sends: 0,
  },
  professional: {
    ai_generations: 100,
    ai_tokens: 100_000,
    api_requests: 50_000,
    automation_executions: 500,
    connector_syncs: 100,
    workflow_executions: 500,
    reports_generated: 200,
    reports_published: 100,
    storage_mb: 500,
    portal_users: 50,
    email_sends: 100,
  },
  business: {
    ai_generations: 500,
    ai_tokens: 500_000,
    api_requests: 200_000,
    automation_executions: 5_000,
    connector_syncs: 1_000,
    workflow_executions: 5_000,
    reports_generated: 1_000,
    reports_published: 500,
    storage_mb: 2_000,
    portal_users: 200,
    email_sends: 500,
  },
  enterprise: {
    ai_generations: 2_000,
    ai_tokens: 2_000_000,
    api_requests: 1_000_000,
    automation_executions: null,
    connector_syncs: null,
    workflow_executions: null,
    reports_generated: null,
    reports_published: null,
    storage_mb: 10_000,
    portal_users: null,
    email_sends: 2_000,
  },
};

export function getUsageLimit(planKey: PlanKey, metric: UsageMetricKey): number | null {
  if (metric === "ai_generations") {
    return getAIUsageLimit(planKey);
  }

  if (metric === "active_users") {
    return getPlanLimit(planKey, "seats");
  }

  if (metric === "active_clients") {
    return getPlanLimit(planKey, "max_clients");
  }

  const configured = MONTHLY_USAGE_LIMITS[planKey][metric];
  if (configured !== undefined) {
    return configured;
  }

  if (metric === "api_requests") {
    return getRateLimitForPlan(planKey) * 60 * 24 * 30;
  }

  return null;
}

export function getSuggestedUpgradePlan(
  planKey: PlanKey,
  metric: UsageMetricKey,
): PlanKey | null {
  const order: PlanKey[] = ["starter", "professional", "business", "enterprise"];
  const currentIndex = order.indexOf(planKey);
  for (let index = currentIndex + 1; index < order.length; index += 1) {
    const candidate = order[index];
    const limit = getUsageLimit(candidate, metric);
    if (limit === null || limit > getUsageLimit(planKey, metric)!) {
      return candidate;
    }
  }
  return null;
}

export async function recordBillingUsageEvent(input: {
  organizationId: string;
  metric: UsageMetricKey | string;
  quantity?: number;
  unit?: string | null;
  metadata?: Record<string, unknown>;
  recordedAt?: string;
}): Promise<void> {
  const metric = validateMetricKey(input.metric);
  const quantity = validateUsageQuantity(input.quantity ?? 1);
  const { periodStart, periodEnd } = getBillingPeriodBounds(
    input.recordedAt ? new Date(input.recordedAt) : new Date(),
  );
  const admin = createAdminClient();

  const { error } = await admin.from("billing_usage_events").insert({
    organization_id: input.organizationId,
    metric,
    quantity,
    unit: input.unit ?? null,
    metadata: sanitizeBillingMetadata(input.metadata),
    billing_period_start: periodStart,
    billing_period_end: periodEnd,
    recorded_at: input.recordedAt ?? new Date().toISOString(),
  } as never);

  if (error) {
    console.error("[billing] failed to record usage event:", error.message);
  }
}

export async function aggregateBillingUsageEvents(
  organizationId: string,
  periodStart: string,
  periodEnd: string,
): Promise<Partial<Record<UsageMetricKey, number>>> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("billing_usage_events")
    .select("metric, quantity")
    .eq("organization_id", organizationId)
    .gte("billing_period_start", periodStart)
    .lt("billing_period_end", periodEnd);

  if (error) {
    console.error("[billing] usage aggregation failed:", error.message);
    return {};
  }

  const totals: Partial<Record<UsageMetricKey, number>> = {};
  for (const row of (data ?? []) as Array<{ metric: string; quantity: number }>) {
    const metric = row.metric as UsageMetricKey;
    totals[metric] = (totals[metric] ?? 0) + Number(row.quantity ?? 0);
  }
  return totals;
}
