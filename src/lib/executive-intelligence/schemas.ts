import { z } from "zod";

export const narrativeOutputSchema = z.object({
  narrative: z.string().min(1).max(4000),
  summary: z.string().min(1).max(1000),
  confidence: z.enum(["low", "medium", "high"]),
  citedEvidenceKeys: z.array(z.string().max(200)).max(30),
});

export type NarrativeOutput = z.infer<typeof narrativeOutputSchema>;

export function validateNarrativeOutput(
  raw: unknown,
  allowedEvidenceKeys: Set<string>,
): NarrativeOutput | null {
  const parsed = narrativeOutputSchema.safeParse(raw);
  if (!parsed.success) return null;

  const invalidKey = parsed.data.citedEvidenceKeys.find((k) => !allowedEvidenceKeys.has(k));
  if (invalidKey) return null;

  if (/<script|javascript:/i.test(parsed.data.narrative)) return null;

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
