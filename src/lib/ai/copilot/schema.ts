import { z } from "zod";
import type { CopilotAnswer } from "@/lib/ai/copilot/types";

const confidenceSchema = z.enum(["high", "medium", "low"]);

const sourceTypeSchema = z.enum([
  "client",
  "risk",
  "incident",
  "report",
  "sla",
  "activity",
  "health",
  "profitability",
]);

const factSchema = z.object({
  statement: z.string().min(1).max(2_000),
  sourceType: sourceTypeSchema,
  sourceId: z.string().uuid().optional(),
  sourceLabel: z.string().min(1).max(200),
});

const recommendationSchema = z.object({
  title: z.string().min(1).max(200),
  reason: z.string().min(1).max(1_000),
  priority: z.enum(["low", "medium", "high", "critical"]),
  href: z.string().max(500).optional(),
});

export const copilotAnswerSchema = z.object({
  answer: z.string().min(1).max(12_000),
  summary: z.string().min(1).max(1_000),
  confidence: confidenceSchema,
  facts: z.array(factSchema).max(20),
  recommendations: z.array(recommendationSchema).max(12),
  limitations: z.array(z.string().max(500)).max(10),
});

export type CopilotAnswerParsed = z.infer<typeof copilotAnswerSchema>;

function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

export function parseCopilotAnswer(raw: string): CopilotAnswer | null {
  try {
    const payload = extractJsonPayload(raw);
    const parsed = JSON.parse(payload) as unknown;
    const validated = copilotAnswerSchema.safeParse(parsed);
    return validated.success ? validated.data : null;
  } catch {
    return null;
  }
}

export function buildSafeCopilotFallback(limitation: string): CopilotAnswer {
  return {
    answer:
      "I could not produce a structured answer from the available workspace data. Please try again or narrow your question.",
    summary: "Structured AI response unavailable.",
    confidence: "low",
    facts: [],
    recommendations: [],
    limitations: [
      limitation,
      "Verify important operational decisions against source records in Auroranexis.",
    ],
  };
}
