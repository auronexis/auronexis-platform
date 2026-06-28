/** Shared prompt fragments — tone, anti-hallucination, formatting. */

export const AI_ANTI_HALLUCINATION_RULES = [
  "- NEVER invent incidents, risks, SLA values, revenue, margins, or client facts.",
  "- ONLY use facts explicitly listed in verified context.",
  "- If evidence is insufficient, state that clearly — do not guess.",
  "- Do not invent metrics, percentages, or operational events.",
  "- Return ONLY the requested content unless the mode requires structured sections.",
] as const;

export const AI_MISSING_DATA_FALLBACK =
  "No relevant verified operational data available for this scope.";

export const AI_ROOT_CAUSE_UNKNOWN = "Root cause cannot yet be determined.";

export function buildStrictRulesBlock(extraRules: string[] = []): string {
  return [
    "=== Strict rules ===",
    ...AI_ANTI_HALLUCINATION_RULES,
    ...extraRules,
  ].join("\n");
}

export function buildToneInstruction(mode?: string): string {
  if (!mode) return "Use a professional MSP / IT agency tone.";

  switch (mode) {
    case "executive":
      return "Write for executive stakeholders — outcome-focused, concise, strategic.";
    case "technical":
      return "Use precise technical language suitable for engineers.";
    case "customer_friendly":
      return "Use approachable, customer-friendly language without jargon.";
    case "formal":
      return "Use formal business language.";
    case "concise":
      return "Be concise — short sentences, minimal filler.";
    case "detailed":
      return "Provide detailed narrative with clear structure.";
    default:
      return `Style: ${mode}.`;
  }
}

export function buildMissingDataInstruction(fallback = AI_MISSING_DATA_FALLBACK): string {
  return `- If a section has no relevant verified data, write exactly:\n"${fallback}"`;
}
