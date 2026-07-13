import { MARKETING_ROUTES, FEATURE_ROUTES, SOLUTION_ROUTES } from "@/lib/company/company-links";
import type { DocRelatedLink } from "@/lib/docs/types";

/** Maps documentation slugs to related public marketing surfaces for GEO cross-linking. */
const DOC_MARKETING_LINKS: Record<string, readonly DocRelatedLink[]> = {
  "getting-started": [
    { href: MARKETING_ROUTES.features, label: "Platform features" },
    { href: MARKETING_ROUTES.pricing, label: "Pricing" },
  ],
  clients: [
    { href: FEATURE_ROUTES.clientPortal, label: "Client portal" },
    { href: FEATURE_ROUTES.healthMonitoring, label: "Health monitoring" },
  ],
  reports: [
    { href: FEATURE_ROUTES.aiExecutiveReports, label: "AI executive reports" },
    { href: SOLUTION_ROUTES.aiReporting, label: "AI reporting solution" },
  ],
  risks: [
    { href: FEATURE_ROUTES.riskIntelligence, label: "Risk intelligence" },
    { href: SOLUTION_ROUTES.riskManagement, label: "Risk management solution" },
  ],
  incidents: [
    { href: FEATURE_ROUTES.incidents, label: "Incident management" },
    { href: SOLUTION_ROUTES.incidentManagement, label: "Incident solution" },
  ],
  monitoring: [
    { href: FEATURE_ROUTES.monitoring, label: "Monitoring" },
    { href: MARKETING_ROUTES.status, label: "Platform status" },
  ],
  sla: [
    { href: SOLUTION_ROUTES.slaManagement, label: "SLA management" },
  ],
  automation: [
    { href: FEATURE_ROUTES.automation, label: "Automation" },
    { href: MARKETING_ROUTES.integrations, label: "Integrations" },
  ],
  integrations: [
    { href: MARKETING_ROUTES.integrations, label: "Integration catalog" },
    { href: "/docs/api", label: "API reference" },
  ],
  "client-portal": [
    { href: FEATURE_ROUTES.clientPortal, label: "Client portal feature" },
  ],
  compliance: [
    { href: MARKETING_ROUTES.compliance, label: "Compliance readiness" },
    { href: MARKETING_ROUTES.security, label: "Security" },
  ],
  security: [
    { href: MARKETING_ROUTES.security, label: "Security practices" },
    { href: MARKETING_ROUTES.faq, label: "FAQ" },
  ],
  api: [
    { href: "/api/docs", label: "OpenAPI reference" },
    { href: MARKETING_ROUTES.integrations, label: "Integrations" },
  ],
  enterprise: [
    { href: MARKETING_ROUTES.enterprise, label: "Enterprise" },
    { href: MARKETING_ROUTES.contact, label: "Contact sales" },
  ],
};

export function getDocMarketingLinks(slug: string): readonly DocRelatedLink[] {
  return DOC_MARKETING_LINKS[slug] ?? [];
}
