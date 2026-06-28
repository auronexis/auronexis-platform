/**
 * Client-callable AI actions (no server, no API keys).
 * Re-exported for components — not Next.js server actions.
 */
export { runReportAssistantAction, checkAIProviderHealth } from "@/lib/ai/assistant";
export { buildReportAIPrompt, buildReportAIContextFromForm } from "@/lib/ai/prompts";
export { getDefaultAIProvider, getAIProvider } from "@/lib/ai/providers";
export type { AIProvider } from "@/lib/ai/providers/types";
