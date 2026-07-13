import {
  FEATURE_ROUTES,
  INDUSTRY_ROUTES,
  MARKETING_ROUTES,
  SOLUTION_ROUTES,
} from "@/lib/company/company-links";
import {
  buildLandingPage,
  landingPageList,
  landingPageSlugs,
} from "@/lib/seo/landing-page-builder";
import type { LandingHubEntry, LandingPageContent } from "@/lib/seo/landing-page-types";

export const INDUSTRY_PAGES: Record<string, LandingPageContent> = {
  marketing: buildLandingPage({
    slug: "marketing",
    pathPrefix: "/industries",
    category: "industry",
    eyebrow: "Industry",
    title: "Client operations for marketing agencies and in-house teams",
    description:
      "Unify campaign delivery, client reporting, and account health across your marketing portfolio in one operations command center.",
    metaDescription:
      "Operations platform for marketing agencies — client health, executive reporting, incident tracking, and portfolio visibility with Auroranexis.",
    problem:
      "Marketing teams juggle multiple clients, campaign timelines, and performance data across disconnected tools. Account managers lack a single view of delivery health, open issues, and executive-ready status. QBR preparation becomes a manual scramble across spreadsheets, ad platforms, and project trackers.",
    solution:
      "Auroranexis gives marketing leaders a structured operations layer for client portfolios. Track delivery signals, incidents, and risks per account, generate executive reports from operational data, and share transparent status through the client portal — without replacing your creative or analytics stack.",
    businessValue:
      "Reduce account churn risk with early visibility into delivery friction. Standardize how teams report outcomes to clients and leadership. Free senior staff from manual status assembly so they can focus on strategy and growth.",
    audience:
      "Marketing agencies, performance marketing firms, brand consultancies, and in-house marketing operations teams managing multiple accounts or business units.",
    enterpriseAdvantages: [
      "Portfolio dashboards for account health across all clients",
      "Role-based access for account, delivery, and leadership teams",
      "Audit trails for operational changes and client-facing updates",
      "Unlimited AI copilot for portfolio and client context on Enterprise",
      "Client portal for transparent campaign and delivery status",
    ],
    benefits: [
      {
        title: "Account health visibility",
        description:
          "See which clients need attention based on incidents, risks, SLA performance, and delivery activity — not gut feel.",
      },
      {
        title: "Executive-ready reporting",
        description:
          "Produce structured client and portfolio reports from operational data instead of rebuilding slides every quarter.",
      },
      {
        title: "Consistent delivery governance",
        description:
          "Apply the same incident, risk, and escalation workflows across accounts so quality does not depend on individual managers.",
      },
    ],
    capabilities: [
      "Client-level health indicators from operational signals",
      "Incident and risk registers tied to marketing accounts",
      "SLA policies for response and resolution commitments",
      "AI-assisted executive summaries grounded in platform data",
      "Automation workflows for operational follow-up",
      "Client portal views for status and report sharing",
    ],
    challenges: [
      "Campaign delivery status scattered across project tools, ad platforms, and email threads",
      "No consistent early warning when an account is at risk of churn or escalation",
      "QBR and executive reporting requires days of manual data assembly",
      "Account handoffs lose context on open issues and client expectations",
      "Leadership lacks portfolio-level visibility without requesting updates from each manager",
    ],
    workflowImprovements: [
      "Centralize client records with incidents, risks, and delivery history in one workspace",
      "Define SLA policies that reflect marketing service commitments per account tier",
      "Generate portfolio and client reports from live operational data",
      "Route escalations through structured workflows instead of ad hoc Slack threads",
      "Share appropriate status updates with clients through a branded portal",
    ],
    expectedOutcomes: [
      "Faster identification of accounts that need proactive intervention",
      "Reduced time spent preparing executive and client review materials",
      "More consistent delivery quality across account managers and teams",
      "Clearer accountability for open issues and remediation steps",
      "Improved client trust through transparent, structured status communication",
    ],
    faq: [
      {
        question: "Does Auroranexis replace our marketing analytics or project management tools?",
        answer:
          "No. It is an operations command center for client governance, reporting, and delivery oversight. Integrate it alongside your existing campaign, analytics, and project tools.",
      },
      {
        question: "Can we track health across a large agency portfolio?",
        answer:
          "Yes. Portfolio dashboards surface health trends, open incidents, and risks across all clients so leadership can prioritize attention.",
      },
      {
        question: "Is this suitable for in-house marketing teams?",
        answer:
          "Yes. Teams managing multiple brands, regions, or business units can use the same operational structure as external agencies.",
      },
    ],
    relatedLinks: [
      { label: "Consulting", href: INDUSTRY_ROUTES.consulting },
      { label: "Technology", href: INDUSTRY_ROUTES.technology },
      { label: "Customer health score", href: SOLUTION_ROUTES.customerHealthScore },
      { label: "AI executive reports", href: FEATURE_ROUTES.aiExecutiveReports },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "seePricing",
  }),

  it: buildLandingPage({
    slug: "it",
    pathPrefix: "/industries",
    category: "industry",
    eyebrow: "Industry",
    title: "Operations command center for IT service providers and MSPs",
    description:
      "Manage multi-client IT delivery with incident tracking, SLA governance, risk registers, and executive portfolio visibility.",
    metaDescription:
      "IT operations platform for MSPs and service providers — incident management, SLA tracking, client health, and executive reporting in Auroranexis.",
    problem:
      "IT service providers operate across dozens of client environments with tickets, alerts, and commitments spread across PSA tools, RMM platforms, and email. Leadership cannot easily see portfolio health, SLA exposure, or which accounts are trending toward escalation without manual roll-ups.",
    solution:
      "Auroranexis provides a client-centric operations layer for IT delivery teams. Associate incidents, risks, and SLA performance with each client, monitor portfolio health from executive dashboards, and communicate status through structured reports and the client portal.",
    businessValue:
      "Protect recurring revenue by catching delivery degradation early. Demonstrate SLA performance with auditable records. Scale operational oversight without adding management overhead per client.",
    audience:
      "Managed service providers, IT consultancies, internal IT shared services teams, and technology service firms with multi-client or multi-department delivery models.",
    enterpriseAdvantages: [
      "Multi-tenant organization isolation with role-based access",
      "SLA policy configuration per client and service tier",
      "Portfolio incident and risk visibility for operations leadership",
      "Integration-ready architecture for PSA, monitoring, and automation tools",
      "Audit-friendly activity history for governance reviews",
    ],
    benefits: [
      {
        title: "SLA-aware incident management",
        description:
          "Track incidents against client SLA policies and surface breach warnings before they become contract disputes.",
      },
      {
        title: "Portfolio command center",
        description:
          "View open incidents, risks, and health indicators across all clients from a single operations dashboard.",
      },
      {
        title: "Client transparency",
        description:
          "Share appropriate incident status and performance summaries through the client portal without manual email updates.",
      },
    ],
    capabilities: [
      "Incident lifecycle tracking with severity and ownership",
      "SLA policy definitions with breach evaluation",
      "Risk registers linked to client delivery context",
      "Executive dashboards for portfolio operational metrics",
      "Automation workflows for escalation and follow-up",
      "REST API and webhook integration points",
    ],
    challenges: [
      "Incident and SLA data fragmented across PSA, RMM, and communication channels",
      "Account managers lack a unified client health view beyond ticket volume",
      "Executive reporting on portfolio performance requires manual aggregation",
      "Risk of SLA breaches discovered only after client escalation",
      "Inconsistent incident documentation across technicians and teams",
    ],
    workflowImprovements: [
      "Maintain a single incident record per client with timeline and ownership",
      "Configure SLA policies that reflect contract tiers and service commitments",
      "Register operational risks before they become major incidents",
      "Automate escalation paths when thresholds or breach warnings trigger",
      "Deliver monthly and quarterly client reports from structured operational data",
    ],
    expectedOutcomes: [
      "Earlier detection of SLA exposure and delivery degradation",
      "Reduced time to produce portfolio and client performance reports",
      "More consistent incident response documentation across the team",
      "Stronger client relationships through proactive, transparent communication",
      "Clearer operational accountability at both technician and leadership levels",
    ],
    faq: [
      {
        question: "Does Auroranexis replace our PSA or RMM platform?",
        answer:
          "No. It complements your existing stack as an operations command center for client governance, SLA tracking, reporting, and portfolio visibility.",
      },
      {
        question: "Can we define different SLA policies per client?",
        answer:
          "Yes. Assign SLA policies based on contract tier, service type, or client segment and evaluate incidents against those policies automatically.",
      },
      {
        question: "How does this help MSP leadership?",
        answer:
          "Executive dashboards and portfolio health views give leaders operational signals without requesting manual updates from each account team.",
      },
    ],
    relatedLinks: [
      { label: "Cybersecurity", href: INDUSTRY_ROUTES.cybersecurity },
      { label: "Technology", href: INDUSTRY_ROUTES.technology },
      { label: "Incident management", href: SOLUTION_ROUTES.incidentManagement },
      { label: "SLA management", href: SOLUTION_ROUTES.slaManagement },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "contactSales",
  }),

  cybersecurity: buildLandingPage({
    slug: "cybersecurity",
    pathPrefix: "/industries",
    category: "industry",
    eyebrow: "Industry",
    title: "Operational governance for cybersecurity service providers",
    description:
      "Coordinate client security delivery with incident records, risk tracking, SLA governance, and audit-ready operational history.",
    metaDescription:
      "Cybersecurity operations platform — incident tracking, risk registers, SLA management, and client reporting for MSSPs and security firms in Auroranexis.",
    problem:
      "Cybersecurity firms manage sensitive client engagements where response time, documentation quality, and risk visibility directly affect trust and contract renewal. Operational data often lives in ticketing systems, spreadsheets, and analyst notebooks with no portfolio-level view for leadership or clients.",
    solution:
      "Auroranexis gives security service providers a structured operations layer for client delivery. Track incidents with SLA awareness, maintain risk registers with ownership and remediation, and produce executive reports that demonstrate control — without replacing your SIEM, EDR, or ticketing infrastructure.",
    businessValue:
      "Demonstrate operational maturity to enterprise clients and auditors. Reduce response coordination overhead during active incidents. Give leadership portfolio visibility without compromising sensitive technical detail in client-facing views.",
    audience:
      "Managed security service providers, cybersecurity consultancies, SOC operators, and internal security teams delivering services across multiple clients or business units.",
    enterpriseAdvantages: [
      "Tenant isolation with organization-scoped data access",
      "Audit trails for operational record changes and assignments",
      "Role-based permissions for analysts, managers, and executives",
      "Controlled client portal sharing for appropriate status visibility",
      "Documented security posture for procurement and vendor review",
    ],
    benefits: [
      {
        title: "Incident coordination with SLA context",
        description:
          "Maintain structured incident records with severity, ownership, and SLA evaluation for security response commitments.",
      },
      {
        title: "Operational risk registers",
        description:
          "Track delivery and client risks with likelihood, impact, and mitigation steps — distinct from enterprise GRC platforms.",
      },
      {
        title: "Executive proof of control",
        description:
          "Generate portfolio and client reports that demonstrate operational governance without manual slide assembly.",
      },
    ],
    capabilities: [
      "Security incident lifecycle tracking and timelines",
      "Risk register with assignment and resolution workflows",
      "SLA policies for response and resolution targets",
      "Portfolio dashboards for open incidents and risks",
      "Client portal for controlled status sharing",
      "Activity history for operational audit review",
    ],
    challenges: [
      "Incident response coordination spread across chat, tickets, and analyst tools",
      "No structured portfolio view of client security delivery health",
      "Risk items tracked informally without ownership or remediation tracking",
      "Executive and client reporting requires sensitive data redaction and manual assembly",
      "SLA commitments difficult to prove during contract reviews or audits",
    ],
    workflowImprovements: [
      "Centralize incident records with timelines, owners, and client associations",
      "Register operational risks with structured severity and mitigation workflows",
      "Evaluate incidents against client SLA policies automatically",
      "Produce executive summaries from operational data with controlled detail levels",
      "Share appropriate incident status through the client portal based on policy",
    ],
    expectedOutcomes: [
      "Faster, more coordinated incident response with clear ownership",
      "Improved ability to demonstrate SLA performance to clients",
      "Earlier visibility into clients with accumulating operational risk",
      "Reduced manual effort for QBR and executive reporting",
      "Stronger audit posture through structured operational history",
    ],
    faq: [
      {
        question: "Is Auroranexis a SIEM or security analytics platform?",
        answer:
          "No. It is an operations command center for client delivery governance. Your detection and analysis tools remain in place; Auroranexis structures how you manage incidents, risks, and client communication.",
      },
      {
        question: "Can we control what clients see during active incidents?",
        answer:
          "Yes. Client portal visibility is configurable so you share appropriate status without exposing sensitive technical detail.",
      },
      {
        question: "Does this support MSSP portfolio management?",
        answer:
          "Yes. Portfolio dashboards surface health, open incidents, and risks across all managed clients for operations leadership.",
      },
    ],
    relatedLinks: [
      { label: "IT services", href: INDUSTRY_ROUTES.it },
      { label: "Finance", href: INDUSTRY_ROUTES.finance },
      { label: "Risk management", href: SOLUTION_ROUTES.riskManagement },
      { label: "Security", href: MARKETING_ROUTES.security },
    ],
    primaryCta: "bookDemo",
    secondaryCta: "seePricing",
  }),

  consulting: buildLandingPage({
    slug: "consulting",
    pathPrefix: "/industries",
    category: "industry",
    eyebrow: "Industry",
    title: "Delivery operations for consulting and professional services firms",
    description:
      "Standardize client governance, engagement reporting, and portfolio oversight across your consulting practice.",
    metaDescription:
      "Consulting operations platform — client health, executive reporting, risk tracking, and engagement governance for professional services firms in Auroranexis.",
    problem:
      "Consulting firms deliver high-touch engagements where partner attention, issue resolution, and client confidence determine renewal and expansion. Engagement status lives in partner inboxes, project tools, and slide decks with no consistent operational record across the practice.",
    solution:
      "Auroranexis gives consulting leaders a practice-wide operations layer. Track client health, incidents, and risks per engagement, standardize executive reporting, and maintain audit-ready delivery history — so partners spend time advising clients, not assembling status updates.",
    businessValue:
      "Protect revenue from silent engagement degradation. Scale partner oversight across a growing client base. Present a consistent, professional operational posture to enterprise clients during procurement and QBR cycles.",
    audience:
      "Management consultancies, strategy firms, implementation partners, and professional services organizations with multi-client engagement portfolios.",
    enterpriseAdvantages: [
      "Practice-wide portfolio visibility for partners and operations leaders",
      "Structured incident and risk workflows per client engagement",
      "Executive reporting templates grounded in operational data",
      "Role-based access aligned to engagement teams and leadership",
      "Client portal for transparent engagement status sharing",
    ],
    benefits: [
      {
        title: "Engagement health tracking",
        description:
          "Monitor client health from operational signals so partners intervene before issues affect renewal conversations.",
      },
      {
        title: "Standardized executive reporting",
        description:
          "Deliver consistent engagement reports and portfolio summaries without rebuilding materials for each client.",
      },
      {
        title: "Governance at scale",
        description:
          "Apply the same incident, risk, and escalation standards across engagements regardless of lead partner.",
      },
    ],
    capabilities: [
      "Client and engagement-level operational records",
      "Risk registers with ownership and mitigation tracking",
      "Incident management with activity timelines",
      "AI-assisted executive report generation",
      "Portfolio dashboards for practice leadership",
      "Automation for follow-up and escalation workflows",
    ],
    challenges: [
      "Engagement status dependent on individual partner communication habits",
      "No early warning system for clients trending toward dissatisfaction",
      "Executive and board-ready reporting consumes senior consultant time",
      "Risk items discussed in meetings but not tracked with ownership",
      "Practice leadership lacks real-time portfolio visibility",
    ],
    workflowImprovements: [
      "Maintain structured client records with delivery history and open items",
      "Register engagement risks with likelihood, impact, and remediation owners",
      "Track incidents and issues with clear timelines and accountability",
      "Generate executive reports from operational data for QBR and steering committees",
      "Share engagement status through the client portal for enterprise transparency",
    ],
    expectedOutcomes: [
      "Earlier partner intervention on at-risk engagements",
      "Reduced senior time spent on status assembly and slide preparation",
      "More consistent delivery quality across the practice",
      "Stronger client confidence through structured, proactive communication",
      "Better data for practice planning and resource allocation decisions",
    ],
    faq: [
      {
        question: "Does Auroranexis replace our project management or CRM tools?",
        answer:
          "No. It focuses on operational governance, client health, and executive reporting. Your project delivery and pipeline tools remain your system of record for tasks and opportunities.",
      },
      {
        question: "Can partners see portfolio health across the practice?",
        answer:
          "Yes. Leadership dashboards provide portfolio-level visibility while engagement teams retain client-scoped access.",
      },
      {
        question: "Is this relevant for boutique consultancies?",
        answer:
          "Yes. Even smaller firms benefit from structured client governance as they grow beyond what partners can track personally.",
      },
    ],
    relatedLinks: [
      { label: "Marketing", href: INDUSTRY_ROUTES.marketing },
      { label: "Legal", href: INDUSTRY_ROUTES.legal },
      { label: "Executive dashboard", href: SOLUTION_ROUTES.executiveDashboard },
      { label: "AI reporting", href: SOLUTION_ROUTES.aiReporting },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "seePricing",
  }),

  healthcare: buildLandingPage({
    slug: "healthcare",
    pathPrefix: "/industries",
    category: "industry",
    eyebrow: "Industry",
    title: "Operational governance for healthcare service delivery teams",
    description:
      "Manage client and partner delivery with structured incident tracking, risk registers, and audit-ready operational records.",
    metaDescription:
      "Healthcare operations platform — incident management, risk tracking, SLA governance, and client reporting for health tech and service providers in Auroranexis.",
    problem:
      "Healthcare technology and service organizations operate under heightened scrutiny for reliability, documentation, and vendor accountability. Delivery teams manage multiple provider or payer clients with operational data scattered across tools, making portfolio oversight and audit preparation labor-intensive.",
    solution:
      "Auroranexis provides a structured operations command center for healthcare delivery teams. Track incidents and risks with clear ownership, govern SLA commitments, and maintain auditable operational history — while controlling what is shared with clients through role-based access and portal policies.",
    businessValue:
      "Strengthen vendor credibility with health system procurement teams. Reduce operational risk from undocumented incidents and informal escalation paths. Give leadership portfolio visibility without compromising data handling discipline.",
    audience:
      "Health technology vendors, healthcare IT service providers, digital health companies, and professional services firms delivering to hospitals, payers, and life sciences organizations.",
    enterpriseAdvantages: [
      "EU-capable data regions with documented sub-processors",
      "Tenant isolation and role-based access controls",
      "Audit trails for operational record changes",
      "Configurable client portal sharing policies",
      "Security and compliance documentation for vendor review",
    ],
    benefits: [
      {
        title: "Audit-ready incident records",
        description:
          "Maintain structured incident timelines with ownership and resolution history suitable for operational review.",
      },
      {
        title: "Operational risk governance",
        description:
          "Track delivery risks with assignment, mitigation steps, and resolution status across your client portfolio.",
      },
      {
        title: "SLA accountability",
        description:
          "Define and monitor SLA policies that reflect healthcare service commitments and uptime expectations.",
      },
    ],
    capabilities: [
      "Incident lifecycle management with severity and timelines",
      "Risk registers with remediation tracking",
      "SLA policy configuration and breach indicators",
      "Executive reporting for portfolio and client reviews",
      "Activity history for governance and audit support",
      "Controlled client portal status sharing",
    ],
    challenges: [
      "Vendor accountability requirements exceed what informal tracking can support",
      "Incident documentation inconsistent across delivery and support teams",
      "No portfolio-level view of client delivery health for leadership",
      "SLA performance difficult to demonstrate during contract and audit reviews",
      "Operational reporting requires manual assembly from multiple systems",
    ],
    workflowImprovements: [
      "Standardize incident logging with severity, ownership, and client context",
      "Maintain risk registers with structured mitigation workflows",
      "Monitor SLA performance against configured policies per client",
      "Generate executive reports from operational data for QBR and vendor reviews",
      "Control client-facing status through portal policies and role-based access",
    ],
    expectedOutcomes: [
      "Stronger operational documentation for vendor and audit reviews",
      "Earlier identification of clients with accumulating delivery risk",
      "More consistent incident response across support and delivery teams",
      "Reduced manual effort for executive and client reporting cycles",
      "Improved client trust through transparent, governed status communication",
    ],
    faq: [
      {
        question: "Is Auroranexis HIPAA-certified?",
        answer:
          "Auroranexis provides security controls, tenant isolation, and compliance documentation for vendor review. Healthcare customers should evaluate alignment with their specific regulatory requirements and execute appropriate agreements.",
      },
      {
        question: "Can we limit what operational data clients access?",
        answer:
          "Yes. Role-based access and client portal policies let you control visibility at the record and organization level.",
      },
      {
        question: "Who in healthcare organizations uses this?",
        answer:
          "Health tech vendors, MSPs serving healthcare, and professional services firms delivering to providers and payers — not clinical care systems.",
      },
    ],
    relatedLinks: [
      { label: "Finance", href: INDUSTRY_ROUTES.finance },
      { label: "Legal", href: INDUSTRY_ROUTES.legal },
      { label: "Compliance", href: MARKETING_ROUTES.compliance },
      { label: "Incident management", href: SOLUTION_ROUTES.incidentManagement },
    ],
    primaryCta: "requestEnterpriseDemo",
    secondaryCta: "contactSales",
  }),

  finance: buildLandingPage({
    slug: "finance",
    pathPrefix: "/industries",
    category: "industry",
    eyebrow: "Industry",
    title: "Client operations for financial services delivery teams",
    description:
      "Govern multi-client delivery with incident tracking, risk registers, SLA management, and executive reporting built for regulated environments.",
    metaDescription:
      "Financial services operations platform — client health, incident management, risk tracking, and SLA governance for fintech and B2B service providers in Auroranexis.",
    problem:
      "Financial services firms and their technology vendors face strict expectations for reliability, documentation, and vendor oversight. Delivery teams serving banks, insurers, and asset managers often lack a unified operational record — making SLA proof, risk visibility, and executive reporting a recurring burden.",
    solution:
      "Auroranexis gives financial services delivery teams a governed operations layer. Structure incident and risk management per client, monitor SLA performance with auditable records, and produce executive reports that demonstrate operational control to demanding enterprise buyers.",
    businessValue:
      "Accelerate enterprise sales cycles with demonstrable operational maturity. Reduce contract risk from undocumented SLA breaches. Give leadership real-time portfolio visibility for resource and escalation decisions.",
    audience:
      "Fintech vendors, financial services consultancies, B2B SaaS companies selling to banks and insurers, and MSPs delivering to regulated financial institutions.",
    enterpriseAdvantages: [
      "Audit-friendly activity history and operational record trails",
      "Role-based access with organization-scoped data isolation",
      "SLA governance with configurable policies per client tier",
      "Security and compliance documentation for procurement review",
      "Executive dashboards for portfolio operational metrics",
    ],
    benefits: [
      {
        title: "SLA proof for enterprise clients",
        description:
          "Track and report SLA performance with structured incident records that stand up to vendor management scrutiny.",
      },
      {
        title: "Operational risk visibility",
        description:
          "Maintain risk registers with ownership and remediation so issues are addressed before they affect client relationships.",
      },
      {
        title: "Executive reporting discipline",
        description:
          "Generate portfolio and client reports from operational data instead of manual quarterly assembly.",
      },
    ],
    capabilities: [
      "Incident management with SLA evaluation and breach indicators",
      "Risk registers with severity, ownership, and resolution workflows",
      "Executive dashboards and AI-assisted reporting",
      "Client portal for governed status sharing",
      "Automation workflows for escalation and follow-up",
      "Documented security posture and sub-processor transparency",
    ],
    challenges: [
      "Enterprise buyers require demonstrable vendor operational controls",
      "SLA commitments tracked informally until a breach triggers escalation",
      "Risk items not systematically captured with ownership and remediation",
      "Executive reporting for portfolio reviews requires cross-tool data assembly",
      "Leadership lacks proactive visibility into client delivery health",
    ],
    workflowImprovements: [
      "Define SLA policies aligned to financial services contract tiers",
      "Log incidents with structured timelines and client associations",
      "Register and track operational risks with mitigation accountability",
      "Produce executive and client reports from live operational data",
      "Share appropriate status through the client portal under access controls",
    ],
    expectedOutcomes: [
      "Faster procurement and vendor review cycles with documented controls",
      "Reduced SLA dispute risk through auditable performance records",
      "Earlier intervention on clients showing delivery degradation signals",
      "Less senior time spent on manual reporting and status preparation",
      "Stronger retention through proactive, transparent client communication",
    ],
    faq: [
      {
        question: "Does Auroranexis replace a GRC or compliance management platform?",
        answer:
          "No. It focuses on operational delivery governance — incidents, risks, SLAs, and client reporting — not enterprise-wide regulatory certification management.",
      },
      {
        question: "Can we demonstrate SLA performance to regulated clients?",
        answer:
          "Yes. Incident records, SLA evaluation, and reporting capabilities provide structured evidence of operational performance.",
      },
      {
        question: "Is this for banks and insurers directly?",
        answer:
          "It is primarily for vendors, MSPs, and service providers delivering to financial institutions, though internal shared services teams can adopt the same structure.",
      },
    ],
    relatedLinks: [
      { label: "Cybersecurity", href: INDUSTRY_ROUTES.cybersecurity },
      { label: "Legal", href: INDUSTRY_ROUTES.legal },
      { label: "SLA management", href: SOLUTION_ROUTES.slaManagement },
      { label: "Enterprise", href: MARKETING_ROUTES.enterprise },
    ],
    primaryCta: "requestEnterpriseDemo",
    secondaryCta: "seePricing",
  }),

  legal: buildLandingPage({
    slug: "legal",
    pathPrefix: "/industries",
    category: "industry",
    eyebrow: "Industry",
    title: "Operations governance for legal services and legal ops teams",
    description:
      "Coordinate client delivery, matter oversight, and portfolio reporting with structured incident, risk, and SLA management.",
    metaDescription:
      "Legal operations platform — client health, incident tracking, risk registers, and executive reporting for law firms and legal service providers in Auroranexis.",
    problem:
      "Legal service organizations manage complex client relationships where responsiveness, documentation quality, and matter oversight affect both client trust and professional reputation. Operational status often depends on individual attorney communication with no practice-wide visibility for managing partners or legal ops leaders.",
    solution:
      "Auroranexis gives legal operations leaders a structured command center for client delivery. Track incidents and risks per client, govern response commitments through SLA policies, and produce executive reports — freeing attorneys to focus on legal work while ops maintains consistent governance.",
    businessValue:
      "Reduce client escalation risk through proactive operational visibility. Standardize how the firm demonstrates responsiveness and accountability. Give managing partners portfolio insight without interrupting matter teams for status updates.",
    audience:
      "Law firms, legal process outsourcers, e-discovery providers, legal technology vendors, and in-house legal operations teams managing external counsel or service provider relationships.",
    enterpriseAdvantages: [
      "Practice-wide portfolio dashboards for managing partners",
      "Structured incident and risk records with audit history",
      "Role-based access for attorneys, ops, and leadership",
      "Client portal for governed matter and delivery status sharing",
      "Configurable SLA policies reflecting client service commitments",
    ],
    benefits: [
      {
        title: "Matter and client oversight",
        description:
          "Monitor client health from operational signals so managing partners identify issues before they become complaints.",
      },
      {
        title: "Response accountability",
        description:
          "Track incidents and commitments against SLA policies to demonstrate responsiveness to enterprise clients.",
      },
      {
        title: "Practice-wide consistency",
        description:
          "Apply uniform governance standards across practice groups instead of relying on individual partner habits.",
      },
    ],
    capabilities: [
      "Client-level incident and risk management",
      "SLA policy configuration and breach tracking",
      "Executive reporting for practice and client reviews",
      "Portfolio health dashboards for leadership",
      "Activity timelines for operational audit review",
      "Automation workflows for escalation and follow-up",
    ],
    challenges: [
      "Client status updates dependent on individual attorney availability",
      "No structured system for tracking delivery issues and remediation",
      "Managing partners lack portfolio visibility without manual check-ins",
      "Enterprise clients expect documented responsiveness and SLA proof",
      "Legal ops spends significant time assembling status for client reviews",
    ],
    workflowImprovements: [
      "Centralize client records with incidents, risks, and delivery history",
      "Define SLA policies that reflect client tier and service agreements",
      "Register operational risks with ownership and mitigation tracking",
      "Generate executive reports for client QBR and practice reviews",
      "Share appropriate status through the client portal under firm policy",
    ],
    expectedOutcomes: [
      "Earlier managing partner awareness of at-risk client relationships",
      "More consistent responsiveness documentation across practice groups",
      "Reduced legal ops time on manual status and reporting assembly",
      "Stronger enterprise client confidence in firm operational maturity",
      "Clearer accountability for open issues and remediation steps",
    ],
    faq: [
      {
        question: "Does Auroranexis handle matter management or document review?",
        answer:
          "No. It is an operations command center for client governance and delivery oversight. Your practice management and document systems remain in place.",
      },
      {
        question: "Can different practice groups have separate visibility?",
        answer:
          "Yes. Role-based access and organization structure support practice-group scoping while leadership retains portfolio views.",
      },
      {
        question: "Is this useful for legal technology vendors?",
        answer:
          "Yes. Vendors serving law firms can use the same operational structure to govern client delivery, incidents, and SLA commitments.",
      },
    ],
    relatedLinks: [
      { label: "Consulting", href: INDUSTRY_ROUTES.consulting },
      { label: "Finance", href: INDUSTRY_ROUTES.finance },
      { label: "Risk management", href: SOLUTION_ROUTES.riskManagement },
      { label: "Activity timeline", href: FEATURE_ROUTES.activityTimeline },
    ],
    primaryCta: "bookDemo",
    secondaryCta: "seePricing",
  }),

  manufacturing: buildLandingPage({
    slug: "manufacturing",
    pathPrefix: "/industries",
    category: "industry",
    eyebrow: "Industry",
    title: "Service delivery operations for manufacturing organizations",
    description:
      "Govern IT, automation, and vendor delivery across plants and business units with portfolio visibility and structured incident management.",
    metaDescription:
      "Manufacturing operations platform — incident tracking, SLA governance, vendor oversight, and executive reporting for industrial organizations in Auroranexis.",
    problem:
      "Manufacturing organizations rely on a web of internal IT, OT integrators, and technology vendors across multiple sites. Service delivery issues, SLA exposure, and vendor accountability are tracked inconsistently — leaving operations leaders without a clear portfolio view of reliability and risk.",
    solution:
      "Auroranexis provides manufacturing operations leaders a unified command center for service delivery governance. Track incidents and risks across sites and vendors, monitor SLA performance, and report operational status to plant leadership and enterprise procurement — without replacing your MES, ERP, or maintenance systems.",
    businessValue:
      "Reduce production impact from undetected service delivery degradation. Strengthen vendor management with auditable SLA and incident records. Give enterprise leadership cross-site visibility for investment and escalation decisions.",
    audience:
      "Manufacturing enterprises, industrial technology vendors, MSPs serving manufacturing clients, and automation integrators managing multi-site delivery portfolios.",
    enterpriseAdvantages: [
      "Portfolio dashboards across sites, vendors, and business units",
      "SLA governance for internal and external service commitments",
      "Risk registers for operational and vendor delivery risks",
      "Executive reporting for plant and enterprise leadership reviews",
      "Role-based access for site, regional, and corporate teams",
    ],
    benefits: [
      {
        title: "Cross-site visibility",
        description:
          "Monitor service delivery health across plants and vendors from a single operations dashboard.",
      },
      {
        title: "Vendor accountability",
        description:
          "Track incidents and SLA performance for technology vendors and integrators with structured records.",
      },
      {
        title: "Operational risk tracking",
        description:
          "Register delivery and reliability risks with ownership and remediation before they affect production.",
      },
    ],
    capabilities: [
      "Incident management with site and vendor associations",
      "SLA policies for internal and external service tiers",
      "Risk registers with mitigation and resolution workflows",
      "Executive dashboards for cross-site operational metrics",
      "Client portal for vendor status sharing where applicable",
      "Automation for escalation when thresholds are breached",
    ],
    challenges: [
      "Service delivery status fragmented across sites, vendors, and email",
      "No enterprise view of vendor SLA performance and open issues",
      "Production-impacting risks identified late due to informal tracking",
      "Executive reporting on reliability requires manual cross-site assembly",
      "Vendor management lacks structured incident and remediation history",
    ],
    workflowImprovements: [
      "Associate incidents with sites, vendors, and service commitments",
      "Define SLA policies reflecting production-critical service tiers",
      "Register operational risks with plant-level ownership and remediation",
      "Generate executive reports for reliability and vendor review meetings",
      "Automate escalation when incident severity or SLA breach thresholds trigger",
    ],
    expectedOutcomes: [
      "Earlier detection of vendor and service delivery issues affecting operations",
      "Stronger vendor management with documented SLA and incident history",
      "Reduced production risk from untracked operational delivery gaps",
      "Less leadership time spent on cross-site status aggregation",
      "Clearer accountability across internal teams and external vendors",
    ],
    faq: [
      {
        question: "Does Auroranexis connect to MES or ERP systems?",
        answer:
          "It integrates via API and webhooks with your operational stack. It does not replace manufacturing execution or enterprise resource planning systems.",
      },
      {
        question: "Can we track both internal IT and external vendors?",
        answer:
          "Yes. Client records support internal business units, sites, and external vendor relationships within one portfolio structure.",
      },
      {
        question: "Is this for plant-level operations teams?",
        answer:
          "Yes. Site teams manage local incidents and risks while enterprise leadership retains cross-portfolio visibility.",
      },
    ],
    relatedLinks: [
      { label: "IT services", href: INDUSTRY_ROUTES.it },
      { label: "Technology", href: INDUSTRY_ROUTES.technology },
      { label: "Monitoring", href: FEATURE_ROUTES.monitoring },
      { label: "Incident management", href: SOLUTION_ROUTES.incidentManagement },
    ],
    primaryCta: "requestEnterpriseDemo",
    secondaryCta: "contactSales",
  }),

  technology: buildLandingPage({
    slug: "technology",
    pathPrefix: "/industries",
    category: "industry",
    eyebrow: "Industry",
    title: "Client operations for technology companies and SaaS providers",
    description:
      "Scale customer delivery governance with health monitoring, incident management, executive reporting, and portfolio command center visibility.",
    metaDescription:
      "Technology operations platform — customer health, incident tracking, SLA management, and executive reporting for SaaS and tech service providers in Auroranexis.",
    problem:
      "Technology companies selling B2B services or platforms must demonstrate operational maturity as they scale. Customer success, support, and delivery teams track health in spreadsheets and siloed tools — making it hard for leadership to see portfolio risk, SLA exposure, or which accounts need executive attention.",
    solution:
      "Auroranexis gives technology leaders an operations command center for customer delivery. Monitor account health from operational signals, manage incidents with SLA awareness, maintain risk registers, and generate executive reports — complementing your CRM, support desk, and product analytics stack.",
    businessValue:
      "Reduce churn risk with proactive portfolio visibility. Accelerate enterprise deals by demonstrating governed operations. Free customer success and leadership from manual health roll-ups and QBR preparation.",
    audience:
      "B2B SaaS companies, software agencies, cloud service providers, and technology consultancies managing enterprise customer portfolios.",
    enterpriseAdvantages: [
      "Portfolio health dashboards for customer success and leadership",
      "SLA governance aligned to enterprise contract tiers",
      "Unlimited AI copilot for portfolio intelligence on Enterprise",
      "Integration-ready API and webhook architecture",
      "Client portal for transparent customer status sharing",
    ],
    benefits: [
      {
        title: "Customer health at scale",
        description:
          "Track account health from incidents, risks, SLA performance, and delivery activity across your entire customer base.",
      },
      {
        title: "Enterprise-ready reporting",
        description:
          "Produce QBR and executive reports from operational data to satisfy demanding enterprise procurement requirements.",
      },
      {
        title: "Operational consistency",
        description:
          "Standardize incident, risk, and escalation workflows so quality does not depend on individual CSM habits.",
      },
    ],
    capabilities: [
      "Customer health scoring from operational signals",
      "Incident and risk management per account",
      "SLA policy configuration and breach indicators",
      "AI-assisted executive report generation",
      "Automation workflows for operational follow-up",
      "REST API for integration with CRM and support tools",
    ],
    challenges: [
      "Customer health assessments subjective and inconsistent across CSMs",
      "Incident and SLA data disconnected from account-level context",
      "Executive and QBR reporting requires manual data pulls from multiple tools",
      "Leadership lacks real-time portfolio risk visibility as customer count grows",
      "Enterprise customers expect documented operational governance during renewal",
    ],
    workflowImprovements: [
      "Centralize customer records with incidents, risks, and delivery history",
      "Define SLA policies reflecting enterprise contract commitments",
      "Monitor portfolio health from a single command center dashboard",
      "Generate executive and customer reports from live operational data",
      "Share appropriate account status through the client portal",
    ],
    expectedOutcomes: [
      "Earlier identification of accounts at risk of churn or escalation",
      "Reduced CSM and leadership time on manual health assessments and reporting",
      "Stronger enterprise renewal conversations with documented operational proof",
      "More consistent customer experience across the success organization",
      "Better data-driven decisions on resource allocation and executive engagement",
    ],
    faq: [
      {
        question: "Does Auroranexis replace our CRM or support platform?",
        answer:
          "No. It is an operations command center that complements your CRM and support desk with structured governance, health monitoring, and executive reporting.",
      },
      {
        question: "How does customer health scoring work?",
        answer:
          "Health indicators derive from operational signals — incidents, risks, SLA performance, and delivery activity — not opaque black-box algorithms.",
      },
      {
        question: "Can we integrate with our existing tech stack?",
        answer:
          "Yes. Auroranexis provides REST API and webhook integration points for connecting with CRM, monitoring, and automation tools.",
      },
    ],
    relatedLinks: [
      { label: "IT services", href: INDUSTRY_ROUTES.it },
      { label: "Marketing", href: INDUSTRY_ROUTES.marketing },
      { label: "Customer health score", href: SOLUTION_ROUTES.customerHealthScore },
      { label: "Customer success", href: FEATURE_ROUTES.customerSuccess },
    ],
    primaryCta: "startFreeTrial",
    secondaryCta: "seePricing",
  }),
};

export const INDUSTRY_SLUGS: string[] = landingPageSlugs(INDUSTRY_PAGES);

export const INDUSTRY_HUB_ENTRIES: LandingHubEntry[] = landingPageList(INDUSTRY_PAGES).map(
  (page) => ({
    slug: page.slug,
    path: page.path,
    title: page.title,
    description: page.description,
  }),
);
