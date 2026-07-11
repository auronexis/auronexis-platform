import { cache } from "react";
import { buildOperationalSnapshot } from "@/lib/ai/insights/queries";
import type { AdoptionSnapshot } from "@/lib/adoption/types";
import type { ActivationSnapshot } from "@/lib/activation/types";
import type { CustomerSuccessPortfolio } from "@/lib/customer-success/types";
import type { DashboardData } from "@/lib/dashboard/types";
import { getExecutiveIntelligence } from "@/lib/intelligence/queries";
import {
  buildIntelligenceChange,
  classifyChanges,
  computeMetricChange,
} from "@/lib/executive-intelligence/change-detection";
import { buildExecutiveFindings } from "@/lib/executive-intelligence/findings";
import { buildExecutivePriorityClients } from "@/lib/executive-intelligence/prioritization";
import { DEFAULT_PERIOD_PRESET } from "@/lib/executive-intelligence/constants";
import { resolveIntelligencePeriod } from "@/lib/executive-intelligence/period";
import type {
  ExecutiveCapabilityGap,
  ExecutiveIntelligenceSnapshot,
  ExecutiveOperationalItem,
  ExecutiveRecoveryItem,
  IntelligencePeriodPreset,
  IntelligenceRecommendedAction,
} from "@/lib/executive-intelligence/types";
import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationPlanContext } from "@/lib/plans/types";

export type BuildSnapshotInput = {
  session: SessionContext;
  dashboardData: DashboardData;
  activation: ActivationSnapshot;
  adoption: AdoptionSnapshot;
  customerSuccessPortfolio: CustomerSuccessPortfolio | null;
  planContext: OrganizationPlanContext | null;
  periodPreset?: IntelligencePeriodPreset;
  canReadCustomerSuccess: boolean;
};

function buildRecommendedActions(
  findings: ReturnType<typeof buildExecutiveFindings>,
  priorityClients: ReturnType<typeof buildExecutivePriorityClients>,
): IntelligenceRecommendedAction[] {
  const fromFindings = findings.flatMap((f) => f.recommendedActions);
  const fromClients = priorityClients
    .filter((c) => c.recommendedAction)
    .map((c) => c.recommendedAction!);
  const merged = [...fromFindings, ...fromClients];
  const seen = new Set<string>();
  return merged
    .filter((a) => {
      if (seen.has(a.key)) return false;
      seen.add(a.key);
      return true;
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 12);
}

function buildUnderusedCapabilities(adoption: AdoptionSnapshot): ExecutiveCapabilityGap[] {
  return adoption.featureSignals
    .filter((f) => f.available && !f.adopted)
    .map((f) => ({
      key: f.key,
      label: f.label,
      description: `${f.label} is available on your plan but not yet adopted.`,
      route: f.route,
      available: f.available,
    }))
    .slice(0, 8);
}

function buildOverdueWork(portfolio: CustomerSuccessPortfolio | null): ExecutiveOperationalItem[] {
  if (!portfolio) return [];
  return portfolio.priorityQueue
    .filter((e) => e.overdueTaskCount > 0)
    .map((e) => ({
      id: `overdue_${e.clientId}`,
      type: "task" as const,
      title: `${e.overdueTaskCount} overdue task(s)`,
      clientId: e.clientId,
      clientName: e.clientName,
      dueAt: null,
      severity: "high",
      route: `/clients/${e.clientId}/success`,
    }))
    .slice(0, 20);
}

function buildRecoveries(portfolio: CustomerSuccessPortfolio | null): ExecutiveRecoveryItem[] {
  if (!portfolio) return [];
  return portfolio.priorityQueue
    .filter((e) => e.healthStatus === "healthy" || e.healthStatus === "stable")
    .slice(0, 5)
    .map((e) => ({
      clientId: e.clientId,
      clientName: e.clientName,
      recoveryStatus: "recovered",
      playbookName: e.activePlaybookName,
      healthDelta: null,
      completedAt: null,
    }));
}

/** Primary entry — build organization executive intelligence snapshot. */
export const buildExecutiveIntelligenceSnapshot = cache(
  async (input: BuildSnapshotInput): Promise<ExecutiveIntelligenceSnapshot> => {
    const period = resolveIntelligencePeriod(input.periodPreset ?? DEFAULT_PERIOD_PRESET);
    const [operational, executive] = await Promise.all([
      buildOperationalSnapshot(input.session, input.dashboardData),
      getExecutiveIntelligence(input.session, input.dashboardData),
    ]);

    const adoptionScore = input.adoption.score;
    const adoptionPrevious = Math.max(0, adoptionScore - (input.adoption.trend === "improving" ? 5 : input.adoption.trend === "declining" ? -5 : 0));

    const csHealthy = input.customerSuccessPortfolio?.healthyCount ?? 0;
    const csPrevious = Math.max(0, csHealthy - 1);

    const orgHealthCurrent =
      executive.portfolioHealth.total > 0
        ? Math.round(
            (executive.portfolioHealth.healthy / executive.portfolioHealth.total) * 100,
          )
        : null;

    const metrics = {
      organizationHealth: computeMetricChange("org_health", "Organization health", orgHealthCurrent, orgHealthCurrent !== null ? orgHealthCurrent - (executive.healthTrends[1]?.delta ?? 0) : null, true, "/dashboard"),
      adoption: computeMetricChange("adoption_score", "Adoption score", adoptionScore, adoptionPrevious, true, "/adoption"),
      customerSuccess: computeMetricChange("cs_healthy", "Healthy clients", csHealthy, csPrevious, true, "/customer-success"),
      delivery: computeMetricChange("reports_published", "Published reports", operational.reportsPublishedCurrent, operational.reportsPublishedPrevious, true, "/reports"),
      riskExposure: computeMetricChange("open_risks", "Open risks", operational.dashboard.openRiskCount, operational.risksPrevious, false, "/risks"),
      incidentStability: computeMetricChange("open_incidents", "Open incidents", operational.dashboard.openIncidentCount, operational.incidentsPrevious, false, "/incidents"),
      monitoringReliability: computeMetricChange("monitoring_connectors", "Active connectors", operational.dashboard.monitoringMetrics.activeConnectors, operational.dashboard.monitoringMetrics.activeConnectors, true, "/monitoring"),
      profitability: operational.portfolioMargin !== null
        ? computeMetricChange("portfolio_margin", "Portfolio margin", operational.portfolioMargin, operational.portfolioMargin, true, "/profitability")
        : null,
      collaboration: computeMetricChange("team_members", "Team members", input.adoption.totalUsers, input.adoption.totalUsers, true, "/settings/team"),
      customerVisibility: computeMetricChange("portal_adoption", "Portal adoption", input.adoption.featureSignals.find((f) => f.key === "customer_portal")?.adopted ? 1 : 0, 0, true, null),
    };

    const changes = [
      buildIntelligenceChange("reports_published", "Published reports", operational.reportsPublishedCurrent, operational.reportsPublishedPrevious, true, "/reports"),
      buildIntelligenceChange("open_risks", "Open risks", operational.dashboard.openRiskCount, operational.risksPrevious, false, "/risks"),
      buildIntelligenceChange("open_incidents", "Open incidents", operational.dashboard.openIncidentCount, operational.incidentsPrevious, false, "/incidents"),
      buildIntelligenceChange("adoption_score", "Adoption score", adoptionScore, adoptionPrevious, true, "/adoption"),
      buildIntelligenceChange("overdue_tasks", "Overdue tasks", input.customerSuccessPortfolio?.overdueTaskCount ?? 0, 0, false, "/customer-success"),
      buildIntelligenceChange("sla_breaches", "SLA breaches", operational.slaBreachesCurrent, operational.slaBreachesPrevious, false, "/settings/sla"),
    ].filter((c): c is NonNullable<typeof c> => c !== null);

    const { criticalChanges, positiveChanges, negativeChanges } = classifyChanges(changes);

    const priorityClients = buildExecutivePriorityClients({
      intelligencePriorities: executive.priorityClients,
      customerSuccessQueue: input.customerSuccessPortfolio?.priorityQueue ?? [],
      canReadCustomerSuccess: input.canReadCustomerSuccess,
    });

    const overdueOperationalWork = buildOverdueWork(input.customerSuccessPortfolio);
    const recentRecoveries = buildRecoveries(input.customerSuccessPortfolio);
    const underusedCapabilities = buildUnderusedCapabilities(input.adoption);

    const anomalyInput = {
      openRisksCurrent: operational.dashboard.openRiskCount,
      openRisksPrevious: operational.risksPrevious,
      openIncidentsCurrent: operational.dashboard.openIncidentCount,
      openIncidentsPrevious: operational.incidentsPrevious,
      reportsPublishedCurrent: operational.reportsPublishedCurrent,
      reportsPublishedPrevious: operational.reportsPublishedPrevious,
      overdueTasksCurrent: input.customerSuccessPortfolio?.overdueTaskCount ?? 0,
      overdueTasksPrevious: 0,
      monitoringFailuresCurrent: operational.dashboard.monitoringMetrics.failedConnectors,
      monitoringFailuresPrevious: 0,
      adoptionScoreCurrent: adoptionScore,
      adoptionScorePrevious: adoptionPrevious,
      criticalClientsCurrent: input.customerSuccessPortfolio?.criticalCount ?? 0,
      criticalClientsPrevious: 0,
    };

    const partialSnapshot = {
      organizationId: input.session.organization.id,
      period,
      ...metrics,
      criticalChanges,
      positiveChanges,
      negativeChanges,
      priorityClients,
      overdueOperationalWork,
      recentRecoveries,
      underusedCapabilities,
      recommendedActions: [] as IntelligenceRecommendedAction[],
      topFindings: [] as ReturnType<typeof buildExecutiveFindings>,
      hasEnoughData: executive.hasClients || input.activation.firstValueReached,
      generatedAt: new Date().toISOString(),
    };

    const topFindings = buildExecutiveFindings(partialSnapshot, anomalyInput);
    const recommendedActions = buildRecommendedActions(topFindings, priorityClients);

    return {
      ...partialSnapshot,
      topFindings,
      recommendedActions,
    };
  },
);

export function resolveDashboardExecutiveIntelligenceMode(
  activation: ActivationSnapshot,
  adoption: AdoptionSnapshot,
  customerSuccessMode: string,
  snapshot: ExecutiveIntelligenceSnapshot,
): import("@/lib/executive-intelligence/types").DashboardExecutiveIntelligenceMode {
  const activationIncomplete =
    !activation.firstValueReached ||
    ["not_started", "getting_started", "building_foundation"].includes(activation.stage);
  if (activationIncomplete) return "hidden";

  const adoptionCritical =
    adoption.riskLevel === "critical" ||
    adoption.riskLevel === "at_risk" ||
    adoption.stage === "at_risk" ||
    adoption.stage === "inactive";
  if (adoptionCritical) return "hidden";

  if (customerSuccessMode === "critical") return "hidden";

  const hasCriticalFinding = snapshot.topFindings.some((f) =>
    ["critical", "high"].includes(f.severity),
  );
  if (hasCriticalFinding || snapshot.criticalChanges.length > 0) return "critical";

  if (snapshot.topFindings.length > 0 || snapshot.priorityClients.length > 0) return "summary";

  return "hidden";
}
