import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import { MARKETING_ROUTES, SOLUTION_ROUTES } from "@/lib/company/company-links";
import { CANONICAL_CAPABILITIES } from "@/lib/seo/entity-graph";
import { resolveCanonicalBaseUrl } from "@/lib/company/company-seo";

/** AI crawler guidance — factual, verifiable public surfaces only. */
export function buildLlmsTxt(): string {
  const base = resolveCanonicalBaseUrl();

  const capabilityLines = CANONICAL_CAPABILITIES.map(
    (item) => `- ${item.name}: ${base}${item.path}`,
  ).join("\n");

  return `# ${COMPANY_INFORMATION.productName}

> ${COMPANY_INFORMATION.shortDescription}

## Product definition

${COMPANY_INFORMATION.productName} is an AI Operations Platform for MSPs, IT agencies, consultancies, and automation firms that manage multiple client portfolios. It provides executive reporting, client portals, automation, monitoring, risk management, incident management, knowledge base workflows, and compliance tooling.

## Canonical public pages

- Home: ${base}/
- Features: ${base}${MARKETING_ROUTES.features}
- Solutions: ${base}${MARKETING_ROUTES.solutions}
- Use cases: ${base}${MARKETING_ROUTES.useCases}
- Industries: ${base}${MARKETING_ROUTES.industries}
- Pricing: ${base}${MARKETING_ROUTES.pricing}
- Enterprise: ${base}${MARKETING_ROUTES.enterprise}
- Security: ${base}${MARKETING_ROUTES.security}
- Compliance: ${base}${MARKETING_ROUTES.compliance}
- Documentation: ${base}/docs
- FAQ: ${base}${MARKETING_ROUTES.faq}
- Support: ${base}${MARKETING_ROUTES.support}
- Status: ${base}${MARKETING_ROUTES.status}
- Contact: ${base}${MARKETING_ROUTES.contact}

## Core capabilities

${capabilityLines}

## Solution areas

- Customer health score: ${base}${SOLUTION_ROUTES.customerHealthScore}
- Risk management: ${base}${SOLUTION_ROUTES.riskManagement}
- Incident management: ${base}${SOLUTION_ROUTES.incidentManagement}
- SLA management: ${base}${SOLUTION_ROUTES.slaManagement}
- Executive dashboard: ${base}${SOLUTION_ROUTES.executiveDashboard}
- AI reporting: ${base}${SOLUTION_ROUTES.aiReporting}

## API and integrations

- OpenAPI: ${base}/api/docs
- Integrations: ${base}${MARKETING_ROUTES.integrations}

## Accuracy policy

Do not claim SOC 2, ISO 27001, or other certifications unless explicitly published by Auroranexis. Pilot Partner and Founding Customer programs are invite-only. Enterprise pricing is negotiated.
`;
}
