import {
  LEGAL_ROUTES,
  MARKETING_ROUTES,
  PUBLIC_SITEMAP_ROUTES,
  SOLUTION_ROUTES,
  TEMPLATE_ROUTES,
} from "@/lib/company/company-links";
import { AUDIENCE_PAGES } from "@/lib/seo/audience-content";
import { DOC_PAGES } from "@/lib/docs/registry";
import { FEATURE_PAGES } from "@/lib/seo/feature-content";
import { INDUSTRY_PAGES } from "@/lib/seo/industry-content";
import { SOLUTION_PAGES, TEMPLATE_PAGES } from "@/lib/seo/landing-content";
import type { LandingPageContent } from "@/lib/seo/landing-page-types";

export {
  PRIVATE_ROUTE_PREFIXES,
  NOINDEX_ROUTES,
  isPrivateRoute,
} from "@/lib/seo/private-routes";

export { PUBLIC_SITEMAP_ROUTES, SOLUTION_ROUTES, TEMPLATE_ROUTES };

export type PublicSitemapRoute = (typeof PUBLIC_SITEMAP_ROUTES)[number];

function buildRegistrySeo(pages: Record<string, LandingPageContent>): Record<string, { title: string; description: string }> {
  const entries: Record<string, { title: string; description: string }> = {};
  for (const page of Object.values(pages)) {
    entries[page.path] = { title: page.title, description: page.metaDescription };
  }
  return entries;
}

function buildDocPageSeo(): Record<string, { title: string; description: string }> {
  const entries: Record<string, { title: string; description: string }> = {};
  for (const doc of DOC_PAGES) {
    entries[`/docs/${doc.slug}`] = { title: doc.title, description: doc.description };
  }
  return entries;
}

function buildLandingPageSeo(): Record<string, { title: string; description: string }> {
  const entries: Record<string, { title: string; description: string }> = {};

  for (const page of Object.values(SOLUTION_PAGES)) {
    entries[page.path] = { title: page.title, description: page.metaDescription };
  }

  for (const page of Object.values(TEMPLATE_PAGES)) {
    entries[page.path] = { title: page.title, description: page.metaDescription };
  }

  return {
    ...entries,
    ...buildRegistrySeo(FEATURE_PAGES),
    ...buildRegistrySeo(AUDIENCE_PAGES),
    ...buildRegistrySeo(INDUSTRY_PAGES),
  };
}

const STATIC_PAGE_SEO: Record<string, { title: string; description: string }> = {
  [MARKETING_ROUTES.home]: {
    title: "MSP & Agency Client Operations Software",
    description:
      "Client health, SLA, incidents, and reporting for multi-client MSPs and agencies — one operations workspace for portfolio delivery, not a generic CRM.",
  },
  [MARKETING_ROUTES.features]: {
    title: "Client Operations Features for Agencies & MSPs",
    description:
      "Explore Auroranexis capabilities for multi-client delivery — reporting, automation, monitoring, risk, incidents, client portal, and executive intelligence.",
  },
  [MARKETING_ROUTES.solutions]: {
    title: "Operational Solutions for Multi-Client Delivery",
    description:
      "Solution pages for customer health, risk, incidents, SLA tracking, executive dashboards, and automated client reporting for agencies and MSPs.",
  },
  [MARKETING_ROUTES.templates]: {
    title: "Operational Templates for Service Delivery Teams",
    description:
      "Free agency templates for customer health scores, risk registers, incident response, SLA policies, and executive reporting frameworks.",
  },
  [MARKETING_ROUTES.useCases]: {
    title: "Use Cases for Agencies, MSPs & Automation Firms",
    description:
      "Persona-focused workflows for MSPs, automation agencies, consultancies, and multi-client teams using Auroranexis for health, risk, incidents, and reporting.",
  },
  [MARKETING_ROUTES.industries]: {
    title: "Industry Client Operations for Service Providers",
    description:
      "Sector-specific client operations guidance for marketing, IT, finance, healthcare, legal, and technology service providers.",
  },
  [MARKETING_ROUTES.resources]: {
    title: "Resources for AI Agency & MSP Operations",
    description:
      "Topical resource pillars connecting Auroranexis features, solutions, and templates for client health, incidents, SLA, monitoring, and reporting.",
  },
  [MARKETING_ROUTES.faq]: {
    title: "FAQ for Auroranexis Buyers & Operators",
    description:
      "Frequently asked questions about Auroranexis — billing, security, AI, client portal, reports, integrations, and enterprise plans.",
  },
  [MARKETING_ROUTES.pricing]: {
    title: "MSP & Agency Operations Pricing (EUR)",
    description:
      "Professional from €179/mo, Business €599/mo, Enterprise €1,799+/mo — MSP and agency client operations. Tax confirmed from billing context at checkout.",
  },
  [MARKETING_ROUTES.enterprise]: {
    title: "Enterprise Client Operations for MSPs & Agencies",
    description:
      "Enterprise-grade client operations for MSPs and agencies — security, scale, AI copilot, and dedicated support.",
  },
  [MARKETING_ROUTES.security]: {
    title: "Security & Trust for Agency Operations Software",
    description:
      "Encryption, role-based access, audit logging, and responsible disclosure for MSP and agency operations software — without inventing SOC 2 or ISO certifications.",
  },
  [MARKETING_ROUTES.vulnerabilityDisclosure]: {
    title: "Vulnerability Disclosure Policy",
    description:
      "How to report security vulnerabilities to Auroranexis in good faith, including scope, prohibited testing, and response targets.",
  },
  [MARKETING_ROUTES.compliance]: {
    title: "Compliance Workflows for Client Operations",
    description:
      "Compliance workflows, audit trails, and governance capabilities for agencies managing regulated client operations.",
  },
  [MARKETING_ROUTES.integrations]: {
    title: "Integrations for Agency Operations Platforms",
    description:
      "Connect Auroranexis with Slack, email, REST API, webhooks, and AI providers for agency operations.",
  },
  [MARKETING_ROUTES.contact]: {
    title: "Contact Auroranexis Sales, Support, and Security",
    description:
      "Contact Auroranexis for sales, support, and security inquiries. Use this page for agency and MSP operations questions — not the authenticated workspace.",
  },
  [MARKETING_ROUTES.pilotProgram]: {
    title: "Pilot Partner Program",
    description:
      "Invite-only Pilot Partner program for qualified MSPs and agencies evaluating Auroranexis.",
  },
  [MARKETING_ROUTES.status]: {
    title: "Platform Status",
    description: "Current operational status and availability of the Auroranexis platform.",
  },
  [MARKETING_ROUTES.about]: {
    title: "About Agency Operations Platform",
    description:
      "About Auroranexis: a B2B operations platform for AI automation agencies and MSPs covering client health, risk, incidents, reporting, and delivery transparency.",
  },
  [MARKETING_ROUTES.careers]: {
    title: "Careers",
    description:
      "Careers at Auroranexis — build enterprise operations software for agencies and managed service providers.",
  },
  [MARKETING_ROUTES.help]: {
    title: "Help Center for Auroranexis Workspace Users",
    description:
      "Help resources for signed-in Auroranexis customers — documentation, support, and platform guidance. Distinct from the public docs hub.",
  },
  [MARKETING_ROUTES.support]: {
    title: "Customer Support for Auroranexis Workspaces",
    description:
      "Customer support options for Auroranexis workspace users — documentation, status, and contact routes.",
  },
  [LEGAL_ROUTES.privacy]: {
    title: "Privacy Policy",
    description: "How Auroranexis AI Solutions processes personal data on the B2B SaaS platform.",
  },
  [LEGAL_ROUTES.terms]: {
    title: "Terms of Service",
    description: "General Terms and Conditions for business use of the Auroranexis B2B SaaS platform.",
  },
  [LEGAL_ROUTES.cookies]: {
    title: "Cookie Policy",
    description: "Cookies, local storage, analytics tools, and consent on the Auroranexis platform.",
  },
  [LEGAL_ROUTES.imprint]: {
    title: "Imprint",
    description: "Provider identification under German digital services law for Auroranexis.",
  },
  [LEGAL_ROUTES.dataProcessingAgreement]: {
    title: "Data Processing Agreement",
    description: "Standard GDPR Article 28 data processing terms for Auroranexis business customers.",
  },
  [LEGAL_ROUTES.securityPolicy]: {
    title: "Security Policy",
    description: "Security practices and responsible disclosure for the Auroranexis platform.",
  },
  [LEGAL_ROUTES.subprocessors]: {
    title: "Sub-processors",
    description: "Third-party processors engaged by Auroranexis AI Solutions.",
  },
  [LEGAL_ROUTES.acceptableUse]: {
    title: "Acceptable Use Policy",
    description: "Rules governing lawful and secure use of the Auroranexis B2B SaaS platform.",
  },
  [LEGAL_ROUTES.refundPolicy]: {
    title: "Refund and Cancellation Policy",
    description:
      "Refund and cancellation rules for Auroranexis subscriptions. Payments are processed via Mollie. Cancellation is distinct from a refund.",
  },
  "/docs": {
    title: "Documentation Hub",
    description: "Auroranexis documentation hub for product guides, API reference, and release notes.",
  },
  "/docs/release-notes": {
    title: "Release Notes",
    description: "Auroranexis product release notes and platform updates.",
  },
  "/login": {
    title: "Sign in",
    description: "Sign in to your Auroranexis workspace.",
  },
  "/signup": {
    title: "Sign up",
    description: "Create your Auroranexis workspace for agency and MSP operations.",
  },
  "/forgot-password": {
    title: "Forgot password",
    description: "Request a password reset link for your Auroranexis account.",
  },
  "/reset-password": {
    title: "Reset password",
    description: "Set a new password for your Auroranexis account.",
  },
};

/** Page-specific SEO titles and descriptions for public indexable routes. */
export const PAGE_SEO: Record<string, { title: string; description: string }> = {
  ...STATIC_PAGE_SEO,
  ...buildDocPageSeo(),
  ...buildLandingPageSeo(),
  "/features/ai-executive-reports": {
    title: "AI Executive Leadership Reports",
    description:
      "AI-assisted leadership briefings from incidents, risks, and SLA data, with reviewer validation. Automated client reporting lives on the solution page.",
  },
  "/features/profitability": {
    title: "Portfolio Profitability Reporting",
    description:
      "Portfolio profitability reporting for agencies and MSPs: delivery effort, margin context, and operational signals — not a replacement accounting system.",
  },
  "/features/reports": {
    title: "Report Templates & Publish Flows",
    description:
      "How Auroranexis reports work: templates, schedules, generate-and-review, PDF export, and portal publication. Outcome page: automated client reporting.",
  },
  "/industries/consulting": {
    title: "Consulting Engagement Governance",
    description:
      "Professional services industry operations — engagement governance, client health, and executive reporting in Auroranexis.",
  },
  "/industries/cybersecurity": {
    title: "Cybersecurity Provider Operations",
    description:
      "Cybersecurity operations platform — incident tracking, risk registers, SLA management, and client reporting for MSSPs and security firms in Auroranexis.",
  },
  "/industries/finance": {
    title: "Financial Services Client Ops",
    description:
      "Financial services operations platform — client health, incident management, risk tracking, and SLA governance for fintech and B2B service providers in Auroranexis.",
  },
  "/industries/healthcare": {
    title: "Healthcare Delivery Operations",
    description:
      "Healthcare operations platform — incident management, risk tracking, SLA governance, and client reporting for health tech and service providers in Auroranexis.",
  },
  "/industries/it": {
    title: "IT Services Portfolio Governance",
    description:
      "IT services industry operations — SLA governance, incident records, and portfolio oversight for service providers in Auroranexis.",
  },
  "/industries/legal": {
    title: "Legal Services Ops Governance",
    description:
      "Legal operations platform — client health, incident tracking, risk registers, and executive reporting for law firms and legal service providers in Auroranexis.",
  },
  "/industries/manufacturing": {
    title: "Manufacturing Delivery Operations",
    description:
      "Manufacturing operations platform — incident tracking, SLA governance, vendor oversight, and executive reporting for industrial organizations in Auroranexis.",
  },
  "/industries/marketing": {
    title: "Marketing Sector Client Operations",
    description:
      "Marketing sector operations platform — portfolio governance for agencies and in-house brand teams with Auroranexis.",
  },
  "/industries/technology": {
    title: "Technology & SaaS Client Operations",
    description:
      "Technology operations platform — customer health, incident tracking, SLA management, and executive reporting for SaaS and tech service providers in Auroranexis.",
  },
  "/solutions/ai-reporting": {
    title: "Automated Client Reporting Software",
    description:
      "Automated client reporting software for MSPs and agencies: templates, schedules, workspace data, PDF export, and portal delivery with human review.",
  },
  "/solutions/incident-management": {
    title: "Incident Response with SLA Tracking",
    description:
      "Agency incident management — timelines, SLA tracking, client transparency, and audit logs in Auroranexis.",
  },
};
