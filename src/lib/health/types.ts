import type { Json } from "@/types/database";
import { formatAppDateTime } from "@/lib/i18n";

export type HealthStatus = "excellent" | "healthy" | "watch" | "critical";

export type HealthBreakdownItem = {
  label: string;
  points: number;
};

export type HealthBreakdown = {
  baseScore: number;
  penalties: HealthBreakdownItem[];
  bonuses: HealthBreakdownItem[];
};

export type HealthSnapshot = {
  id: string;
  organization_id: string;
  client_id: string;
  score: number;
  status: HealthStatus;
  delta: number;
  reason: string | null;
  breakdown: HealthBreakdown;
  calculated_at: string;
};

export type HealthCalculationInput = {
  client: {
    id: string;
    name: string;
    status: string;
    updated_at: string;
  };
  metrics: HealthMetricsInput;
  previousScore?: number | null;
};

export type HealthMetricsInput = {
  slaViolations: number;
  monitoringCriticalEvents: number;
  isInactiveClient: boolean;
  missingReports: boolean;
  portalDisabled: boolean;
  noRecentActivity: boolean;
  healthySla: boolean;
  portalEnabled: boolean;
  recentEngagement: boolean;
};

export type HealthCalculationResult = {
  score: number;
  status: HealthStatus;
  delta: number;
  reason: string;
  breakdown: HealthBreakdown;
};

export type ClientHealthSummary = {
  clientId: string;
  score: number;
  status: HealthStatus;
  delta: number;
  reason: string | null;
  calculatedAt: string;
};

export type HealthDashboardMetrics = {
  averageScore: number | null;
  excellentClients: number;
  healthyClients: number;
  watchClients: number;
  criticalClients: number;
  trackedClients: number;
  trendDelta: number | null;
  trendLabel: string;
  hasSnapshots: boolean;
};

export const HEALTH_STATUS_LABELS: Record<HealthStatus, string> = {
  excellent: "Excellent",
  healthy: "Healthy",
  watch: "Watch",
  critical: "Critical",
};

export function scoreToHealthStatus(score: number): HealthStatus {
  if (score >= 90) {
    return "excellent";
  }

  if (score >= 70) {
    return "healthy";
  }

  if (score >= 50) {
    return "watch";
  }

  return "critical";
}

export function formatHealthTrend(delta: number): string {
  if (delta > 0) {
    return `↑ ${delta}`;
  }

  if (delta < 0) {
    return `↓ ${Math.abs(delta)}`;
  }

  return "— 0";
}

export function parseHealthBreakdown(value: Json | HealthBreakdown | null | undefined): HealthBreakdown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { baseScore: 100, penalties: [], bonuses: [] };
  }

  const record = value as Record<string, unknown>;

  return {
    baseScore: typeof record.baseScore === "number" ? record.baseScore : 100,
    penalties: Array.isArray(record.penalties)
      ? (record.penalties as HealthBreakdownItem[])
      : [],
    bonuses: Array.isArray(record.bonuses) ? (record.bonuses as HealthBreakdownItem[]) : [],
  };
}

export function formatHealthTimestamp(value: string): string {
  return formatAppDateTime(value);
}

/** Canonical PostgREST select for health_snapshots rows. */
export const HEALTH_SNAPSHOT_SELECT =
  "id, organization_id, client_id, score, status, delta, reason, breakdown, calculated_at";

/** Map a raw health_snapshots row into the domain HealthSnapshot shape. */
export function mapHealthSnapshotRow(row: Record<string, unknown>): HealthSnapshot {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    client_id: String(row.client_id),
    score: Number(row.score),
    status: row.status as HealthStatus,
    delta: Number(row.delta ?? 0),
    reason: (row.reason as string | null) ?? null,
    breakdown: parseHealthBreakdown(row.breakdown as Json | null | undefined),
    calculated_at: String(row.calculated_at),
  };
}

/** Keep the first (newest) snapshot per client when rows are ordered newest-first. */
export function latestSnapshotByClient(rows: HealthSnapshot[]): Map<string, HealthSnapshot> {
  const map = new Map<string, HealthSnapshot>();

  for (const row of rows) {
    if (!map.has(row.client_id)) {
      map.set(row.client_id, row);
    }
  }

  return map;
}
