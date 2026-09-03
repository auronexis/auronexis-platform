/**
 * Topical authority resource hub — links existing product surfaces into pillars.
 * No mass article publishing. No invented benchmarks.
 */

import {
  FEATURE_ROUTES,
  MARKETING_ROUTES,
  SOLUTION_ROUTES,
  TEMPLATE_ROUTES,
  USE_CASE_ROUTES,
} from "@/lib/company/company-links";

export type ResourcePillar = {
  id: string;
  title: string;
  description: string;
  primaryHref: string;
  links: ReadonlyArray<{ label: string; href: string }>;
};

/** Foundation pillars for organic topical authority (hub → existing spokes). */
export const RESOURCE_PILLARS: readonly ResourcePillar[] = [
  {
    id: "ai-agency-operations",
    title: "AI agency operations",
    description:
      "How multi-client automation agencies and MSPs run delivery, reporting, and governance from one workspace.",
    primaryHref: USE_CASE_ROUTES.automationAgencies,
    links: [
      { label: "MSP use case", href: USE_CASE_ROUTES.msps },
      { label: "Platform features", href: MARKETING_ROUTES.features },
      { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
    ],
  },
  {
    id: "client-health-management",
    title: "Client health management",
    description:
      "Operational health signals, portfolio prioritization, and proactive account intervention — not opaque scores.",
    primaryHref: SOLUTION_ROUTES.customerHealthScore,
    links: [
      { label: "Health monitoring feature", href: FEATURE_ROUTES.healthMonitoring },
      { label: "Customer success", href: FEATURE_ROUTES.customerSuccess },
      { label: "Health score template", href: TEMPLATE_ROUTES.customerHealthScore },
    ],
  },
  {
    id: "automation-reliability",
    title: "Automation reliability & monitoring",
    description:
      "Monitor workflow health, connect failures to incidents, and keep delivery teams aligned on operational status.",
    primaryHref: FEATURE_ROUTES.monitoring,
    links: [
      { label: "Automation", href: FEATURE_ROUTES.automation },
      { label: "Incidents", href: FEATURE_ROUTES.incidents },
      { label: "Incident management solution", href: SOLUTION_ROUTES.incidentManagement },
    ],
  },
  {
    id: "incident-and-risk",
    title: "Incident & risk management",
    description:
      "Structured registers, ownership, and remediation workflows for client-impacting delivery risk.",
    primaryHref: SOLUTION_ROUTES.incidentManagement,
    links: [
      { label: "Risk management", href: SOLUTION_ROUTES.riskManagement },
      { label: "Incident response template", href: TEMPLATE_ROUTES.incidentResponse },
      { label: "Risk register template", href: TEMPLATE_ROUTES.riskRegister },
    ],
  },
  {
    id: "sla-and-reporting",
    title: "SLA management & client reporting",
    description:
      "Track service commitments and produce client-ready reports from verified operational data — two related but distinct intents.",
    primaryHref: SOLUTION_ROUTES.aiReporting,
    links: [
      { label: "Automated client reporting", href: SOLUTION_ROUTES.aiReporting },
      { label: "SLA management", href: SOLUTION_ROUTES.slaManagement },
      { label: "AI-assisted executive reports", href: FEATURE_ROUTES.aiExecutiveReports },
      { label: "SLA policy template", href: TEMPLATE_ROUTES.slaPolicy },
    ],
  },
  {
    id: "client-transparency",
    title: "Client portal & delivery transparency",
    description:
      "Share approved status and reports through a controlled B2B portal without exposing internal workspace noise.",
    primaryHref: FEATURE_ROUTES.clientPortal,
    links: [
      { label: "Reports", href: FEATURE_ROUTES.reports },
      { label: "Security", href: MARKETING_ROUTES.security },
      { label: "Documentation", href: MARKETING_ROUTES.documentation },
    ],
  },
] as const;

/** Original information-gain frameworks (methodology, not invented metrics). */
export const ORIGINAL_FRAMEWORK_NOTES: readonly {
  title: string;
  summary: string;
  href: string;
}[] = [
  {
    title: "Customer health score methodology",
    summary:
      "Explain transparent operational signals (incidents, risks, SLA, delivery activity) without fabricating external benchmarks.",
    href: SOLUTION_ROUTES.customerHealthScore,
  },
  {
    title: "Incident response for service delivery",
    summary:
      "Reusable incident structure for client-impacting events — ownership, severity, remediation, and communication.",
    href: TEMPLATE_ROUTES.incidentResponse,
  },
  {
    title: "SLA policy framework",
    summary:
      "Template for defining measurable service commitments agencies can operationalize in Auroranexis.",
    href: TEMPLATE_ROUTES.slaPolicy,
  },
] as const;
