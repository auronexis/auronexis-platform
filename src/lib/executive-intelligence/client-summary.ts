import { buildClientSuccessSnapshot } from "@/lib/customer-success/snapshot";
import { buildDeterministicExecutiveNarrative } from "@/lib/executive-intelligence/briefing";
import { buildExecutiveFindings } from "@/lib/executive-intelligence/findings";
import type { ClientIntelligenceSummary } from "@/lib/executive-intelligence/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationPlanContext } from "@/lib/plans/types";

export async function buildClientIntelligenceSummary(input: {
  session: SessionContext;
  clientId: string;
  planContext: OrganizationPlanContext | null;
}): Promise<ClientIntelligenceSummary | null> {
  const snapshot = await buildClientSuccessSnapshot({
    session: input.session,
    clientId: input.clientId,
    planContext: input.planContext,
  });
  if (!snapshot) return null;

  const findings = buildExecutiveFindings(
    {
      criticalChanges: [],
      negativeChanges: [],
      positiveChanges: [],
      adoption: {
        key: "adoption",
        label: "Adoption",
        currentValue: null,
        previousValue: null,
        unit: "score",
        direction: "unknown",
        changeAbsolute: null,
        changePercentage: null,
        interpretation: "unknown",
        evidence: [],
      },
      customerSuccess: {
        key: "cs",
        label: "Customer success",
        currentValue: snapshot.healthScore,
        previousValue: null,
        unit: "score",
        direction: snapshot.trend === "improving" ? "up" : snapshot.trend === "declining" ? "down" : "stable",
        changeAbsolute: null,
        changePercentage: null,
        interpretation: snapshot.healthStatus === "healthy" ? "positive" : "negative",
        evidence: [],
      },
      delivery: {
        key: "delivery",
        label: "Delivery",
        currentValue: snapshot.daysSinceLastPublishedReport,
        previousValue: null,
        unit: "days",
        direction: "unknown",
        changeAbsolute: null,
        changePercentage: null,
        interpretation: "unknown",
        evidence: [],
      },
      riskExposure: {
        key: "risks",
        label: "Risks",
        currentValue: snapshot.openRiskCount,
        previousValue: null,
        unit: "count",
        direction: "unknown",
        changeAbsolute: null,
        changePercentage: null,
        interpretation: snapshot.openRiskCount > 0 ? "negative" : "neutral",
        evidence: [],
      },
      incidentStability: {
        key: "incidents",
        label: "Incidents",
        currentValue: snapshot.openIncidentCount,
        previousValue: null,
        unit: "count",
        direction: "unknown",
        changeAbsolute: null,
        changePercentage: null,
        interpretation: snapshot.openIncidentCount > 0 ? "negative" : "neutral",
        evidence: [],
      },
      overdueOperationalWork: snapshot.overdueTaskCount > 0
        ? [{ id: "1", type: "task", title: "Overdue tasks", clientId: snapshot.clientId, clientName: snapshot.clientName, dueAt: null, severity: "high", route: `/clients/${snapshot.clientId}/success` }]
        : [],
      underusedCapabilities: [],
    },
    {
      openRisksCurrent: snapshot.openRiskCount,
      openRisksPrevious: 0,
      openIncidentsCurrent: snapshot.openIncidentCount,
      openIncidentsPrevious: 0,
      reportsPublishedCurrent: 0,
      reportsPublishedPrevious: 0,
      overdueTasksCurrent: snapshot.overdueTaskCount,
      overdueTasksPrevious: 0,
      monitoringFailuresCurrent: 0,
      monitoringFailuresPrevious: 0,
      adoptionScoreCurrent: null,
      adoptionScorePrevious: null,
      criticalClientsCurrent: snapshot.healthStatus === "critical" ? 1 : 0,
      criticalClientsPrevious: 0,
    },
  );

  return {
    clientId: snapshot.clientId,
    clientName: snapshot.clientName,
    healthScore: snapshot.healthScore,
    healthStatus: snapshot.healthStatus,
    trend: snapshot.trend,
    recentChanges: [],
    findings,
    recommendedActions: snapshot.suggestedPlaybooks
      .filter((p) => p.available && p.permitted)
      .slice(0, 3)
      .map((p) => ({
        key: p.key,
        title: p.name,
        description: p.description,
        route: `/clients/${snapshot.clientId}/success`,
        ctaLabel: "Start playbook",
        priority: 80,
        permitted: p.permitted,
        available: p.available,
        rationale: p.reason,
      })),
    narrative: buildDeterministicExecutiveNarrative(
      {
        organizationId: snapshot.organizationId,
        period: { currentStart: "", currentEnd: "", comparisonStart: "", comparisonEnd: "", label: "Client", preset: "30d" },
        organizationHealth: { key: "h", label: "Health", currentValue: snapshot.healthScore, previousValue: null, unit: "score", direction: "unknown", changeAbsolute: null, changePercentage: null, interpretation: "unknown", evidence: [] },
        adoption: { key: "a", label: "Adoption", currentValue: null, previousValue: null, unit: "score", direction: "unknown", changeAbsolute: null, changePercentage: null, interpretation: "unknown", evidence: [] },
        customerSuccess: { key: "cs", label: "CS", currentValue: snapshot.healthScore, previousValue: null, unit: "score", direction: "unknown", changeAbsolute: null, changePercentage: null, interpretation: "unknown", evidence: [] },
        delivery: { key: "d", label: "Delivery", currentValue: null, previousValue: null, unit: "count", direction: "unknown", changeAbsolute: null, changePercentage: null, interpretation: "unknown", evidence: [] },
        riskExposure: { key: "r", label: "Risk", currentValue: snapshot.openRiskCount, previousValue: null, unit: "count", direction: "unknown", changeAbsolute: null, changePercentage: null, interpretation: "unknown", evidence: [] },
        incidentStability: { key: "i", label: "Incidents", currentValue: snapshot.openIncidentCount, previousValue: null, unit: "count", direction: "unknown", changeAbsolute: null, changePercentage: null, interpretation: "unknown", evidence: [] },
        monitoringReliability: { key: "m", label: "Monitoring", currentValue: null, previousValue: null, unit: "count", direction: "unknown", changeAbsolute: null, changePercentage: null, interpretation: "unknown", evidence: [] },
        profitability: null,
        collaboration: { key: "c", label: "Collab", currentValue: null, previousValue: null, unit: "count", direction: "unknown", changeAbsolute: null, changePercentage: null, interpretation: "unknown", evidence: [] },
        customerVisibility: { key: "v", label: "Visibility", currentValue: null, previousValue: null, unit: "count", direction: "unknown", changeAbsolute: null, changePercentage: null, interpretation: "unknown", evidence: [] },
        topFindings: findings,
        criticalChanges: [],
        positiveChanges: [],
        negativeChanges: [],
        priorityClients: [],
        overdueOperationalWork: [],
        recentRecoveries: [],
        underusedCapabilities: [],
        recommendedActions: [],
        hasEnoughData: true,
        generatedAt: snapshot.generatedAt,
      },
      findings,
    ),
    generatedBy: "deterministic",
    generatedAt: new Date().toISOString(),
  };
}
