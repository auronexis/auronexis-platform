import {
  MARKETING_ROUTES,
  USE_CASE_ROUTES,
  FEATURE_ROUTES,
  SOLUTION_ROUTES,
} from "@/lib/company/company-links";
import {
  buildLandingPage,
  landingPageList,
  landingPageSlugs,
} from "@/lib/seo/landing-page-builder";
import type { LandingHubEntry, LandingPageContent } from "@/lib/seo/landing-page-types";

export const AUDIENCE_PAGES: Record<string, LandingPageContent> = {
  "marketing-agencies": buildLandingPage({
    slug: "marketing-agencies",
    pathPrefix: "/use-cases",
    category: "audience",
    eyebrow: "Use case",
    title: "Client operations for marketing agencies",
    description:
      "Unify campaign delivery, client reporting, and account health across your agency portfolio in one operational workspace.",
    metaDescription:
      "Marketing agency client operations — portfolio visibility, executive reporting, and delivery accountability in Auroranexis.",
    problem:
      "Marketing agencies manage dozens of retainers with fragmented tools for reporting, client communication, and delivery tracking. Account teams spend hours assembling QBR decks while leadership lacks a reliable view of which clients are healthy, at risk, or underperforming against SLAs.",
    solution:
      "Auroranexis gives marketing agencies a client-centric command center. Connect each account to incidents, risks, reports, and health signals so account managers, strategists, and leadership work from the same operational record — not scattered spreadsheets and inbox threads.",
    businessValue:
      "Reduce manual reporting overhead, surface at-risk accounts earlier, and demonstrate measurable delivery value during renewals. Agencies protect margin by standardizing how teams monitor, communicate, and report across the portfolio.",
    audience:
      "Performance marketing agencies, brand agencies, and full-service shops managing multi-client retainers who need portfolio visibility, client-facing transparency, and executive-ready reporting without adding headcount.",
    enterpriseAdvantages: [
      "Organization-scoped workspaces with role-based access for account, strategy, and leadership teams",
      "White-label client portal options for branded status sharing on Business and Enterprise plans",
      "Audit logs for sensitive account changes and compliance workflows",
      "Configurable SLA policies per client tier to align delivery accountability with contract terms",
    ],
    benefits: [
      {
        title: "Portfolio health at a glance",
        description:
          "See which clients need attention based on operational signals — not subjective check-ins or lagging revenue data.",
      },
      {
        title: "Executive-ready reporting",
        description:
          "Generate structured client reports and QBR summaries from live delivery data instead of manual slide assembly.",
      },
      {
        title: "Client transparency",
        description:
          "Share appropriate status, incidents, and progress through a dedicated portal that reinforces trust and retention.",
      },
    ],
    capabilities: [
      "Client-level health indicators derived from incidents, risks, and delivery activity",
      "Scheduled and on-demand executive reports with export support",
      "Client portal with configurable visibility for status and documentation",
      "Activity timelines for account history and handoff continuity",
      "Integration hooks for CRM, ticketing, and automation workflows",
    ],
    challenges: [
      "Account managers juggle client updates across email, Slack, and project tools with no single source of truth",
      "Leadership discovers churn risk only when contracts are up for renewal",
      "QBR preparation consumes senior time because data lives in disconnected systems",
      "Delivery quality varies by team because there is no shared operational standard",
    ],
    workflowImprovements: [
      "Assign each client a workspace record with owners, SLAs, and linked operational data",
      "Review portfolio health dashboards weekly instead of ad-hoc account reviews",
      "Publish client-facing status through the portal before scheduled check-ins",
      "Use report templates to standardize QBR output across account teams",
    ],
    expectedOutcomes: [
      "Faster QBR preparation with data pulled from a single operational system",
      "Earlier identification of at-risk accounts through structured health signals",
      "Consistent client communication that scales as the portfolio grows",
      "Clearer renewal conversations backed by delivery evidence rather than anecdotes",
    ],
    faq: [
      {
        question: "Does Auroranexis replace our project management tool?",
        answer:
          "No. It complements project tools by providing the client operations layer — health, reporting, incidents, risks, and portal visibility — that PM software typically does not cover.",
      },
      {
        question: "Can we white-label the client portal?",
        answer:
          "Yes. Business and Enterprise plans support white-label branding so clients see your agency identity, not Auroranexis.",
      },
      {
        question: "How do health scores work for marketing clients?",
        answer:
          "Health indicators combine operational signals such as incident volume, open risks, SLA performance, and delivery activity. They are transparent and configurable, not opaque AI scores.",
      },
    ],
    relatedLinks: [
      { label: "Digital agencies", href: USE_CASE_ROUTES.digitalAgencies },
      { label: "Customer health score", href: SOLUTION_ROUTES.customerHealthScore },
      { label: "Executive reports", href: FEATURE_ROUTES.reports },
      { label: "Pricing", href: MARKETING_ROUTES.pricing },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "seePricing",
  }),

  "it-service-providers": buildLandingPage({
    slug: "it-service-providers",
    pathPrefix: "/use-cases",
    category: "audience",
    eyebrow: "Use case",
    title: "Operational command center for IT service providers",
    description:
      "Manage incidents, SLAs, and client accountability across your service portfolio from one structured workspace.",
    metaDescription:
      "IT service provider operations — incident tracking, SLA management, and multi-client visibility in Auroranexis.",
    problem:
      "IT service providers coordinate delivery across ticketing systems, monitoring tools, and client communication channels. Without a portfolio-level view, managers react to escalations instead of managing proactively, and SLA performance is difficult to prove during contract reviews.",
    solution:
      "Auroranexis centralizes client records, incident lifecycles, SLA policies, and risk registers so IT service teams operate from a shared system of record. Technicians, account managers, and leadership see the same data — reducing handoff friction and improving client transparency.",
    businessValue:
      "Prove SLA compliance with auditable records, reduce time spent on status reporting, and scale delivery standards as the client base grows. Service providers protect revenue by demonstrating reliability before clients question it.",
    audience:
      "Managed IT firms, outsourced IT departments, and technology service providers delivering recurring support and infrastructure services to business clients.",
    enterpriseAdvantages: [
      "Per-client SLA policy configuration with breach tracking and escalation integration",
      "Role-based access separating technician, account, and executive visibility",
      "Audit trails for incident resolution and policy changes",
      "API access and integration connectors for existing RMM, PSA, and monitoring stacks",
    ],
    benefits: [
      {
        title: "Incident accountability",
        description:
          "Track severity, ownership, timelines, and resolution status for every client incident in one workspace.",
      },
      {
        title: "SLA proof on demand",
        description:
          "Evaluate incidents against client-specific SLA policies and surface breaches before they become disputes.",
      },
      {
        title: "Portfolio oversight",
        description:
          "Operations leaders see open incidents, risks, and health trends across all clients without switching tools.",
      },
    ],
    capabilities: [
      "Incident lifecycle management with severity, status, and ownership",
      "SLA policy definitions with automatic breach evaluation",
      "Risk registers linked to clients and remediation workflows",
      "Client portal for transparent incident and status sharing",
      "Executive dashboards for portfolio-wide operational visibility",
    ],
    challenges: [
      "Incident history is trapped in technician inboxes and PSA tickets with no executive summary",
      "SLA breaches are discovered after the fact, damaging client trust",
      "Account managers lack visibility into open operational issues across their book",
      "Scaling the client base means more manual status reporting, not better delivery",
    ],
    workflowImprovements: [
      "Log and assign incidents with client context and SLA evaluation from creation",
      "Review portfolio dashboards daily to prioritize accounts with open critical items",
      "Share incident status through the client portal instead of reactive email updates",
      "Include SLA performance in scheduled client reports and QBRs",
    ],
    expectedOutcomes: [
      "Reduced SLA disputes backed by timestamped operational records",
      "Faster incident resolution through clear ownership and escalation paths",
      "Proactive account management based on portfolio health signals",
      "Scalable reporting that does not require additional operations headcount",
    ],
    faq: [
      {
        question: "Does Auroranexis replace our PSA or RMM?",
        answer:
          "It is designed to complement your existing stack. Use integrations and API access to connect operational data while Auroranexis provides the client-facing operations and reporting layer.",
      },
      {
        question: "Can clients see incident status in real time?",
        answer:
          "Yes. The client portal supports configurable visibility for incidents, risks, and reports based on your delivery policies.",
      },
      {
        question: "How are SLAs configured?",
        answer:
          "Define response and resolution targets per client or tier. Auroranexis evaluates incidents against those policies and surfaces breach warnings on records and dashboards.",
      },
    ],
    relatedLinks: [
      { label: "MSPs", href: USE_CASE_ROUTES.msps },
      { label: "Incident management", href: SOLUTION_ROUTES.incidentManagement },
      { label: "SLA management", href: SOLUTION_ROUTES.slaManagement },
      { label: "Integrations", href: FEATURE_ROUTES.integrations },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "seePricing",
  }),

  msps: buildLandingPage({
    slug: "msps",
    pathPrefix: "/use-cases",
    category: "audience",
    eyebrow: "Use case",
    title: "Portfolio operations built for MSPs",
    description:
      "Monitor multi-client health, prove SLA performance, and standardize delivery across your managed services portfolio.",
    metaDescription:
      "MSP client operations — portfolio health, SLA tracking, incident management, and client portal in Auroranexis.",
    problem:
      "MSPs operate at scale with hundreds of endpoints and dozens of clients, yet operational visibility remains fragmented. Leadership cannot quickly answer which accounts are at risk, technicians lack context during handoffs, and QBR preparation pulls senior staff away from delivery.",
    solution:
      "Auroranexis gives MSPs a portfolio command center designed for multi-client operators. Track health signals, incidents, risks, and SLA performance per client while providing transparent status through a branded portal — all from one workspace.",
    businessValue:
      "Protect recurring revenue by identifying at-risk accounts early, reduce churn through proactive transparency, and scale operations without proportional growth in reporting overhead. MSPs compete on reliability — Auroranexis helps you prove it.",
    audience:
      "Managed service providers of all sizes — from boutique MSPs to regional operators — who need portfolio visibility, SLA accountability, and client-facing transparency at scale.",
    enterpriseAdvantages: [
      "High client limits on Business and Enterprise plans for large portfolios",
      "White-label portal branding for client-facing delivery",
      "Escalation rule integration for critical incident routing",
      "Dedicated onboarding and custom limits on Enterprise plans",
    ],
    benefits: [
      {
        title: "Multi-client health monitoring",
        description:
          "Aggregate operational signals across your portfolio to surface accounts that need attention before renewal conversations.",
      },
      {
        title: "SLA performance proof",
        description:
          "Track and report SLA outcomes per client with auditable records suitable for contract reviews and QBRs.",
      },
      {
        title: "Standardized delivery",
        description:
          "Apply consistent incident, risk, and reporting workflows across all clients regardless of team size.",
      },
    ],
    capabilities: [
      "Portfolio dashboards with health, incident, and risk summaries",
      "Per-client SLA policies with breach indicators",
      "Client portal with white-label options",
      "Automation workflows triggered by operational events",
      "Executive reports and export for QBR and leadership reviews",
    ],
    challenges: [
      "Portfolio health is assessed subjectively during account reviews instead of continuously",
      "SLA data lives in PSA exports that are outdated by the time leadership sees them",
      "Client communication is inconsistent — some accounts get proactive updates, others do not",
      "Growing the client base increases reporting burden linearly",
    ],
    workflowImprovements: [
      "Configure health thresholds and review portfolio dashboards on a fixed cadence",
      "Assign SLA policies by client tier at onboarding and monitor breaches automatically",
      "Deliver status updates through the client portal as standard practice",
      "Use report templates for QBRs instead of building decks from scratch each quarter",
    ],
    expectedOutcomes: [
      "Proactive account management driven by operational data, not gut feel",
      "Documented SLA performance that strengthens renewal negotiations",
      "Consistent client experience across the entire portfolio",
      "Operations that scale without adding reporting-focused roles",
    ],
    faq: [
      {
        question: "How many clients can an MSP manage in Auroranexis?",
        answer:
          "Professional supports up to 25 clients. Business and Enterprise plans offer higher limits, with custom allocations available through sales for large portfolios.",
      },
      {
        question: "Does this integrate with ConnectWise, Datto, or other MSP tools?",
        answer:
          "Auroranexis provides integration connectors and API access. Specific connector availability depends on your plan and configured integrations.",
      },
      {
        question: "Can we automate responses to operational events?",
        answer:
          "Yes. Automation workflows can react to incidents, health changes, and other operational signals where configured.",
      },
    ],
    relatedLinks: [
      { label: "IT service providers", href: USE_CASE_ROUTES.itServiceProviders },
      { label: "Customer health score", href: SOLUTION_ROUTES.customerHealthScore },
      { label: "Monitoring", href: FEATURE_ROUTES.monitoring },
      { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  consultancies: buildLandingPage({
    slug: "consultancies",
    pathPrefix: "/use-cases",
    category: "audience",
    eyebrow: "Use case",
    title: "Delivery operations for consultancies",
    description:
      "Package operational insights, track engagement health, and demonstrate ongoing value across consulting retainers and programs.",
    metaDescription:
      "Consultancy client operations — engagement tracking, executive reporting, and portfolio visibility in Auroranexis.",
    problem:
      "Consultancies deliver high-touch engagements but struggle to operationalize client oversight between steering committees. Partners lack portfolio visibility, engagement health is assessed anecdotally, and value demonstration depends on senior consultants assembling reports manually.",
    solution:
      "Auroranexis gives consultancies a structured operations layer for multi-client engagements. Track risks, incidents, delivery milestones, and health signals per client while producing executive-ready reports that reinforce the value of ongoing advisory relationships.",
    businessValue:
      "Extend retainer relationships by demonstrating continuous value, reduce partner time spent on status assembly, and identify engagement risks before they affect client satisfaction or renewal decisions.",
    audience:
      "Management consultancies, technology advisory firms, and boutique consulting practices managing multiple concurrent client engagements with recurring or project-based contracts.",
    enterpriseAdvantages: [
      "Executive dashboards tailored for partner-level portfolio reviews",
      "Knowledge base integration for engagement documentation and handoffs",
      "Compliance center for audit-ready delivery records on Business and Enterprise plans",
      "Custom onboarding for firms with complex engagement structures",
    ],
    benefits: [
      {
        title: "Engagement visibility",
        description:
          "Track delivery health, open risks, and operational signals for every active engagement from one workspace.",
      },
      {
        title: "Value documentation",
        description:
          "Produce structured reports that translate operational progress into executive narratives for steering committees.",
      },
      {
        title: "Partner oversight",
        description:
          "Give partners portfolio-level visibility without requiring status meetings for every engagement.",
      },
    ],
    capabilities: [
      "Client records with engagement context, owners, and linked operational data",
      "Risk registers for delivery and transformation program oversight",
      "Executive report generation with export for client presentations",
      "Activity timelines for engagement history and continuity",
      "Client portal for transparent progress sharing between steering meetings",
    ],
    challenges: [
      "Engagement status lives in partner heads and email threads, not operational systems",
      "Steering committee preparation consumes billable senior time",
      "At-risk engagements are flagged too late to adjust delivery approach",
      "Knowledge from completed engagements does not transfer cleanly to new teams",
    ],
    workflowImprovements: [
      "Create a client record at engagement kickoff with owners, risks, and reporting cadence",
      "Review portfolio health before weekly partner meetings instead of per-engagement status calls",
      "Publish interim progress through the client portal between formal steering sessions",
      "Archive engagement activity in timelines for knowledge transfer and case development",
    ],
    expectedOutcomes: [
      "Reduced partner time on status assembly and report preparation",
      "Earlier intervention on engagements showing operational risk signals",
      "Stronger renewal conversations supported by documented delivery evidence",
      "Improved knowledge continuity across engagement teams and transitions",
    ],
    faq: [
      {
        question: "Is Auroranexis a project management tool for consulting?",
        answer:
          "It focuses on the client operations layer — health, risks, reporting, and portal visibility — rather than task-level project management. It complements your existing engagement tools.",
      },
      {
        question: "Can we customize reports for different engagement types?",
        answer:
          "Yes. Report templates and export options support varied engagement formats, from advisory retainers to transformation programs.",
      },
      {
        question: "How does this help with partner-level oversight?",
        answer:
          "Executive dashboards aggregate health, risks, and activity across all clients so partners review portfolio status without individual status meetings.",
      },
    ],
    relatedLinks: [
      { label: "Enterprise teams", href: USE_CASE_ROUTES.enterpriseTeams },
      { label: "Executive dashboard", href: SOLUTION_ROUTES.executiveDashboard },
      { label: "Knowledge base", href: FEATURE_ROUTES.knowledgeBase },
      { label: "Pilot program", href: MARKETING_ROUTES.pilotProgram },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "seePricing",
  }),

  "cybersecurity-companies": buildLandingPage({
    slug: "cybersecurity-companies",
    pathPrefix: "/use-cases",
    category: "audience",
    eyebrow: "Use case",
    title: "Client delivery for cybersecurity firms",
    description:
      "Track incidents, risks, and compliance posture across your security services portfolio with audit-ready operational records.",
    metaDescription:
      "Cybersecurity company client operations — incident tracking, risk registers, and audit-ready delivery in Auroranexis.",
    problem:
      "Cybersecurity firms deliver critical services where accountability and documentation matter. Yet incident response records, risk assessments, and client communication often live in disconnected tools, making it difficult to demonstrate control during audits, QBRs, or post-incident reviews.",
    solution:
      "Auroranexis provides cybersecurity service providers with a structured client operations workspace. Log incidents with timelines, maintain risk registers with ownership and mitigation tracking, and share appropriate status through a secure client portal — all with audit trails for sensitive actions.",
    businessValue:
      "Demonstrate operational maturity to enterprise clients, reduce time spent on compliance documentation, and maintain consistent delivery standards as the security portfolio grows.",
    audience:
      "MSSPs, vCISO providers, penetration testing firms, and security consultancies managing multi-client security services with contractual accountability requirements.",
    enterpriseAdvantages: [
      "Audit logging for sensitive operational and configuration changes",
      "Role-based access with organization-scoped permissions",
      "Compliance center workflows on Business and Enterprise plans",
      "EU-friendly data residency via Supabase Frankfurt region support",
    ],
    benefits: [
      {
        title: "Incident documentation",
        description:
          "Maintain timestamped incident records with severity, ownership, and resolution timelines suitable for post-incident review.",
      },
      {
        title: "Risk register management",
        description:
          "Track identified risks with likelihood, impact, owners, and mitigation status per client engagement.",
      },
      {
        title: "Audit-ready records",
        description:
          "Activity history and change logs provide evidence of operational control for client and regulatory reviews.",
      },
    ],
    capabilities: [
      "Incident lifecycle tracking with severity and timeline documentation",
      "Risk registers with assignment, status, and mitigation workflows",
      "SLA policy evaluation for security response commitments",
      "Client portal with controlled visibility for status and reports",
      "Compliance center integration for audit workflows",
    ],
    challenges: [
      "Incident response documentation is incomplete or inconsistent across analysts",
      "Risk registers are maintained in spreadsheets without client-level context",
      "Clients request evidence of operational control that takes days to assemble",
      "Scaling security services means more manual reporting, not better governance",
    ],
    workflowImprovements: [
      "Log security incidents with client association and SLA evaluation at creation",
      "Maintain living risk registers linked to each client instead of periodic spreadsheet updates",
      "Share incident status and remediation progress through the client portal",
      "Include risk and incident summaries in scheduled executive reports",
    ],
    expectedOutcomes: [
      "Complete incident records available for post-incident review within hours, not days",
      "Current risk posture visible per client without manual data aggregation",
      "Faster response to client audit and compliance documentation requests",
      "Consistent security delivery standards across the entire portfolio",
    ],
    faq: [
      {
        question: "Does Auroranexis replace a SIEM or SOAR platform?",
        answer:
          "No. It is the client operations and accountability layer — incident records, risk tracking, reporting, and portal visibility — not a security monitoring or orchestration platform.",
      },
      {
        question: "Are audit logs available for compliance reviews?",
        answer:
          "Yes. Sensitive actions are logged with timestamps and actor information. Compliance center features on higher plans support structured audit workflows.",
      },
      {
        question: "Can we control what security data clients see?",
        answer:
          "Portal visibility is configurable per client. You decide which incidents, risks, and reports are shared based on contractual and operational policies.",
      },
    ],
    relatedLinks: [
      { label: "MSPs", href: USE_CASE_ROUTES.msps },
      { label: "Risk management", href: SOLUTION_ROUTES.riskManagement },
      { label: "Risk intelligence", href: FEATURE_ROUTES.riskIntelligence },
      { label: "Security", href: MARKETING_ROUTES.security },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "seePricing",
  }),

  "digital-agencies": buildLandingPage({
    slug: "digital-agencies",
    pathPrefix: "/use-cases",
    category: "audience",
    eyebrow: "Use case",
    title: "Operations platform for digital agencies",
    description:
      "Manage client delivery, health monitoring, and executive reporting for web, UX, and digital product agencies.",
    metaDescription:
      "Digital agency operations — client health, delivery tracking, and executive reporting in Auroranexis.",
    problem:
      "Digital agencies deliver projects and retainers across design, development, and strategy disciplines. Without a unified operations layer, account teams lack portfolio visibility, client health is assessed subjectively, and leadership cannot scale delivery standards as the agency grows.",
    solution:
      "Auroranexis gives digital agencies a client-centric workspace for tracking delivery health, incidents, risks, and reporting across the portfolio. Account managers, project leads, and leadership operate from shared operational data instead of disconnected project tools and status spreadsheets.",
    businessValue:
      "Protect retainer revenue through proactive account management, reduce senior time on report assembly, and demonstrate delivery value with structured evidence during client reviews.",
    audience:
      "Web agencies, UX studios, digital product shops, and full-service digital firms managing multiple concurrent client engagements with recurring or project-based contracts.",
    enterpriseAdvantages: [
      "Client portal with white-label branding for professional client-facing delivery",
      "Profitability tracking to connect operational delivery with account margin",
      "Automation workflows for recurring operational tasks and client notifications",
      "Integration connectors for project management and CRM tools",
    ],
    benefits: [
      {
        title: "Delivery accountability",
        description:
          "Track incidents, risks, and SLA commitments per client so account teams manage proactively, not reactively.",
      },
      {
        title: "Client-facing transparency",
        description:
          "Share project status, reports, and operational updates through a branded portal between formal reviews.",
      },
      {
        title: "Scalable reporting",
        description:
          "Generate executive reports from live data instead of manually assembling slides for every QBR.",
      },
    ],
    capabilities: [
      "Client health indicators based on operational delivery signals",
      "Executive report generation with templates and export",
      "Client portal with configurable visibility and white-label options",
      "Activity timelines for account history and team handoffs",
      "Profitability views connecting delivery effort to account performance",
    ],
    challenges: [
      "Account health is discussed in partner meetings without supporting operational data",
      "Client updates are inconsistent — some accounts get proactive communication, others do not",
      "QBR decks take days to assemble from project tool exports and email threads",
      "Delivery quality varies because there is no shared operational standard across teams",
    ],
    workflowImprovements: [
      "Assign client records with owners and health thresholds at engagement start",
      "Review portfolio dashboards weekly to prioritize at-risk accounts",
      "Publish interim status through the client portal between scheduled reviews",
      "Use report templates to standardize QBR output across account managers",
    ],
    expectedOutcomes: [
      "Consistent client communication that scales with portfolio growth",
      "Faster QBR preparation with data sourced from one operational system",
      "Earlier identification of accounts showing delivery risk signals",
      "Clearer renewal conversations backed by documented delivery evidence",
    ],
    faq: [
      {
        question: "Does this replace our project management tool?",
        answer:
          "Auroranexis complements project tools by providing the client operations layer — health, reporting, incidents, and portal visibility — that project software typically does not address.",
      },
      {
        question: "Can we track profitability per client?",
        answer:
          "Yes. Profitability features connect operational delivery data with account performance views on supported plans.",
      },
      {
        question: "Is the client portal customizable?",
        answer:
          "Business and Enterprise plans support white-label branding so clients see your agency identity throughout the portal experience.",
      },
    ],
    relatedLinks: [
      { label: "Marketing agencies", href: USE_CASE_ROUTES.marketingAgencies },
      { label: "Software agencies", href: USE_CASE_ROUTES.softwareAgencies },
      { label: "Client portal", href: FEATURE_ROUTES.clientPortal },
      { label: "Profitability", href: FEATURE_ROUTES.profitability },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "seePricing",
  }),

  "software-agencies": buildLandingPage({
    slug: "software-agencies",
    pathPrefix: "/use-cases",
    category: "audience",
    eyebrow: "Use case",
    title: "Client operations for software development agencies",
    description:
      "Track delivery health, incidents, and SLA performance across your software development client portfolio.",
    metaDescription:
      "Software agency operations — delivery tracking, incident management, and client reporting in Auroranexis.",
    problem:
      "Software development agencies manage complex delivery with multiple stakeholders per client. Incident tracking, SLA commitments, and health monitoring are often buried in developer tools that account managers and clients cannot access, leading to communication gaps and renewal risk.",
    solution:
      "Auroranexis bridges the gap between engineering delivery and client operations. Track incidents, risks, health signals, and SLA performance per client while providing account managers and clients with appropriate visibility through reports and a dedicated portal.",
    businessValue:
      "Improve client retention through transparent delivery communication, reduce escalations caused by information gaps, and scale account management without proportional growth in senior oversight time.",
    audience:
      "Custom software shops, product development agencies, and engineering consultancies delivering recurring development services or long-term product partnerships to business clients.",
    enterpriseAdvantages: [
      "Integration connectors for development and project management tools",
      "Automation workflows for incident notifications and status updates",
      "Role-based access separating engineering, account, and client visibility",
      "API access for custom integrations with internal delivery systems",
    ],
    benefits: [
      {
        title: "Delivery transparency",
        description:
          "Give account managers and clients visibility into operational status without requiring access to developer tools.",
      },
      {
        title: "Incident coordination",
        description:
          "Track production incidents with severity, ownership, and SLA evaluation in a workspace both engineering and account teams use.",
      },
      {
        title: "Health-driven account management",
        description:
          "Surface at-risk accounts based on incident volume, open risks, and SLA performance — not anecdotal check-ins.",
      },
    ],
    capabilities: [
      "Incident management with severity, timeline, and SLA integration",
      "Client health indicators derived from delivery operational signals",
      "Executive reports for sprint reviews, QBRs, and steering committees",
      "Client portal for status sharing between formal delivery milestones",
      "Activity timelines for delivery history and stakeholder continuity",
    ],
    challenges: [
      "Account managers lack visibility into production incidents and delivery risks",
      "Clients receive inconsistent updates depending on which developer handles communication",
      "SLA commitments for support and response are tracked manually or not at all",
      "Renewal conversations lack documented evidence of delivery reliability",
    ],
    workflowImprovements: [
      "Log production incidents with client context and notify account owners automatically",
      "Review portfolio health dashboards to prioritize accounts with elevated incident activity",
      "Share incident status and resolution through the client portal as standard practice",
      "Include delivery health and SLA summaries in scheduled client reports",
    ],
    expectedOutcomes: [
      "Reduced client escalations caused by communication gaps between engineering and account teams",
      "Documented SLA performance suitable for contract reviews and renewals",
      "Proactive account management based on operational delivery signals",
      "Consistent client experience across all development engagements",
    ],
    faq: [
      {
        question: "Does Auroranexis integrate with GitHub, Jira, or Linear?",
        answer:
          "Integration connectors and API access support connections to development and project tools. Specific connector availability depends on your plan configuration.",
      },
      {
        question: "Can engineering teams use this alongside their existing tools?",
        answer:
          "Yes. Auroranexis is the client operations layer. Engineering continues in existing tools while operational records, reporting, and client visibility live in Auroranexis.",
      },
      {
        question: "How do health scores reflect software delivery?",
        answer:
          "Health indicators combine incident volume, open risks, SLA performance, and delivery activity. They provide transparent, configurable signals rather than opaque scoring.",
      },
    ],
    relatedLinks: [
      { label: "Digital agencies", href: USE_CASE_ROUTES.digitalAgencies },
      { label: "Automation agencies", href: USE_CASE_ROUTES.automationAgencies },
      { label: "Incidents", href: FEATURE_ROUTES.incidents },
      { label: "Documentation", href: MARKETING_ROUTES.documentation },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "seePricing",
  }),

  "automation-agencies": buildLandingPage({
    slug: "automation-agencies",
    pathPrefix: "/use-cases",
    category: "audience",
    eyebrow: "Use case",
    title: "Operations for automation and integration agencies",
    description:
      "Monitor workflow reliability, demonstrate automation ROI, and manage client health across your integration portfolio.",
    metaDescription:
      "Automation agency operations — workflow monitoring, client health, and ROI reporting in Auroranexis.",
    problem:
      "Automation agencies build integrations and workflows that clients depend on daily. When workflows fail silently, client trust erodes quickly. Yet most agencies lack a portfolio-level view of automation health, incident history, and delivery reliability across their client base.",
    solution:
      "Auroranexis gives automation agencies an operational command center for multi-client delivery. Track incidents, monitor health signals, manage risks, and report automation reliability to clients through structured reports and a transparent portal.",
    businessValue:
      "Demonstrate automation ROI with operational evidence, reduce client churn from undetected workflow failures, and scale delivery oversight as the integration portfolio grows without adding operations headcount.",
    audience:
      "Workflow automation firms, integration specialists, and no-code/low-code agencies delivering recurring automation services and managed integration programs to business clients.",
    enterpriseAdvantages: [
      "Automation workflow integration for operational event triggers",
      "Monitoring capabilities for workflow health and reliability signals",
      "Connector ecosystem for linking client systems to operational records",
      "Custom automation limits and onboarding on Enterprise plans",
    ],
    benefits: [
      {
        title: "Workflow reliability visibility",
        description:
          "Track incidents and health signals related to automation delivery so failures are surfaced before clients discover them.",
      },
      {
        title: "ROI documentation",
        description:
          "Produce structured reports that connect automation performance to business outcomes for client reviews.",
      },
      {
        title: "Portfolio monitoring",
        description:
          "Operations leaders see automation health across all clients from one dashboard instead of checking each integration individually.",
      },
    ],
    capabilities: [
      "Incident tracking for automation failures with severity and ownership",
      "Health monitoring signals for workflow reliability per client",
      "Automation workflow triggers based on operational events",
      "Executive reports demonstrating automation performance and ROI",
      "Client portal for transparent status sharing on managed integrations",
    ],
    challenges: [
      "Workflow failures are discovered by clients before the agency is aware",
      "Automation ROI is discussed qualitatively because operational data is not aggregated",
      "Scaling the integration portfolio means more manual health checks, not systematic monitoring",
      "Client communication about automation status is inconsistent across accounts",
    ],
    workflowImprovements: [
      "Log automation incidents with client association and SLA evaluation at detection",
      "Review portfolio health dashboards to identify clients with elevated failure rates",
      "Configure automation workflows to notify account owners when operational thresholds are breached",
      "Include reliability metrics and incident summaries in scheduled client reports",
    ],
    expectedOutcomes: [
      "Proactive detection and resolution of automation issues before client impact",
      "Documented automation ROI suitable for renewal and upsell conversations",
      "Systematic portfolio monitoring that scales with client growth",
      "Consistent client communication about automation health and performance",
    ],
    faq: [
      {
        question: "Does Auroranexis monitor my client's automations directly?",
        answer:
          "Monitoring capabilities track health signals where configured. Auroranexis also serves as the operational record for incidents, risks, and client communication regardless of where automations run.",
      },
      {
        question: "Can automations trigger actions in Auroranexis?",
        answer:
          "Yes. Automation workflows can react to operational events such as incidents, health changes, and SLA breaches where configured.",
      },
      {
        question: "How do we demonstrate automation ROI to clients?",
        answer:
          "Executive reports aggregate operational data — reliability, incident resolution, and delivery activity — into structured narratives suitable for QBRs and steering reviews.",
      },
    ],
    relatedLinks: [
      { label: "Software agencies", href: USE_CASE_ROUTES.softwareAgencies },
      { label: "Automation", href: FEATURE_ROUTES.automation },
      { label: "Monitoring", href: FEATURE_ROUTES.monitoring },
      { label: "AI reporting", href: SOLUTION_ROUTES.aiReporting },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "seePricing",
  }),

  "enterprise-teams": buildLandingPage({
    slug: "enterprise-teams",
    pathPrefix: "/use-cases",
    category: "audience",
    eyebrow: "Use case",
    title: "Enterprise client operations at scale",
    description:
      "Standardize delivery oversight, compliance workflows, and executive reporting across large multi-client or multi-business-unit portfolios.",
    metaDescription:
      "Enterprise client operations — portfolio governance, compliance, executive dashboards, and audit-ready delivery in Auroranexis.",
    problem:
      "Enterprise teams managing vendor portfolios, internal service catalogs, or multi-division client relationships need operational governance that smaller tools cannot provide. Delivery oversight is fragmented across business units, compliance documentation is assembled manually, and executive leadership lacks a consolidated view of portfolio health.",
    solution:
      "Auroranexis Enterprise provides a governed operations platform for large portfolios. Centralize client records, incidents, risks, SLA policies, and compliance workflows with role-based access, audit trails, and executive dashboards designed for leadership-level portfolio reviews.",
    businessValue:
      "Reduce governance overhead, accelerate compliance documentation, and give executive leadership reliable portfolio visibility without depending on manual status aggregation across business units.",
    audience:
      "Enterprise operations leaders, shared services teams, and program management offices managing large vendor portfolios, internal service delivery, or multi-division client relationships with governance and compliance requirements.",
    enterpriseAdvantages: [
      "Custom client limits and dedicated onboarding tailored to portfolio complexity",
      "Compliance center with structured audit workflows and retention controls",
      "Plan overrides for organization-specific operational requirements",
      "Priority support and SLA-backed response times on Enterprise plans",
    ],
    benefits: [
      {
        title: "Portfolio governance",
        description:
          "Consolidate operational visibility across business units, vendors, or service lines in executive-ready dashboards.",
      },
      {
        title: "Compliance readiness",
        description:
          "Maintain audit trails, retention controls, and structured compliance workflows for regulated delivery environments.",
      },
      {
        title: "Standardized delivery",
        description:
          "Apply consistent incident, risk, and SLA workflows across the entire portfolio regardless of team or division.",
      },
    ],
    capabilities: [
      "Executive dashboards with portfolio-wide health, incident, and risk summaries",
      "Compliance center for audit workflows, retention policies, and documentation",
      "Role-based access with organization-scoped permissions and team management",
      "Custom SLA policies and escalation rules per client tier or business unit",
      "Dedicated onboarding, custom limits, and priority support on Enterprise plans",
    ],
    challenges: [
      "Portfolio status requires manual aggregation from multiple business units and vendor reports",
      "Compliance documentation requests take weeks because operational records are scattered",
      "Delivery standards vary across divisions with no enforced operational framework",
      "Executive leadership receives outdated portfolio summaries that do not reflect current risk",
    ],
    workflowImprovements: [
      "Establish organization-wide operational standards for incidents, risks, and SLA policies",
      "Review executive dashboards on a fixed cadence instead of requesting status from each division",
      "Route compliance documentation through the compliance center instead of manual assembly",
      "Assign portfolio owners with role-based access aligned to business unit structure",
    ],
    expectedOutcomes: [
      "Consolidated portfolio visibility available to leadership without manual aggregation",
      "Faster compliance documentation response through structured audit workflows",
      "Consistent delivery governance across all business units and vendor relationships",
      "Reduced operational overhead as the portfolio scales without proportional governance growth",
    ],
    faq: [
      {
        question: "What does Enterprise onboarding include?",
        answer:
          "Dedicated onboarding covers workspace configuration, team setup, SLA policy design, and integration planning tailored to your portfolio structure. Contact sales for scope details.",
      },
      {
        question: "Can we enforce operational standards across business units?",
        answer:
          "Yes. Organization-scoped permissions, shared SLA templates, and compliance workflows allow central governance while preserving appropriate team-level access.",
      },
      {
        question: "Is Auroranexis suitable for regulated industries?",
        answer:
          "The platform supports GDPR workflows, audit logging, retention controls, and EU data residency. Specific regulatory suitability depends on your requirements — contact sales for a compliance review.",
      },
    ],
    relatedLinks: [
      { label: "Consultancies", href: USE_CASE_ROUTES.consultancies },
      { label: "Executive dashboard", href: SOLUTION_ROUTES.executiveDashboard },
      { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
      { label: "Compliance", href: MARKETING_ROUTES.compliance },
    ],
    primaryCta: "bookDemo",
    secondaryCta: "contactSales",
  }),
};

export const AUDIENCE_SLUGS: string[] = landingPageSlugs(AUDIENCE_PAGES);

export const AUDIENCE_HUB_ENTRIES: LandingHubEntry[] = landingPageList(AUDIENCE_PAGES).map(
  ({ slug, path, title, description }) => ({
    slug,
    path,
    title,
    description,
  }),
);
