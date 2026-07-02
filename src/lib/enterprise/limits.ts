import type { PlanKey } from "@/lib/billing/plans";
import { getPlanFeatures } from "@/lib/plans/features";
import type { PlanFeatures } from "@/lib/plans/types";
import type {
  EffectiveLimits,
  MergedPlanFeatures,
  OrganizationPlanOverrideView,
} from "@/lib/enterprise/types";

export function applyPlanOverride(
  basePlanKey: PlanKey,
  override: OrganizationPlanOverrideView | null,
): MergedPlanFeatures {
  const base = { ...getPlanFeatures(basePlanKey) };
  const merged: MergedPlanFeatures = {
    ...base,
    monitoring_limit: null,
    portal_branding_enabled: false,
    custom_domain_enabled: false,
  };

  if (!override || override.status !== "active") {
    return merged;
  }

  const overridePlanKey = override.plan;
  const overrideBase = getPlanFeatures(overridePlanKey);
  const result: MergedPlanFeatures = {
    ...overrideBase,
    seats: override.seatsLimit ?? overrideBase.seats,
    max_clients: override.clientsLimit ?? overrideBase.max_clients,
    max_automations: overrideBase.max_automations,
    future_api_webhooks: override.apiEnabled || override.webhooksEnabled || overrideBase.future_api_webhooks,
    priority_support: override.prioritySupportEnabled || overrideBase.priority_support,
    monitoring_limit: override.monitoringLimit,
    portal_branding_enabled: override.portalBrandingEnabled,
    custom_domain_enabled: override.customDomainEnabled,
  };

  if (override.aiEnabled) {
    result.ai_report_assistant = true;
    result.ai_client_success = true;
    result.ai_client_analysis = true;
    result.ai_risk_assistant = true;
    result.ai_incident_assistant = true;
    result.ai_automation_builder = true;
    result.ai_workflow_translation = true;
    result.ai_knowledge_search = true;
    result.ai_knowledge_generation = true;
    result.ai_playbook_generation = true;
    result.ai_predictive_intelligence = true;
  }

  return result;
}

export function getEffectiveLimitsFromFeatures(features: PlanFeatures | MergedPlanFeatures): EffectiveLimits {
  return {
    seats: features.seats,
    maxClients: features.max_clients,
    monitoringLimit:
      "monitoring_limit" in features ? (features.monitoring_limit ?? null) : null,
  };
}

export function getEffectiveLimits(
  basePlanKey: PlanKey,
  override: OrganizationPlanOverrideView | null,
): EffectiveLimits {
  return getEffectiveLimitsFromFeatures(applyPlanOverride(basePlanKey, override));
}
