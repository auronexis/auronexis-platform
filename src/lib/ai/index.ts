export type {
  AIHistoryEntry,
  AIProviderId,
  AIUsageDisplay,
  AIUsageSummary,
  ReportAIActionKey,
  ReportAIContext,
  ReportAISectionKey,
  ReportAssistantRunInput,
  ReportAssistantRunResult,
} from "@/lib/ai/types";
export {
  PLACEHOLDER_AI_USAGE,
  PLACEHOLDER_SIMULATION_DELAY_MS,
  REPORT_AI_ACTION_LABELS,
  REPORT_AI_SECTION_LABELS,
} from "@/lib/ai/types";
export { buildReportAIPrompt, buildReportAIContextFromForm } from "@/lib/ai/prompts";
export {
  getOperationalIntelligence,
  refreshOperationalInsightsServerAction,
} from "@/lib/ai/insights";
export {
  getClientSuccessAnalysis,
  getClientSuccessPortfolio,
  refreshClientPortfolioServerAction,
  refreshClientSuccessServerAction,
} from "@/lib/ai/client-success";
export {
  runOperationalAssistantServerAction,
  buildOperationalTasks,
} from "@/lib/ai/operational";
export type {
  OperationalAIActionKey,
  OperationalAssistantResult,
  OperationalEntityType,
  OperationalTaskItem,
} from "@/lib/ai/operational";
export {
  translateWorkflowServerAction,
  validateWorkflowServerAction,
  simulateWorkflowServerAction,
} from "@/lib/ai/automation-builder";
export {
  getKnowledgeHubData,
  getClientKnowledgeTimeline,
  buildRelatedKnowledgePanel,
  searchKnowledgeHub,
} from "@/lib/ai/knowledge/get-hub";
export {
  searchKnowledgeServerAction,
  answerKnowledgeQuestionServerAction,
  generateKnowledgeArticleServerAction,
  generatePlaybookServerAction,
} from "@/lib/ai/knowledge/action";
export type {
  KnowledgeHubData,
  KnowledgeArticle,
  KnowledgePlaybook,
  KnowledgeAnswer,
  RelatedKnowledgePanel,
  KnowledgeHealthScore,
} from "@/lib/ai/knowledge/types";
export {
  toAIActionError,
  validateAIOutput,
  recordAIGenerationMetric,
  getAIDiagnosticsSnapshot,
  checkAIProviderHealth,
  AI_MODULE_VERSIONS,
} from "@/lib/ai/core";
export { runReportAssistantAction } from "@/lib/ai/assistant";
export { getDefaultAIProvider, getAIProvider } from "@/lib/ai/providers";
export type { AIProvider } from "@/lib/ai/providers/types";
export {
  askCopilotServerAction,
  getCopilotAccessForSession,
  parseCopilotAnswer,
  buildSafeCopilotFallback,
  WORKSPACE_SUGGESTED_PROMPTS,
  CLIENT_SUGGESTED_PROMPTS,
  COPILOT_FEATURE,
} from "@/lib/ai/copilot";
export type {
  CopilotActionResult,
  CopilotAnswer,
  CopilotTaskType,
  AskCopilotInput,
} from "@/lib/ai/copilot";
