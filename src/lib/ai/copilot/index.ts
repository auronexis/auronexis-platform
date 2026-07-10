export type {
  CopilotActionInput,
  CopilotActionResult,
  CopilotAnswer,
  CopilotConfidence,
  CopilotErrorCode,
  CopilotFact,
  CopilotHistoryTurn,
  CopilotRecommendation,
  CopilotSourceType,
  CopilotTaskType,
} from "@/lib/ai/copilot/types";
export {
  COPILOT_FEATURE,
  COPILOT_USAGE_FEATURE,
  MAX_COPILOT_HISTORY_TURNS,
  MAX_COPILOT_PROMPT_LENGTH,
  buildSourceHref,
} from "@/lib/ai/copilot/types";
export { askCopilotServerAction, getCopilotAccessForSession } from "@/lib/ai/copilot/action";
export type { AskCopilotInput } from "@/lib/ai/copilot/action";
export { parseCopilotAnswer, buildSafeCopilotFallback } from "@/lib/ai/copilot/schema";
export {
  WORKSPACE_SUGGESTED_PROMPTS,
  CLIENT_SUGGESTED_PROMPTS,
} from "@/lib/ai/copilot/suggested-prompts";
