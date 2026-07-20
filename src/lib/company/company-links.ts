import { COMPANY_CONTACT } from "@/lib/company/company-contact";
import { COMPANY_INFORMATION } from "@/lib/company/company-information";
import { DOC_PAGE_SLUGS } from "@/lib/docs/registry";

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
  solutions: "/solutions",
  templates: "/templates",
  useCases: "/use-cases",
  industries: "/industries",
  pricing: "/pricing",
  enterprise: "/enterprise",
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
  faq: "/faq",
} as const;

export const FEATURE_ROUTES = {
  aiExecutiveReports: "/features/ai-executive-reports",
  aiCopilot: "/features/ai-copilot",
  clientPortal: "/features/client-portal",
  automation: "/features/automation",
  monitoring: "/features/monitoring",
  riskIntelligence: "/features/risk-intelligence",
  healthMonitoring: "/features/health-monitoring",
  executiveDashboards: "/features/executive-dashboards",
  knowledgeBase: "/features/knowledge-base",
  incidents: "/features/incidents",
  profitability: "/features/profitability",
  customerSuccess: "/features/customer-success",
  reports: "/features/reports",
  activityTimeline: "/features/activity-timeline",
  integrations: "/features/integrations",
} as const;

export const USE_CASE_ROUTES = {
  marketingAgencies: "/use-cases/marketing-agencies",
  itServiceProviders: "/use-cases/it-service-providers",
  msps: "/use-cases/msps",
  consultancies: "/use-cases/consultancies",
  cybersecurityCompanies: "/use-cases/cybersecurity-companies",
  digitalAgencies: "/use-cases/digital-agencies",
  softwareAgencies: "/use-cases/software-agencies",
  automationAgencies: "/use-cases/automation-agencies",
  enterpriseTeams: "/use-cases/enterprise-teams",
} as const;

export const INDUSTRY_ROUTES = {
  marketing: "/industries/marketing",
  it: "/industries/it",
  cybersecurity: "/industries/cybersecurity",
  consulting: "/industries/consulting",
  healthcare: "/industries/healthcare",
  finance: "/industries/finance",
  legal: "/industries/legal",
  manufacturing: "/industries/manufacturing",
  technology: "/industries/technology",
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
  refundPolicy: "/refund-policy",
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
  /** Public indexable API guide — interactive OpenAPI UI remains at /api/docs (noindex). */
  apiDocumentation: "/docs/api",
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
    { label: "Solutions", href: MARKETING_ROUTES.solutions },
    { label: "Templates", href: MARKETING_ROUTES.templates },
    { label: "Industries", href: MARKETING_ROUTES.industries },
    { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
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
    { label: "Refund Policy", href: LEGAL_ROUTES.refundPolicy },
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
    { label: "Help", href: MARKETING_ROUTES.help },
    { label: "FAQ", href: MARKETING_ROUTES.faq },
    { label: "Use cases", href: MARKETING_ROUTES.useCases },
  ],
} as const;

export const FOOTER_LINKS = [
  ...FOOTER_SECTIONS.legal.slice(0, 4),
  { label: "Support", href: MARKETING_ROUTES.support },
  { label: "Status", href: MARKETING_ROUTES.status },
  { label: "Documentation", href: MARKETING_ROUTES.documentation },
  { label: "Pilot Program", href: MARKETING_ROUTES.pilotProgram },
] as const;

export const PUBLIC_DOC_ROUTES = DOC_PAGE_SLUGS.map((slug) => `/docs/${slug}`) as readonly string[];

export const PUBLIC_SITEMAP_ROUTES = [
  ...Object.values(MARKETING_ROUTES),
  ...Object.values(LEGAL_ROUTES),
  ...Object.values(FEATURE_ROUTES),
  ...Object.values(USE_CASE_ROUTES),
  ...Object.values(INDUSTRY_ROUTES),
  ...Object.values(SOLUTION_ROUTES),
  ...Object.values(TEMPLATE_ROUTES),
  "/docs",
  "/docs/release-notes",
  ...PUBLIC_DOC_ROUTES,
] as const;
