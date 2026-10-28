import {
  FEATURE_ROUTES,
  GUIDE_ROUTES,
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
  /**
   * Optional <title> tag text when it should differ from the visible H1 — used to match the
   * wording people search for (from Search Console and keyword research) without changing the
   * page heading. Keep it under ~47 characters; " | Auroranexis" is appended.
   */
  seoTitle?: string;
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
    title: "Customer Health Score Software for MSPs",
    seoTitle: "Health Score & Client Retention Software",
    breadcrumbName: "Customer health score",
    description:
      "Customer health score software for MSPs — portfolio signals, thresholds, and executive-ready visibility across managed clients.",
    metaDescription:
      "Customer health score and client retention software for MSPs and agencies: a score per client, early warning signals and the reason behind every change.",
    intro:
      "Auroranexis is customer health score software for MSPs and multi-client agencies. Track customer health using operational signals from reports, incidents, risks, and SLA performance. Instead of relying on spreadsheets or subjective check-ins, teams get a structured view of which clients need attention and why.",
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
      { label: "Health monitoring feature", href: FEATURE_ROUTES.healthMonitoring },
      { label: "Customer success tools", href: FEATURE_ROUTES.customerSuccess },
      { label: "Health score template", href: TEMPLATE_ROUTES.customerHealthScore },
      { label: "Automated client reporting for agencies", href: SOLUTION_ROUTES.aiReporting },
      { label: "SLA tracking for MSPs", href: SOLUTION_ROUTES.slaManagement },
      { label: "MSP portfolio operations", href: USE_CASE_ROUTES.msps },
      { label: "MSP & agency operations pricing", href: MARKETING_ROUTES.pricing },
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
      { label: "NIS2 incident management for IT service providers", href: SOLUTION_ROUTES.incidentManagement },
      { label: "Risk register template", href: TEMPLATE_ROUTES.riskRegister },
      { label: "Automated client reporting for agencies", href: SOLUTION_ROUTES.aiReporting },
    ],
  },
  "incident-management": {
    slug: "incident-management",
    path: SOLUTION_ROUTES.incidentManagement,
    eyebrow: "Solution",
    title: "NIS2 Incident Management for IT Service Providers",
    breadcrumbName: "Incident management",
    definitionTerm: "NIS2 incident management",
    description:
      "NIS2-oriented incident management for IT service providers — timelines, ownership, SLA impact, and audit-ready records across the client portfolio.",
    metaDescription:
      "NIS2 incident management for IT service providers — timelines, SLA tracking, client transparency, and audit logs for operator incident workflows.",
    intro:
      "IT service providers need defensible incident records when client-impacting events occur. Auroranexis centralizes incident management with response timelines, SLA evaluation, and audit history so delivery teams coordinate faster and document what happened — supportive of NIS2-style operator incident obligations without claiming NIS2 certification.",
    problem:
      "Incidents are logged in tickets, email, and chat without a shared client timeline. SLA impact is reconstructed after the fact, which weakens both response and client communication — and leaves little evidence for operator reporting expectations.",
    audience:
      "Delivery and operations leads at IT service providers, MSPs, and agencies who coordinate client-impacting incidents against contractual response targets and operator documentation needs.",
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
        question: "Does Auroranexis claim NIS2 certification?",
        answer:
          "No. Incident and risk workflows help IT service providers document operator-relevant events; Auroranexis does not claim NIS2 certification or act as a compliance authority.",
      },
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
      { label: "SLA tracking for MSPs", href: SOLUTION_ROUTES.slaManagement },
      { label: "Incident response template", href: TEMPLATE_ROUTES.incidentResponse },
      { label: "Automated client reporting for agencies", href: SOLUTION_ROUTES.aiReporting },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
  },
  "sla-management": {
    slug: "sla-management",
    path: SOLUTION_ROUTES.slaManagement,
    eyebrow: "Solution",
    title: "SLA Tracking for MSPs",
    seoTitle: "SLA Management & Tracking Software for MSPs",
    breadcrumbName: "SLA tracking",
    definitionTerm: "SLA tracking",
    description:
      "SLA tracking for MSPs — define policies, monitor breaches, and prove performance across multi-client portfolios.",
    metaDescription:
      "SLA management and tracking software for MSPs: response and resolution targets per client, breach alerts and SLA reports clients can read.",
    intro:
      "SLA tracking is how MSPs prove reliability to clients. On Business and Enterprise plans, Auroranexis lets you define policies per client, monitor incidents and risks against those policies, and report outcomes without manual spreadsheet tracking.",
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
      { label: "NIS2 incident management for IT service providers", href: SOLUTION_ROUTES.incidentManagement },
      { label: "SLA documentation", href: "/docs/sla" },
      { label: "SLA policy template", href: TEMPLATE_ROUTES.slaPolicy },
      { label: "Automated client reporting for agencies", href: SOLUTION_ROUTES.aiReporting },
      { label: "Customer health score software for MSPs", href: SOLUTION_ROUTES.customerHealthScore },
      { label: "MSP portfolio operations", href: USE_CASE_ROUTES.msps },
      { label: "MSP & agency operations pricing", href: MARKETING_ROUTES.pricing },
    ],
  },
  "executive-dashboard": {
    slug: "executive-dashboard",
    path: SOLUTION_ROUTES.executiveDashboard,
    eyebrow: "Solution",
    title: "Executive dashboard for agency operations",
    seoTitle: "Executive Dashboard Software for Agencies",
    description: "Give leadership a portfolio view of clients, risks, incidents, and delivery health.",
    metaDescription:
      "Executive dashboard software for agencies and MSPs: portfolio health, incidents, risks, SLA results and reporting status for every client in one place.",
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
      { label: "Automated client reporting for agencies", href: SOLUTION_ROUTES.aiReporting },
      { label: "Platform features", href: MARKETING_ROUTES.features },
    ],
  },
  "ai-reporting": {
    slug: "ai-reporting",
    path: SOLUTION_ROUTES.aiReporting,
    eyebrow: "Solution",
    title: "Automated Client Reporting Software",
    breadcrumbName: "Automated client reporting",
    definitionTerm: "Automated client reporting",
    description:
      "Automated client reporting for agencies — create, generate, review, and publish reports from operational data with templates, schedules, PDF export, and portal delivery.",
    metaDescription:
      "Automated, AI-assisted client reporting software: templates, schedules, live client data, PDF export and portal delivery, reviewed by your team before sending.",
    intro:
      "Automated client reporting for agencies in Auroranexis turns delivery records into client-ready reports without rebuilding decks from scratch each period. Each report is linked to one client and a reporting period. Templates define the structure. Generate fills metrics and default narrative from workspace data such as health signals, SLA outcomes, related incidents, and open risks. Your team reviews and edits before publish. Published reports can go to the client portal, PDF export, and email where configured. Recurring schedules can create draft shells so cadence does not depend on someone remembering to start the report. Optional AI-assisted executive summaries are available when enabled; they do not replace human review, and reporting works without AI.",
    problem:
      "Agencies still assemble client reports from spreadsheets, ticket exports, and last month's slides. Delivery is late or inconsistent, metrics do not match the live workspace, and there is no durable record of what the client actually received.",
    audience:
      "Account, delivery, and operations teams at agencies, MSPs, and multi-client service firms who publish recurring client reports and QBR packs.",
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
      { label: "AI executive leadership briefings", href: FEATURE_ROUTES.aiExecutiveReports },
      { label: "Reports documentation", href: "/docs/reports" },
      { label: "Executive report outline", href: TEMPLATE_ROUTES.executiveReport },
      { label: "Client portal delivery", href: FEATURE_ROUTES.clientPortal },
      { label: "Customer health score software for MSPs", href: SOLUTION_ROUTES.customerHealthScore },
      { label: "SLA tracking for MSPs", href: SOLUTION_ROUTES.slaManagement },
      { label: "MSP portfolio operations", href: USE_CASE_ROUTES.msps },
      { label: "Portfolio profitability reporting", href: FEATURE_ROUTES.profitability },
      { label: "MSP & agency operations pricing", href: MARKETING_ROUTES.pricing },
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
  /**
   * Optional <title> tag text when it should differ from the visible H1 — used to match the
   * wording people search for (from Search Console and keyword research) without changing the
   * page heading. Keep it under ~47 characters; " | Auroranexis" is appended.
   */
  seoTitle?: string;
  description: string;
  metaDescription: string;
  intro: string;
  /** Filled-in example so readers can copy the structure, rendered as a real table. */
  example?: {
    heading: string;
    caption: string;
    columns: readonly string[];
    rows: ReadonlyArray<readonly string[]>;
    note?: string;
  };
  /** Free CSV version of the example in /public/templates (opens in Excel or Google Sheets). */
  download?: { href: string; label: string };
  /** Step-by-step instructions for filling in and maintaining the template. */
  howTo?: { heading: string; steps: readonly string[] };
  sections: ReadonlyArray<{ heading: string; items: readonly string[] }>;
  checklist: readonly string[];
  faq: ReadonlyArray<{ question: string; answer: string }>;
  relatedLinks?: ReadonlyArray<{ label: string; href: string }>;
};

export const TEMPLATE_PAGES: Record<string, TemplatePageContent> = {
  "risk-register": {
    slug: "risk-register",
    path: "/templates/risk-register",
    eyebrow: "Free template",
    title: "Risk register template for client delivery",
    seoTitle: "Risk Register Template (Free CSV + Example)",
    description:
      "A free risk register template with a filled-in example, a 5×5 likelihood and impact score, and a weekly review routine. Download the CSV for Excel or Google Sheets.",
    metaDescription:
      "Free risk register template: columns, a filled-in example, 5×5 likelihood × impact scoring and a review routine. Download the CSV for Excel or Google Sheets.",
    intro:
      "A risk register is a single list of things that could go wrong, who owns each one, how serious it is and what is being done about it. This version is built for teams that deliver ongoing services to many clients — agencies, MSPs, accounting and facility firms — where one missed risk usually means an unhappy client. Copy the columns below, download the CSV, or track the same fields per client in Auroranexis.",
    example: {
      heading: "Risk register example",
      caption:
        "Example entries. Score = likelihood (1–5) × impact (1–5). 15–25 high, 8–14 medium, 1–7 low.",
      columns: ["ID", "Risk", "Client / service", "Category", "Likelihood", "Impact", "Score", "Owner", "Mitigation", "Due", "Status"],
      rows: [
        ["R-01", "Key contact at the client leaves; no replacement named", "Client A · Managed IT", "Relationship", "3", "4", "12", "Account lead", "Identify a second sponsor; send a handover summary", "2 weeks", "Open"],
        ["R-02", "Backup job failing silently on one site", "Client B · Backup", "Technical", "2", "5", "10", "Service desk lead", "Add failure alerting; test a restore", "1 week", "In progress"],
        ["R-03", "Monthly report delivered late three months in a row", "Client C · SEO retainer", "Delivery", "4", "3", "12", "Delivery manager", "Fix the report date in the contract; automate the draft", "This month", "Open"],
        ["R-04", "Single engineer holds all knowledge of a custom integration", "Client D · Integration", "Resourcing", "3", "4", "12", "Ops lead", "Document the runbook; pair a second engineer", "1 month", "Open"],
        ["R-05", "Vendor price increase not passed on in the contract", "Client E · Licences", "Commercial", "4", "2", "8", "Finance", "Review contract terms at renewal", "Next renewal", "Accepted"],
        ["R-06", "Response-time target (SLA) breached twice this quarter", "Client F · Support", "Service level", "4", "4", "16", "Service manager", "Add on-call cover; review ticket triage", "2 weeks", "Escalated"],
      ],
      note: "Replace the examples with your own. Keep one row per risk, not per symptom.",
    },
    download: { href: "/downloads/templates/risk-register-template.csv", label: "Download risk register template (CSV)" },
    howTo: {
      heading: "How to fill in the risk register",
      steps: [
        "List risks in plain language: what could happen and what it would affect (\"backup failing silently on one site\", not \"backup risk\").",
        "Link every risk to a client or service so the register can be filtered per account.",
        "Score likelihood and impact from 1 to 5 and multiply them. The score decides the order of the weekly review.",
        "Name one owner per risk — a person, not a team — and a due date for the next mitigation step.",
        "Write the mitigation as an action someone can do this week, then update the status after each review.",
        "Close a risk only when the mitigation is done or the risk is formally accepted, and keep closed risks for history.",
      ],
    },
    sections: [
      {
        heading: "Risk register columns",
        items: [
          "ID — a short reference such as R-01, so risks can be mentioned in meetings and reports",
          "Risk — a one-line description of the event and its effect",
          "Client / service — which account or service line is affected",
          "Category — for example technical, delivery, relationship, resourcing, commercial, security",
          "Likelihood and impact — each scored 1 (very low) to 5 (very high)",
          "Score — likelihood × impact, used to sort the register",
          "Owner — one named person responsible for the next step",
          "Mitigation — what is being done to reduce likelihood or impact",
          "Due — when the next mitigation step should be finished",
          "Status — open, in progress, escalated, accepted or closed",
        ],
      },
      {
        heading: "5×5 risk score bands",
        items: [
          "15–25 high: review weekly, escalate to account leadership, agree a dated mitigation",
          "8–14 medium: review every two weeks; owner and due date required",
          "1–7 low: review monthly; it is fine to accept and monitor",
        ],
      },
    ],
    checklist: [
      "Review high risks weekly in the delivery meeting, the rest every two to four weeks",
      "Re-score a risk whenever something changes, not only at the review",
      "Escalate any risk scoring 15 or more to the account lead",
      "When a risk happens, log it as an incident and link the two",
      "Summarise the top risks per client in the monthly or quarterly client report",
    ],
    faq: [
      {
        question: "What is a risk register?",
        answer:
          "A risk register is a list of known risks with, for each one, a description, a likelihood and impact score, an owner, the planned mitigation and the current status. It turns worries into tracked actions and shows at a glance which risks need attention first.",
      },
      {
        question: "What columns should a risk register have?",
        answer:
          "At minimum: ID, risk description, affected client or service, category, likelihood, impact, score, owner, mitigation, due date and status. The template on this page uses exactly these columns.",
      },
      {
        question: "How do you calculate a risk score?",
        answer:
          "Multiply likelihood by impact, each on a 1–5 scale. A risk that is likely (4) and serious (4) scores 16 and lands in the high band. The score is a way to sort the list, not an exact measurement.",
      },
      {
        question: "What is the difference between a risk register and an issue log?",
        answer:
          "A risk register tracks things that might happen; an issue log tracks things that already happened. When a risk materialises, record it as an incident or issue and keep the link to the original risk.",
      },
      {
        question: "How often should a risk register be updated?",
        answer:
          "High risks weekly, the rest every two to four weeks, and immediately when something changes. A register that is only updated before audits stops being useful.",
      },
      {
        question: "Can I use this risk register template in Excel or Google Sheets?",
        answer:
          "Yes. Download the CSV and open it in Excel, Google Sheets or Numbers. Add a formula for the score column (likelihood × impact) and conditional formatting for the bands.",
      },
      {
        question: "Is this an ISO 27001 risk assessment?",
        answer:
          "No. This template is for operational delivery risks across clients. Information-security risk assessments for certification have additional requirements.",
      },
    ],
    relatedLinks: [
      { label: "Operational risk management", href: SOLUTION_ROUTES.riskManagement },
      { label: "Incident response playbook template", href: TEMPLATE_ROUTES.incidentResponse },
      { label: "SLA policy template", href: TEMPLATE_ROUTES.slaPolicy },
      { label: "Quarterly business review template", href: TEMPLATE_ROUTES.quarterlyBusinessReview },
    ],
  },
  "customer-health-score": {
    slug: "customer-health-score",
    path: "/templates/customer-health-score",
    eyebrow: "Free template",
    title: "Customer health score template",
    seoTitle: "Customer Health Score Template & Model",
    description:
      "A weighted customer health score model with five dimensions, example scores for three clients and clear green, amber and red bands. Download the CSV.",
    metaDescription:
      "Free customer health score template: five weighted dimensions, a worked example for three clients, score bands and a review routine. CSV for Excel or Sheets.",
    intro:
      "A customer health score combines a few signals into one number per client so you can see who is at risk before they cancel. This template is designed for service businesses with recurring clients — agencies, MSPs and professional services — and uses signals you already have: delivery, responsiveness, engagement, open issues and the commercial relationship.",
    example: {
      heading: "Customer health score example",
      caption:
        "Each dimension is scored 0–100 and multiplied by its weight. Health score = sum of weighted scores. 75–100 healthy, 50–74 watch, 0–49 at risk.",
      columns: ["Dimension", "Weight", "What to measure", "Client A", "Client B", "Client C"],
      rows: [
        ["Delivery", "30%", "Work delivered on time; SLA targets met", "90", "60", "35"],
        ["Responsiveness", "20%", "Client replies, approvals and attendance at reviews", "80", "70", "40"],
        ["Engagement", "20%", "Reports opened, portal logins, meetings held", "85", "55", "30"],
        ["Open issues", "15%", "Open incidents and high risks (fewer = higher score)", "95", "50", "20"],
        ["Commercial", "15%", "Paying on time; scope growing or stable", "80", "75", "50"],
        ["Health score", "100%", "Weighted total", "86 · healthy", "62 · watch", "35 · at risk"],
      ],
      note: "Client A: 0.30×90 + 0.20×80 + 0.20×85 + 0.15×95 + 0.15×80 = 86.25. Adjust weights to what predicts churn in your business.",
    },
    download: { href: "/downloads/templates/customer-health-score-template.csv", label: "Download health score template (CSV)" },
    howTo: {
      heading: "How to build your customer health score",
      steps: [
        "Pick four to six dimensions you can measure every month without guessing.",
        "Give each a weight; the weights add up to 100%. Start with the example and adjust after a quarter.",
        "Define what 0, 50 and 100 mean for each dimension so two people score the same client the same way.",
        "Score every active client monthly and keep the history — the trend matters more than one number.",
        "Agree an action for each band: thank and expand green clients, review amber ones, start a recovery plan for red ones.",
        "After six months, check which dimensions moved before clients left and increase their weight.",
      ],
    },
    sections: [
      {
        heading: "Score bands and actions",
        items: [
          "75–100 healthy: keep the rhythm; look for expansion or a referral",
          "50–74 watch: account lead reviews the client this month and fixes the weakest dimension",
          "0–49 at risk: recovery plan with an owner, a date and a check-in with the client sponsor",
        ],
      },
    ],
    checklist: [
      "Assign one owner per client for the health review",
      "Score monthly; review the portfolio weekly for red clients",
      "Write down the reason for every score change",
      "Discuss the health trend in quarterly business reviews",
      "Track whether red clients recover — that is the real test of the model",
    ],
    faq: [
      {
        question: "What is a customer health score?",
        answer:
          "A customer health score is a single number, usually 0–100, that summarises how a client relationship is going, based on a few weighted signals such as delivery quality, engagement, open issues and payment behaviour.",
      },
      {
        question: "How do you calculate a customer health score?",
        answer:
          "Score each dimension from 0 to 100, multiply by its weight and add the results. With the weights in this template, a client scoring 90, 80, 85, 95 and 80 gets 0.30×90 + 0.20×80 + 0.20×85 + 0.15×95 + 0.15×80 ≈ 86.",
      },
      {
        question: "Which metrics should a customer health score include?",
        answer:
          "Choose signals you can measure consistently: on-time delivery or SLA performance, client responsiveness, engagement with reports or the portal, open incidents and risks, and commercial signals such as late payments or scope changes.",
      },
      {
        question: "How often should health scores be updated?",
        answer:
          "Monthly for the score itself, with a weekly look at clients in the red band. Automating the inputs makes weekly updates realistic.",
      },
      {
        question: "Can Auroranexis calculate this automatically?",
        answer:
          "Yes. Auroranexis calculates a health score per client from incidents, risks, SLA data, reports and activity, and shows why the score changed. You can still use this template on its own in a spreadsheet.",
      },
    ],
    relatedLinks: [
      { label: "Customer health score guide", href: GUIDE_ROUTES.customerHealthScore },
      { label: "Customer health score software", href: SOLUTION_ROUTES.customerHealthScore },
      { label: "Quarterly business review template", href: TEMPLATE_ROUTES.quarterlyBusinessReview },
    ],
  },
  "quarterly-business-review": {
    slug: "quarterly-business-review",
    path: "/templates/quarterly-business-review",
    eyebrow: "Free template",
    title: "Quarterly business review (QBR) template",
    seoTitle: "Quarterly Business Review (QBR) Template",
    description:
      "A QBR template for agencies, MSPs and service firms: a 60-minute agenda, the slides to prepare, the metrics to bring and the follow-up. Download the agenda as CSV.",
    metaDescription:
      "Free quarterly business review (QBR) template: 60-minute agenda, slide outline, metrics to prepare and follow-up checklist for client reviews. CSV download.",
    intro:
      "A quarterly business review (QBR) is a structured meeting with a client to look back at the last quarter, agree what matters next and catch problems early. A good QBR is mostly about the client's goals, not a list of tasks you completed. Use the agenda below as a starting point and keep the same structure every quarter so trends are easy to compare.",
    example: {
      heading: "QBR agenda (60 minutes)",
      caption: "A typical client QBR. Send the slides two days before the meeting.",
      columns: ["Time", "Section", "What to cover", "Owner"],
      rows: [
        ["0–5 min", "Goals check", "The client's goals for the year and whether they changed", "Account lead"],
        ["5–15 min", "Results last quarter", "Three to five outcomes tied to those goals, with numbers", "Account lead"],
        ["15–25 min", "Service performance", "SLA targets met, incidents and how they were resolved", "Service / delivery lead"],
        ["25–35 min", "Risks and open issues", "Top risks, what is being done, what you need from the client", "Delivery lead"],
        ["35–50 min", "Next quarter plan", "Priorities, upcoming changes, proposals and budget", "Account lead + client"],
        ["50–60 min", "Feedback and actions", "What to improve; actions with owners and dates", "Both sides"],
      ],
      note: "Keep the results section to outcomes the client cares about. Detailed task lists belong in an appendix.",
    },
    download: { href: "/downloads/templates/qbr-agenda-template.csv", label: "Download QBR agenda (CSV)" },
    howTo: {
      heading: "How to run a quarterly business review",
      steps: [
        "Two weeks before: pull the quarter's numbers — delivery, SLA performance, incidents, risks and health score trend.",
        "One week before: draft the slides and agree the three main messages with your team.",
        "Two days before: send the slides and ask the client what they want to discuss.",
        "In the meeting: start with their goals, show results against them, be open about problems and agree next steps.",
        "Within 48 hours: send a short summary with actions, owners and dates.",
        "Next quarter: open by reviewing the actions from this QBR.",
      ],
    },
    sections: [
      {
        heading: "QBR slide outline",
        items: [
          "1. Title and attendees",
          "2. The client's goals and how this quarter contributed",
          "3. Key results with numbers (three to five)",
          "4. Service performance: SLA results and incidents",
          "5. Risks, open issues and what you need from the client",
          "6. Plan and recommendations for next quarter",
          "7. Actions, owners and dates",
          "Appendix: detailed metrics and task lists",
        ],
      },
      {
        heading: "Metrics to prepare",
        items: [
          "Results against the client's goals (for example leads, uptime, processing times)",
          "SLA performance: share of tickets or jobs within target",
          "Incidents: number, severity and time to resolve",
          "Open risks and their status",
          "Client health score and its trend over the quarter",
          "Work delivered and work planned",
        ],
      },
    ],
    checklist: [
      "Book QBRs for the whole year at the start of the contract",
      "Invite a decision-maker from the client, not only day-to-day contacts",
      "Use the same slide structure every quarter",
      "Bring at least one proposal for the next quarter",
      "Track whether QBR actions were completed",
    ],
    faq: [
      {
        question: "What is a quarterly business review?",
        answer:
          "A quarterly business review (QBR) is a meeting every three months between a service provider and a client to review results, service performance and risks, and to agree priorities for the next quarter.",
      },
      {
        question: "What should be included in a QBR?",
        answer:
          "The client's goals, results against those goals, service performance such as SLA results and incidents, risks and open issues, the plan for next quarter and a list of actions with owners.",
      },
      {
        question: "How long should a QBR be?",
        answer:
          "Usually 45 to 60 minutes. If it regularly runs longer, move detail into an appendix or a separate working session.",
      },
      {
        question: "Who should attend a QBR?",
        answer:
          "From your side the account lead and the delivery or service lead; from the client a decision-maker plus the day-to-day contact. Without a decision-maker, agreed priorities often do not stick.",
      },
      {
        question: "How do MSPs use QBRs?",
        answer:
          "MSPs use QBRs to show SLA performance, incidents, security and infrastructure risks, and a technology roadmap with budget for the next quarters.",
      },
      {
        question: "Can Auroranexis prepare QBR data?",
        answer:
          "Yes. Auroranexis collects SLA results, incidents, risks and health scores per client and can generate a report draft for the quarter that you review before sharing.",
      },
    ],
    relatedLinks: [
      { label: "Executive report template", href: TEMPLATE_ROUTES.executiveReport },
      { label: "Customer health score template", href: TEMPLATE_ROUTES.customerHealthScore },
      { label: "Automated client reporting", href: SOLUTION_ROUTES.aiReporting },
      { label: "SLA reporting guide", href: GUIDE_ROUTES.slaReporting },
    ],
  },
  "incident-response": {
    slug: "incident-response",
    path: "/templates/incident-response",
    eyebrow: "Free template",
    title: "Incident response playbook template",
    seoTitle: "Incident Response Playbook Template (Free)",
    description:
      "An incident response playbook for teams serving many clients: severity levels, roles, a step-by-step response timeline, client updates and the post-incident review.",
    metaDescription:
      "Free incident response playbook template: severity levels P1–P4, roles, response steps, client communication and post-incident review for MSPs and agencies.",
    intro:
      "An incident response playbook tells everyone what to do in the first hour of a client-impacting incident: who leads, how serious it is, who tells the client and how you learn from it afterwards. This template covers operational incidents such as outages, failed deliveries or data problems. Security incidents may also have legal reporting duties — check what applies to you.",
    example: {
      heading: "Severity levels",
      caption: "Example severity matrix. Align the response targets with your SLA policy.",
      columns: ["Severity", "Definition", "Example", "First response", "Client update"],
      rows: [
        ["P1 critical", "Service down or data at risk for a client", "Client's main system unavailable", "15 minutes", "Every hour"],
        ["P2 high", "Major function impaired, no workaround", "Email delivery failing for one site", "1 hour", "Every 4 hours"],
        ["P3 medium", "Function impaired, workaround exists", "Report export slow but working", "4 business hours", "Daily"],
        ["P4 low", "Minor issue or question", "Cosmetic error in a dashboard", "1 business day", "On resolution"],
      ],
    },
    howTo: {
      heading: "Incident response steps",
      steps: [
        "Detect and log: record the incident with client, time and first symptoms in one system.",
        "Classify severity using the matrix and assign an incident lead.",
        "Contain: stop the impact from spreading; restore service before finding the root cause if possible.",
        "Communicate: the communication owner informs the client at the agreed intervals, even if there is no news.",
        "Resolve and confirm with the client that service is back to normal.",
        "Review within five business days: timeline, cause, what went well, actions with owners.",
      ],
    },
    sections: [
      {
        heading: "Roles",
        items: [
          "Incident lead — makes decisions and keeps the timeline",
          "Technical responders — investigate and fix",
          "Communication owner — updates the client and internal stakeholders",
          "Account lead — joins for P1/P2 and handles the client relationship",
        ],
      },
      {
        heading: "Client update template",
        items: [
          "What happened and when it started",
          "What is affected and what still works",
          "What we are doing now",
          "When the next update will come",
        ],
      },
    ],
    checklist: [
      "Agree the severity matrix with clients and link it to the SLA policy",
      "Keep client update templates ready",
      "Log every step of the timeline in one place",
      "Hold the post-incident review within five business days",
      "Add new risks found during the incident to the risk register",
    ],
    faq: [
      {
        question: "What is an incident response playbook?",
        answer:
          "A written, step-by-step plan for handling incidents: how to classify severity, who does what, how and when to inform affected clients, and how to review the incident afterwards.",
      },
      {
        question: "What are P1, P2, P3 and P4 incidents?",
        answer:
          "Priority levels from critical (P1, service down) to low (P4, minor issue). Each level has its own response and update times, which should match your SLA commitments.",
      },
      {
        question: "Does Auroranexis replace paging tools like PagerDuty?",
        answer:
          "No. Auroranexis is the record of incidents per client with SLA tracking and client communication; keep a paging tool for alerting on-call engineers if you need one.",
      },
    ],
    relatedLinks: [
      { label: "Incident management software", href: SOLUTION_ROUTES.incidentManagement },
      { label: "SLA policy template", href: TEMPLATE_ROUTES.slaPolicy },
      { label: "Risk register template", href: TEMPLATE_ROUTES.riskRegister },
    ],
  },
  "sla-policy": {
    slug: "sla-policy",
    path: "/templates/sla-policy",
    eyebrow: "Free template",
    title: "SLA policy template",
    seoTitle: "SLA Policy Template: Response & Resolution",
    description:
      "An SLA policy template with response and resolution targets per priority, service hours, exclusions and how breaches are measured and reported. Download the CSV.",
    metaDescription:
      "Free SLA policy template: response and resolution times per priority, service hours, exclusions and breach reporting for MSPs, agencies and service firms.",
    intro:
      "A service level agreement (SLA) policy states how fast you respond to and resolve client requests, during which hours, and how performance is measured. Clear targets protect both sides. The targets below are examples — set them to what your team can reliably deliver.",
    example: {
      heading: "SLA targets by priority",
      caption: "Example targets during service hours (Monday–Friday, 08:00–18:00 client time).",
      columns: ["Priority", "Definition", "Response target", "Resolution target", "Measured"],
      rows: [
        ["Critical", "Service down for the client", "30 minutes", "4 hours", "24/7 if contracted"],
        ["High", "Major function impaired", "2 hours", "1 business day", "Service hours"],
        ["Medium", "Function impaired, workaround exists", "4 hours", "3 business days", "Service hours"],
        ["Low", "Question or minor issue", "1 business day", "10 business days", "Service hours"],
      ],
      note: "Report SLA performance as the share of tickets within target, not as an average time.",
    },
    download: { href: "/downloads/templates/sla-policy-template.csv", label: "Download SLA targets (CSV)" },
    sections: [
      {
        heading: "What an SLA policy should contain",
        items: [
          "Service hours and time zone",
          "Priority definitions with examples",
          "Response and resolution targets per priority",
          "How time is measured (when the clock starts, pauses and stops)",
          "Exclusions such as planned maintenance or client-caused delays",
          "How breaches are reported and what happens next (for example service credits, if contracted)",
        ],
      },
    ],
    checklist: [
      "Use the same priority names in the SLA, the ticket system and the incident playbook",
      "Assign an SLA policy to each client or service tier",
      "Review breaches monthly and fix the cause, not only the ticket",
      "Show SLA results in the monthly report and the QBR",
    ],
    faq: [
      {
        question: "What is an SLA policy?",
        answer:
          "An SLA policy defines the service levels a provider commits to — mainly response and resolution times per priority, service hours and how performance is measured and reported.",
      },
      {
        question: "What is the difference between response time and resolution time?",
        answer:
          "Response time is how long until a person acknowledges and starts working on the request. Resolution time is how long until the problem is fixed or a workaround is in place.",
      },
      {
        question: "How do you report SLA performance?",
        answer:
          "Report the percentage of tickets handled within target per priority and per client, plus the number of breaches and their causes. Averages hide the slow cases clients remember.",
      },
      {
        question: "Can SLA policies differ per client?",
        answer:
          "Yes. In Auroranexis each client can have its own SLA policy with response and resolution targets per priority.",
      },
    ],
    relatedLinks: [
      { label: "SLA management software", href: SOLUTION_ROUTES.slaManagement },
      { label: "SLA reporting guide", href: GUIDE_ROUTES.slaReporting },
      { label: "Incident response playbook template", href: TEMPLATE_ROUTES.incidentResponse },
    ],
  },
  "executive-report": {
    slug: "executive-report",
    path: "/templates/executive-report",
    eyebrow: "Free template",
    title: "Executive report template for client reviews",
    seoTitle: "Executive Report Template for Client Reviews",
    description:
      "An executive report template for monthly or quarterly client updates: a one-page summary, results, service performance, risks and next steps — with an example summary.",
    metaDescription:
      "Free executive report template for client reviews: one-page executive summary, results, SLA performance, risks and recommendations, with a written example.",
    intro:
      "Senior client stakeholders read the first page of a report and little else. An executive report puts the answer to \"is this going well and what do you need from me?\" on that page, with the detail behind it. Use this outline for monthly executive updates or as the written version of a quarterly business review.",
    example: {
      heading: "Executive summary example",
      caption: "The first page of an executive client report (example content).",
      columns: ["Section", "Example"],
      rows: [
        ["Overall status", "On track. Two of three quarterly goals reached; the third is delayed by two weeks."],
        ["Highlights", "Ticket backlog down by a third; new reporting dashboard live; no critical incidents."],
        ["Service performance", "Response targets met for nearly all tickets; two high-priority breaches, both explained in section 3."],
        ["Risks", "One high risk: a single point of knowledge on the billing integration. Mitigation in progress."],
        ["Decisions needed", "Approve the scope for the Q3 migration by the 15th."],
        ["Next steps", "Migration plan, second engineer onboarded, next review on the first Tuesday of next month."],
      ],
    },
    sections: [
      {
        heading: "Executive report outline",
        items: [
          "1. Executive summary (one page, five to seven lines)",
          "2. Results against the client's goals",
          "3. Service performance: SLA results, incidents and causes",
          "4. Risks and open issues, with mitigations",
          "5. Recommendations and decisions needed",
          "6. Appendix: detailed metrics and task lists",
        ],
      },
    ],
    checklist: [
      "Write the summary last, after the detail is final",
      "Use the same metrics every period so trends are visible",
      "State decisions you need from the client with a date",
      "Keep the summary to one page",
    ],
    faq: [
      {
        question: "What is an executive report?",
        answer:
          "A short report for senior stakeholders that summarises status, results, risks and the decisions needed, with supporting detail in later sections or an appendix.",
      },
      {
        question: "How long should an executive summary be?",
        answer: "One page at most, ideally five to seven short lines that can be read in under a minute.",
      },
      {
        question: "Can Auroranexis generate executive reports?",
        answer:
          "Yes. Auroranexis generates report drafts from client data (health, SLA results, incidents and risks) using templates and schedules. You review and edit before publishing to the client portal or sending as PDF.",
      },
    ],
    relatedLinks: [
      { label: "Quarterly business review template", href: TEMPLATE_ROUTES.quarterlyBusinessReview },
      { label: "Automated client reporting", href: SOLUTION_ROUTES.aiReporting },
      { label: "Automated client reporting guide", href: GUIDE_ROUTES.automatedClientReporting },
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
