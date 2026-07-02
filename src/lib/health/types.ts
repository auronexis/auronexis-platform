import type { Json } from "@/types/database";

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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
