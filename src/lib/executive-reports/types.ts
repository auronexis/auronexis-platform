import type { Json } from "@/types/database";
import { formatAppDateTimeCompact } from "@/lib/i18n";

export type ExecutiveReportSnapshot = {
  id: string;
  organization_id: string;
  report_id: string | null;
  executive_summary: string | null;
  risk_summary: string | null;
  incident_summary: string | null;
  sla_summary: string | null;
  monitoring_summary: string | null;
  ai_summary: string | null;
  generated_at: string;
  metadata: ExecutiveReportMetadata;
};

export type ExecutiveReportMetadata = {
  healthScore?: number | null;
  healthStatus?: string | null;
  healthDelta?: number | null;
  complianceScore?: number | null;
  averageConfidence?: number | null;
  openRisks?: number;
  openIncidents?: number;
  slaScore?: number | null;
  slaViolations?: number;
  topConcerns?: string[];
  positiveDevelopments?: string[];
  suggestedPriorities?: string[];
  trendAnalysis?: string;
  executiveRecommendations?: string[];
  predictiveTrajectory?: string | null;
  predictedHealth?: number | null;
  predictedRisk?: number | null;
  predictedIncidents?: number | null;
  predictedChurn?: number | null;
  predictiveConfidence?: number | null;
  predictiveSummary?: string | null;
  timeline?: Array<{ title: string; createdAt: string }>;
  published?: boolean;
  isMock?: boolean;
};

export type ExecutiveReportContent = {
  executiveSummary: string;
  riskSummary: string;
  incidentSummary: string;
  slaSummary: string;
  monitoringSummary: string;
  aiSummary: string;
  predictiveSummary: string;
  metadata: ExecutiveReportMetadata;
};

export type ExecutiveReportDashboardMetrics = {
  generatedThisMonth: number;
  published: number;
  averageConfidence: number | null;
  averageHealth: number | null;
  averageCompliance: number | null;
};

export const EXECUTIVE_REPORT_SNAPSHOT_SELECT =
  "id, organization_id, report_id, executive_summary, risk_summary, incident_summary, sla_summary, monitoring_summary, ai_summary, generated_at, metadata";

export function mapExecutiveReportSnapshotRow(row: Record<string, unknown>): ExecutiveReportSnapshot {
  const metadata =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as ExecutiveReportMetadata)
      : {};

  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    report_id: row.report_id == null ? null : String(row.report_id),
    executive_summary: (row.executive_summary as string | null) ?? null,
    risk_summary: (row.risk_summary as string | null) ?? null,
    incident_summary: (row.incident_summary as string | null) ?? null,
    sla_summary: (row.sla_summary as string | null) ?? null,
    monitoring_summary: (row.monitoring_summary as string | null) ?? null,
    ai_summary: (row.ai_summary as string | null) ?? null,
    generated_at: String(row.generated_at),
    metadata,
  };
}

export function formatExecutiveReportTimestamp(value: string | null | undefined): string {
  return formatAppDateTimeCompact(value);
}

export function parseExecutiveMetadata(value: Json | ExecutiveReportMetadata | null | undefined): ExecutiveReportMetadata {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as ExecutiveReportMetadata;
  }

  return {};
}
