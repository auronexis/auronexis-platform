import "server-only";

import { cache } from "react";
import { getRecentActivityEvents } from "@/lib/activity/queries";
import { buildOperationalSnapshot } from "@/lib/ai/insights/queries";
import type { DashboardData } from "@/lib/dashboard/types";
import { deriveHealthTrend } from "@/lib/reports-v2/summary";
import type { HealthSnapshot } from "@/lib/health/types";
import { parseHealthBreakdown, scoreToHealthStatus } from "@/lib/health/types";
import { createClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/tenancy/context";
import {
  buildCustomerSuccessCategories,
  buildExecutiveBrief,
  buildExecutiveInsights,
  buildPriorityClientSummaries,
  buildSmartTimeline,
} from "@/lib/intelligence/recommendations";
import { buildPortfolioHealthDistribution } from "@/lib/intelligence/scoring";
import type {
  ExecutiveIntelligence,
  HealthTrendPeriodDays,
  OrganizationHealthTrend,
} from "@/lib/intelligence/types";

const HEALTH_SNAPSHOT_SELECT =
  "id, organization_id, client_id, score, status, delta, reason, breakdown, calculated_at";

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function mapSnapshotRow(row: Record<string, unknown>): HealthSnapshot {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    client_id: String(row.client_id),
    score: Number(row.score),
    status: row.status as HealthSnapshot["status"],
    delta: Number(row.delta ?? 0),
    reason: (row.reason as string | null) ?? null,
    breakdown: parseHealthBreakdown(row.breakdown as never),
    calculated_at: String(row.calculated_at),
  };
}

function latestSnapshotByClient(rows: HealthSnapshot[]): Map<string, HealthSnapshot> {
  const map = new Map<string, HealthSnapshot>();

  for (const row of rows) {
    if (!map.has(row.client_id)) {
      map.set(row.client_id, row);
    }
  }

  return map;
}

function computeAverageScore(rows: HealthSnapshot[]): number | null {
  if (rows.length === 0) {
    return null;
  }

  return Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length);
}

function buildPeriodTrend(
  periodDays: HealthTrendPeriodDays,
  snapshots: HealthSnapshot[],
): OrganizationHealthTrend {
  const now = Date.now();
  const periodStart = now - periodDays * 24 * 60 * 60 * 1000;
  const previousStart = now - periodDays * 2 * 24 * 60 * 60 * 1000;

  const currentRows = snapshots.filter(
    (row) => new Date(row.calculated_at).getTime() >= periodStart,
  );
  const previousRows = snapshots.filter((row) => {
    const timestamp = new Date(row.calculated_at).getTime();
    return timestamp >= previousStart && timestamp < periodStart;
  });

  const currentLatest = [...latestSnapshotByClient(currentRows).values()];
  const previousLatest = [...latestSnapshotByClient(previousRows).values()];
  const periodAverage = computeAverageScore(currentLatest);
  const previousAverage = computeAverageScore(previousLatest);
  const delta =
    periodAverage != null && previousAverage != null ? periodAverage - previousAverage : null;

  const trend = deriveHealthTrend(
    currentLatest
      .slice()
      .sort(
        (left, right) =>
          new Date(right.calculated_at).getTime() - new Date(left.calculated_at).getTime(),
      )
      .slice(0, 8)
      .map((row) => ({
        score: row.score,
        status: row.status,
        calculated_at: row.calculated_at,
      })),
  );

  return {
    periodDays,
    label: `${periodDays} days`,
    averageScore: periodAverage,
    delta,
    status:
      periodAverage != null ? scoreToHealthStatus(periodAverage) : (trend.status as HealthSnapshot["status"] | null),
    points: trend.points,
    hasData: currentLatest.length > 0,
  };
}

async function loadOrganizationHealthSnapshots(session: SessionContext): Promise<HealthSnapshot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("health_snapshots")
    .select(HEALTH_SNAPSHOT_SELECT)
    .eq("organization_id", session.organization.id)
    .gte("calculated_at", daysAgoIso(90))
    .order("calculated_at", { ascending: false })
    .limit(500);

  if (error) {
    console.warn("[intelligence] failed to load health snapshots:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapSnapshotRow(row as Record<string, unknown>));
}

/** Aggregate executive intelligence from existing operational data sources. */
export const getExecutiveIntelligence = cache(
  async (
    session: SessionContext,
    existingDashboard?: DashboardData,
  ): Promise<ExecutiveIntelligence> => {
    const [snapshot, healthSnapshots, timelineEvents] = await Promise.all([
      buildOperationalSnapshot(session, existingDashboard),
      loadOrganizationHealthSnapshots(session),
      getRecentActivityEvents(session, 20).catch(() => []),
    ]);

    const brief = buildExecutiveBrief(snapshot, session.user.full_name);
    const priorityClients = buildPriorityClientSummaries(snapshot);
    const portfolioHealth = buildPortfolioHealthDistribution(
      snapshot.dashboard.clientHealth,
      snapshot.dashboard.healthMetrics,
    );
    const insights = buildExecutiveInsights(snapshot);
    const successCategories = buildCustomerSuccessCategories(snapshot);
    const healthTrends: OrganizationHealthTrend[] = [7, 30, 90].map((periodDays) =>
      buildPeriodTrend(periodDays as HealthTrendPeriodDays, healthSnapshots),
    );
    const timeline = buildSmartTimeline(
      timelineEvents.length > 0 ? timelineEvents : snapshot.recentActivity,
    );

    return {
      brief,
      priorityClients,
      portfolioHealth,
      insights,
      successCategories,
      healthTrends,
      timeline,
      generatedAt: new Date().toISOString(),
      hasClients: snapshot.clients.length > 0,
    };
  },
);
