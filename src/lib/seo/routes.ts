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

/**
 * Authenticated and internal route prefixes excluded from crawling and indexing.
 * Keep aligned with robots.txt disallow rules.
 */
export const PRIVATE_ROUTE_PREFIXES = [
  "/dashboard",
  "/settings",
  "/client-portal",
  "/api/",
  "/webhooks",
  "/sales",
  "/invite",
  "/profile",
  "/clients",
  "/reports",
  "/incidents",
  "/risks",
  "/automation",
  "/monitoring",
  "/predictive",
  "/profitability",
  "/knowledge",
  "/notifications",
  "/activity",
  "/onboarding",
  "/copilot",
  "/intelligence",
  "/customer-success",
  "/adoption",
  "/billing",
  "/invoices",
  "/team",
] as const;

/**
 * Routes that must not be indexed (auth flows, password reset).
 * Authenticated app surfaces use PRIVATE_ROUTE_PREFIXES + layout noindex.
 */
export const NOINDEX_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

export { PUBLIC_SITEMAP_ROUTES, SOLUTION_ROUTES, TEMPLATE_ROUTES };

export type PublicSitemapRoute = (typeof PUBLIC_SITEMAP_ROUTES)[number];

/** True when a path belongs to a private authenticated or internal surface. */
export function isPrivateRoute(path: string): boolean {
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix),
  );
}

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
    title: "Operations Command Center",
    description:
      "Auroranexis is an AI-powered B2B SaaS platform for client intelligence, risk monitoring, reports, incidents, and executive operational insights.",
  },
  [MARKETING_ROUTES.features]: {
    title: "Features",
    description:
      "Explore Auroranexis features for agency operations — reporting, automation, risk management, integrations, and executive intelligence.",
  },
  [MARKETING_ROUTES.solutions]: {
    title: "Solutions",
    description:
      "Operational solutions for agencies — customer health, risk management, incidents, SLA tracking, executive dashboards, and AI reporting.",
  },
  [MARKETING_ROUTES.useCases]: {
    title: "Use Cases",
    description:
      "See how MSPs, agencies, and enterprise teams use Auroranexis for client health, risk registers, incident response, and executive reporting.",
  },
  [MARKETING_ROUTES.industries]: {
    title: "Industries",
    description:
      "Industry-focused client operations for marketing, IT, finance, healthcare, legal, and technology service providers.",
  },
  [MARKETING_ROUTES.faq]: {
    title: "FAQ",
    description:
      "Frequently asked questions about Auroranexis — billing, security, AI, client portal, reports, integrations, and enterprise plans.",
  },
  [MARKETING_ROUTES.pricing]: {
    title: "Pricing",
    description:
      "Transparent B2B SaaS pricing for agencies — Professional, Business, and Enterprise plans for client operations.",
  },
  [MARKETING_ROUTES.enterprise]: {
    title: "Enterprise",
    description:
      "Enterprise-grade client operations for MSPs and agencies — security, scale, AI copilot, and dedicated support.",
  },
  [MARKETING_ROUTES.security]: {
    title: "Security",
    description:
      "Security practices, encryption, access controls, and responsible disclosure for the Auroranexis B2B SaaS platform.",
  },
  [MARKETING_ROUTES.compliance]: {
    title: "Compliance",
    description:
      "Compliance workflows, audit trails, and governance capabilities for agencies managing regulated client operations.",
  },
  [MARKETING_ROUTES.integrations]: {
    title: "Integrations",
    description:
      "Connect Auroranexis with Stripe, Slack, email, REST API, webhooks, and AI providers for agency operations.",
  },
  [MARKETING_ROUTES.documentation]: {
    title: "Documentation",
    description:
      "Product documentation for Auroranexis — getting started, clients, reports, security, and API reference.",
  },
  [MARKETING_ROUTES.contact]: {
    title: "Contact",
    description:
      "Contact Auroranexis for sales, support, and security inquiries for agency and MSP operations teams.",
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
    title: "About",
    description:
      "About Auroranexis — the Operations Command Center for AI automation agencies, MSPs, and service providers.",
  },
  [MARKETING_ROUTES.careers]: {
    title: "Careers",
    description:
      "Careers at Auroranexis — build enterprise operations software for agencies and managed service providers.",
  },
  [MARKETING_ROUTES.help]: {
    title: "Help Center",
    description:
      "Help resources for Auroranexis customers — documentation, support, and platform guidance.",
  },
  [MARKETING_ROUTES.support]: {
    title: "Support",
    description:
      "Customer support for Auroranexis workspace users — documentation, status, and contact options.",
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
};
