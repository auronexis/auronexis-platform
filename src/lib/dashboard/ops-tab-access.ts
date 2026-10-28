import "server-only";

import { checkPlanFeatureForSession } from "@/lib/plans";
import { canManageOrganizationSettings } from "@/lib/team/guards";
import type { SessionContext } from "@/lib/tenancy/context";

export type OpsTabAccess = {
  aiAccess: boolean;
  successAccess: boolean;
  operationalAiAccess: boolean;
  incidentAiAccess: boolean;
  riskAiAccess: boolean;
  automationAccess: boolean;
  predictiveAccess: boolean;
  knowledgeAccess: boolean;
  canManageCompliance: boolean;
};

/** Ops tabs that load on demand (the Overview tab renders with the page). */
export const LAZY_OPS_TABS = ["intelligence", "automation", "governance"] as const;
export type LazyOpsTab = (typeof LAZY_OPS_TABS)[number];

export function isLazyOpsTab(value: unknown): value is LazyOpsTab {
  return typeof value === "string" && (LAZY_OPS_TABS as readonly string[]).includes(value);
}

/**
 * Plan and role access for the dashboard Ops tabs, always derived from the server session —
 * never from values sent by the browser.
 */
export async function resolveOpsTabAccess(session: SessionContext): Promise<OpsTabAccess> {
  const [ai, success, operationalAi, incidentAi, automation, predictive, knowledge] =
    await Promise.all([
      checkPlanFeatureForSession(session, "ai_report_assistant"),
      checkPlanFeatureForSession(session, "ai_client_analysis"),
      checkPlanFeatureForSession(session, "ai_risk_assistant"),
      checkPlanFeatureForSession(session, "ai_incident_assistant"),
      checkPlanFeatureForSession(session, "ai_automation_builder"),
      checkPlanFeatureForSession(session, "ai_predictive_intelligence"),
      checkPlanFeatureForSession(session, "ai_knowledge_search"),
    ]);

  return {
    aiAccess: ai.allowed,
    successAccess: success.allowed,
    operationalAiAccess: operationalAi.allowed,
    incidentAiAccess: incidentAi.allowed,
    // Same feature key as before: risk AI and operational AI share "ai_risk_assistant".
    riskAiAccess: operationalAi.allowed,
    automationAccess: automation.allowed,
    predictiveAccess: predictive.allowed,
    knowledgeAccess: knowledge.allowed,
    canManageCompliance: canManageOrganizationSettings(session),
  };
}
