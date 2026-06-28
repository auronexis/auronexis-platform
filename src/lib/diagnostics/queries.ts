import "server-only";

import { getPlanByKey, type PlanKey } from "@/lib/billing/plans";
import { getPlanKeyByPriceId } from "@/lib/billing/plans.server";
import { getAIDiagnosticsSnapshot } from "@/lib/ai/core/observability";
import { getAIUsageSummaryForSession } from "@/lib/ai/usage/queries";
import { getAutomationRepositoryDiagnostics } from "@/lib/automation/storage/repository";
import { getAutomationEngineDiagnostics } from "@/lib/automation/storage/queries";
import { getIntegrationsDiagnostics } from "@/lib/integrations/simulation";
import { getIntegrationRuntimeDiagnostics } from "@/lib/integrations/execution/health";
import { getIntegrationSecretsDiagnostics } from "@/lib/integrations/secrets/health";
import { getPredictiveDiagnosticsSnapshot } from "@/lib/predictive/cache";
import { getConnectorsDiagnosticsSnapshot } from "@/lib/connectors/health";
import { getApiDiagnosticsSnapshot } from "@/lib/api/diagnostics";
import { getWhiteLabelDiagnosticsSnapshot } from "@/lib/white-label/queries";
import { getBillingDiagnosticsSnapshot } from "@/lib/billing/diagnostics";
import { getComplianceDiagnosticsSnapshot } from "@/lib/compliance/diagnostics";
import { computeProductionReadiness } from "@/lib/diagnostics/production-readiness";
import { getDeploymentReadinessSnapshot } from "@/lib/diagnostics/deployment-readiness";
import { getAbuseProtectionSnapshot } from "@/lib/diagnostics/abuse-protection";
import { getRevenueReadinessSnapshot } from "@/lib/diagnostics/revenue-readiness";
import { getAcquisitionReadinessSnapshot } from "@/lib/diagnostics/acquisition-readiness";
import { getFirstCustomerReadinessSnapshot } from "@/lib/diagnostics/first-customer-readiness";
import { getLaunchCandidateReadinessSnapshot } from "@/lib/diagnostics/launch-candidate-readiness";
import { getGoLiveReadinessSnapshot } from "@/lib/diagnostics/go-live-readiness";
import { getSecurityReadinessSnapshot } from "@/lib/diagnostics/security-readiness";
import { getLaunchPolishSnapshot } from "@/lib/diagnostics/launch-polish";
import { getPilotExecutionReadinessSnapshot } from "@/lib/diagnostics/pilot-execution-readiness";
import { getPilotAcquisitionSnapshot } from "@/lib/diagnostics/pilot-acquisition";
import { getStripeStagingReadiness } from "@/lib/diagnostics/stripe-staging";
import { getCronDiagnosticsSnapshot } from "@/lib/jobs/health";
import { getQueueDiagnosticsSnapshot } from "@/lib/queue/health";
import { getStripeWebhookDiagnostics } from "@/lib/stripe/idempotency";
import {
  checkDatabaseHealth,
  checkStripeHealth,
  getBuildInfo,
} from "@/lib/diagnostics/platform-health";
import { getOrganizationSubscription } from "@/lib/billing/queries";
import type { WorkspaceDiagnostics } from "@/lib/diagnostics/types";
import { getStripeEnvDiagnostics } from "@/lib/diagnostics/stripe-env";
import {
  getMinimumPlanForFeature,
  getRequiredPlanLabel,
  isFeatureEnabled,
} from "@/lib/plans/features";
import { getDevForcePlanOverride, isDevForcePlanConfigured } from "@/lib/plans/dev-override";
import { getOrganizationPlanContextForSession } from "@/lib/plans/queries";
import type { PlanFeatureKey } from "@/lib/plans/types";
import { checkPlanFeatureForSession } from "@/lib/plans/guards";
import { canCreateReport } from "@/lib/reports/guards";
import { canAccessSettings } from "@/lib/rbac/permissions";
import type { SessionContext } from "@/lib/tenancy/context";

const FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  reports: "Reports",
  pdf_export: "PDF export",
  customer_portal: "Customer portal",
  activity_feed: "Activity feed",
  report_templates: "Report templates",
  report_scheduling: "Report scheduling",
  email_delivery: "Email delivery",
  notifications: "Notifications",
  white_label: "White label",
  profitability: "Profitability",
  risks: "Risks",
  incidents: "Incidents",
  sla_tracking: "SLA tracking",
  escalation_rules: "Escalation rules",
  automation_engine: "Automation engine",
  future_api_webhooks: "API / webhooks",
  priority_support: "Priority support",
  ai_report_assistant: "AI report assistant",
  ai_client_success: "AI client success",
  ai_client_analysis: "AI client analysis",
  ai_risk_assistant: "AI risk assistant",
  ai_incident_assistant: "AI incident assistant",
  ai_automation_builder: "AI automation builder",
  ai_workflow_translation: "AI workflow translation",
  ai_knowledge_search: "AI knowledge search",
  ai_knowledge_generation: "AI knowledge generation",
  ai_playbook_generation: "AI playbook generation",
  ai_predictive_intelligence: "Predictive intelligence",
};

function listFeatureKeys(): PlanFeatureKey[] {
  return Object.keys(FEATURE_LABELS) as PlanFeatureKey[];
}

/** Owner/admin workspace diagnostics — server-side only. */
export async function getWorkspaceDiagnostics(
  session: SessionContext,
): Promise<WorkspaceDiagnostics> {
  const [plan, subscription, aiAccess] = await Promise.all([
    getOrganizationPlanContextForSession(session),
    getOrganizationSubscription(session),
    checkPlanFeatureForSession(session, "ai_report_assistant"),
  ]);

  const [usageSummary, aiDiagnostics, databaseHealth, automationDiagnostics, automationEngine, integrationsDiagnostics, integrationRuntimeDiagnostics, predictiveDiagnostics, connectorsDiagnostics, publicApiDiagnostics, whiteLabelDiagnostics, billingDiagnostics, complianceDiagnostics, secretsDiagnostics, stripeWebhookDiagnostics, cronDiagnostics, queueDiagnostics, stripeStagingDiagnostics] =
    await Promise.all([
    getAIUsageSummaryForSession(session, plan.planKey),
    getAIDiagnosticsSnapshot(session, plan.planKey),
    checkDatabaseHealth(),
    getAutomationRepositoryDiagnostics(session),
    getAutomationEngineDiagnostics({
      organizationId: session.organization.id,
      userId: session.user.id,
    }),
    Promise.resolve(getIntegrationsDiagnostics()),
    getIntegrationRuntimeDiagnostics(session.organization.id),
    getPredictiveDiagnosticsSnapshot(),
    getConnectorsDiagnosticsSnapshot(session),
    getApiDiagnosticsSnapshot(session),
    getWhiteLabelDiagnosticsSnapshot(session),
    getBillingDiagnosticsSnapshot(session),
    getComplianceDiagnosticsSnapshot(session),
    getIntegrationSecretsDiagnostics(session),
    getStripeWebhookDiagnostics(),
    getCronDiagnosticsSnapshot(),
    getQueueDiagnosticsSnapshot(),
    getStripeStagingReadiness(session),
  ]);
  const stripeEnv = getStripeEnvDiagnostics();
  const buildInfo = getBuildInfo();
  const stripeHealth = checkStripeHealth(stripeEnv);

  const enabledFeatures = listFeatureKeys().map((key) => ({
    key,
    enabled: isFeatureEnabled(plan.planKey, key),
  }));

  const lockedFeatures = listFeatureKeys()
    .filter((feature) => !isFeatureEnabled(plan.planKey, feature))
    .map((feature) => ({
      feature,
      label: FEATURE_LABELS[feature],
      requiredPlan: getMinimumPlanForFeature(feature),
      requiredPlanLabel: getRequiredPlanLabel(feature),
    }));

  const matchedPlanFromSubscriptionPriceId = subscription?.stripe_price_id
    ? getPlanKeyByPriceId(subscription.stripe_price_id)
    : null;

  const permissions: WorkspaceDiagnostics["permissions"] = {
    canAccessSettings: canAccessSettings(session.role),
    canCreateReport: canCreateReport(session),
    canUseAiReportAssistant: aiAccess.allowed,
    canUseReportTemplates: isFeatureEnabled(plan.planKey, "report_templates"),
    canUseReportSchedules: isFeatureEnabled(plan.planKey, "report_scheduling"),
    canUseEmailDelivery: isFeatureEnabled(plan.planKey, "email_delivery"),
    canUseRisks: isFeatureEnabled(plan.planKey, "risks"),
    canUseIncidents: isFeatureEnabled(plan.planKey, "incidents"),
    canUseProfitability: isFeatureEnabled(plan.planKey, "profitability"),
    canUseWhiteLabel: isFeatureEnabled(plan.planKey, "white_label"),
    canUseNotifications: isFeatureEnabled(plan.planKey, "notifications"),
  };

  const baseDiagnostics: Omit<
    WorkspaceDiagnostics,
    | "productionReadiness"
    | "launchPolish"
    | "pilotAcquisition"
    | "deploymentReadiness"
    | "pilotExecution"
    | "goLive"
    | "securityReadiness"
    | "abuseProtection"
    | "revenueReadiness"
    | "acquisitionReadiness"
    | "firstCustomerReadiness"
    | "launchCandidateReadiness"
  > = {
    organization: {
      name: session.organization.name,
      organizationId: session.organization.id,
      slug: session.organization.slug,
      userId: session.user.id,
      userRole: session.role,
      userEmail: session.email,
    },
    plan,
    enabledFeatures,
    lockedFeatures,
    subscription: {
      exists: subscription !== null,
      row: subscription,
      missingMessage: subscription
        ? null
        : "No subscription row found. This organization resolves to Starter fallback.",
    },
    stripeEnv,
    matchedPlanFromSubscriptionPriceId,
    ai: {
      aiProviderEnv: aiDiagnostics.providerEnv,
      openaiApiKeyPresent: aiDiagnostics.openaiApiKeyPresent,
      openaiModel: aiDiagnostics.openaiModel,
      resolvedProviderId: aiDiagnostics.resolvedProviderId,
      aiFeatureAllowed: aiAccess.allowed,
      usageSummary,
      diagnostics: aiDiagnostics,
    },
    automation: {
      ...automationDiagnostics,
      engine: automationEngine,
    },
    integrations: integrationsDiagnostics,
    integrationRuntime: integrationRuntimeDiagnostics,
    predictive: predictiveDiagnostics,
    connectors: connectorsDiagnostics,
    publicApi: publicApiDiagnostics,
    whiteLabel: whiteLabelDiagnostics,
    billing: billingDiagnostics,
    compliance: complianceDiagnostics,
    secrets: secretsDiagnostics,
    stripeWebhook: stripeWebhookDiagnostics,
    cron: cronDiagnostics,
    queue: queueDiagnostics,
    stripeStaging: stripeStagingDiagnostics,
    platform: {
      buildVersion: buildInfo.version,
      environment: buildInfo.environment,
      nodeEnv: buildInfo.nodeEnv,
      deploymentUrl: buildInfo.deploymentUrl,
      databaseHealth,
      stripeHealth,
      cacheEnabled: true,
      planSource: plan.planSource,
      developerMode: process.env.NODE_ENV !== "production",
    },
    permissions,
    devForcePlanEnvPresent: isDevForcePlanConfigured(),
    devForcePlanValue: getDevForcePlanOverride(),
    isDevelopment: process.env.NODE_ENV !== "production",
  };

  const launchPolish = getLaunchPolishSnapshot();
  const pilotAcquisition = getPilotAcquisitionSnapshot();
  const deploymentReadiness = getDeploymentReadinessSnapshot();
  const pilotExecution = getPilotExecutionReadinessSnapshot();
  const goLive = getGoLiveReadinessSnapshot();
  const securityReadiness = getSecurityReadinessSnapshot();
  const abuseProtection = getAbuseProtectionSnapshot();
  const revenueReadiness = await getRevenueReadinessSnapshot();
  const acquisitionReadiness = await getAcquisitionReadinessSnapshot();
  const firstCustomerReadiness = await getFirstCustomerReadinessSnapshot();
  const launchCandidateReadiness = await getLaunchCandidateReadinessSnapshot();

  return {
    ...baseDiagnostics,
    launchPolish,
    pilotAcquisition,
    deploymentReadiness,
    pilotExecution,
    goLive,
    securityReadiness,
    abuseProtection,
    revenueReadiness,
    acquisitionReadiness,
    firstCustomerReadiness,
    launchCandidateReadiness,
    productionReadiness: computeProductionReadiness({
      ...baseDiagnostics,
      productionReadiness: {
        overallScore: 0,
        label: "Not Ready",
        stripeReadiness: 0,
        cronReadiness: 0,
        queueReadiness: 0,
        oauthReadiness: 0,
        connectorReadiness: 0,
        billingReadiness: 0,
        apiReadiness: 0,
        complianceReadiness: 0,
        aiReadiness: 0,
        predictiveReadiness: 0,
        launchPolishReadiness: 0,
        pilotAcquisitionReadiness: 0,
        deploymentReadiness: 0,
        pilotExecutionReadiness: 0,
        goLiveReadiness: 0,
      },
      launchPolish,
      pilotAcquisition,
      deploymentReadiness,
      pilotExecution,
      goLive,
      securityReadiness,
      abuseProtection,
      revenueReadiness,
      acquisitionReadiness,
      firstCustomerReadiness,
      launchCandidateReadiness,
      stripeStaging: stripeStagingDiagnostics,
    }),
  };
}

export function formatPlanFeatureValue(
  feature: PlanFeatureKey,
  enabled: boolean | string,
): string {
  if (typeof enabled === "string") {
    return enabled;
  }

  return enabled ? "Enabled" : "Locked";
}

export function getPlanFeatureLabel(feature: PlanFeatureKey): string {
  return FEATURE_LABELS[feature];
}

export function getMatchedPlanLabel(planKey: PlanKey | null): string {
  if (!planKey) {
    return "No matching plan";
  }

  return getPlanByKey(planKey).name;
}
