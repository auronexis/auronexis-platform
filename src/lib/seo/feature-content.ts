import {
  MARKETING_ROUTES,
  FEATURE_ROUTES,
  SOLUTION_ROUTES,
} from "@/lib/company/company-links";
import {
  buildLandingPage,
  landingPageSlugs,
  landingPageList,
} from "@/lib/seo/landing-page-builder";
import type { LandingHubEntry, LandingPageContent } from "@/lib/seo/landing-page-types";

export const FEATURE_PAGES: Record<string, LandingPageContent> = {
  "ai-executive-reports": buildLandingPage({
    slug: "ai-executive-reports",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "AI executive reports for client delivery teams",
    description:
      "Generate structured executive summaries from verified operational data — with clear separation between facts and recommendations.",
    metaDescription:
      "AI executive reports for MSPs and agencies — portfolio summaries, client narratives, and leadership-ready briefings in Auroranexis.",
    problem:
      "Leadership briefings are assembled manually from spreadsheets, ticket exports, and email threads. By the time a report reaches a client or executive, the narrative is outdated and hard to defend.",
    solution:
      "Auroranexis drafts executive reports from live client data — incidents, risks, SLA outcomes, and delivery activity. AI assists with narrative structure while keeping source signals visible so reviewers can validate claims before publication.",
    businessValue:
      "Reduce hours spent on recurring executive reporting while improving consistency across your portfolio. Teams publish briefings faster and with a clearer audit trail of what data informed each summary.",
    audience:
      "Operations leaders, client success directors, and delivery managers at MSPs and agencies who produce recurring executive updates for clients or internal leadership.",
    enterpriseAdvantages: [
      "Organization-scoped report generation with role-based review before client delivery",
      "Evidence-linked summaries that distinguish verified metrics from AI recommendations",
      "Scheduled generation aligned to QBR and monthly reporting cadences",
      "Export and portal publication controls for client-facing distribution",
    ],
    benefits: [
      {
        title: "Faster briefing cycles",
        description:
          "Draft executive summaries from current portfolio data instead of rebuilding slides from scratch each period.",
      },
      {
        title: "Consistent narrative structure",
        description:
          "Apply repeatable report templates so every client receives the same quality of operational context.",
      },
      {
        title: "Review before publish",
        description:
          "Validate AI-assisted narratives against underlying records before sharing with clients or executives.",
      },
    ],
    capabilities: [
      "Executive report templates with configurable sections and branding",
      "AI-assisted narrative generation from incidents, risks, and SLA data",
      "Source signal visibility for reviewer validation",
      "PDF export and client portal publication options",
      "Scheduled report generation for recurring delivery cadences",
    ],
    faq: [
      {
        question: "Does AI executive reporting replace human review?",
        answer:
          "No. Auroranexis is designed for human-in-the-loop review. AI assists with structure and narrative; your team approves content before publication.",
      },
      {
        question: "What data sources feed executive reports?",
        answer:
          "Reports draw from operational records in your workspace — clients, incidents, risks, SLA performance, and delivery activity — depending on your configured templates.",
      },
    ],
    relatedLinks: [
      { label: "Reports", href: FEATURE_ROUTES.reports },
      { label: "Executive dashboards", href: FEATURE_ROUTES.executiveDashboards },
      { label: "AI reporting solution", href: SOLUTION_ROUTES.aiReporting },
      { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  "client-portal": buildLandingPage({
    slug: "client-portal",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "Client portal for transparent delivery",
    description:
      "Give clients a secure view of reports, health status, and operational updates — with controls over what you share.",
    metaDescription:
      "B2B client portal for MSPs — secure report delivery, status visibility, and controlled transparency in Auroranexis.",
    problem:
      "Client updates arrive as email attachments and ad-hoc links with no consistent experience. Teams struggle to prove delivery value and maintain a single source of truth clients can access on demand.",
    solution:
      "Auroranexis provides a branded client portal where you publish approved reports, share appropriate operational status, and give clients self-service access to delivery artifacts. You control visibility per client and per record type.",
    businessValue:
      "Strengthen client relationships with predictable, professional delivery touchpoints. Reduce back-and-forth email requests while keeping sensitive internal data out of client view.",
    audience:
      "Account managers, client success teams, and operations leaders at agencies who need a controlled transparency layer for multi-client portfolios.",
    enterpriseAdvantages: [
      "Per-client visibility rules for reports, incidents, and health indicators",
      "Branded portal experience aligned to your organization settings",
      "Secure access with organization-scoped authentication",
      "Publication workflow that separates internal drafts from client-visible content",
    ],
    benefits: [
      {
        title: "Controlled transparency",
        description:
          "Share what clients need to see without exposing internal risk notes, draft reports, or team-only context.",
      },
      {
        title: "Professional delivery experience",
        description:
          "Replace scattered email attachments with a consistent portal clients can bookmark and revisit.",
      },
      {
        title: "Reduced status requests",
        description:
          "Clients self-serve published reports and status updates, freeing account teams from repetitive check-ins.",
      },
    ],
    capabilities: [
      "Client-facing portal with organization branding",
      "Report publication and portal-only delivery rules",
      "Configurable visibility for incidents, health, and operational status",
      "Secure client authentication and access scoping",
      "Activity history for published portal content",
    ],
    faq: [
      {
        question: "Can clients see all operational data?",
        answer:
          "No. You control what is published to the portal. Internal drafts, unresolved risks, and team-only records remain in your workspace.",
      },
      {
        question: "Is white-label portal branding available?",
        answer:
          "Branding options depend on your plan. Business and Enterprise tiers support organization-level portal customization.",
      },
    ],
    relatedLinks: [
      { label: "Reports", href: FEATURE_ROUTES.reports },
      { label: "Health monitoring", href: FEATURE_ROUTES.healthMonitoring },
      { label: "Customer health score", href: SOLUTION_ROUTES.customerHealthScore },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  automation: buildLandingPage({
    slug: "automation",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "Automation workflows for agency operations",
    description:
      "Define triggers, actions, and execution history to reduce manual follow-up across your client portfolio.",
    metaDescription:
      "Operations automation for MSPs — triggers, actions, execution logs, and delivery event workflows in Auroranexis.",
    problem:
      "Repeatable operational tasks — escalation reminders, status updates, report notifications — still depend on individuals remembering to act. Manual coordination does not scale across dozens of clients.",
    solution:
      "Auroranexis lets you build automation workflows with defined triggers and actions inside your operations workspace. Monitor execution history, connect delivery events, and standardize responses without leaving the platform.",
    businessValue:
      "Free delivery teams from repetitive coordination while improving consistency. Automations run with organization-scoped logs so leaders can audit what fired and when.",
    audience:
      "Operations managers, delivery leads, and technical account teams at MSPs and automation agencies who standardize multi-client workflows.",
    enterpriseAdvantages: [
      "Organization-scoped automation with execution audit logs",
      "Integration with incidents, risks, and reporting events",
      "Connector-backed actions for external system coordination",
      "Role-based access for workflow creation and monitoring",
    ],
    benefits: [
      {
        title: "Less manual follow-up",
        description:
          "Automate recurring responses to operational events instead of relying on inbox reminders and spreadsheets.",
      },
      {
        title: "Consistent execution",
        description:
          "Apply the same workflow logic across clients so nothing depends on who is on shift.",
      },
      {
        title: "Traceable history",
        description:
          "Review execution logs to understand what ran, what failed, and what needs adjustment.",
      },
    ],
    capabilities: [
      "Trigger and action workflow builder",
      "Execution history with status and error visibility",
      "Event-driven automation tied to operational records",
      "Connector integration for external tool actions",
      "Organization-scoped workflow management",
    ],
    faq: [
      {
        question: "Do I need engineering resources to build automations?",
        answer:
          "No. Auroranexis provides a workflow builder for common operational triggers and actions. Complex integrations may require connector configuration.",
      },
      {
        question: "Can automations react to incidents or SLA breaches?",
        answer:
          "Yes. Workflows can respond to operational events such as incident creation or SLA threshold warnings where configured.",
      },
    ],
    relatedLinks: [
      { label: "Integrations", href: FEATURE_ROUTES.integrations },
      { label: "Incidents", href: FEATURE_ROUTES.incidents },
      { label: "Monitoring", href: FEATURE_ROUTES.monitoring },
      { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  monitoring: buildLandingPage({
    slug: "monitoring",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "Portfolio monitoring for multi-client teams",
    description:
      "Track operational signals, open work, and delivery exceptions across your client portfolio from one view.",
    metaDescription:
      "Agency portfolio monitoring — operational alerts, delivery exceptions, and multi-client visibility in Auroranexis.",
    problem:
      "Operations teams discover problems late because status lives in disconnected tools. Without portfolio-level monitoring, overdue work and emerging issues surface only during client calls.",
    solution:
      "Auroranexis aggregates operational signals — open incidents, overdue reports, risk changes, and SLA warnings — into portfolio monitoring views. Teams see what changed and which clients need attention without switching systems.",
    businessValue:
      "Shift from reactive firefighting to proactive portfolio management. Leaders allocate attention based on current signals rather than whoever escalated loudest.",
    audience:
      "Operations directors, service delivery managers, and team leads at MSPs managing multi-client portfolios with shared delivery standards.",
    enterpriseAdvantages: [
      "Portfolio-wide dashboards with client-level drill-down",
      "Configurable alert thresholds tied to SLA and delivery policies",
      "Integration with incidents, risks, and reporting modules",
      "Organization-scoped visibility with role-based access controls",
    ],
    benefits: [
      {
        title: "Portfolio-wide awareness",
        description:
          "See operational status across all clients instead of checking each account individually.",
      },
      {
        title: "Earlier exception detection",
        description:
          "Surface overdue work, open incidents, and SLA warnings before they reach client conversations.",
      },
      {
        title: "Prioritized attention",
        description:
          "Focus team capacity on clients and records that need action now, not on routine status gathering.",
      },
    ],
    capabilities: [
      "Multi-client monitoring dashboards",
      "Alert indicators for incidents, risks, and SLA breaches",
      "Overdue report and delivery task visibility",
      "Client-level drill-down from portfolio views",
      "Activity feed integration for recent operational changes",
    ],
    faq: [
      {
        question: "Is this infrastructure uptime monitoring?",
        answer:
          "No. Auroranexis monitors operational delivery signals — incidents, risks, reports, and SLA performance — not server infrastructure metrics.",
      },
      {
        question: "Can I customize what triggers alerts?",
        answer:
          "Alert visibility depends on your configured SLA policies, workflow rules, and operational record status within the workspace.",
      },
    ],
    relatedLinks: [
      { label: "Health monitoring", href: FEATURE_ROUTES.healthMonitoring },
      { label: "Executive dashboards", href: FEATURE_ROUTES.executiveDashboards },
      { label: "SLA management", href: SOLUTION_ROUTES.slaManagement },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  "risk-intelligence": buildLandingPage({
    slug: "risk-intelligence",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "Risk intelligence for client delivery",
    description:
      "Register, prioritize, and track operational risks with client context, ownership, and audit-ready history.",
    metaDescription:
      "Operational risk intelligence for agencies — risk registers, mitigation tracking, and portfolio risk visibility in Auroranexis.",
    problem:
      "Delivery risks are captured in spreadsheets, chat threads, or not at all until they become incidents. Without structured risk intelligence, teams cannot demonstrate control to clients or leadership.",
    solution:
      "Auroranexis provides a risk register tied to clients, owners, and remediation workflows. Track severity, status, and mitigation progress with full change history so risk posture is visible across your portfolio.",
    businessValue:
      "Reduce surprise escalations by surfacing risks early. Give account and leadership teams a defensible record of what was identified, who owns it, and how it was resolved.",
    audience:
      "Delivery managers, compliance-aware operations teams, and client-facing leaders at MSPs and consultancies managing operational delivery risk.",
    enterpriseAdvantages: [
      "Client-associated risk registers with ownership and severity tracking",
      "Audit logs for risk status changes and mitigation updates",
      "Portfolio views to compare open risk exposure across clients",
      "Integration with incidents, reports, and executive dashboards",
    ],
    benefits: [
      {
        title: "Structured risk capture",
        description:
          "Log likelihood, impact, owners, and mitigation steps in a consistent format across all clients.",
      },
      {
        title: "Portfolio risk visibility",
        description:
          "Compare open risk exposure across accounts to prioritize leadership attention and remediation.",
      },
      {
        title: "Defensible audit trail",
        description:
          "Track changes and resolutions for customer reviews and internal governance conversations.",
      },
    ],
    capabilities: [
      "Risk creation, assignment, and resolution workflows",
      "Severity and status tracking with portfolio filters",
      "Client-level risk association and context",
      "Change history and audit logs for risk records",
      "Links to incidents, reports, and automation workflows",
    ],
    faq: [
      {
        question: "Does Auroranexis replace an enterprise GRC platform?",
        answer:
          "No. It focuses on operational delivery risks for agencies and service providers, not enterprise-wide governance certification management.",
      },
      {
        question: "Can risks link to incidents?",
        answer:
          "Yes. Risks and incidents can be associated within the workspace to show how operational issues relate to identified exposure.",
      },
    ],
    relatedLinks: [
      { label: "Incidents", href: FEATURE_ROUTES.incidents },
      { label: "Risk management solution", href: SOLUTION_ROUTES.riskManagement },
      { label: "Executive dashboards", href: FEATURE_ROUTES.executiveDashboards },
      { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  "health-monitoring": buildLandingPage({
    slug: "health-monitoring",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "Client health monitoring across your portfolio",
    description:
      "Combine operational signals into client health indicators so teams know which accounts need attention and why.",
    metaDescription:
      "Client health monitoring for MSPs — portfolio health signals, threshold alerts, and account oversight in Auroranexis.",
    problem:
      "Account health is assessed subjectively during QBRs or when a client threatens to churn. Without structured health signals, teams intervene too late to protect delivery quality and revenue.",
    solution:
      "Auroranexis derives client health indicators from operational data — incident volume, open risks, SLA performance, and delivery activity. Teams see which clients are stable, which are declining, and what signals drive the assessment.",
    businessValue:
      "Enable proactive account management with evidence-backed health views. Leadership allocates retention and delivery resources based on current portfolio signals, not gut feel.",
    audience:
      "Client success managers, account directors, and operations leaders at agencies who oversee multi-client portfolios and recurring business reviews.",
    enterpriseAdvantages: [
      "Health indicators derived from verified operational records",
      "Configurable thresholds and ownership assignments per client",
      "Portfolio dashboards for leadership and account team reviews",
      "Client portal visibility options for transparent status sharing",
    ],
    benefits: [
      {
        title: "Evidence-backed health views",
        description:
          "Base account assessments on incidents, risks, and SLA data instead of subjective check-in notes.",
      },
      {
        title: "Early intervention signals",
        description:
          "Identify declining accounts before renewal conversations or executive escalations.",
      },
      {
        title: "QBR-ready summaries",
        description:
          "Export health context for quarterly reviews without manual data assembly.",
      },
    ],
    capabilities: [
      "Client-level health indicators from operational signals",
      "Portfolio health dashboards with trend visibility",
      "Threshold configuration and ownership assignments",
      "Integration with incidents, risks, and SLA modules",
      "Export-friendly summaries for account reviews",
    ],
    faq: [
      {
        question: "Is the health score a black-box AI metric?",
        answer:
          "No. Health indicators reflect operational signals in your workspace — such as incident volume, open risks, and SLA outcomes — with visible underlying data.",
      },
      {
        question: "Can clients see their health status?",
        answer:
          "You control portal visibility. Share appropriate health context with clients based on your delivery and contractual policies.",
      },
    ],
    relatedLinks: [
      { label: "Customer success", href: FEATURE_ROUTES.customerSuccess },
      { label: "Monitoring", href: FEATURE_ROUTES.monitoring },
      { label: "Customer health score", href: SOLUTION_ROUTES.customerHealthScore },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  "executive-dashboards": buildLandingPage({
    slug: "executive-dashboards",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "Executive dashboards for operations leadership",
    description:
      "Give leadership a portfolio-level view of delivery performance, open exceptions, and client status without manual reporting.",
    metaDescription:
      "Executive dashboards for MSPs — portfolio KPIs, delivery exceptions, and leadership visibility in Auroranexis.",
    problem:
      "Executives rely on slide decks that take days to compile and are outdated on arrival. Without live dashboards, leadership decisions lag behind operational reality.",
    solution:
      "Auroranexis executive dashboards aggregate portfolio KPIs — client health, open incidents, risk exposure, SLA performance, and delivery metrics — into views designed for leadership review. Drill down to client detail when exceptions require attention.",
    businessValue:
      "Accelerate leadership decision cycles with current operational data. Reduce time spent in status meetings by giving executives self-service visibility into portfolio performance.",
    audience:
      "COOs, operations VPs, and managing partners at MSPs and agencies who need portfolio-level visibility without requesting manual reports from delivery teams.",
    enterpriseAdvantages: [
      "Portfolio KPI views with client-level drill-down",
      "Role-based dashboard access for leadership and operations teams",
      "Integration with reports, incidents, risks, and profitability data",
      "Export options for board and investor reporting where needed",
    ],
    benefits: [
      {
        title: "Live portfolio visibility",
        description:
          "Leadership sees current operational status instead of waiting for monthly report cycles.",
      },
      {
        title: "Exception-focused review",
        description:
          "Highlight open incidents, SLA breaches, and at-risk clients so meetings focus on decisions, not data gathering.",
      },
      {
        title: "Consistent leadership metrics",
        description:
          "Standardize how performance is measured across the portfolio for repeatable executive reviews.",
      },
    ],
    capabilities: [
      "Portfolio-level executive dashboard views",
      "KPI aggregation from incidents, risks, SLA, and delivery data",
      "Client drill-down for exception investigation",
      "Role-based access for leadership and operations roles",
      "Integration with AI executive reports for narrative export",
    ],
    faq: [
      {
        question: "Can I customize dashboard metrics?",
        answer:
          "Dashboard views reflect operational data configured in your workspace. Metric availability depends on your active modules and client records.",
      },
      {
        question: "Are dashboards suitable for client-facing use?",
        answer:
          "Executive dashboards are designed for internal leadership. Client-facing visibility is handled through the client portal and published reports.",
      },
    ],
    relatedLinks: [
      { label: "AI executive reports", href: FEATURE_ROUTES.aiExecutiveReports },
      { label: "Profitability", href: FEATURE_ROUTES.profitability },
      { label: "Executive dashboard solution", href: SOLUTION_ROUTES.executiveDashboard },
      { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  "knowledge-base": buildLandingPage({
    slug: "knowledge-base",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "Knowledge base for delivery teams",
    description:
      "Centralize runbooks, procedures, and client context so teams resolve issues consistently across your portfolio.",
    metaDescription:
      "Operations knowledge base for agencies — runbooks, delivery procedures, and team reference content in Auroranexis.",
    problem:
      "Institutional knowledge lives in individual inboxes, wikis, and shared drives with no connection to client work. New team members ramp slowly and experienced staff repeat the same explanations.",
    solution:
      "Auroranexis provides an organization-scoped knowledge base for runbooks, procedures, and delivery reference content. Teams access consistent guidance alongside client records instead of searching disconnected documentation systems.",
    businessValue:
      "Improve delivery consistency and reduce onboarding time. Standardize how teams handle recurring scenarios so quality does not depend on who is assigned.",
    audience:
      "Operations managers, team leads, and enablement-focused leaders at MSPs and agencies building repeatable delivery playbooks.",
    enterpriseAdvantages: [
      "Organization-scoped content with role-based access",
      "Structured articles linked to operational workflows",
      "Searchable reference content alongside client context",
      "Audit-friendly content management for procedure updates",
    ],
    benefits: [
      {
        title: "Consistent delivery playbooks",
        description:
          "Document procedures once and make them accessible to every team member handling client work.",
      },
      {
        title: "Faster onboarding",
        description:
          "New hires find runbooks and context in the same workspace where they manage clients and incidents.",
      },
      {
        title: "Reduced tribal knowledge",
        description:
          "Capture expertise in searchable articles instead of relying on senior staff for repeated guidance.",
      },
    ],
    capabilities: [
      "Article creation and organization-scoped publishing",
      "Search across knowledge base content",
      "Role-based access for sensitive procedures",
      "Integration with client and incident workflows for contextual reference",
      "Content versioning and update history",
    ],
    faq: [
      {
        question: "Can clients access the knowledge base?",
        answer:
          "The knowledge base is designed for internal delivery teams. Client-facing documentation is shared through reports and the client portal.",
      },
      {
        question: "Does this replace a dedicated wiki platform?",
        answer:
          "It provides operational reference content within your command center. Teams may still use external wikis for broader company documentation.",
      },
    ],
    relatedLinks: [
      { label: "Incidents", href: FEATURE_ROUTES.incidents },
      { label: "Automation", href: FEATURE_ROUTES.automation },
      { label: "Documentation", href: MARKETING_ROUTES.documentation },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  incidents: buildLandingPage({
    slug: "incidents",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "Incident management with SLA awareness",
    description:
      "Track incidents, response timelines, ownership, and SLA impact across your client portfolio.",
    metaDescription:
      "Agency incident management — timelines, SLA tracking, ownership, and client transparency in Auroranexis.",
    problem:
      "When operations break, coordination happens in chat threads with no shared record. Clients receive inconsistent updates and leadership cannot assess SLA impact across the portfolio.",
    solution:
      "Auroranexis centralizes incident records with severity, ownership, client association, and response timelines. Evaluate incidents against SLA policies and share appropriate status through the client portal.",
    businessValue:
      "Resolve issues with accountability and prove reliability to clients. Incident history becomes a defensible record for QBRs, SLA reviews, and post-incident analysis.",
    audience:
      "Service delivery managers, operations coordinators, and technical account teams at MSPs handling multi-client incident response.",
    enterpriseAdvantages: [
      "Incident lifecycle tracking with severity and status workflows",
      "SLA policy evaluation and breach indicators",
      "Client portal sharing controls for transparent communication",
      "Activity history and audit logs for post-incident review",
    ],
    benefits: [
      {
        title: "Single incident workspace",
        description:
          "Log incidents with severity, owners, and client context in one system of record.",
      },
      {
        title: "SLA-aware response",
        description:
          "Evaluate incidents against client SLA policies and surface breach warnings in real time.",
      },
      {
        title: "Client transparency",
        description:
          "Share appropriate incident status through the portal without manual status email threads.",
      },
    ],
    capabilities: [
      "Incident creation, assignment, and resolution workflows",
      "Severity and status tracking with portfolio filters",
      "SLA policy evaluation and breach indicators",
      "Activity timeline and ownership history",
      "Links to risks, automation workflows, and reports",
    ],
    faq: [
      {
        question: "Can incidents trigger automations?",
        answer:
          "Yes. Auroranexis supports automation workflows that react to incident events where configured in your workspace.",
      },
      {
        question: "Is this an on-call paging system?",
        answer:
          "It is an operations record and coordination layer. Integrate with your existing paging or ticketing tools via connectors.",
      },
    ],
    relatedLinks: [
      { label: "Risk intelligence", href: FEATURE_ROUTES.riskIntelligence },
      { label: "Activity timeline", href: FEATURE_ROUTES.activityTimeline },
      { label: "Incident management solution", href: SOLUTION_ROUTES.incidentManagement },
      { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  profitability: buildLandingPage({
    slug: "profitability",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "Profitability visibility for client portfolios",
    description:
      "Connect delivery effort to client revenue context so leaders understand which accounts drive margin and which need attention.",
    metaDescription:
      "Client profitability for MSPs — delivery cost visibility, margin context, and portfolio financial oversight in Auroranexis.",
    problem:
      "Agencies grow revenue without clear visibility into which clients consume disproportionate delivery effort. Profitability conversations happen in finance spreadsheets disconnected from operational reality.",
    solution:
      "Auroranexis brings profitability context into your operations workspace alongside delivery records. Leaders correlate client effort, incident volume, and service delivery patterns with financial visibility for portfolio decisions.",
    businessValue:
      "Support pricing reviews, scope conversations, and resource allocation with operational and financial context in one place. Identify clients where delivery cost outpaces contract value before margins erode.",
    audience:
      "Managing partners, finance-aware operations leaders, and client directors at MSPs and agencies managing retainer and project-based client relationships.",
    enterpriseAdvantages: [
      "Client-level profitability context within the operations workspace",
      "Portfolio views for margin and effort comparison",
      "Integration with delivery metrics, incidents, and reporting data",
      "Role-based access for finance and operations leadership",
    ],
    benefits: [
      {
        title: "Margin-aware portfolio decisions",
        description:
          "See which clients consume disproportionate delivery effort relative to contract value.",
      },
      {
        title: "Operational-financial alignment",
        description:
          "Connect incident volume, reporting cadence, and service patterns to profitability context.",
      },
      {
        title: "Data for scope conversations",
        description:
          "Support renewal and upsell discussions with delivery evidence alongside financial indicators.",
      },
    ],
    capabilities: [
      "Client-level profitability indicators and context",
      "Portfolio comparison views for margin analysis",
      "Correlation with delivery activity and incident records",
      "Export-friendly summaries for leadership reviews",
      "Role-based access for sensitive financial data",
    ],
    faq: [
      {
        question: "Does Auroranexis replace my accounting system?",
        answer:
          "No. It provides operational profitability context within your command center. Full financial accounting remains in your finance tools.",
      },
      {
        question: "What data inputs profitability views?",
        answer:
          "Profitability indicators reflect configured client financial context and operational delivery signals within your workspace.",
      },
    ],
    relatedLinks: [
      { label: "Executive dashboards", href: FEATURE_ROUTES.executiveDashboards },
      { label: "Customer success", href: FEATURE_ROUTES.customerSuccess },
      { label: "Reports", href: FEATURE_ROUTES.reports },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  "customer-success": buildLandingPage({
    slug: "customer-success",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "Customer success tools for agency portfolios",
    description:
      "Track adoption, engagement, and delivery outcomes to support retention and proactive account management.",
    metaDescription:
      "Customer success for MSPs — adoption tracking, account oversight, and retention-focused delivery in Auroranexis.",
    problem:
      "Customer success teams lack operational visibility into how clients use delivered services. Retention conversations happen without evidence of adoption gaps or delivery friction.",
    solution:
      "Auroranexis connects customer success workflows to operational data — health indicators, report engagement, incident patterns, and delivery activity. Account teams see which clients are thriving and which need structured intervention.",
    businessValue:
      "Improve retention with evidence-backed account reviews. Align customer success outreach with actual delivery signals instead of calendar-driven check-ins alone.",
    audience:
      "Client success managers, account directors, and revenue retention leaders at MSPs and agencies with recurring client relationships.",
    enterpriseAdvantages: [
      "Health and adoption signals integrated with operational records",
      "Account review context for QBR and renewal preparation",
      "Portfolio prioritization for at-risk client intervention",
      "Client portal engagement visibility where configured",
    ],
    benefits: [
      {
        title: "Evidence-backed account reviews",
        description:
          "Prepare for QBRs and renewals with health, incident, and delivery data instead of anecdotal notes.",
      },
      {
        title: "Proactive retention focus",
        description:
          "Identify accounts showing declining signals before they reach formal escalation.",
      },
      {
        title: "Aligned CS and operations",
        description:
          "Give customer success teams the same operational context delivery teams use daily.",
      },
    ],
    capabilities: [
      "Client health and adoption signal tracking",
      "Account review summaries for QBR preparation",
      "Portfolio prioritization for at-risk clients",
      "Integration with reports, portal, and incident data",
      "Activity history for account touchpoint context",
    ],
    faq: [
      {
        question: "Does Auroranexis replace a dedicated CS platform?",
        answer:
          "It provides operational customer success context within your command center. Teams may integrate with CRM tools via connectors for broader sales workflows.",
      },
      {
        question: "How are adoption signals measured?",
        answer:
          "Signals reflect operational activity in your workspace — report engagement, portal usage, incident patterns, and configured health indicators.",
      },
    ],
    relatedLinks: [
      { label: "Health monitoring", href: FEATURE_ROUTES.healthMonitoring },
      { label: "Client portal", href: FEATURE_ROUTES.clientPortal },
      { label: "Customer health score", href: SOLUTION_ROUTES.customerHealthScore },
      { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  reports: buildLandingPage({
    slug: "reports",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "Client reporting with schedules and portal delivery",
    description:
      "Create, schedule, and publish client reports with templates, PDF export, and controlled portal distribution.",
    metaDescription:
      "Client reporting for MSPs — templates, schedules, PDF export, and portal delivery in Auroranexis.",
    problem:
      "Recurring client reports are assembled manually from multiple data sources. Delivery is inconsistent, late, and difficult to prove when clients question the value of your services.",
    solution:
      "Auroranexis provides a structured reporting workflow — draft, generate, review, publish, and schedule — with templates and client portal delivery. Teams maintain a published record of every report sent to each client.",
    businessValue:
      "Establish predictable reporting cadences that demonstrate ongoing value. Reduce manual assembly time while improving consistency and auditability across your portfolio.",
    audience:
      "Delivery managers, account teams, and operations leads at agencies producing recurring client reports and QBR materials.",
    enterpriseAdvantages: [
      "Report templates with configurable sections and branding",
      "Scheduled generation and publication workflows",
      "PDF export and client portal delivery controls",
      "Version history and audit trail for published reports",
    ],
    benefits: [
      {
        title: "Predictable delivery cadence",
        description:
          "Schedule recurring reports so clients receive consistent updates without last-minute assembly.",
      },
      {
        title: "Template-driven consistency",
        description:
          "Apply standardized report structures across clients while customizing content per account.",
      },
      {
        title: "Published record of value",
        description:
          "Maintain a history of delivered reports for renewals, QBRs, and client transparency.",
      },
    ],
    capabilities: [
      "Report template creation and management",
      "Draft, review, publish, and schedule workflows",
      "PDF export for client delivery",
      "Client portal publication with visibility controls",
      "Report history and version tracking",
    ],
    faq: [
      {
        question: "Can reports include operational data automatically?",
        answer:
          "Yes. Reports can incorporate incidents, risks, SLA outcomes, and delivery metrics from your workspace depending on template configuration.",
      },
      {
        question: "Are AI-generated report sections available?",
        answer:
          "AI-assisted narrative features are available for executive reports. Standard reports use configured templates with operational data.",
      },
    ],
    relatedLinks: [
      { label: "AI executive reports", href: FEATURE_ROUTES.aiExecutiveReports },
      { label: "Client portal", href: FEATURE_ROUTES.clientPortal },
      { label: "AI reporting solution", href: SOLUTION_ROUTES.aiReporting },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  "activity-timeline": buildLandingPage({
    slug: "activity-timeline",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "Activity timeline for operational audit trails",
    description:
      "Review a chronological record of changes, actions, and delivery events across clients and team members.",
    metaDescription:
      "Operations activity timeline for agencies — audit trails, change history, and delivery event logs in Auroranexis.",
    problem:
      "When something changes — an incident status, a risk assignment, a published report — teams cannot easily reconstruct who did what and when. Accountability and post-review analysis suffer.",
    solution:
      "Auroranexis activity timeline captures operational events across your workspace — record changes, assignments, publications, and workflow executions — in a searchable chronological feed with client and user context.",
    businessValue:
      "Support accountability, post-incident review, and compliance conversations with a clear record of operational activity. Reduce time spent reconstructing events from email and chat history.",
    audience:
      "Operations managers, compliance-aware team leads, and delivery directors at agencies who need traceable activity across multi-client portfolios.",
    enterpriseAdvantages: [
      "Organization-scoped activity logging across operational modules",
      "User and client context for every recorded event",
      "Filterable timeline views for incident and account review",
      "Integration with audit and compliance workflows",
    ],
    benefits: [
      {
        title: "Clear accountability",
        description:
          "See who changed records, published reports, or updated incident status and when.",
      },
      {
        title: "Faster post-incident review",
        description:
          "Reconstruct event sequences from a unified timeline instead of searching multiple systems.",
      },
      {
        title: "Compliance-ready history",
        description:
          "Maintain activity records suitable for internal governance and client transparency requests.",
      },
    ],
    capabilities: [
      "Chronological activity feed across operational modules",
      "User, client, and record-type filtering",
      "Change history for incidents, risks, and reports",
      "Automation execution event logging",
      "Export-friendly activity summaries for reviews",
    ],
    faq: [
      {
        question: "How long is activity history retained?",
        answer:
          "Retention depends on your plan and organization settings. Enterprise plans support extended history for governance requirements.",
      },
      {
        question: "Can clients see the activity timeline?",
        answer:
          "The full activity timeline is an internal operations view. Clients see published content through the portal.",
      },
    ],
    relatedLinks: [
      { label: "Incidents", href: FEATURE_ROUTES.incidents },
      { label: "Automation", href: FEATURE_ROUTES.automation },
      { label: "Risk intelligence", href: FEATURE_ROUTES.riskIntelligence },
      { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  integrations: buildLandingPage({
    slug: "integrations",
    pathPrefix: "/features",
    category: "feature",
    eyebrow: "Feature",
    title: "Integrations and connectors for your stack",
    description:
      "Connect CRM, ticketing, and productivity tools with OAuth flows and sync jobs to keep operational data current.",
    metaDescription:
      "MSP integrations — CRM, ticketing, OAuth connectors, and sync workflows in Auroranexis.",
    problem:
      "Client and delivery data lives in external systems that operations teams reconcile manually. Swivel-chair work between tools creates delays, errors, and incomplete portfolio views.",
    solution:
      "Auroranexis integrations connect approved external systems via OAuth and configured sync jobs. Operational records stay aligned with your CRM, ticketing, and productivity tools without constant manual export and import.",
    businessValue:
      "Reduce reconciliation overhead and keep your command center current. Teams spend less time copying data between systems and more time acting on portfolio signals.",
    audience:
      "Technical operations leads, integration administrators, and delivery managers at MSPs connecting Auroranexis to existing client and service management tools.",
    enterpriseAdvantages: [
      "OAuth-based connector authentication for supported systems",
      "Organization-scoped integration inventory and status monitoring",
      "Sync job configuration with execution history",
      "Role-based access for integration administration",
    ],
    benefits: [
      {
        title: "Less manual reconciliation",
        description:
          "Sync client and event data from connected systems instead of maintaining parallel spreadsheets.",
      },
      {
        title: "Current operational context",
        description:
          "Keep portfolio views aligned with your CRM and ticketing tools through configured sync jobs.",
      },
      {
        title: "Controlled connector access",
        description:
          "Manage OAuth credentials and integration permissions at the organization level.",
      },
    ],
    capabilities: [
      "Connector catalog with OAuth authorization flows",
      "Sync job configuration and execution monitoring",
      "Integration status and error visibility",
      "Event-driven data alignment with operational records",
      "Organization-scoped connector administration",
    ],
    faq: [
      {
        question: "Which systems can I connect?",
        answer:
          "Auroranexis supports a growing catalog of CRM, ticketing, and productivity connectors. See the integrations page for current availability.",
      },
      {
        question: "Do integrations require custom development?",
        answer:
          "Supported connectors use OAuth and configured sync jobs. Custom integrations may require Enterprise plan discussion with our team.",
      },
    ],
    relatedLinks: [
      { label: "Automation", href: FEATURE_ROUTES.automation },
      { label: "Monitoring", href: FEATURE_ROUTES.monitoring },
      { label: "Integrations overview", href: MARKETING_ROUTES.integrations },
      { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),
};

export const FEATURE_SLUGS = landingPageSlugs(FEATURE_PAGES);

export const FEATURE_HUB_ENTRIES: LandingHubEntry[] = landingPageList(FEATURE_PAGES).map(
  (page) => ({
    slug: page.slug,
    path: page.path,
    title: page.title,
    description: page.description,
  }),
);
