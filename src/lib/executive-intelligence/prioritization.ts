import { MAX_PRIORITY_CLIENTS } from "@/lib/executive-intelligence/constants";
import type { IntelligenceRecommendedAction } from "@/lib/executive-intelligence/types";
import type { ClientPriorityResult } from "@/lib/intelligence/types";
import type { CustomerSuccessPortfolioEntry } from "@/lib/customer-success/types";
import type { ExecutivePriorityClient } from "@/lib/executive-intelligence/types";

function toRecommendedAction(
  clientId: string,
  title: string,
  description: string,
  permitted: boolean,
): IntelligenceRecommendedAction {
  return {
    key: `priority_${clientId}`,
    title,
    description,
    route: `/clients/${clientId}/success`,
    ctaLabel: "Open workspace",
    priority: 90,
    permitted,
    available: true,
    rationale: description,
  };
}

export function buildExecutivePriorityClients(input: {
  intelligencePriorities: ClientPriorityResult[];
  customerSuccessQueue: CustomerSuccessPortfolioEntry[];
  canReadCustomerSuccess: boolean;
}): ExecutivePriorityClient[] {
  const merged = new Map<string, ExecutivePriorityClient>();

  for (const client of input.intelligencePriorities) {
    merged.set(client.clientId, {
      clientId: client.clientId,
      clientName: client.clientName,
      priorityScore: client.score,
      healthScore: client.healthLabel === "healthy" ? 75 : client.healthLabel === "watch" ? 55 : 30,
      healthStatus: client.healthLabel,
      trend: "unknown",
      primaryReason: client.reasons[0] ?? "Operational attention required",
      supportingReasons: client.reasons.slice(1),
      activePlaybookCount: 0,
      overdueTaskCount: 0,
      openRiskCount: client.openRisks,
      openIncidentCount: client.openIncidents,
      recommendedAction: toRecommendedAction(
        client.clientId,
        client.recommendedAction,
        client.recommendedAction,
        true,
      ),
    });
  }

  if (input.canReadCustomerSuccess) {
    for (const entry of input.customerSuccessQueue) {
      const existing = merged.get(entry.clientId);
      const csBoost =
        (entry.healthStatus === "critical" ? 40 : entry.healthStatus === "at_risk" ? 25 : 0) +
        entry.overdueTaskCount * 8 +
        entry.openCriticalIncidentCount * 12 +
        entry.openHighRiskCount * 10;

      if (existing) {
        existing.priorityScore += csBoost;
        existing.activePlaybookCount = entry.activePlaybookName ? 1 : 0;
        existing.overdueTaskCount = entry.overdueTaskCount;
        existing.healthScore = entry.healthScore;
        existing.healthStatus = entry.healthStatus;
        existing.trend = entry.trend;
        if (entry.primaryRiskReason) {
          existing.supportingReasons.unshift(entry.primaryRiskReason);
        }
        if (entry.nextAction) {
          existing.recommendedAction = {
            key: entry.nextAction.key,
            title: entry.nextAction.title,
            description: entry.nextAction.description,
            route: entry.nextAction.route,
            ctaLabel: entry.nextAction.ctaLabel,
            priority: 95,
            permitted: true,
            available: true,
            rationale: entry.nextAction.reason,
          };
        }
      } else {
        merged.set(entry.clientId, {
          clientId: entry.clientId,
          clientName: entry.clientName,
          priorityScore: csBoost + entry.healthScore,
          healthScore: entry.healthScore,
          healthStatus: entry.healthStatus,
          trend: entry.trend,
          primaryReason: entry.primaryRiskReason ?? "Customer success attention required",
          supportingReasons: [],
          activePlaybookCount: entry.activePlaybookName ? 1 : 0,
          overdueTaskCount: entry.overdueTaskCount,
          openRiskCount: entry.openHighRiskCount,
          openIncidentCount: entry.openCriticalIncidentCount,
          recommendedAction: entry.nextAction
            ? {
                key: entry.nextAction.key,
                title: entry.nextAction.title,
                description: entry.nextAction.description,
                route: entry.nextAction.route,
                ctaLabel: entry.nextAction.ctaLabel,
                priority: 95,
                permitted: true,
                available: true,
                rationale: entry.nextAction.reason,
              }
            : toRecommendedAction(
                entry.clientId,
                "Review client success workspace",
                entry.primaryRiskReason ?? "Customer success intervention needed",
                true,
              ),
        });
      }
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, MAX_PRIORITY_CLIENTS);
}
