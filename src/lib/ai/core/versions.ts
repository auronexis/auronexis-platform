/** Module version constants — surfaced in developer diagnostics only. */

export const AI_CORE_VERSION = "1.0.0";
export const AI_PROMPT_VERSION = "2026.06";
export const AI_CONTEXT_VERSION = "2026.06";
export const AI_KNOWLEDGE_VERSION = "2026.06";
export const AI_AUTOMATION_VERSION = "2026.06";

export const AI_MODULE_VERSIONS = {
  core: AI_CORE_VERSION,
  prompts: AI_PROMPT_VERSION,
  context: AI_CONTEXT_VERSION,
  knowledge: AI_KNOWLEDGE_VERSION,
  automation: AI_AUTOMATION_VERSION,
} as const;
