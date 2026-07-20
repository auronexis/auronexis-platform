import type { Json } from "@/types/database";
import { formatAppDateTimeCompact } from "@/lib/i18n";

export const RISK_AI_PROVIDERS = ["OpenAI", "Anthropic", "Mock", "Disabled"] as const;

export type RiskAIProviderName = (typeof RISK_AI_PROVIDERS)[number];

export type RiskAIAnalysis = {
  id: string;
  organization_id: string;
  risk_id: string;
  provider: string;
  model: string;
  summary: string | null;
  risk_reasoning: string | null;
  mitigation_plan: string | null;
  recommended_actions: string[];
  predicted_severity: string | null;
  predicted_score: number | null;
  confidence: number | null;
  tokens_used: number | null;
  latency_ms: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type RiskAIContext = {
  riskId: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  likelihood: number | null;
  impactScore: number | null;
  riskScore: number | null;
  mitigationPlan: string | null;
  recommendation: string | null;
  clientName: string | null;
  clientHealthScore: number | null;
  clientHealthStatus: string | null;
  relatedIncidents: Array<{ title: string; severity: string; status: string }>;
  monitoringEvents: Array<{ severity: string; message: string | null }>;
  slaBreaches: number;
  recentActivity: Array<{ title: string; createdAt: string }>;
  recentReports: Array<{ title: string; status: string }>;
  timeline: Array<{ title: string; createdAt: string }>;
};

export type RiskAIAnalysisResult = {
  summary: string;
  riskReasoning: string;
  mitigationPlan: string;
  recommendedActions: string[];
  predictedSeverity: string;
  predictedScore: number;
  confidence: number;
  provider: string;
  model: string;
  tokensUsed: number | null;
  latencyMs: number;
  isMock: boolean;
};

export type RiskAIDashboardMetrics = {
  analysesGenerated: number;
  highConfidenceAnalyses: number;
  criticalRisksReviewed: number;
  averageConfidence: number | null;
};

export type RiskAIReportSnapshot = {
  summary: string | null;
  topMitigationRecommendations: string[];
  predictedSeverity: string | null;
  predictedScore: number | null;
  confidence: number | null;
};

export function mapRiskAIAnalysisRow(row: Record<string, unknown>): RiskAIAnalysis {
  const actions = row.recommended_actions;
  let recommendedActions: string[] = [];

  if (Array.isArray(actions)) {
    recommendedActions = actions.map((item) => String(item));
  } else if (typeof actions === "string") {
    try {
      const parsed = JSON.parse(actions) as unknown;
      if (Array.isArray(parsed)) {
        recommendedActions = parsed.map((item) => String(item));
      }
    } catch {
      recommendedActions = [];
    }
  }

  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    risk_id: String(row.risk_id),
    provider: String(row.provider),
    model: String(row.model),
    summary: (row.summary as string | null) ?? null,
    risk_reasoning: (row.risk_reasoning as string | null) ?? null,
    mitigation_plan: (row.mitigation_plan as string | null) ?? null,
    recommended_actions: recommendedActions,
    predicted_severity: (row.predicted_severity as string | null) ?? null,
    predicted_score: row.predicted_score == null ? null : Number(row.predicted_score),
    confidence: row.confidence == null ? null : Number(row.confidence),
    tokens_used: row.tokens_used == null ? null : Number(row.tokens_used),
    latency_ms: row.latency_ms == null ? null : Number(row.latency_ms),
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function formatRiskAITimestamp(value: string | null | undefined): string {
  return formatAppDateTimeCompact(value);
}

export function confidenceLabel(confidence: number | null | undefined): string {
  if (confidence == null) {
    return "Unknown";
  }

  if (confidence >= 0.85) {
    return "High";
  }

  if (confidence >= 0.65) {
    return "Medium";
  }

  return "Low";
}

export function parseRecommendedActions(value: Json | string[] | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  return [];
}
