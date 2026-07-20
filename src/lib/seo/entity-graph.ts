import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import { resolveCanonicalBaseUrl } from "@/lib/company/company-seo";
import {
  FEATURE_ROUTES,
  MARKETING_ROUTES,
  SOLUTION_ROUTES,
} from "@/lib/company/company-links";

/** Canonical @id fragments for the Auroranexis knowledge graph. */
export const ENTITY_FRAGMENTS = {
  organization: "#organization",
  website: "#website",
  softwareApplication: "#software-application",
  product: "#product",
} as const;

export function entityId(fragment: string): string {
  const base = resolveCanonicalBaseUrl();
  const normalized = fragment.startsWith("#") ? fragment : `#${fragment}`;
  return `${base}${normalized}`;
}

export const GRAPH_ENTITY_IDS = {
  organization: entityId(ENTITY_FRAGMENTS.organization),
  website: entityId(ENTITY_FRAGMENTS.website),
  softwareApplication: entityId(ENTITY_FRAGMENTS.softwareApplication),
  product: entityId(ENTITY_FRAGMENTS.product),
} as const;

/** Canonical product capabilities — single source for knowsAbout and AI citation. */
export const CANONICAL_CAPABILITIES = [
  {
    id: "ai-operations-platform",
    name: "AI Operations Platform",
    description:
      "A B2B SaaS workspace for multi-client operators to monitor delivery, automate workflows, and report client outcomes.",
    path: MARKETING_ROUTES.features,
  },
  {
    id: "executive-reporting",
    name: "Executive Reporting",
    description:
      "Structured executive summaries and client reports derived from verified operational data.",
    path: FEATURE_ROUTES.aiExecutiveReports,
  },
  {
    id: "client-portal",
    name: "Client Portal",
    description:
      "Secure client-facing workspace for published reports, status updates, and delivery transparency.",
    path: FEATURE_ROUTES.clientPortal,
  },
  {
    id: "automation",
    name: "Automation",
    description:
      "Trigger-based workflows with organization-scoped execution history for repeatable operations.",
    path: FEATURE_ROUTES.automation,
  },
  {
    id: "monitoring",
    name: "Monitoring",
    description:
      "Portfolio health, SLA breaches, connector sync status, and automation execution visibility.",
    path: FEATURE_ROUTES.monitoring,
  },
  {
    id: "risk-management",
    name: "Risk Management",
    description:
      "Operational risk registers with ownership, mitigation tracking, and audit-ready history.",
    path: FEATURE_ROUTES.riskIntelligence,
  },
  {
    id: "incident-management",
    name: "Incident Management",
    description:
      "Client-impacting incident tracking with SLA awareness and resolution workflows.",
    path: FEATURE_ROUTES.incidents,
  },
  {
    id: "knowledge-base",
    name: "Knowledge Hub",
    description:
      "Organization-scoped operational knowledge for delivery teams and client context.",
    path: FEATURE_ROUTES.knowledgeBase,
  },
  {
    id: "ai-copilot",
    name: "AI Copilot",
    description:
      "Operational Q&A and structured summaries grounded in workspace data with human review before publication.",
    path: FEATURE_ROUTES.aiCopilot,
  },
  {
    id: "compliance",
    name: "Compliance",
    description:
      "GDPR-ready workflows, audit trails, and governance tooling without certification claims.",
    path: MARKETING_ROUTES.compliance,
  },
] as const;

export const CANONICAL_SOLUTIONS = [
  {
    id: "customer-health-score",
    name: "Customer Health Score",
    path: SOLUTION_ROUTES.customerHealthScore,
  },
  {
    id: "risk-management-solution",
    name: "Risk Management",
    path: SOLUTION_ROUTES.riskManagement,
  },
  {
    id: "incident-management-solution",
    name: "Incident Management",
    path: SOLUTION_ROUTES.incidentManagement,
  },
  {
    id: "sla-management",
    name: "SLA Management",
    path: SOLUTION_ROUTES.slaManagement,
  },
  {
    id: "executive-dashboard",
    name: "Executive Dashboard",
    path: SOLUTION_ROUTES.executiveDashboard,
  },
  {
    id: "ai-reporting",
    name: "AI Reporting",
    path: SOLUTION_ROUTES.aiReporting,
  },
] as const;

export function capabilityKnowsAbout(): string[] {
  return CANONICAL_CAPABILITIES.map((item) => item.name);
}

export function productSummary(): string {
  return COMPANY_INFORMATION.shortDescription;
}

export function pageEntityId(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return entityId(normalized);
}
