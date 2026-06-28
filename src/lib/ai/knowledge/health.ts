import type {
  KnowledgeGap,
  KnowledgeHealthScore,
  KnowledgeRecommendation,
} from "@/lib/ai/knowledge/types";
import { KNOWLEDGE_GAP_MESSAGES } from "@/lib/ai/knowledge/types";
import type { KnowledgeEntityRef } from "@/lib/ai/knowledge/types";

export function calculateKnowledgeHealth(input: {
  reports: KnowledgeEntityRef[];
  risks: KnowledgeEntityRef[];
  incidents: KnowledgeEntityRef[];
  playbooksCount: number;
  articlesCount: number;
  slaBreachEvents?: number;
}): KnowledgeHealthScore {
  const reportsLearned = input.reports.length;
  const incidentsLearned = input.incidents.length;
  const risksLearned = input.risks.length;
  const playbooksGenerated = input.playbooksCount;
  const articlesCount = input.articlesCount;

  const totalPossible = 40;
  const totalActual = reportsLearned + incidentsLearned + risksLearned + playbooksGenerated;
  const coveragePercent = Math.min(100, Math.round((totalActual / totalPossible) * 100));

  let score = 20;
  score += Math.min(25, reportsLearned * 3);
  score += Math.min(25, incidentsLearned * 4);
  score += Math.min(20, risksLearned * 3);
  score += Math.min(10, playbooksGenerated * 5);
  const clamped = Math.min(100, score);

  const gaps: KnowledgeGap[] = [];
  if (input.slaBreachEvents === 0) {
    gaps.push({ id: "no-sla-history", message: KNOWLEDGE_GAP_MESSAGES.noSlaHistory });
  }
  if (risksLearned === 0) {
    gaps.push({ id: "no-mitigation", message: KNOWLEDGE_GAP_MESSAGES.noMitigation });
  }
  if (incidentsLearned === 0) {
    gaps.push({ id: "no-resolution", message: KNOWLEDGE_GAP_MESSAGES.noResolution });
  }
  if (reportsLearned === 0) {
    gaps.push({ id: "no-reports", message: KNOWLEDGE_GAP_MESSAGES.noReports });
  }

  let label = "Low";
  if (clamped >= 75) label = "High";
  else if (clamped >= 50) label = "Medium";

  return {
    score: clamped,
    label,
    reportsLearned,
    incidentsLearned,
    risksLearned,
    playbooksGenerated,
    articlesCount,
    coveragePercent,
    gaps,
  };
}

export function buildKnowledgeRecommendations(input: {
  reports: KnowledgeEntityRef[];
  risks: KnowledgeEntityRef[];
  incidents: KnowledgeEntityRef[];
}): KnowledgeRecommendation[] {
  const recommendations: KnowledgeRecommendation[] = [];

  const mitigationTitles = new Map<string, number>();
  for (const risk of input.risks) {
    const key = risk.excerpt.slice(0, 40).toLowerCase();
    if (!key) continue;
    mitigationTitles.set(key, (mitigationTitles.get(key) ?? 0) + 1);
  }
  const topMitigation = [...mitigationTitles.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topMitigation && topMitigation[1] >= 2) {
    recommendations.push({
      id: "mitigation-repeat",
      message: `This mitigation pattern appears in ${topMitigation[1]} resolved risks.`,
      evidence: "Verified resolved risk notes",
      confidence: Math.min(95, 60 + topMitigation[1] * 8),
    });
  }

  if (input.reports.length >= 3) {
    recommendations.push({
      id: "report-recommendations",
      message: `Historical recommendations appear in ${input.reports.length} published reports.`,
      evidence: "Published executive summaries",
      confidence: 70,
    });
  }

  const clientIncidentCounts = new Map<string, number>();
  for (const incident of input.incidents) {
    if (!incident.clientId) continue;
    clientIncidentCounts.set(
      incident.clientId,
      (clientIncidentCounts.get(incident.clientId) ?? 0) + 1,
    );
  }
  const repeatClient = [...clientIncidentCounts.entries()].find(([, count]) => count >= 2);
  if (repeatClient) {
    recommendations.push({
      id: "repeat-outages",
      message: "This customer has experienced similar resolved incidents more than once.",
      evidence: "Resolved incident history",
      confidence: 78,
    });
  }

  return recommendations.slice(0, 4);
}
