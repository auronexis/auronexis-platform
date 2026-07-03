import {
  COMPANY_NAME,
  LEGAL_ROUTES,
  MARKETING_ROUTES,
  SALES_EMAIL,
  SECURITY_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/contact";

export const MARKETING_NAV = [
  { label: "Features", href: MARKETING_ROUTES.features },
  { label: "Use Cases", href: MARKETING_ROUTES.useCases },
  { label: "Pricing", href: MARKETING_ROUTES.pricing },
  { label: "Security", href: MARKETING_ROUTES.security },
  { label: "Pilot Program", href: MARKETING_ROUTES.pilotProgram },
  { label: "Documentation", href: MARKETING_ROUTES.documentation },
] as const;

export const FEATURES = [
  {
    title: "Operations Command Center",
    description: "One workspace for client health, alerts, reports, and delivery metrics.",
  },
  {
    title: "Client Reporting",
    description: "Templates, schedules, PDF export, and secure client portal delivery.",
  },
  {
    title: "Risk & Incident Management",
    description: "Track operational risks, incidents, and SLA breaches with audit trails.",
  },
  {
    title: "Automation Workflows",
    description: "Build triggers, actions, and execution history without leaving the platform.",
  },
  {
    title: "Integrations & Connectors",
    description: "Connect CRM, ticketing, and productivity tools with OAuth and sync jobs.",
  },
  {
    title: "Predictive Intelligence",
    description: "Health scores, forecasts, and early warning signals for client portfolios.",
  },
] as const;

export const USE_CASES = [
  {
    title: "MSPs",
    description: "Monitor multi-client operations, prove SLA performance, and standardize reporting.",
  },
  {
    title: "IT Agencies",
    description: "Deliver client dashboards, incident transparency, and recurring value reports.",
  },
  {
    title: "Consultancies",
    description: "Package operational insights for retainers and transformation programs.",
  },
  {
    title: "Automation Firms",
    description: "Show automation ROI, workflow reliability, and client health in one command center.",
  },
] as const;

export const PUBLIC_PRICING_PLANS = [
  {
    name: "Professional",
    price: "€149",
    period: "/ month",
    description: "For growing agencies starting with automation and client portal delivery.",
    highlights: ["Up to 25 clients", "Automation workflows", "Client portal", "Integrations"],
    featured: false,
  },
  {
    name: "Business",
    price: "€499",
    period: "/ month",
    description: "For established agencies with compliance, white-label, and higher operational limits.",
    highlights: ["Higher limits", "White label", "Compliance center", "Priority support"],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "From €1,499",
    period: "/ month",
    description: "For large portfolios and custom requirements. Contact Sales for tailored limits and onboarding.",
    highlights: ["Custom client limits", "Dedicated onboarding", "Priority support", "Plan overrides"],
    featured: false,
  },
] as const;

/** Copy-only footnote for public pricing pages — invite-only programs are not listed here. */
export const PUBLIC_PRICING_NOTE =
  "Enterprise pricing is negotiated. Contact sales for custom limits and onboarding.";

export const INVITE_ONLY_PROGRAMS_NOTE = "Pilot and Founding programs are invite-only.";

export const SECURITY_HIGHLIGHTS = [
  "Encryption in transit (TLS) and at rest for platform data stores.",
  "Role-based access control with organization-scoped permissions.",
  "Audit logging for sensitive actions and compliance workflows.",
  "EU-friendly data residency options via Supabase (Frankfurt region supported).",
  "Security contact: security@auroranexis.com for responsible disclosure.",
] as const;

export const COMPLIANCE_READINESS = [
  {
    framework: "GDPR",
    status: "Supported",
    detail: "Data subject request tooling, retention controls, and privacy documentation.",
  },
  {
    framework: "SOC 2",
    status: "Readiness",
    detail: "Designed to support compliance workflows; no SOC 2 certification claim is made.",
  },
  {
    framework: "ISO 27001",
    status: "Readiness",
    detail: "Aligned with ISO 27001 principles; no certification claimed.",
  },
  {
    framework: "NIS2",
    status: "Readiness",
    detail: "Incident and risk workflows support operator obligations; not certified.",
  },
  {
    framework: "DORA",
    status: "Readiness",
    detail: "Operational resilience features planned for financial-sector partners.",
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: "Who is Auroranexis for?",
    answer: `${COMPANY_NAME} is built for MSPs, IT agencies, consultancies, and automation firms that manage multiple client operations.`,
  },
  {
    question: "Is there a pilot program?",
    answer:
      "Pilot Partner is an invite-only private onboarding program — not a public plan tier. Contact sales if you received an invitation.",
  },
  {
    question: "Where is data hosted?",
    answer: "Production deployments use EU-capable infrastructure (Supabase, Vercel). Specific residency is confirmed during enterprise onboarding.",
  },
  {
    question: "Do you claim SOC 2 or ISO certifications?",
    answer: "No. We describe readiness posture only and do not claim certifications we have not obtained.",
  },
  {
    question: "How do I get support?",
    answer: `Visit ${MARKETING_ROUTES.support} or email ${SUPPORT_EMAIL}. Security issues go to ${SECURITY_EMAIL}.`,
  },
] as const;

export const PILOT_PROGRAM = {
  duration: "6 weeks",
  discount: "Invite-only beta pricing on approved Pilot Partner terms",
  targets: ["MSPs", "IT agencies", "Consultancies", "Automation firms"],
  includes: [
    "Dedicated onboarding and workspace setup",
    "Weekly check-ins with product team",
    "Priority support channel",
    "Approved pricing terms for the pilot period",
    "Roadmap influence and feedback sessions",
    "Early access to upcoming modules",
  ],
  requirements: [
    "Direct invitation or approved application",
    "Active client portfolio (minimum 3 managed clients)",
    "Designated operations owner for the pilot",
    "Willingness to provide structured feedback",
    "Agreement to pilot terms and acceptable use policy",
  ],
  benefits: [
    "Dedicated onboarding",
    "Roadmap influence",
    "Invite-only pricing terms",
    "Early access to new capabilities",
  ],
  emails: [SUPPORT_EMAIL, SALES_EMAIL],
} as const;

export const CONTACT_EMAILS = [
  { label: "Support", email: SUPPORT_EMAIL, description: "Product support, onboarding, and general inquiries" },
  { label: "Sales", email: SALES_EMAIL, description: "Pricing, pilots, and partnerships" },
  { label: "Security", email: SECURITY_EMAIL, description: "Security reports and trust inquiries" },
] as const;

export const STATUS_COMPONENTS_STATIC = [
  { name: "Platform", status: "operational" as const, detail: "Application and web services" },
  { name: "API", status: "operational" as const, detail: "REST API and public endpoints" },
  { name: "Billing", status: "operational" as const, detail: "Stripe subscriptions and invoices" },
  { name: "AI", status: "operational" as const, detail: "AI generation and insights" },
  { name: "Connectors", status: "operational" as const, detail: "OAuth and sync infrastructure" },
  { name: "Automation", status: "operational" as const, detail: "Workflow engine and executions" },
  { name: "Queue", status: "operational" as const, detail: "Background job processing" },
  { name: "Cron", status: "operational" as const, detail: "Scheduled jobs and maintenance" },
  { name: "Database", status: "operational" as const, detail: "Supabase PostgreSQL" },
  { name: "Stripe", status: "operational" as const, detail: "Payment webhooks and checkout" },
  { name: "Observability", status: "operational" as const, detail: "Monitoring and error tracking" },
] as const;

export const HELP_TOPICS = [
  { title: "Getting started", href: "/docs/getting-started", description: "Account setup and first workspace." },
  { title: "Documentation hub", href: "/docs", description: "Module guides and API reference." },
  { title: "Release notes", href: "/docs/release-notes", description: "Product updates and changes." },
  { title: "System status", href: MARKETING_ROUTES.status, description: "Platform component health." },
  { title: "Pilot program", href: MARKETING_ROUTES.pilotProgram, description: "Invite-only Pilot Partner application." },
  { title: "Contact support", href: MARKETING_ROUTES.contact, description: "Reach sales, support, or security." },
] as const;

export const LEGAL_NAV = [
  { label: "Imprint", href: LEGAL_ROUTES.imprint },
  { label: "Privacy", href: LEGAL_ROUTES.privacy },
  { label: "Terms", href: LEGAL_ROUTES.terms },
  { label: "Cookies", href: LEGAL_ROUTES.cookies },
  { label: "Security Policy", href: LEGAL_ROUTES.securityPolicy },
  { label: "Sub-processors", href: LEGAL_ROUTES.subprocessors },
  { label: "DPA", href: LEGAL_ROUTES.dataProcessingAgreement },
  { label: "Acceptable Use", href: LEGAL_ROUTES.acceptableUse },
] as const;
