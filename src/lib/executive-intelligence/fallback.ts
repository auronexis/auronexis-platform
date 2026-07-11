import type { ExecutiveBriefing, ExecutiveIntelligenceSnapshot } from "@/lib/executive-intelligence/types";
import { buildDeterministicExecutiveNarrative } from "@/lib/executive-intelligence/briefing";

export function buildDeterministicNarrativeResult(
  snapshot: ExecutiveIntelligenceSnapshot,
  briefing: ExecutiveBriefing,
) {
  return {
    narrative: briefing.narrative || buildDeterministicExecutiveNarrative(snapshot),
    generatedBy: "deterministic" as const,
    provider: null,
    model: null,
  };
}
