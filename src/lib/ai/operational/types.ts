import type { KnowledgeSnippet } from "@/lib/ai/knowledge/types";

/** AI Risk & Incident Copilot — shared types. */

export type OperationalEntityType = "risk" | "incident";

export type OperationalFieldKey = "description" | "resolution_notes";

export type RiskAIActionKey =
  | "summarize_risk"
  | "assess_business_impact"
  | "assess_technical_impact"
  | "generate_mitigation_plan"
  | "generate_recommended_actions"
  | "improve_description"
  | "rewrite_professionally"
  | "executive_explanation"
  | "technical_explanation"
  | "customer_friendly_explanation"
  | "estimate_priority";

export type IncidentAIActionKey =
  | "summarize_incident"
  | "generate_root_cause_analysis"
  | "generate_investigation_notes"
  | "generate_resolution_notes"
  | "generate_customer_update"
  | "generate_internal_update"
  | "generate_timeline_summary"
  | "suggest_escalation"
  | "suggest_sla_impact"
  | "recommend_next_actions";

export type OperationalAIActionKey = RiskAIActionKey | IncidentAIActionKey;

export const RISK_AI_ACTION_LABELS: Record<RiskAIActionKey, string> = {
  summarize_risk: "Summarize risk",
  assess_business_impact: "Assess business impact",
  assess_technical_impact: "Assess technical impact",
  generate_mitigation_plan: "Generate mitigation plan",
  generate_recommended_actions: "Generate recommended actions",
  improve_description: "Improve description",
  rewrite_professionally: "Rewrite professionally",
  executive_explanation: "Executive explanation",
  technical_explanation: "Technical explanation",
  customer_friendly_explanation: "Customer-friendly explanation",
  estimate_priority: "Estimate priority",
};

export const INCIDENT_AI_ACTION_LABELS: Record<IncidentAIActionKey, string> = {
  summarize_incident: "Summarize incident",
  generate_root_cause_analysis: "Generate root cause analysis",
  generate_investigation_notes: "Generate investigation notes",
  generate_resolution_notes: "Generate resolution notes",
  generate_customer_update: "Generate customer update",
  generate_internal_update: "Generate internal update",
  generate_timeline_summary: "Generate timeline summary",
  suggest_escalation: "Suggest escalation",
  suggest_sla_impact: "Suggest SLA impact",
  recommend_next_actions: "Recommend next actions",
};

export const OPERATIONAL_FIELD_LABELS: Record<OperationalFieldKey, string> = {
  description: "Description",
  resolution_notes: "Resolution / mitigation notes",
};

export type OperationalRelatedItem = {
  id: string;
  title: string;
  href: string;
  kind: "risk" | "incident" | "report" | "client" | "sla" | "engineer";
};

export type OperationalAIWarning = {
  id: string;
  message: string;
};

export type OperationalChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
};

export type OperationalRiskAssessment = {
  likelihood: string;
  impact: string;
  priority: string;
  confidence: string;
  reasoning: string;
};

export type OperationalContextSnapshot = {
  clientName: string;
  entityTitle: string;
  severity: string;
  status: string;
  assignee: string | null;
  slaPolicy: string | null;
  openRisksCount: number;
  openIncidentsCount: number;
  relatedReportsCount: number;
  recentActivityCount: number;
  customerHealth: string | null;
};

export type OperationalAIContext = {
  entityType: OperationalEntityType;
  entityId?: string;
  clientId: string;
  clientName: string;
  title: string;
  description: string;
  resolutionNotes: string;
  severity: string;
  status: string;
  assigneeName: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  slaPolicyName: string | null;
  slaBreached: boolean;
  linkedRiskTitle: string | null;
  openRisks: Array<{ id: string; title: string; severity: string; status: string }>;
  openIncidents: Array<{ id: string; title: string; severity: string; status: string }>;
  relatedReports: Array<{ id: string; title: string; status: string }>;
  recentActivity: Array<{ id: string; title: string; action: string; createdAt: string }>;
  customerHealth: string | null;
  profitabilityMargin: number | null;
  openRisksCount: number;
  openIncidentsCount: number;
  knowledgeSnippets?: KnowledgeSnippet[];
};

export type OperationalAssistantResult = {
  content: string;
  targetField: OperationalFieldKey | null;
  providerId: string;
  model: string;
  isPlaceholder: boolean;
  usageSummary: import("@/lib/ai/types").AIUsageSummary;
  devNotice?: string;
  durationMs: number;
  warnings: OperationalAIWarning[];
  checklist: OperationalChecklistItem[];
  relatedItems: OperationalRelatedItem[];
  contextSnapshot: OperationalContextSnapshot;
  confidence: { score: number; label: string };
  riskAssessment?: OperationalRiskAssessment;
  tokenUsage?: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
};

export type OperationalTaskItem = {
  id: string;
  message: string;
  href: string;
  priority: "critical" | "high" | "medium";
};

export type OperationalTasksResult = {
  tasks: OperationalTaskItem[];
  generatedAt: string;
};

export type OperationalPendingDiff = {
  field: OperationalFieldKey;
  current: string;
  proposed: string;
};

export type OperationalUndoEntry = {
  field: OperationalFieldKey;
  previous: string;
  expiresAt: number;
};

export type OperationalHistoryEntry = {
  id: string;
  action: OperationalAIActionKey;
  field?: OperationalFieldKey;
  response: string;
  timestamp: string;
  provider?: string;
  model?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  durationMs?: number;
};

export const INSUFFICIENT_OPERATIONAL_DATA =
  "Not enough verified operational data available for this analysis.";
