export {
  toAIActionError,
  createAIUserError,
  AI_ERROR_MESSAGES,
  type AIActionErrorResult,
  type AIActionSuccessResult,
} from "@/lib/ai/core/errors";
export {
  validateAIOutput,
  assertValidAIOutput,
  normalizeAIOutput,
  stripUnsupportedHtml,
  type AIValidationOptions,
  type AIValidationResult,
} from "@/lib/ai/core/validation";
export {
  AI_HISTORY_MAX_ENTRIES,
  AI_UNDO_WINDOW_MS,
  createHistoryEntryId,
  trimHistory,
  formatHistoryMeta,
  type AIHistoryEntryBase,
} from "@/lib/ai/core/history";
export {
  isRetryableResult,
  shouldShowRetryButton,
  createRetryState,
  recordRetryAttempt,
  type AIRetryState,
} from "@/lib/ai/core/retry";
export {
  AI_ANTI_HALLUCINATION_RULES,
  AI_MISSING_DATA_FALLBACK,
  AI_ROOT_CAUSE_UNKNOWN,
  buildStrictRulesBlock,
  buildToneInstruction,
  buildMissingDataInstruction,
} from "@/lib/ai/core/prompts";
export {
  scoreToConfidenceLabel,
  buildConfidenceScore,
  confidenceFromContextCounts,
  type AIConfidenceLabel,
} from "@/lib/ai/core/confidence";
export { buildAIOutput, mergeDevNotices, type AIOutput, type AIOutputMeta } from "@/lib/ai/core/output";
export { AI_MODULE_VERSIONS, AI_CORE_VERSION } from "@/lib/ai/core/versions";
export {
  recordAIGenerationMetric,
  getRecentAIGenerationMetrics,
  getAIDiagnosticsSnapshot,
  checkAIProviderHealth,
  timeAIContextBuild,
  type AIGenerationMetric,
  type AIDiagnosticsSnapshot,
} from "@/lib/ai/core/observability";

// Re-export usage layer for unified imports
export {
  getAIUsageSummaryForPlan,
  getAIUsageSummaryForSession,
  assertWithinAIUsageLimit,
} from "@/lib/ai/usage/queries";
export { recordAIUsageEvent } from "@/lib/ai/usage/record";
export { getAIUsageLimit } from "@/lib/ai/usage/limits";

// Re-export provider resolver
export { resolveAIProvider } from "@/lib/ai/server/resolve-provider";
