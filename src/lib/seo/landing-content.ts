import {
  FEATURE_ROUTES,
  MARKETING_ROUTES,
  SOLUTION_ROUTES,
  TEMPLATE_ROUTES,
  USE_CASE_ROUTES,
} from "@/lib/company/company-links";

export type SolutionPageContent = {
  slug: string;
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  metaDescription: string;
  intro: string;
  /** Visible definition term; defaults to title. */
  definitionTerm?: string;
  /** Shorter breadcrumb label when the H1 is long. */
  breadcrumbName?: string;
  problem?: string;
  audience?: string;
  howItWorks?: ReadonlyArray<{ title: string; description: string }>;
  benefits: ReadonlyArray<{ title: string; description: string }>;
  capabilities: ReadonlyArray<string>;
  faq: ReadonlyArray<{ question: string; answer: string }>;
  relatedLinks: ReadonlyArray<{ label: string; href: string }>;
};

export const SOLUTION_PAGES: Record<string, SolutionPageContent> = {
  "customer-health-score": {
    slug: "customer-health-score",
    path: SOLUTION_ROUTES.customerHealthScore,
    eyebrow: "Solution",
    title: "Customer health score for agency portfolios",
    description:
      "Monitor client health across your portfolio with signals, thresholds, and executive-ready visibility.",
    metaDescription:
      "Customer health scoring for MSPs and agencies — portfolio signals, risk indicators, and operational visibility in Auroranexis.",
    intro:
      "Auroranexis helps agencies track customer health using operational signals from reports, incidents, risks, and SLA performance. Instead of relying on spreadsheets or subjective check-ins, teams get a structured view of which clients need attention and why.",
    problem:
      "Account teams often judge client health from memory, last-week tickets, or a spreadsheet that is already stale. At-risk retainers surface too late — after a missed QBR, a surprise churn notice, or an SLA dispute.",
    audience:
      "Customer success, account leadership, and operations leads at agencies and MSPs who need a portfolio view of which clients need attention and why.",
    benefits: [
      {
        title: "Portfolio-wide visibility",
        description: "See health trends across all clients from one command center instead of disconnected tools.",
      },
      {
        title: "Early warning signals",
        description: "Combine incident volume, open risks, and SLA breaches into actionable health indicators.",
      },
      {
        title: "Executive reporting",
        description: "Export health summaries for QBRs and leadership reviews without manual data assembly.",
      },
    ],
    capabilities: [
      "Client-level health indicators derived from operational data",
      "Configurable thresholds and ownership assignments",
      "Integration with incidents, risks, and SLA policies",
      "Dashboard portfolio views for operations leaders",
      "Client portal visibility for transparent status sharing",
    ],
    faq: [
      {
        question: "What is a customer health score in Auroranexis?",
        answer:
          "It is a structured operational signal that reflects client status based on incidents, risks, SLA performance, and delivery activity — not a black-box AI score.",
      },
      {
        question: "Who is this for?",
        answer: "MSPs, IT agencies, and automation firms managing multi-client portfolios who need proactive account oversight.",
      },
    ],
    relatedLinks: [
      { label: "Health monitoring", href: FEATURE_ROUTES.healthMonitoring },
      { label: "Health score template", href: TEMPLATE_ROUTES.customerHealthScore },
      { label: "Automated client reporting", href: SOLUTION_ROUTES.aiReporting },
      { label: "Risk management", href: SOLUTION_ROUTES.riskManagement },
    ],
  },
  "risk-management": {
    slug: "risk-management",
    path: SOLUTION_ROUTES.riskManagement,
    eyebrow: "Solution",
    title: "Operational risk management for client delivery",
    description: "Register, track, and resolve operational risks with audit trails and client-level context.",
    metaDescription:
      "B2B risk management for agencies — risk registers, ownership, mitigation tracking, and audit logs in Auroranexis.",
    intro:
      "Agencies on Business and Enterprise plans need a consistent way to capture delivery risks before they become incidents. Auroranexis provides a risk register tied to clients, owners, and remediation workflows so teams can demonstrate control to customers and leadership.",
    problem:
      "Delivery risks live in chat threads and personal notes. When ownership is unclear, the same exposure repeats across clients and never appears in executive reporting.",
    audience:
      "Operations and delivery owners at agencies who need a client-scoped risk register — not a full enterprise GRC suite.",
    benefits: [
      {
        title: "Structured risk registers",
        description: "Capture likelihood, impact, owners, and mitigation steps in a single workspace.",
      },
      {
        title: "Client context",
        description: "Associate risks with client records, reports, and portal visibility where appropriate.",
      },
      {
        title: "Audit-ready history",
        description: "Track changes and resolutions for compliance and customer transparency.",
      },
    ],
    capabilities: [
      "Risk creation, assignment, and resolution workflows",
      "Severity and status tracking with filters",
      "Links to clients, incidents, and executive reporting",
      "Role-based access for agency teams",
      "Export-friendly summaries for customer reviews",
    ],
    faq: [
      {
        question: "Which plans include risk management?",
        answer:
          "Risk registers require Business or Enterprise. Professional includes client operations, reporting, portal, and automation builder without risk modules.",
      },
      {
        question: "Does Auroranexis replace a GRC platform?",
        answer:
          "No. It focuses on operational delivery risks for agencies and service providers, not enterprise-wide GRC certification management.",
      },
      {
        question: "Can clients see risks in the portal?",
        answer: "You control what is shared via the client portal based on your delivery and contractual policies.",
      },
    ],
    relatedLinks: [
      { label: "Risk intelligence", href: FEATURE_ROUTES.riskIntelligence },
      { label: "Incident management with SLA tracking", href: SOLUTION_ROUTES.incidentManagement },
      { label: "Risk register template", href: TEMPLATE_ROUTES.riskRegister },
      { label: "Automated client reporting", href: SOLUTION_ROUTES.aiReporting },
    ],
  },
  "incident-management": {
    slug: "incident-management",
    path: SOLUTION_ROUTES.incidentManagement,
    eyebrow: "Solution",
    title: "Client portfolio incident response with SLA tracking",
    description: "Track incidents, timelines, ownership, and SLA impact across your client portfolio.",
    metaDescription:
      "Agency incident management — timelines, SLA tracking, client transparency, and audit logs in Auroranexis.",
    intro:
      "When operations break, agencies need fast coordination and clear customer communication. Auroranexis centralizes incident records, response timelines, and SLA evaluation so teams resolve issues with accountability.",
    problem:
      "Incidents are logged in tickets, email, and chat without a shared client timeline. SLA impact is reconstructed after the fact, which weakens both response and client communication.",
    audience:
      "Delivery and operations leads at MSPs and agencies who coordinate client-impacting incidents against contractual response and resolution targets.",
    benefits: [
      {
        title: "Single incident workspace",
        description: "Log incidents with severity, owners, and client associations in one system of record.",
      },
      {
        title: "SLA integration",
        description: "Evaluate incidents against client SLA policies and surface breach warnings.",
      },
      {
        title: "Client transparency",
        description: "Share appropriate incident status through the client portal.",
      },
    ],
    capabilities: [
      "Incident lifecycle tracking with status and severity",
      "SLA policy evaluation and breach indicators",
      "Activity history and ownership assignments",
      "Links to risks, reports, and automation workflows",
      "Portfolio dashboards for open incident visibility",
    ],
    faq: [
      {
        question: "Can incidents trigger automations?",
        answer: "Yes. Auroranexis supports automation workflows that react to operational events where configured.",
      },
      {
        question: "Is this an on-call paging system?",
        answer: "It is an operations record and coordination layer; integrate with your existing paging or ticketing tools.",
      },
    ],
    relatedLinks: [
      { label: "Incidents feature", href: FEATURE_ROUTES.incidents },
      { label: "SLA management for multi-client agencies", href: SOLUTION_ROUTES.slaManagement },
      { label: "Incident response template", href: TEMPLATE_ROUTES.incidentResponse },
      { label: "Automated client reporting", href: SOLUTION_ROUTES.aiReporting },
    ],
  },
  "sla-management": {
    slug: "sla-management",
    path: SOLUTION_ROUTES.slaManagement,
    eyebrow: "Solution",
    title: "SLA management for multi-client agencies",
    description: "Define SLA policies, monitor breaches, and prove performance to clients.",
    metaDescription:
      "SLA management for MSPs — policy definitions, breach tracking, and client reporting in Auroranexis.",
    intro:
      "SLA performance is how agencies prove reliability. On Business and Enterprise plans, Auroranexis lets you define policies per client, monitor incidents and risks against those policies, and report outcomes without manual spreadsheet tracking.",
    problem:
      "SLA targets live in contracts while delivery work lives in another system. Breach evidence is assembled manually when a client asks for proof.",
    audience:
      "Service delivery managers at MSPs and agencies who assign response and resolution policies per client and need breach visibility on operational records.",
    benefits: [
      {
        title: "Policy per client",
        description: "Assign SLA policies based on contract tier, service type, or portfolio segment.",
      },
      {
        title: "Breach visibility",
        description: "Surface warnings and breaches on records and portfolio dashboards.",
      },
      {
        title: "Customer proof",
        description: "Include SLA outcomes in reports and portal views for transparent delivery.",
      },
    ],
    capabilities: [
      "SLA policy configuration with response and resolution targets",
      "Automatic evaluation against incidents and operational records",
      "Escalation rule integration where configured",
      "Reporting and portal-friendly status summaries",
      "Audit logs for policy and assignment changes",
    ],
    faq: [
      {
        question: "Which plans include SLA management?",
        answer:
          "SLA policy configuration, client assignment, and breach tracking require Business or Enterprise. Professional includes reports, portal, and automation builder features without SLA modules.",
      },
      {
        question: "What SLA metrics are supported?",
        answer: "Response and resolution targets tied to incident workflows; exact metrics depend on your configured policies.",
      },
      {
        question: "Can I export SLA performance?",
        answer: "Yes — include SLA summaries in reports and operational exports.",
      },
    ],
    relatedLinks: [
      { label: "SLA documentation", href: "/docs/sla" },
      { label: "SLA policy template", href: TEMPLATE_ROUTES.slaPolicy },
      { label: "Executive dashboard for agency operations", href: SOLUTION_ROUTES.executiveDashboard },
      { label: "Automated client reporting", href: SOLUTION_ROUTES.aiReporting },
    ],
  },
  "executive-dashboard": {
    slug: "executive-dashboard",
    path: SOLUTION_ROUTES.executiveDashboard,
    eyebrow: "Solution",
    title: "Executive dashboard for agency operations",
    description: "Give leadership a portfolio view of clients, risks, incidents, and delivery health.",
    metaDescription:
      "Executive operations dashboard for agencies — portfolio health, incidents, risks, and reporting in Auroranexis.",
    intro:
      "Operations leaders need a concise view of what matters across the client portfolio. Auroranexis aggregates signals from clients, incidents, risks, and SLAs into an executive-ready dashboard without building custom BI projects.",
    problem:
      "Leadership reviews pull screenshots from five tools. Portfolio questions — open incidents, health, overdue reports — cannot be answered from one workspace.",
    audience:
      "COOs, delivery directors, and operations VPs who need a live command-center view of the client portfolio, distinct from scheduled client-facing reports.",
    benefits: [
      {
        title: "Portfolio at a glance",
        description: "See open incidents, risks, and health indicators across clients in one view.",
      },
      {
        title: "Leadership-ready",
        description: "Designed for COO, delivery director, and account leadership reviews.",
      },
      {
        title: "Connected to delivery",
        description: "Drill into client records, reports, and operational workflows from summary cards.",
      },
    ],
    capabilities: [
      "Operations Command Center dashboard",
      "Portfolio health and activity summaries",
      "Quick links to clients, incidents, and reports",
      "Role-based views for owners and executives",
      "Export and report integration for QBRs",
    ],
    faq: [
      {
        question: "Is this a separate BI tool?",
        answer: "No. It is an operational command center built into Auroranexis using your workspace data.",
      },
      {
        question: "Can I white-label the dashboard for clients?",
        answer: "Professional and higher plans support white-label and client portal branding options.",
      },
    ],
    relatedLinks: [
      { label: "Portfolio KPI dashboards", href: FEATURE_ROUTES.executiveDashboards },
      { label: "AI Copilot", href: FEATURE_ROUTES.aiCopilot },
      { label: "Automated client reporting", href: SOLUTION_ROUTES.aiReporting },
      { label: "Platform features", href: MARKETING_ROUTES.features },
    ],
  },
  "ai-reporting": {
    slug: "ai-reporting",
    path: SOLUTION_ROUTES.aiReporting,
    eyebrow: "Solution",
    title: "Automated client reporting for agencies and MSPs",
    breadcrumbName: "Automated client reporting",
    definitionTerm: "Automated client reporting",
    description:
      "Create, generate, review, and publish client reports from operational data — templates, schedules, PDF export, and portal delivery, with optional AI-assisted summaries.",
    metaDescription:
      "Automated client reporting for agencies and MSPs: templates, scheduled drafts, generate-from-workspace data, PDF export, and portal delivery. Optional AI-assisted summaries with human review.",
    intro:
      "Automated client reporting in Auroranexis is the workflow that turns delivery records into client-ready reports without rebuilding decks from scratch each period. Each report is linked to one client and a reporting period. Templates define the structure. Generate fills metrics and default narrative from workspace data such as health signals, SLA outcomes, related incidents, and open risks. Your team reviews and edits before publish. Published reports can go to the client portal, PDF export, and email where configured. Recurring schedules can create draft shells so cadence does not depend on someone remembering to start the report. Optional AI-assisted executive summaries are available when enabled; they do not replace human review, and reporting works without AI.",
    problem:
      "Agencies still assemble client reports from spreadsheets, ticket exports, and last month's slides. Delivery is late or inconsistent, metrics do not match the live workspace, and there is no durable record of what the client actually received.",
    audience:
      "Account, delivery, and operations teams at AI automation agencies, MSPs, and multi-client service firms who publish recurring client reports and QBR packs.",
    howItWorks: [
      {
        title: "Start from a template",
        description:
          "Reuse an agency template so every client report includes the same sections — typically executive summary, wins, risks, next actions, and operational metrics.",
      },
      {
        title: "Generate for a reporting period",
        description:
          "Run Generate on a draft so metrics and default narrative reflect the selected period and the linked client's operational records.",
      },
      {
        title: "Review, then publish",
        description:
          "Edit the draft internally. Publishing finalizes the report for portal users on that client, PDF export, and email delivery where Settings allow it.",
      },
      {
        title: "Schedule the next draft",
        description:
          "Where your plan includes scheduling, recurring cadences create draft shells. You still generate, review, and publish — schedules do not auto-send unreviewed reports to clients.",
      },
    ],
    benefits: [
      {
        title: "Operational data in the report",
        description:
          "Generated sections can include health, SLA, incident, and risk context from the same client record your team already operates — not a disconnected BI export.",
      },
      {
        title: "Predictable client cadence",
        description:
          "Templates plus optional schedules reduce last-minute assembly so retainers receive a consistent reporting rhythm.",
      },
      {
        title: "Controlled delivery channels",
        description:
          "Publish to the client portal, export PDF for QBRs, or email with attachment where configured — after internal review.",
      },
    ],
    capabilities: [
      "Client-linked reports with draft, generated, published, and archived statuses",
      "Reusable templates and reporting periods",
      "Generate step that populates metrics and default narrative from workspace data",
      "Scheduled draft creation where the plan includes report schedules",
      "PDF export and client portal publication after review",
      "Email delivery with PDF where organization email settings are configured",
      "Optional AI-assisted executive summaries with human-in-the-loop review",
      "Version history and activity logging on the report record",
    ],
    faq: [
      {
        question: "What is automated client reporting in Auroranexis?",
        answer:
          "It is the product workflow for turning operational client data into recurring reports: template, generate for a period, human review, then publish to portal, PDF, or email. Automation means structured generation and optional schedules — not unattended client-facing publication.",
      },
      {
        question: "Is AI required for automated client reporting?",
        answer:
          "No. Templates, generate, schedules, PDF export, and portal delivery work without AI. AI-assisted summaries are optional and must be enabled in the workspace; reviewers still approve content before publish.",
      },
      {
        question: "Can reports include incidents, risks, and SLA data?",
        answer:
          "Yes, depending on the template and which modules your plan includes. Generated reports can surface health scores, SLA metrics, and related open risks and incidents for the linked client.",
      },
      {
        question: "How do clients receive reports?",
        answer:
          "Published reports can appear in that client's portal for active portal users, be exported as PDF, and be emailed with a PDF attachment where Settings → Email is configured.",
      },
      {
        question: "Where is data processed for optional AI features?",
        answer:
          "See the Sub-processors page and Data Processing Agreement for optional AI provider details. Do not enable AI features if your contracts forbid that processing.",
      },
    ],
    relatedLinks: [
      { label: "Report templates and schedules", href: FEATURE_ROUTES.reports },
      { label: "AI-assisted executive reports", href: FEATURE_ROUTES.aiExecutiveReports },
      { label: "Reports documentation", href: "/docs/reports" },
      { label: "Executive report outline", href: TEMPLATE_ROUTES.executiveReport },
      { label: "Client portal delivery", href: FEATURE_ROUTES.clientPortal },
      { label: "Customer health score", href: SOLUTION_ROUTES.customerHealthScore },
      { label: "MSP portfolio operations", href: USE_CASE_ROUTES.msps },
      { label: "Portfolio profitability visibility", href: FEATURE_ROUTES.profitability },
    ],
  },
};

export const SOLUTION_SLUGS = Object.keys(SOLUTION_PAGES);

export const SOLUTION_HUB_ENTRIES = Object.values(SOLUTION_PAGES).map((page) => ({
  slug: page.slug,
  path: page.path,
  title: page.title,
  description: page.description,
}));

export type TemplatePageContent = {
  slug: string;
  path: string;
  eyebrow: string;
  title: string;
  description: string;
  metaDescription: string;
  intro: string;
  sections: ReadonlyArray<{ heading: string; items: readonly string[] }>;
  checklist: readonly string[];
  faq: ReadonlyArray<{ question: string; answer: string }>;
};

export const TEMPLATE_PAGES: Record<string, TemplatePageContent> = {
  "customer-health-score": {
    slug: "customer-health-score",
    path: "/templates/customer-health-score",
    eyebrow: "Template",
    title: "Customer health score framework",
    description: "A practical structure for defining and reviewing client health in agency portfolios.",
    metaDescription:
      "Free customer health score template for agencies — dimensions, review cadence, and operational checklist.",
    intro:
      "Use this framework to define how your agency measures client health using operational signals. Auroranexis can operationalize this structure across your portfolio automatically.",
    sections: [
      {
        heading: "Recommended dimensions",
        items: [
          "Delivery reliability (incidents, SLA breaches)",
          "Risk exposure (open risks, overdue mitigations)",
          "Engagement (report cadence, portal usage)",
          "Automation reliability (failed workflows, integration errors)",
          "Commercial health (scope changes, expansion signals)",
        ],
      },
      {
        heading: "Scoring bands",
        items: [
          "Green — stable operations, no critical open items",
          "Amber — elevated risk or recurring minor issues",
          "Red — critical incidents, SLA breaches, or unresolved high risks",
        ],
      },
    ],
    checklist: [
      "Assign an owner for each client health review",
      "Define review cadence (weekly portfolio, monthly account)",
      "Document escalation path for amber and red clients",
      "Link health reviews to QBR reports",
      "Track changes over time — not just point-in-time opinions",
    ],
    faq: [
      {
        question: "Can Auroranexis automate this template?",
        answer: "Yes. Health signals, incidents, risks, and SLA data can feed portfolio views in the platform.",
      },
    ],
  },
  "risk-register": {
    slug: "risk-register",
    path: "/templates/risk-register",
    eyebrow: "Template",
    title: "Operational risk register template",
    description: "Fields and review cadence for agency delivery risk registers.",
    metaDescription: "Risk register template for agencies — fields, severity matrix, and review checklist.",
    intro:
      "A lightweight risk register structure for operational delivery teams. Use it in workshops or implement directly in Auroranexis.",
    sections: [
      {
        heading: "Core fields",
        items: [
          "Risk ID and title",
          "Client / service line",
          "Category (technical, process, vendor, security)",
          "Likelihood and impact",
          "Owner and status",
          "Mitigation plan and target date",
        ],
      },
    ],
    checklist: [
      "Review open risks weekly in delivery standups",
      "Close or downgrade risks only with documented mitigation",
      "Escalate high-impact risks to account leadership",
      "Link risks to incidents when materialized",
    ],
    faq: [
      {
        question: "Is this an ISO 27001 risk assessment?",
        answer: "No. This template is for operational delivery risks, not certification audit registers.",
      },
    ],
  },
  "incident-response": {
    slug: "incident-response",
    path: "/templates/incident-response",
    eyebrow: "Template",
    title: "Incident response playbook outline",
    description: "A practical incident response structure for agency operations teams.",
    metaDescription: "Incident response template for MSPs — roles, timeline, communication, and post-incident review.",
    intro:
      "Use this outline to standardize how your agency detects, responds to, and learns from client-impacting incidents.",
    sections: [
      {
        heading: "Response phases",
        items: [
          "Detect and classify severity",
          "Assign incident commander and comms owner",
          "Contain and remediate",
          "Customer communication and status updates",
          "Post-incident review and action items",
        ],
      },
    ],
    checklist: [
      "Define severity matrix with SLA implications",
      "Maintain customer communication templates",
      "Log timeline events in a single system of record",
      "Schedule post-incident review within five business days",
    ],
    faq: [
      {
        question: "Does Auroranexis replace PagerDuty?",
        answer: "No. Use Auroranexis as the system of record; integrate paging tools where needed.",
      },
    ],
  },
  "sla-policy": {
    slug: "sla-policy",
    path: "/templates/sla-policy",
    eyebrow: "Template",
    title: "SLA policy template for client contracts",
    description: "Define response and resolution targets for agency service delivery.",
    metaDescription: "SLA policy template — response targets, resolution targets, and breach handling for agencies.",
    intro:
      "A starting point for SLA definitions you can align with contracts and operational tracking in Auroranexis.",
    sections: [
      {
        heading: "Policy components",
        items: [
          "Service hours and coverage window",
          "Severity definitions (P1–P4)",
          "Response time targets by severity",
          "Resolution time targets by severity",
          "Exclusions and maintenance windows",
          "Breach notification and credits (per contract)",
        ],
      },
    ],
    checklist: [
      "Map severities to incident workflow labels",
      "Assign SLA policy per client or tier",
      "Review breach trends monthly",
      "Include SLA summary in client QBR reports",
    ],
    faq: [
      {
        question: "Can policies differ per client?",
        answer: "Yes. Auroranexis supports client-level SLA policy assignment.",
      },
    ],
  },
  "executive-report": {
    slug: "executive-report",
    path: "/templates/executive-report",
    eyebrow: "Template",
    title: "Executive client report outline",
    description: "Structure for QBR and executive operational reports.",
    metaDescription: "Executive report template for agencies — QBR sections, metrics, and narrative structure.",
    intro:
      "A report outline your delivery leads can use for quarterly business reviews and executive updates.",
    sections: [
      {
        heading: "Suggested sections",
        items: [
          "Executive summary (3–5 bullets)",
          "Service performance and SLA outcomes",
          "Open risks and incident highlights",
          "Automation and integration reliability",
          "Upcoming initiatives and recommendations",
          "Appendix: detailed metrics tables",
        ],
      },
    ],
    checklist: [
      "Keep executive summary under one page",
      "Use consistent metrics month over month",
      "Highlight customer-visible wins and resolved incidents",
      "Publish to client portal when appropriate",
    ],
    faq: [
      {
        question: "Can Auroranexis generate this report?",
        answer: "Yes. Use report templates and schedules to assemble operational data into structured deliverables.",
      },
    ],
  },
};

export const TEMPLATE_SLUGS = Object.keys(TEMPLATE_PAGES);

export const TEMPLATE_HUB_ENTRIES = Object.values(TEMPLATE_PAGES).map((page) => ({
  slug: page.slug,
  path: page.path,
  title: page.title,
  description: page.description,
}));
