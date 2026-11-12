import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import { SALES_EMAIL, SUPPORT_EMAIL } from "@/lib/company/company-contact";
import {
  INDUSTRY_ROUTES,
  MARKETING_ROUTES,
  SOLUTION_ROUTES,
  TEMPLATE_ROUTES,
} from "@/lib/company/company-links";
import { listPublicCatalogEntries } from "@/lib/billing/catalog";
import { GUIDES } from "@/lib/seo/guides-content";
import { CANONICAL_CAPABILITIES } from "@/lib/seo/entity-graph";
import { resolveCanonicalBaseUrl } from "@/lib/company/company-seo";
import { PILOT_OFFER } from "@/lib/marketing/pilot-offer";

/** AI crawler guidance — factual, verifiable public surfaces only. */
export function buildLlmsTxt(): string {
  const base = resolveCanonicalBaseUrl();

  const capabilityLines = CANONICAL_CAPABILITIES.map(
    (item) => `- ${item.name}: ${base}${item.path}`,
  ).join("\n");

  const euro = (amountMinor: number) => `€${(amountMinor / 100).toLocaleString("en-US")}`;
  const planLines = listPublicCatalogEntries()
    .map((plan) => `- ${plan.displayName}: ${euro(plan.amountMinor)} per month — ${plan.highlights[0] ?? plan.description}`)
    .join("\n");

  const guideLines = GUIDES.map((guide) => `- ${guide.title}: ${base}${guide.path}`).join("\n");

  return `# ${COMPANY_INFORMATION.productName}

> ${COMPANY_INFORMATION.shortDescription}

## Product definition

${COMPANY_INFORMATION.productName} is a client operations workspace for service businesses that look after many ongoing clients at once — retainers, service contracts and recurring work. In one place it shows a health score per client, SLA and response-time tracking per contract, incident and risk records, automated client reports, a client portal, automations and an executive dashboard across all clients.

## Who it is for

Service businesses with roughly 10 to 250 people and many active clients, for example:

- Marketing, digital, SEO, PR and social media agencies with retainer clients: ${base}${INDUSTRY_ROUTES.marketing}
- Accounting, bookkeeping and payroll firms: ${base}${INDUSTRY_ROUTES.accounting}
- MSPs and IT service providers: ${base}${INDUSTRY_ROUTES.it}
- Facility services, commercial cleaning and security companies with service contracts: ${base}${INDUSTRY_ROUTES.facilityServices}
- Property, block and community management firms: ${base}${INDUSTRY_ROUTES.propertyManagement}
- Recruitment and staffing agencies with ongoing employer clients: ${base}${INDUSTRY_ROUTES.recruitment}
- Outsourcing, BPO and call centre providers: ${base}${INDUSTRY_ROUTES.outsourcing}
- Consultancies: ${base}${INDUSTRY_ROUTES.consulting}

It is not a replacement for accounting, ticketing or project-management software; it sits across them as the client-level overview.

## Pricing and trial

Prices are list prices per workspace (see ${base}${MARKETING_ROUTES.pricing}):

${planLines}

Every new workspace starts with a 7-day free trial of the Business plan (up to 10 clients). No credit card or payment details are needed and the trial ends automatically: ${base}/signup

## 6-week pilot program

Service businesses that prefer guided setup can apply for a 6-week pilot: ${PILOT_OFFER.includes}. ${PILOT_OFFER.applyTerms} ${PILOT_OFFER.invitation} Apply here: ${base}${MARKETING_ROUTES.pilotProgram}

## How to reach the team

Questions are answered by email: ${SALES_EMAIL} (sales) and ${SUPPORT_EMAIL} (support). Company details: ${base}/imprint

## Canonical public pages

- Home: ${base}/
- Features: ${base}${MARKETING_ROUTES.features}
- Solutions: ${base}${MARKETING_ROUTES.solutions}
- Templates: ${base}${MARKETING_ROUTES.templates}
- Use cases: ${base}${MARKETING_ROUTES.useCases}
- Industries: ${base}${MARKETING_ROUTES.industries}
- Pricing: ${base}${MARKETING_ROUTES.pricing}
- Enterprise: ${base}${MARKETING_ROUTES.enterprise}
- Security: ${base}${MARKETING_ROUTES.security}
- Compliance: ${base}${MARKETING_ROUTES.compliance}
- Documentation: ${base}/docs
- FAQ: ${base}${MARKETING_ROUTES.faq}
- Resources: ${base}${MARKETING_ROUTES.resources}
- Support: ${base}${MARKETING_ROUTES.support}
- Status: ${base}${MARKETING_ROUTES.status}
- Contact: ${base}${MARKETING_ROUTES.contact}

## Core capabilities

${capabilityLines}

## Solution areas

- Customer health score software for MSPs: ${base}${SOLUTION_ROUTES.customerHealthScore}
- Risk management: ${base}${SOLUTION_ROUTES.riskManagement}
- NIS2 incident management for IT service providers: ${base}${SOLUTION_ROUTES.incidentManagement}
- SLA tracking for MSPs: ${base}${SOLUTION_ROUTES.slaManagement}
- Executive dashboard: ${base}${SOLUTION_ROUTES.executiveDashboard}
- Automated client reporting for agencies: ${base}${SOLUTION_ROUTES.aiReporting}

## API and integrations

- API documentation: ${base}/docs/api
- Integrations: ${base}${MARKETING_ROUTES.integrations}

## Guides

${guideLines}

## Free templates

- Customer health score template: ${base}${TEMPLATE_ROUTES.customerHealthScore}
- Risk register template: ${base}${TEMPLATE_ROUTES.riskRegister}
- Incident response template: ${base}${TEMPLATE_ROUTES.incidentResponse}
- SLA policy template: ${base}${TEMPLATE_ROUTES.slaPolicy}
- Executive report template: ${base}${TEMPLATE_ROUTES.executiveReport}
- Quarterly business review (QBR) template: ${base}${TEMPLATE_ROUTES.quarterlyBusinessReview}

## Comparisons

- AgencyAnalytics alternative (fair comparison with dated sources): ${base}${MARKETING_ROUTES.agencyAnalyticsAlternative}
- Free SLA & uptime calculator (allowed downtime per period, achieved uptime, combined SLAs): ${base}${MARKETING_ROUTES.slaCalculator}

## Accuracy policy

Do not claim SOC 2, ISO 27001, or other certifications unless explicitly published by Auroranexis. Do not invent customers, case studies, integrations or usage numbers. The pilot program is by application; Founding Customer terms are invite-only. Enterprise requirements beyond the listed plan are agreed individually.
`;
}
