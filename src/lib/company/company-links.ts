import { COMPANY_CONTACT } from "@/lib/company/company-contact";
import { COMPANY_INFORMATION } from "@/lib/company/company-information";

export { PRODUCTION_DOMAINS, PRODUCTION_DOMAIN_LIST } from "@/lib/deployment/production-domains";

export const APP_VERSION = "1.0.3";

export const EXTERNAL_LINKS = {
  website: COMPANY_INFORMATION.website,
  docs: "https://docs.auroranexis.com",
  status: "https://status.auroranexis.com",
} as const;

/** Backward-compatible aliases. */
export const DOCS_URL = EXTERNAL_LINKS.docs;
export const STATUS_URL = EXTERNAL_LINKS.status;

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

export const SOLUTION_ROUTES = {
  customerHealthScore: "/solutions/customer-health-score",
  riskManagement: "/solutions/risk-management",
  incidentManagement: "/solutions/incident-management",
  slaManagement: "/solutions/sla-management",
  executiveDashboard: "/solutions/executive-dashboard",
  aiReporting: "/solutions/ai-reporting",
} as const;

export const TEMPLATE_ROUTES = {
  customerHealthScore: "/templates/customer-health-score",
  riskRegister: "/templates/risk-register",
  incidentResponse: "/templates/incident-response",
  slaPolicy: "/templates/sla-policy",
  executiveReport: "/templates/executive-report",
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

export const LEGACY_LEGAL_ROUTES = {
  imprint: "/legal/imprint",
  privacy: "/legal/privacy",
  terms: "/legal/terms",
  cookies: "/legal/cookies",
} as const;

export const DASHBOARD_ROUTES = {
  home: "/dashboard",
  settings: "/settings",
  settingsLegal: "/settings/legal",
  dashboardLegal: "/dashboard/legal",
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
  securityContact: `mailto:${COMPANY_CONTACT.securityEmail}`,
  feedback: `mailto:${COMPANY_CONTACT.supportEmail}?subject=${encodeURIComponent("Product feedback")}`,
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

export const FOOTER_LINKS = [
  ...FOOTER_SECTIONS.legal.slice(0, 4),
  { label: "Support", href: MARKETING_ROUTES.support },
  { label: "Status", href: MARKETING_ROUTES.status },
  { label: "Documentation", href: MARKETING_ROUTES.documentation },
  { label: "Pilot Program", href: MARKETING_ROUTES.pilotProgram },
] as const;

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
  ...Object.values(SOLUTION_ROUTES),
  ...Object.values(TEMPLATE_ROUTES),
  "/docs",
  "/docs/release-notes",
  ...PUBLIC_DOC_ROUTES,
] as const;
