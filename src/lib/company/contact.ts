/** Company contact and external URLs — single source for support, legal, and help links. */

export const COMPANY_NAME = "Auroranexis";

export const INFO_EMAIL = "info@auroranexis.com";
export const SUPPORT_EMAIL = "support@auroranexis.com";
export const SALES_EMAIL = "sales@auroranexis.com";
export const SECURITY_EMAIL = "security@auroranexis.com";
export const NO_REPLY_EMAIL = "no-reply@auroranexis.com";

export const DOCS_URL = "https://docs.auroranexis.com";
export const STATUS_URL = "https://status.auroranexis.com";

export const APP_VERSION = "1.0.3";

export { PRODUCTION_DOMAINS, PRODUCTION_DOMAIN_LIST } from "@/lib/deployment/production-domains";

export const MARKETING_ROUTES = {
  home: "/",
  features: "/features",
  useCases: "/use-cases",
  pricing: "/pricing",
  security: "/security",
  compliance: "/compliance",
  integrations: "/integrations",
  documentation: "/documentation",
  contact: "/contact",
  pilotProgram: "/pilot-program",
  status: "/status",
  about: "/about",
  careers: "/careers",
  help: "/help",
  support: "/support",
} as const;

export const LEGAL_ROUTES = {
  imprint: "/imprint",
  privacy: "/privacy",
  terms: "/terms",
  cookies: "/cookies",
  securityPolicy: "/security-policy",
  subprocessors: "/subprocessors",
  dataProcessingAgreement: "/data-processing-agreement",
  acceptableUse: "/acceptable-use",
} as const;

/** Legacy legal paths — kept for redirects and in-app hubs. */
export const LEGACY_LEGAL_ROUTES = {
  imprint: "/legal/imprint",
  privacy: "/legal/privacy",
  terms: "/legal/terms",
  cookies: "/legal/cookies",
} as const;

export const HELP_LINKS = {
  documentation: MARKETING_ROUTES.documentation,
  apiDocumentation: "/api/docs",
  releaseNotes: "/docs/release-notes",
  statusPage: MARKETING_ROUTES.status,
  support: MARKETING_ROUTES.support,
  security: MARKETING_ROUTES.security,
  pilotProgram: MARKETING_ROUTES.pilotProgram,
  contact: MARKETING_ROUTES.contact,
  helpCenter: MARKETING_ROUTES.help,
  securityContact: `mailto:${SECURITY_EMAIL}`,
  feedback: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Product feedback")}`,
} as const;

export const FOOTER_SECTIONS = {
  product: [
    { label: "Features", href: MARKETING_ROUTES.features },
    { label: "Pricing", href: MARKETING_ROUTES.pricing },
    { label: "Integrations", href: MARKETING_ROUTES.integrations },
    { label: "Security", href: MARKETING_ROUTES.security },
    { label: "Compliance", href: MARKETING_ROUTES.compliance },
    { label: "Documentation", href: MARKETING_ROUTES.documentation },
    { label: "Support", href: MARKETING_ROUTES.support },
    { label: "Status", href: MARKETING_ROUTES.status },
    { label: "Pilot Program", href: MARKETING_ROUTES.pilotProgram },
  ],
  legal: [
    { label: "Privacy", href: LEGAL_ROUTES.privacy },
    { label: "Terms", href: LEGAL_ROUTES.terms },
    { label: "Cookies", href: LEGAL_ROUTES.cookies },
    { label: "Imprint", href: LEGAL_ROUTES.imprint },
    { label: "Security Policy", href: LEGAL_ROUTES.securityPolicy },
    { label: "Sub-processors", href: LEGAL_ROUTES.subprocessors },
    { label: "DPA", href: LEGAL_ROUTES.dataProcessingAgreement },
    { label: "Acceptable Use", href: LEGAL_ROUTES.acceptableUse },
  ],
  company: [
    { label: "About", href: MARKETING_ROUTES.about },
    { label: "Careers", href: MARKETING_ROUTES.careers },
    { label: "Contact", href: MARKETING_ROUTES.contact },
  ],
} as const;

/** Flat footer links for minimal variant and legacy consumers. */
export const FOOTER_LINKS = [
  ...FOOTER_SECTIONS.legal.slice(0, 4),
  { label: "Support", href: MARKETING_ROUTES.support },
  { label: "Status", href: MARKETING_ROUTES.status },
  { label: "Documentation", href: MARKETING_ROUTES.documentation },
  { label: "Pilot Program", href: MARKETING_ROUTES.pilotProgram },
] as const;

/** Public documentation topic pages included in sitemap. */
export const PUBLIC_DOC_ROUTES = [
  "/docs/getting-started",
  "/docs/api",
  "/docs/security",
  "/docs/compliance",
  "/docs/clients",
  "/docs/reports",
] as const;

export const PUBLIC_SITEMAP_ROUTES = [
  ...Object.values(MARKETING_ROUTES),
  ...Object.values(LEGAL_ROUTES),
  "/docs",
  ...PUBLIC_DOC_ROUTES,
  "/login",
  "/signup",
] as const;
