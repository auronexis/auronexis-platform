import {
  AI_ANTI_HALLUCINATION_RULES,
  AI_MISSING_DATA_FALLBACK,
  buildMissingDataInstruction,
  buildStrictRulesBlock,
} from "@/lib/ai/core/prompts";
import { COPILOT_INJECTION_RULES, wrapEvidenceBlock } from "@/lib/ai/copilot/safety";
import type { CopilotTaskType } from "@/lib/ai/copilot/types";

const OUTPUT_SCHEMA = `{
  "answer": "string — full narrative answer",
  "summary": "string — one or two sentence summary",
  "confidence": "high | medium | low",
  "facts": [
    {
      "statement": "verified fact only",
      "sourceType": "client | risk | incident | report | sla | activity | health | profitability",
      "sourceId": "optional uuid when known",
      "sourceLabel": "human-readable source label"
    }
  ],
  "recommendations": [
    {
      "title": "recommended action title",
      "reason": "why this is suggested — not a verified fact",
      "priority": "low | medium | high | critical",
      "href": "optional internal path like /clients/uuid"
    }
  ],
  "limitations": ["list uncertainties, missing data, or scope limits"]
}`;

export function buildCopilotSystemPrompt(): string {
  return [
    "You are Ask Auroranexis — an operational intelligence copilot for MSP and agency workspaces.",
    "You help users understand clients, health, risks, incidents, reports, SLA state, and executive priorities.",
    "",
    "=== Safety model ===",
    ...COPILOT_INJECTION_RULES.map((rule) => `- ${rule}`),
    "",
    buildStrictRulesBlock([
      "- Separate verified facts from recommendations.",
      "- Recommendations must never be presented as verified facts.",
      "- Do not perform legal, medical, financial, or compliance certainty claims.",
      "- Use phrasing such as 'Based on configured SLA policy…' not 'This legally proves…'.",
      "- Deterministic dashboard metrics in evidence are authoritative — do not invent or override them.",
      "- Return ONLY valid JSON matching the schema below — no markdown outside JSON.",
    ]),
    "",
    "=== Anti-hallucination ===",
    ...AI_ANTI_HALLUCINATION_RULES.map((rule) => rule),
    buildMissingDataInstruction(AI_MISSING_DATA_FALLBACK),
    "",
    "=== Output schema ===",
    OUTPUT_SCHEMA,
  ].join("\n");
}

function taskInstruction(taskType: CopilotTaskType, userPrompt: string): string {
  switch (taskType) {
    case "executive_brief":
      return "Generate an executive brief explaining deterministic metrics. Summarize top priorities and recommended next actions.";
    case "client_summary":
      return "Analyze the selected client using verified context. Cover health, risks, incidents, reports, SLA, and profitability when available.";
    case "risk_explanation":
      return "Explain the selected risk: severity, status, owner, overdue state, related client, and recommended mitigation.";
    case "incident_explanation":
      return "Explain the selected incident: severity, status, timeline, SLA state, affected client, and recommended next steps.";
    case "sla_explanation":
      return "Explain SLA state based on configured policy data only. Do not interpret contracts beyond platform data.";
    default:
      return userPrompt || "Answer the workspace question using verified organization context.";
  }
}

export function buildCopilotUserPrompt(
  taskType: CopilotTaskType,
  userPrompt: string,
  evidencePayload: string,
  historyBlock?: string,
): string {
  const instruction = taskInstruction(taskType, userPrompt);

  return [
    `Task: ${taskType}`,
    `User question: ${userPrompt || "(suggested prompt)"}`,
    `Instruction: ${instruction}`,
    historyBlock ? wrapEvidenceBlock("conversation_history", historyBlock) : "",
    wrapEvidenceBlock("workspace_context", evidencePayload),
    "",
    "Respond with JSON only.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function buildCopilotRetryPrompt(previousRaw: string): string {
  return [
    "Your previous response was not valid JSON matching the required schema.",
    "Return ONLY corrected JSON with answer, summary, confidence, facts, recommendations, and limitations.",
    "Do not include markdown fences.",
    "",
    "Previous invalid output (truncated):",
    previousRaw.slice(0, 1_500),
  ].join("\n");
}
