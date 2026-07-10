import type { AIUsageSummary } from "@/lib/ai/types";

export type CopilotTaskType =
  | "workspace_question"
  | "client_summary"
  | "executive_brief"
  | "risk_explanation"
  | "incident_explanation"
  | "sla_explanation";

export type CopilotSourceType =
  | "client"
  | "risk"
  | "incident"
  | "report"
  | "sla"
  | "activity"
  | "health"
  | "profitability";

export type CopilotConfidence = "high" | "medium" | "low";

export type CopilotFact = {
  statement: string;
  sourceType: CopilotSourceType;
  sourceId?: string;
  sourceLabel: string;
};

export type CopilotRecommendationPriority = "low" | "medium" | "high" | "critical";

export type CopilotRecommendation = {
  title: string;
  reason: string;
  priority: CopilotRecommendationPriority;
  href?: string;
};

export type CopilotAnswer = {
  answer: string;
  summary: string;
  confidence: CopilotConfidence;
  facts: CopilotFact[];
  recommendations: CopilotRecommendation[];
  limitations: string[];
};

export type CopilotErrorCode =
  | "AI_NOT_CONFIGURED"
  | "PLAN_REQUIRED"
  | "PERMISSION_DENIED"
  | "CREDITS_EXHAUSTED"
  | "ENTITY_NOT_FOUND"
  | "INVALID_REQUEST"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_RATE_LIMIT"
  | "PROVIDER_UNAVAILABLE"
  | "INVALID_PROVIDER_RESPONSE"
  | "GENERIC_AI_ERROR";

export type CopilotActionInput = {
  taskType: CopilotTaskType;
  prompt?: string;
  clientId?: string;
  riskId?: string;
  incidentId?: string;
  reportId?: string;
};

export type CopilotActionSuccess = {
  ok: true;
  answer: CopilotAnswer;
  taskType: CopilotTaskType;
  usageSummary: AIUsageSummary;
  providerConfigured: boolean;
  isPlaceholder: boolean;
  devNotice: string | null;
  durationMs: number;
};

export type CopilotActionFailure = {
  ok: false;
  error: string;
  code: CopilotErrorCode;
  retryable: boolean;
};

export type CopilotActionResult = CopilotActionSuccess | CopilotActionFailure;

export const COPILOT_FEATURE = "ai_report_assistant" as const;

export const COPILOT_USAGE_FEATURE = "ai_global_copilot" as const;

export const MAX_COPILOT_PROMPT_LENGTH = 2_000;

export const MAX_COPILOT_HISTORY_TURNS = 4;

export type CopilotHistoryTurn = {
  role: "user" | "assistant";
  content: string;
};

export function buildSourceHref(
  sourceType: CopilotSourceType,
  sourceId?: string,
): string | undefined {
  if (!sourceId) return undefined;

  switch (sourceType) {
    case "client":
    case "health":
    case "profitability":
      return `/clients/${sourceId}`;
    case "risk":
      return `/risks/${sourceId}`;
    case "incident":
      return `/incidents/${sourceId}`;
    case "report":
      return `/reports/${sourceId}`;
    case "sla":
      return `/settings/sla`;
    case "activity":
      return "/activity";
    default:
      return undefined;
  }
}
