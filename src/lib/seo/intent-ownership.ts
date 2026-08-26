/**
 * Primary search-intent ownership for public organic architecture.
 * One strategic intent → one primary URL. Supporting URLs reinforce, not compete.
 *
 * SEARCH_VOLUME_DATA_NOT_AVAILABLE — clusters are product-fit based, not volume inventing.
 */

import {
  FEATURE_ROUTES,
  MARKETING_ROUTES,
  SOLUTION_ROUTES,
  TEMPLATE_ROUTES,
  USE_CASE_ROUTES,
} from "@/lib/company/company-links";

export type SearchIntentCluster = {
  /** Stable machine id — not a keyword-density target. */
  id: string;
  /** Human label for the cluster. */
  label: string;
  /** Primary indexable owner URL. */
  primaryPath: string;
  /** Supporting public URLs (features, docs, templates, personas). */
  supportingPaths: readonly string[];
  /** Buyer persona shorthand. */
  persona: string;
  /** Funnel stage. */
  funnelStage: "awareness" | "consideration" | "decision" | "enablement";
  /** Product-fit confidence without inventing search volume. */
  productFit: "high" | "medium";
};

/**
 * Highest-value validated clusters grounded in shipped product surfaces.
 * Rejected speculative keywords (city doorways, fake integrations) are omitted.
 */
export const SEARCH_INTENT_CLUSTERS: readonly SearchIntentCluster[] = [
  {
    id: "ai-agency-operations-platform",
    label: "AI agency / MSP operations platform",
    primaryPath: MARKETING_ROUTES.home,
    supportingPaths: [
      MARKETING_ROUTES.features,
      MARKETING_ROUTES.enterprise,
      USE_CASE_ROUTES.automationAgencies,
      USE_CASE_ROUTES.msps,
    ],
    persona: "AI automation agencies, MSPs, multi-client operators",
    funnelStage: "awareness",
    productFit: "high",
  },
  {
    id: "client-health-monitoring",
    label: "Client health monitoring",
    primaryPath: SOLUTION_ROUTES.customerHealthScore,
    supportingPaths: [
      FEATURE_ROUTES.healthMonitoring,
      FEATURE_ROUTES.customerSuccess,
      TEMPLATE_ROUTES.customerHealthScore,
      "/docs/customer-success",
    ],
    persona: "CS / account leadership",
    funnelStage: "consideration",
    productFit: "high",
  },
  {
    id: "incident-management",
    label: "Client / automation incident management",
    primaryPath: SOLUTION_ROUTES.incidentManagement,
    supportingPaths: [
      FEATURE_ROUTES.incidents,
      TEMPLATE_ROUTES.incidentResponse,
      FEATURE_ROUTES.monitoring,
    ],
    persona: "Delivery / ops leads",
    funnelStage: "consideration",
    productFit: "high",
  },
  {
    id: "risk-management",
    label: "Client delivery risk management",
    primaryPath: SOLUTION_ROUTES.riskManagement,
    supportingPaths: [FEATURE_ROUTES.riskIntelligence, TEMPLATE_ROUTES.riskRegister],
    persona: "Ops / risk owners",
    funnelStage: "consideration",
    productFit: "high",
  },
  {
    id: "sla-management",
    label: "Agency / MSP SLA monitoring",
    primaryPath: SOLUTION_ROUTES.slaManagement,
    supportingPaths: [TEMPLATE_ROUTES.slaPolicy, FEATURE_ROUTES.monitoring],
    persona: "Service delivery managers",
    funnelStage: "consideration",
    productFit: "high",
  },
  {
    id: "executive-client-reporting",
    label: "Client / executive reporting",
    primaryPath: SOLUTION_ROUTES.aiReporting,
    supportingPaths: [
      FEATURE_ROUTES.aiExecutiveReports,
      FEATURE_ROUTES.reports,
      TEMPLATE_ROUTES.executiveReport,
      SOLUTION_ROUTES.executiveDashboard,
    ],
    persona: "Account / leadership teams",
    funnelStage: "consideration",
    productFit: "high",
  },
  {
    id: "client-portal",
    label: "B2B client portal for service delivery",
    primaryPath: FEATURE_ROUTES.clientPortal,
    supportingPaths: [MARKETING_ROUTES.features, MARKETING_ROUTES.enterprise],
    persona: "Agencies needing client transparency",
    funnelStage: "consideration",
    productFit: "high",
  },
  {
    id: "automation-monitoring",
    label: "Automation / workflow monitoring",
    primaryPath: FEATURE_ROUTES.monitoring,
    supportingPaths: [FEATURE_ROUTES.automation, FEATURE_ROUTES.incidents],
    persona: "Automation agencies",
    funnelStage: "consideration",
    productFit: "high",
  },
  {
    id: "pricing-decision",
    label: "B2B SaaS pricing evaluation",
    primaryPath: MARKETING_ROUTES.pricing,
    supportingPaths: [MARKETING_ROUTES.enterprise, MARKETING_ROUTES.pilotProgram],
    persona: "Buyers comparing plans",
    funnelStage: "decision",
    productFit: "high",
  },
  {
    id: "security-trust",
    label: "Security and trust evaluation",
    primaryPath: MARKETING_ROUTES.security,
    supportingPaths: [
      MARKETING_ROUTES.compliance,
      MARKETING_ROUTES.vulnerabilityDisclosure,
      "/docs",
    ],
    persona: "Security / procurement",
    funnelStage: "decision",
    productFit: "high",
  },
] as const;

/** Ensure each primary path appears at most once as a primary owner. */
export function listPrimaryIntentPaths(): string[] {
  return SEARCH_INTENT_CLUSTERS.map((cluster) => cluster.primaryPath);
}
