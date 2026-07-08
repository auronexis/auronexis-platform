import {
  LEGAL_ROUTES,
  MARKETING_ROUTES,
  PUBLIC_SITEMAP_ROUTES,
  SOLUTION_ROUTES,
  TEMPLATE_ROUTES,
} from "@/lib/company/company-links";

/**
 * Routes that must not be indexed (auth flows, password reset).
 * Authenticated app surfaces are excluded via robots.txt disallow rules.
 */
export const NOINDEX_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

export { PUBLIC_SITEMAP_ROUTES, SOLUTION_ROUTES, TEMPLATE_ROUTES };

export type PublicSitemapRoute = (typeof PUBLIC_SITEMAP_ROUTES)[number];

/** Page-specific SEO titles and descriptions for key public routes. */
export const PAGE_SEO: Record<string, { title: string; description: string }> = {
  [MARKETING_ROUTES.home]: {
    title: "Operations Command Center",
    description:
      "Auroranexis is an AI-powered B2B SaaS platform for client intelligence, risk monitoring, reports, incidents, and executive operational insights.",
  },
  [MARKETING_ROUTES.about]: {
    title: "About",
    description:
      "About Auroranexis — the Operations Command Center for AI automation agencies, MSPs, and service providers.",
  },
  [MARKETING_ROUTES.security]: {
    title: "Security",
    description:
      "Security practices, encryption, access controls, and responsible disclosure for the Auroranexis B2B SaaS platform.",
  },
  [MARKETING_ROUTES.pricing]: {
    title: "Pricing",
    description:
      "Transparent B2B SaaS pricing for agencies — Professional, Business, and Enterprise plans for client operations.",
  },
  [MARKETING_ROUTES.status]: {
    title: "Platform Status",
    description: "Current operational status and availability of the Auroranexis platform.",
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
  "/docs/api": {
    title: "API Documentation",
    description: "Auroranexis REST API reference for integrations, webhooks, and automation.",
  },
};
