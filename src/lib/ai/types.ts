import type { KnowledgeSnippet } from "@/lib/ai/knowledge/types";

/** AI Report Assistant — shared types (provider-agnostic). */

export type AIProviderId =
  | "placeholder"
  | "openai"
  | "anthropic"
  | "gemini"
  | "azure_openai"
  | "local";

/** Report sections the copilot can read/write. */
export type ReportAISectionKey =
  | "executive_summary"
  | "business_summary"
  | "key_wins"
  | "key_risks"
  | "next_actions"
  | "recommendations"
  | "customer_highlights"
  | "operational_health_summary"
  | "management_summary"
  | "customer_email"
  | "meeting_agenda";

/** Sections persisted on the report record (form submit). */
export type ReportAIPersistedSectionKey =
  | "executive_summary"
  | "key_wins"
  | "key_risks"
  | "next_actions";

export type ReportAIStyleMode =
  | "executive"
  | "technical"
  | "customer_friendly"
  | "formal"
  | "concise"
  | "detailed";

export const REPORT_AI_STYLE_LABELS: Record<ReportAIStyleMode, string> = {
  executive: "Executive",
  technical: "Technical",
  customer_friendly: "Customer friendly",
  formal: "Formal",
  concise: "Concise",
  detailed: "Detailed",
};

export type ReportAIActionKey =
  | "generate_executive_summary"
  | "generate_business_summary"
  | "generate_key_wins"
  | "generate_key_risks"
  | "generate_next_actions"
  | "generate_recommendations"
  | "generate_entire_report"
  | "rewrite_professionally"
  | "rewrite_shorter"
  | "rewrite_longer"
  | "explain_technically"
  | "explain_for_executives"
  | "generate_customer_email"
  | "generate_meeting_agenda"
  | "generate_customer_highlights"
  | "generate_operational_health"
  | "generate_management_summary"
  // Legacy aliases (still accepted server-side)
  | "generate_summary"
  | "improve_writing"
  | "shorten"
  | "expand"
  | "tone_professional"
  | "tone_executive"
  | "tone_technical"
  | "generate_next_actions"
  | "generate_risks"
  | "generate_wins";

export const REPORT_AI_SECTION_LABELS: Record<ReportAISectionKey, string> = {
  executive_summary: "Executive summary",
  business_summary: "Business summary",
  key_wins: "Key wins",
  key_risks: "Key risks",
  next_actions: "Next actions",
  recommendations: "Recommendations",
  customer_highlights: "Customer highlights",
  operational_health_summary: "Operational health summary",
  management_summary: "Management summary",
  customer_email: "Customer email",
  meeting_agenda: "Meeting agenda",
};

export const REPORT_AI_ACTION_LABELS: Record<ReportAIActionKey, string> = {
  generate_executive_summary: "Generate executive summary",
  generate_business_summary: "Generate business summary",
  generate_key_wins: "Generate key wins",
  generate_key_risks: "Generate key risks",
  generate_next_actions: "Generate next actions",
  generate_recommendations: "Generate recommendations",
  generate_entire_report: "Generate entire report",
  rewrite_professionally: "Rewrite professionally",
  rewrite_shorter: "Rewrite shorter",
  rewrite_longer: "Rewrite longer",
  explain_technically: "Explain technically",
  explain_for_executives: "Explain for executives",
  generate_customer_email: "Generate customer email",
  generate_meeting_agenda: "Generate meeting agenda",
  generate_customer_highlights: "Generate customer highlights",
  generate_operational_health: "Generate operational health summary",
  generate_management_summary: "Generate management summary",
  generate_summary: "Generate summary",
  improve_writing: "Improve writing",
  shorten: "Shorten",
  expand: "Expand",
  tone_professional: "Professional tone",
  tone_executive: "Executive tone",
  tone_technical: "Technical tone",
  generate_risks: "Generate risks",
  generate_wins: "Generate wins",
};

export type ReportAIOpenRisk = {
  id: string;
  title: string;
  severity: string;
  status: string;
};

export type ReportAIOpenIncident = {
  id: string;
  title: string;
  severity: string;
  status: string;
};

export type ReportAIActivityItem = {
  id: string;
  title: string;
  action: string;
  createdAt: string;
};

export type ReportAIProfitabilitySnapshot = {
  monthlyRevenue?: number | null;
  monthlyCost?: number | null;
  margin?: number | null;
  profit?: number | null;
  health?: string | null;
};

export type ReportAIContext = {
  reportId?: string;
  reportTitle: string;
  clientId: string;
  clientName: string;
  organizationName: string;
  periodLabel: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  executiveSummary: string;
  businessSummary: string;
  keyWins: string;
  keyRisks: string;
  nextActions: string;
  recommendations: string;
  customerHighlights: string;
  operationalHealthSummary: string;
  managementSummary: string;
  templateName?: string | null;
  scheduleTitle?: string | null;
  assignedEngineer?: string | null;
  reviewer?: string | null;
  customerHealth?: string | null;
  profitability?: ReportAIProfitabilitySnapshot | null;
  openRisks: ReportAIOpenRisk[];
  openIncidents: ReportAIOpenIncident[];
  metrics?: {
    openRisksCount: number;
    criticalRisksCount: number;
    openIncidentsCount: number;
    criticalIncidentsCount: number;
  };
  slaBreachesCount?: number;
  recentActivity?: ReportAIActivityItem[];
  completedReportsCount?: number;
  previousReportSummary?: string | null;
  latestReportVersion?: string | null;
  knowledgeSnippets?: KnowledgeSnippet[];
};

/** Safe subset for AI context panel — no secrets or internal IDs. */
export type ReportAIContextSnapshot = {
  clientName: string;
  organizationName: string;
  periodLabel: string;
  openRisksCount: number;
  criticalRisksCount: number;
  openIncidentsCount: number;
  criticalIncidentsCount: number;
  slaBreachesCount: number;
  hasProfitability: boolean;
  hasTemplate: boolean;
  hasSchedule: boolean;
  assignedEngineer: string | null;
  reviewer: string | null;
  customerHealth: string | null;
  hasPreviousReport: boolean;
  completedReportsCount: number;
  recentActivityCount: number;
};

export type AIGenerateRequest = {
  prompt: string;
  action: ReportAIActionKey;
  section?: ReportAISectionKey;
  context: ReportAIContext;
  styleMode?: ReportAIStyleMode;
  maxTokens?: number;
  temperature?: number;
};

export type AIGenerateResponse = {
  content: string;
  providerId: AIProviderId;
  model: string;
  isPlaceholder: boolean;
  finishReason: "stop" | "length" | "placeholder";
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
};

export type AISummarizeRequest = {
  text: string;
  context: ReportAIContext;
};

export type AIImproveRequest = {
  text: string;
  instruction: string;
  context: ReportAIContext;
};

export type AIHealthStatus = {
  ok: boolean;
  providerId: AIProviderId;
  message: string;
  latencyMs?: number;
};

export type AIHistoryEntry = {
  id: string;
  action: ReportAIActionKey;
  section?: ReportAISectionKey;
  response: string;
  timestamp: string;
  isPlaceholder: boolean;
  provider?: string;
  model?: string;
  inputTokens?: number | null;
  outputTokens?: number | null;
  durationMs?: number;
};

export type AISmartSuggestion = {
  id: string;
  message: string;
};

export type AIWarning = {
  id: string;
  message: string;
};

export type AIChecklistItem = {
  id: string;
  label: string;
  complete: boolean;
};

export type AIConfidenceScore = {
  score: number;
  label: string;
};

export type EntireReportSectionResult = {
  section: ReportAISectionKey;
  content: string;
  error?: string;
};

export type ReportAssistantRunInput = {
  action: ReportAIActionKey;
  context: ReportAIContext;
  section?: ReportAISectionKey;
  styleMode?: ReportAIStyleMode;
  fieldValues?: Partial<Record<ReportAISectionKey, string>>;
};

export type ReportAssistantRunResult = {
  response: AIGenerateResponse;
  prompt: string;
  historyEntry: AIHistoryEntry;
};

export type AIUsageDisplay = {
  used: number;
  limit: number;
  label: string;
};

export type AIUsageSummary = {
  callsThisMonth: number;
  limit: number;
  totalTokensThisMonth: number | null;
  lastProvider: string | null;
  lastModel: string | null;
  hasUsage: boolean;
  remainingCalls: number;
};

export const PLACEHOLDER_AI_USAGE: AIUsageDisplay = {
  used: 0,
  limit: 0,
  label: "AI Usage",
};

export const PLACEHOLDER_SIMULATION_DELAY_MS = 800;

export type PendingDiff = {
  section: ReportAISectionKey;
  current: string;
  proposed: string;
};

export type UndoEntry = {
  section: ReportAISectionKey;
  previous: string;
  expiresAt: number;
};

export type EntireReportDraft = Partial<Record<ReportAISectionKey, string>>;

export type EntireReportProgress = {
  active: boolean;
  currentStep: number;
  totalSteps: number;
  currentLabel: string;
  complete: boolean;
};
