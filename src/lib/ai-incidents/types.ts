import type { Json } from "@/types/database";

export const INCIDENT_AI_PROVIDERS = ["OpenAI", "Anthropic", "Mock", "Disabled"] as const;

export type IncidentAIProviderName = (typeof INCIDENT_AI_PROVIDERS)[number];

export type IncidentAIAnalysis = {
  id: string;
  organization_id: string;
  incident_id: string | null;
  provider: string;
  model: string;
  summary: string | null;
  root_cause: string | null;
  recommendations: string | null;
  confidence: number | null;
  tokens_used: number | null;
  latency_ms: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type IncidentAIContext = {
  incidentId: string;
  title: string;
  severity: string;
  status: string;
  description: string | null;
  resolutionNotes: string | null;
  clientName: string | null;
  clientHealthScore: number | null;
  assigneeName: string | null;
  timeline: Array<{ title: string; createdAt: string }>;
  monitoringEvents: Array<{ severity: string; message: string | null; createdAt: string }>;
  relatedRisks: Array<{ title: string; severity: string; status: string }>;
  slaBreached: boolean;
  slaStatus: string | null;
  recentActivity: Array<{ title: string; createdAt: string }>;
};

export type IncidentAIAnalysisResult = {
  summary: string;
  rootCause: string;
  recommendations: string;
  nextSteps: string;
  confidence: number;
  provider: string;
  model: string;
  tokensUsed: number | null;
  latencyMs: number;
  isMock: boolean;
};

export type IncidentAIDashboardMetrics = {
  analysesGenerated: number;
  highConfidenceAnalyses: number;
  incidentsReviewed: number;
  averageConfidence: number | null;
};

export type IncidentAIReportSnapshot = {
  summary: string | null;
  rootCause: string | null;
  suggestedImprovements: string | null;
  confidence: number | null;
};

export const INCIDENT_AI_PROVIDER_LABELS: Record<IncidentAIProviderName, string> = {
  OpenAI: "OpenAI",
  Anthropic: "Anthropic",
  Mock: "Mock",
  Disabled: "Disabled",
};

export function mapIncidentAIAnalysisRow(row: Record<string, unknown>): IncidentAIAnalysis {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    incident_id: (row.incident_id as string | null) ?? null,
    provider: String(row.provider),
    model: String(row.model),
    summary: (row.summary as string | null) ?? null,
    root_cause: (row.root_cause as string | null) ?? null,
    recommendations: (row.recommendations as string | null) ?? null,
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

export function parseAnalysisMetadata(value: Json | Record<string, unknown> | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function formatIncidentAITimestamp(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
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
