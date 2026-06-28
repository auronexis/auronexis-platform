/** Shared confidence scoring helpers. */

export type AIConfidenceLabel = "Low" | "Medium" | "High";

export function scoreToConfidenceLabel(score: number): AIConfidenceLabel {
  if (score >= 75) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

export function buildConfidenceScore(input: {
  score: number;
  factors?: string[];
}): { score: number; label: AIConfidenceLabel; reasoning?: string } {
  const clamped = Math.max(0, Math.min(100, Math.round(input.score)));
  return {
    score: clamped,
    label: scoreToConfidenceLabel(clamped),
    reasoning: input.factors?.length ? input.factors.join("; ") : undefined,
  };
}

export function confidenceFromContextCounts(input: {
  openItems?: number;
  activityCount?: number;
  hasHistorical?: boolean;
  hasKnowledge?: boolean;
}): { score: number; label: AIConfidenceLabel } {
  let score = 35;
  if (input.openItems) score += Math.min(20, input.openItems * 4);
  if (input.activityCount) score += Math.min(15, input.activityCount * 2);
  if (input.hasHistorical) score += 15;
  if (input.hasKnowledge) score += 10;
  return buildConfidenceScore({ score });
}
