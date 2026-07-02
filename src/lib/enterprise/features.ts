import type { PlanFeatureKey, PlanFeatures } from "@/lib/plans/types";
import type { OrganizationPlanOverrideView } from "@/lib/enterprise/types";

/** Whether effective features include a plan flag (respects overrides). */
export function hasEnterpriseFeature(
  features: PlanFeatures,
  feature: PlanFeatureKey,
  override: OrganizationPlanOverrideView | null,
): boolean {
  if (override?.status === "active") {
    if (feature === "future_api_webhooks") {
      return override.apiEnabled || override.webhooksEnabled || Boolean(features.future_api_webhooks);
    }
    if (feature === "priority_support") {
      return override.prioritySupportEnabled || Boolean(features.priority_support);
    }
    const aiFeatures: PlanFeatureKey[] = [
      "ai_report_assistant",
      "ai_client_success",
      "ai_client_analysis",
      "ai_risk_assistant",
      "ai_incident_assistant",
      "ai_automation_builder",
      "ai_workflow_translation",
      "ai_knowledge_search",
      "ai_knowledge_generation",
      "ai_playbook_generation",
      "ai_predictive_intelligence",
    ];
    if (aiFeatures.includes(feature) && override.aiEnabled) {
      return true;
    }
  }

  const value = features[feature];
  return typeof value === "boolean" ? value : Boolean(value);
}
