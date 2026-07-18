import {
  COMPANY_NAME,
  LEGAL_ROUTES,
  MARKETING_ROUTES,
  PRIMARY_CONTACT_EMAILS,
  SECURITY_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/contact";

export const MARKETING_NAV = [
  { label: "Features", href: MARKETING_ROUTES.features },
  { label: "Solutions", href: MARKETING_ROUTES.solutions },
  { label: "Industries", href: MARKETING_ROUTES.industries },
  { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
  { label: "Pricing", href: MARKETING_ROUTES.pricing },
  { label: "Security", href: MARKETING_ROUTES.security },
  { label: "Documentation", href: MARKETING_ROUTES.documentation },
] as const;

export const MARKETING_STATS = [
  { value: "6", label: "Solution areas", detail: "Health, risk, incident, SLA, executive, and AI reporting." },
  { value: "3", label: "Public plan tiers", detail: "Professional, Business, and Enterprise subscriptions." },
  { value: "EU", label: "Deployment posture", detail: "EU-capable hosting with enterprise security controls." },
  { value: "24/7", label: "Portfolio visibility", detail: "Continuous operational dashboards — not 24/7 human support." },
] as const;

export const MARKETING_LOGO_CLOUD = [
  { name: "Managed service providers", category: "Operations" },
  { name: "IT consultancies", category: "Delivery" },
  { name: "Automation agencies", category: "AI workflows" },
  { name: "Multi-client service firms", category: "Portfolio" },
] as const;

export const MARKETING_TESTIMONIALS = [
  {
    quote:
      "Teams need one portfolio view for client health, overdue reports, and SLA risk — not another generic CRM.",
    role: "Operations leadership",
    organizationType: "Representative priority",
  },
  {
    quote:
      "Executive briefings should separate verified facts from recommendations before they reach clients.",
    role: "Delivery leadership",
    organizationType: "Representative priority",
  },
  {
    quote:
      "Procurement reviews go faster when AI usage, audit trails, and plan entitlements are documented.",
    role: "Client success leadership",
    organizationType: "Representative priority",
  },
] as const;

export const PLAN_COMPARISON_ROWS = [
  { feature: "AI copilot", professional: true, business: true, enterprise: "Unlimited credits" },
  { feature: "Risk & incident modules", professional: "—", business: true, enterprise: true },
  { feature: "SLA tracking", professional: "—", business: true, enterprise: true },
  { feature: "Profitability", professional: true, business: true, enterprise: true },
  { feature: "Priority support", professional: "—", business: "—", enterprise: true },
  { feature: "Custom limits", professional: "—", business: "—", enterprise: true },
] as const;

export type MarketingFeature = {
  title: string;
  description: string;
  problem: string;
  workflow: string;
  outcome: string;
  enterpriseValue: string;
  ctaLabel: string;
  ctaHref: string;
  planNote?: string;
};

export const FEATURES: readonly MarketingFeature[] = [
  {
    title: "Operations Command Center",
    description: "One workspace for client health, alerts, reports, and delivery metrics.",
    problem: "Client signals are scattered across spreadsheets, inboxes, and disconnected tools.",
    workflow: "Monitor portfolio health, overdue work, and executive priorities from a single dashboard.",
    outcome: "Leadership sees what changed, which clients need attention, and what to do next.",
    enterpriseValue: "Faster operational decisions with organization-scoped visibility and audit-friendly activity.",
    ctaLabel: "Explore the dashboard",
    ctaHref: "/signup",
  },
  {
    title: "Client Reporting",
    description: "Templates, schedules, PDF export, and secure client portal delivery.",
    problem: "Recurring client reports are manual, inconsistent, and hard to prove on time.",
    workflow: "Draft, generate, publish, and schedule reports with client portal visibility controls.",
    outcome: "Predictable delivery and a published record of value for every client.",
    enterpriseValue: "Client-ready reporting with version history and portal-only publication rules.",
    ctaLabel: "See reporting workflow",
    ctaHref: "/docs/reports",
  },
  {
    title: "Risk & Incident Management",
    description: "Track operational risks, incidents, and SLA breaches with audit trails.",
    problem: "Operational issues are tracked informally and escalate without portfolio context.",
    workflow: "Log risks and incidents, tie them to clients, and resolve with traceable status changes.",
    outcome: "Fewer surprises and a defensible record for client and leadership reviews.",
    enterpriseValue: "Governance-ready risk and incident history with role-based access.",
    ctaLabel: "Review risk workflows",
    ctaHref: "/pricing#compare",
    planNote: "Available on Business and Enterprise plans.",
  },
  {
    title: "Automation Workflows",
    description: "Build triggers, actions, and execution history without leaving the platform.",
    problem: "Repeatable operational work still depends on manual follow-up across teams.",
    workflow: "Define triggers and actions, monitor execution history, and connect delivery events.",
    outcome: "More consistent operations with less manual coordination.",
    enterpriseValue: "Repeatable automation with organization-scoped execution logs.",
    ctaLabel: "View automation capabilities",
    ctaHref: "/docs/automation",
  },
  {
    title: "Integrations & Connectors",
    description: "Connect CRM, ticketing, and productivity tools with OAuth and sync jobs.",
    problem: "Client data lives in external systems that operations teams still reconcile by hand.",
    workflow: "Connect approved systems, sync events, and keep operational records in one workspace.",
    outcome: "Less swivel-chair work between delivery tools and client intelligence.",
    enterpriseValue: "Connector inventory and OAuth flows designed for multi-tenant operations teams.",
    ctaLabel: "Browse integrations",
    ctaHref: "/integrations",
  },
  {
    title: "Predictive Intelligence",
    description: "Health scores, forecasts, and early warning signals for client portfolios.",
    problem: "Client deterioration is noticed too late to protect revenue and delivery quality.",
    workflow: "Use adoption, success, and operational signals to surface priority clients and changes.",
    outcome: "Earlier intervention on at-risk clients and clearer executive narratives.",
    enterpriseValue: "Deterministic intelligence with evidence-backed findings and optional AI assistance.",
    ctaLabel: "See executive intelligence",
    ctaHref: "/features/executive-dashboards",
    planNote: "Advanced AI narrative features are plan-gated.",
  },
];

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
    highlights: ["Higher limits", "White label", "Compliance center", "Advanced operations"],
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
  `Security contact: ${SECURITY_EMAIL} for responsible disclosure.`,
] as const;

export const COMPLIANCE_READINESS = [
  {
    framework: "GDPR",
    status: "Supported",
    detail: "Platform supports GDPR workflows and privacy documentation — not a certification claim.",
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
    detail: "Incident and resilience workflows support operator obligations; roadmap aligned with financial-sector needs.",
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
  emails: PRIMARY_CONTACT_EMAILS.map((entry) => entry.email),
} as const;

export const CONTACT_EMAILS = PRIMARY_CONTACT_EMAILS;

export const STATUS_COMPONENTS_STATIC = [
  { name: "Platform", status: "operational" as const, detail: "Application and web services" },
  { name: "API", status: "operational" as const, detail: "REST API and public endpoints" },
  { name: "Billing", status: "operational" as const, detail: "Paddle subscriptions and invoices" },
  { name: "AI", status: "operational" as const, detail: "AI generation and insights" },
  { name: "Connectors", status: "operational" as const, detail: "OAuth and sync infrastructure" },
  { name: "Automation", status: "operational" as const, detail: "Workflow engine and executions" },
  { name: "Queue", status: "operational" as const, detail: "Background job processing" },
  { name: "Cron", status: "operational" as const, detail: "Scheduled jobs and maintenance" },
  { name: "Database", status: "operational" as const, detail: "Supabase PostgreSQL" },
  { name: "Observability", status: "operational" as const, detail: "Monitoring and error tracking" },
] as const;

export const HELP_TOPICS = [
  { title: "FAQ", href: MARKETING_ROUTES.faq, description: "Billing, security, AI, reports, and enterprise questions." },
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
  { label: "Refund Policy", href: LEGAL_ROUTES.refundPolicy },
  { label: "Cookies", href: LEGAL_ROUTES.cookies },
  { label: "Security Policy", href: LEGAL_ROUTES.securityPolicy },
  { label: "Sub-processors", href: LEGAL_ROUTES.subprocessors },
  { label: "DPA", href: LEGAL_ROUTES.dataProcessingAgreement },
  { label: "Acceptable Use", href: LEGAL_ROUTES.acceptableUse },
] as const;
