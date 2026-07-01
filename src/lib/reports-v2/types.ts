import type { Report } from "@/types/database";

export type ReportStatusV2 = "draft" | "generated" | "published" | "archived";

export type ReportVersion = {
  id: string;
  version: number;
  status: ReportStatusV2;
  title: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportMetrics = {
  healthScore: number | null;
  previousHealthScore: number | null;
  healthDelta: number | null;
  healthStatus: string | null;
  slaScore: number | null;
  slaViolations: number;
  activityCount: number;
  openIncidents: number;
  openRisks: number;
  activityTrendPercent: number | null;
};

export type HealthTrendPoint = {
  score: number;
  status: string;
  calculatedAt: string;
};

export type HealthTrend = {
  current: number | null;
  previous: number | null;
  delta: number | null;
  status: string | null;
  points: HealthTrendPoint[];
};

export type SLASnapshot = {
  score: number;
  violations: number;
  onTrack: boolean;
  policyName: string | null;
  avgResponseMinutes?: number | null;
  avgResolutionMinutes?: number | null;
  monthlyTrend?: Array<{ month: string; compliancePercent: number }>;
  topBreachedClients?: Array<{ clientId: string; breachCount: number }>;
};

export type ExecutiveSummary = {
  paragraph: string;
  highlights: string[];
};

export type ReportSummary = {
  metrics: ReportMetrics;
  healthTrend: HealthTrend;
  slaSnapshot: SLASnapshot;
  executiveSummary: ExecutiveSummary;
  summaryParagraph: string;
};

export type ReportV2View = Report & {
  version: number;
  root_report_id: string | null;
  published_at: string | null;
  summary: string | null;
  health_score: number | null;
  sla_score: number | null;
  clients?: { name: string; contact_email: string | null; status: string } | null;
  users?: { full_name: string } | null;
};

export type ReportsOverviewMetrics = {
  publishedThisMonth: number;
  draftCount: number;
  averageHealthScore: number | null;
  averageSlaScore: number | null;
  latestReport: Pick<ReportV2View, "id" | "title" | "published_at" | "client_id" | "updated_at"> | null;
};

export type SafeResult<T> = {
  data: T | null;
  error: string | null;
};

export const REPORT_STATUS_V2_LABELS: Record<ReportStatusV2, string> = {
  draft: "Draft",
  generated: "Generated",
  published: "Published",
  archived: "Archived",
};

export const REPORT_V2_SELECT =
  "id, organization_id, client_id, title, reporting_period_start, reporting_period_end, status, executive_summary, summary, key_wins, key_risks, next_actions, assigned_user_id, sent_at, published_at, version, root_report_id, health_score, sla_score, created_at, updated_at";

export const REPORT_V2_LIST_SELECT = `
  ${REPORT_V2_SELECT},
  clients ( name, contact_email, status ),
  users ( full_name )
`;

export const PORTAL_PUBLISHED_STATUS: ReportStatusV2 = "published";
