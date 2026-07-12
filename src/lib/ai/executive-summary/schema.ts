import { z } from "zod";

export const EXECUTIVE_SUMMARY_PROMPT_VERSION = "executive-summary-v1";

export const executiveSummaryOutputSchema = z.object({
  headline: z.string().min(1).max(160),
  executive_summary: z.string().min(1).max(2500),
  key_outcomes: z.array(z.string().min(1).max(240)).max(6),
  key_risks: z.array(z.string().min(1).max(240)).max(6),
  recommended_next_steps: z.array(z.string().min(1).max(240)).max(6),
  confidence_note: z.string().min(1).max(400),
});

export type ExecutiveSummaryOutput = z.infer<typeof executiveSummaryOutputSchema>;

export function validateExecutiveSummaryOutput(raw: unknown): ExecutiveSummaryOutput | null {
  const parsed = executiveSummaryOutputSchema.safeParse(raw);
  if (!parsed.success) return null;
  if (/<script|javascript:/i.test(parsed.data.executive_summary)) return null;
  return parsed.data;
}

export function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

export function formatExecutiveSummaryDraft(output: ExecutiveSummaryOutput): string {
  const sections = [
    output.headline,
    "",
    output.executive_summary,
    "",
    "Key outcomes:",
    ...output.key_outcomes.map((item) => `- ${item}`),
    "",
    "Key risks:",
    ...output.key_risks.map((item) => `- ${item}`),
    "",
    "Recommended next steps:",
    ...output.recommended_next_steps.map((item) => `- ${item}`),
    "",
    `Confidence note: ${output.confidence_note}`,
  ];
  return sections.join("\n").trim();
}
