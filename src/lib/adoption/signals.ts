import type { SessionContext } from "@/lib/tenancy/context";
import type { OrganizationPlanContext } from "@/lib/plans/types";
import { ADOPTION_FEATURE_REGISTRY } from "@/lib/adoption/constants";
import type { AdoptionDataSnapshot, AdoptionFeatureSignal } from "@/lib/adoption/types";
import { isFeatureEnabled } from "@/lib/plans/features";
import type { PlanKey } from "@/lib/billing/plans";

type BuildFeatureSignalsInput = {
  data: AdoptionDataSnapshot;
  session: SessionContext;
  planContext: OrganizationPlanContext | null;
};

function isFeatureAvailable(
  definition: (typeof ADOPTION_FEATURE_REGISTRY)[number],
  planKey: PlanKey,
): boolean {
  if (!definition.planFeature) {
    return true;
  }
  return isFeatureEnabled(planKey, definition.planFeature);
}

function isFeatureAdopted(
  key: string,
  data: AdoptionDataSnapshot,
): { adopted: boolean; usageCount30d: number } {
  switch (key) {
    case "clients":
      return { adopted: data.clientCount > 0, usageCount30d: data.clientCount > 0 ? 1 : 0 };
    case "reports":
      return { adopted: data.reportCount > 0, usageCount30d: data.reportCount > 0 ? 1 : 0 };
    case "published_reports":
      return {
        adopted: data.publishedReportCount > 0,
        usageCount30d: data.publishedReports30d,
      };
    case "report_scheduling":
      return {
        adopted: data.reportScheduleCount > 0,
        usageCount30d: data.activeScheduleCount,
      };
    case "risks":
      return { adopted: data.riskCount > 0, usageCount30d: data.riskCount > 0 ? 1 : 0 };
    case "incidents":
      return { adopted: data.incidentCount > 0, usageCount30d: data.incidentCount > 0 ? 1 : 0 };
    case "monitoring":
      return {
        adopted: data.monitoringConnectorCount > 0,
        usageCount30d: data.monitoringEvents30d,
      };
    case "automations":
      return {
        adopted: data.automationWorkflowCount > 0,
        usageCount30d: data.automationExecutions30d,
      };
    case "knowledge":
      return {
        adopted: data.knowledgeItemCount > 0,
        usageCount30d: data.knowledgeItemCount > 0 ? 1 : 0,
      };
    case "team_collaboration":
      return {
        adopted: data.teamMemberCount > 1 || data.pendingInvitationCount > 0,
        usageCount30d: data.activeUsers30d,
      };
    case "client_portal":
      return {
        adopted: data.portalUserCount > 0,
        usageCount30d: data.customerFacingEvents30d,
      };
    case "sla":
      return { adopted: data.slaPolicyCount > 0, usageCount30d: data.slaPolicyCount > 0 ? 1 : 0 };
    case "profitability":
      return {
        adopted: data.profitabilityRecordCount > 0,
        usageCount30d: data.profitabilityRecordCount > 0 ? 1 : 0,
      };
    case "integrations":
      return {
        adopted: data.monitoringConnectorCount > 0 || data.automationWorkflowCount > 0,
        usageCount30d: data.monitoringEvents30d + data.automationExecutions30d,
      };
    default:
      return { adopted: false, usageCount30d: 0 };
  }
}

/** Build feature adoption signals from registry and real workspace data. */
export function buildFeatureSignals(input: BuildFeatureSignalsInput): AdoptionFeatureSignal[] {
  const planKey = input.planContext?.planKey ?? "starter";

  return ADOPTION_FEATURE_REGISTRY.map((definition) => {
    const available = isFeatureAvailable(definition, planKey);
    const { adopted, usageCount30d } = isFeatureAdopted(definition.key, input.data);

    return {
      key: definition.key,
      label: definition.label,
      category: definition.category,
      available,
      adopted: available ? adopted : false,
      firstUsedAt: available && adopted ? input.data.lastMeaningfulActivityAt : null,
      lastUsedAt: available && adopted ? input.data.lastMeaningfulActivityAt : null,
      usageCount30d: available ? usageCount30d : 0,
      importance: definition.importance,
      route: definition.route,
    };
  });
}

export function countAdoptedFeatures(signals: AdoptionFeatureSignal[]): number {
  return signals.filter((signal) => signal.available && signal.adopted).length;
}

export function countAvailableFeatures(signals: AdoptionFeatureSignal[]): number {
  return signals.filter((signal) => signal.available).length;
}
