import type { DocPageInput } from "@/lib/docs/types";

export const GETTING_STARTED_DOC: DocPageInput = {
  slug: "getting-started",
  title: "Getting Started",
  description: "Sign up, onboarding, and first workspace setup.",
  intro:
    "Auroranexis is an operations platform built for agencies that manage multiple clients. After you create an account, your team works inside an organization-scoped workspace where clients, reports, risks, incidents, monitoring, and billing are kept together. This guide covers account creation, role assignment, and the first operational steps that establish a reliable delivery baseline for your agency.",
  callouts: [
    {
      variant: "tip",
      title: "Pilot program",
      body: "Founding customers can apply for a six-week pilot with dedicated onboarding and beta pricing. Visit the Pilot Program page on the marketing site or Settings → About for eligibility and next steps.",
    },
    {
      variant: "info",
      title: "Organization scope",
      body: "Every user, client, and record belongs to one workspace. Users cannot see data from other organizations, even if they use the same email address elsewhere.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "Getting started in Auroranexis means creating your agency workspace, inviting teammates with appropriate roles, and configuring the settings that govern delivery. The Operations Command Center dashboard surfaces portfolio health, open incidents, SLA status, and recent activity so operators can orient quickly without hunting across disconnected tools.",
        "Your workspace is an isolated tenant. All modules—Clients, Reports, Risks, Incidents, Monitoring—read and write data only within your organization identifier. Internal users, portal users, and automation workflows all respect this boundary, which keeps client data segregated and audit-friendly as your portfolio grows.",
        "Billing runs through Stripe. Plan limits on clients, monitoring connectors, and advanced modules are enforced at the organization level. Owners and admins manage subscriptions in Settings → Billing; all roles can review effective limits in Settings → Usage before onboarding large client batches.",
        "The recommended onboarding path moves from workspace identity and team access to your first managed clients, then to SLA policies, report templates, and optional portal access. Completing these steps in order reduces rework and ensures health scores, SLA timers, and portfolio views reflect accurate data from day one.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "The onboarding path is designed to move an agency from empty workspace to operational readiness without custom setup. You establish who can access what, add your first managed clients, and connect delivery artifacts—reports, SLA policies, monitoring—to those clients so daily operations have a single system of record.",
        "Early configuration reduces rework later. Assigning owners, aligning SLA policies with contracts, and defining report templates before bulk client import keeps portfolio data consistent. Teams that skip these steps often discover mismatched SLA timers, incomplete health scores, or portal users added before published content exists.",
        "For agency leadership, a well-configured workspace supports weekly operations reviews, quarterly business reviews, and escalation decisions without exporting data to spreadsheets. The goal is not merely to sign up—it is to reach a state where every client has an owner, a policy, and a reporting cadence your team can defend in client conversations.",
      ],
    },
    {
      title: "Core Concepts",
      subsections: [
        {
          title: "Workspace and organization",
          paragraphs: [
            "Your workspace is an isolated tenant identified by your organization profile. Settings → Organization holds the workspace name and profile details that appear in internal navigation. All operational records—clients, reports, risks, incidents, monitoring connectors—inherit this scope automatically.",
            "Users invited to your workspace cannot access data from other organizations. If someone participates in multiple agencies, they receive separate invitations and sign in to the workspace they need. This model mirrors how agencies serve distinct client portfolios without commingling data.",
          ],
        },
        {
          title: "Roles and permissions",
          table: {
            caption: "Internal role summary",
            headers: ["Role", "Description"],
            rows: [
              [
                "Owner",
                "Full workspace control including billing, team management, and all operational modules.",
              ],
              [
                "Admin",
                "Manage operations and most settings; billing access depends on assigned permissions.",
              ],
              [
                "Staff",
                "Day-to-day create and update access on assigned modules such as clients, reports, and incidents.",
              ],
              [
                "Viewer",
                "Read-focused access for review, finance oversight, and portfolio reporting without edit rights.",
              ],
            ],
          },
        },
        {
          title: "Clients, plans, and portal users",
          bullets: [
            "Client — a customer account your agency manages; links reports, risks, incidents, monitoring, and portal access.",
            "Plan — subscription tier that controls feature availability and usage limits enforced in Settings → Usage.",
            "Client portal — separate sign-in for external contacts, scoped to one client and its published content.",
            "SLA policy — organization template assigned per client; drives incident and risk timers.",
          ],
        },
        {
          title: "Settings hub",
          paragraphs: [
            "Settings centralizes organization profile, team, billing, usage, SLA policies, escalation rules, branding, and email defaults. Most onboarding tasks route through Settings before you work in operational modules. Owners and admins configure policies; staff consume them when logging incidents or publishing reports.",
          ],
        },
      ],
    },
    {
      title: "Features",
      bullets: [
        "Self-service sign up with email and password; password reset via the login page.",
        "Operations Command Center dashboard with portfolio signals and quick links.",
        "Settings hub for organization, team, billing, usage, SLA, escalation, branding, and email.",
        "Role-based access control with owner, admin, staff, and viewer roles.",
        "Clients module for portfolio management, health scores, owners, and portal user administration.",
        "Reports with templates, schedules, draft and publish workflow, PDF export, and portal delivery.",
        "Risks and Incidents with ownership, SLA timers, and optional portal visibility on incidents.",
        "Monitoring connectors linked to clients with event history and health impact.",
        "Stripe checkout, invoices, and customer portal for subscription management.",
        "Usage meters for clients, monitoring connectors, and plan-specific limits.",
        "Activity logging across major operational records for audit-friendly history.",
        "Client portal publishing for reports and selective incident transparency.",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Go to Sign up, enter your name, agency name, email, and password, then confirm your account.",
        "Sign in to reach the Operations Command Center dashboard.",
        "Open Settings → Organization and verify your workspace name and profile details.",
        "Open Settings → Team and invite owners, admins, staff, or viewers as needed.",
        "Review Settings → Billing to confirm your plan; complete Stripe checkout if upgrading.",
        "Check Settings → Usage to understand current limits before adding many clients or connectors.",
        "Add your first client from Clients → New client with status and internal owner assigned.",
        "Open Settings → SLA and create or review policies before assigning them to clients.",
        "Create a report template under Reports → Templates, then generate a draft report for the client.",
        "Review the draft internally, publish when ready, and add portal users on the client detail page.",
        "Optionally configure Settings → Escalation rules for SLA warning and breach notifications.",
        "Schedule a weekly operations review using dashboard metrics and client health scores.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Maintain at least two owners on active workspaces for continuity during leave or turnover.",
        "Assign one primary internal owner per client to keep accountability clear.",
        "Review Settings → Usage before onboarding large client batches to avoid hitting plan limits.",
        "Use consistent naming for clients and report templates across your portfolio.",
        "Document significant risks and incidents early rather than relying on informal channels.",
        "Enable the client portal only after internal review of published content.",
        "Align SLA policy names with contract language before assigning policies at scale.",
        "Designate an operations lead responsible for weekly health review and reporting cadence.",
        "Configure branding and email defaults in Settings before inviting external portal users.",
        "Export or archive critical reports before any planned subscription cancellation.",
      ],
      paragraphs: [
        "Treat onboarding as a one-week sprint: day one for workspace and team, days two and three for clients and SLA, days four and five for templates and first published report. Agencies that follow this rhythm reach defensible portfolio visibility faster than those who add clients before policies exist.",
      ],
    },
    {
      title: "Examples",
      subsections: [
        {
          title: "Marketing agency",
          paragraphs: [
            "A fifteen-person marketing agency signs up on Professional, invites two admins and six staff users, and adds twelve active clients with account managers as owners. They create a monthly operations report template, assign Standard SLA policies matching their MSA, and enable portal access for three strategic accounts after the first published report cycle.",
          ],
        },
        {
          title: "AI automation agency",
          paragraphs: [
            "An automation consultancy on Starter configures five clients who receive workflow monitoring via HTTP connectors linked on each client record. They log Medium incidents when integrations fail, publish quarterly executive summaries, and upgrade through Settings → Billing when client count approaches plan limits.",
          ],
        },
        {
          title: "MSP",
          paragraphs: [
            "A managed services provider imports twenty clients in batches while watching Settings → Usage, defines Premium and Standard SLA tiers in Settings → SLA, and pairs escalation rules for critical accounts. Monitoring connectors feed events that staff triage into incidents during daily standups.",
          ],
        },
        {
          title: "Consultancy",
          paragraphs: [
            "A strategy consultancy with a small delivery team uses viewer roles for partner reviewers, maintains Watch status on at-risk engagements, and publishes post-engagement reports through the client portal. Risks capture scope and resource constraints before they become client-impacting incidents.",
          ],
        },
        {
          title: "Enterprise deployment",
          paragraphs: [
            "A large agency workspace designates multiple owners, segments staff by client portfolio using ownership assignments, and standardizes report templates across business units. They configure Settings → Escalation for breach notifications and review compliance metrics in the Operations Command Center before executive QBRs.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting",
      table: {
        caption: "Common getting-started issues",
        headers: ["Problem", "Cause", "Solution"],
        rows: [
          [
            "Cannot sign in after registration",
            "Incorrect password or unverified email",
            "Use Forgot password on the login page; confirm the correct email with your workspace admin.",
          ],
          [
            "Missing menu items or modules",
            "Role or plan does not include that feature",
            "Ask an owner or admin to verify permissions in Settings → Team and subscription in Settings → Billing.",
          ],
          [
            "Invitation email not received",
            "Spam filtering or incorrect address",
            "Check spam folders; confirm the address in Settings → Team and resend the invitation.",
          ],
          [
            "Checkout completed but plan unchanged",
            "Stripe webhook delay or session mismatch",
            "Refresh Settings → Billing; contact support with the approximate checkout time if the issue persists.",
          ],
          [
            "Cannot add new clients",
            "Client limit reached on current plan",
            "Review client limits in Settings → Usage or upgrade via Settings → Billing.",
          ],
          [
            "SLA timers not visible on incidents",
            "No policy assigned to the client",
            "Assign an SLA policy on the client detail page or create one in Settings → SLA first.",
          ],
          [
            "Portal user cannot access published report",
            "Report not published or user disabled",
            "Confirm report status is Published and portal users are active on the client detail page.",
          ],
        ],
      },
    },
  ],
  faq: [
    {
      question: "Who should be the workspace owner?",
      answer:
        "Assign owners to people who manage billing, team access, and contractual decisions. Most agencies designate a founder or operations director plus a backup owner.",
    },
    {
      question: "Can I change my workspace name later?",
      answer:
        "Yes. Owners and admins can update organization details in Settings → Organization. Client-facing branding is configured separately in Settings → Branding.",
    },
    {
      question: "Do clients need their own Auroranexis accounts?",
      answer:
        "No. Internal team members use the main application. Client contacts receive portal user accounts scoped to a single client and sign in through the client portal.",
    },
    {
      question: "What happens when I hit a plan limit?",
      answer:
        "Creation actions such as adding clients or monitoring connectors may be blocked. Review Settings → Usage for current consumption and upgrade in Settings → Billing if needed.",
    },
    {
      question: "Is there a recommended order for first modules?",
      answer:
        "Configure team and billing first, then clients and SLA policies, then reports and portal access. Add monitoring once baseline delivery is stable.",
    },
    {
      question: "Can staff manage billing?",
      answer:
        "Billing changes require owner or admin roles with billing permissions. Staff can review operational data but cannot modify subscriptions or payment methods.",
    },
  ],
  relatedLinks: [
    { href: "/docs/clients", label: "Clients" },
    { href: "/docs/reports", label: "Reports" },
    { href: "/docs/billing", label: "Billing" },
    { href: "/docs/sla", label: "SLA policies" },
  ],
};

export const CLIENTS_DOC: DocPageInput = {
  slug: "clients",
  title: "Clients",
  description: "Manage client portfolio, health, and revenue.",
  intro:
    "The Clients module is your portfolio command center. Each client record ties together health scores, ownership, SLA alignment, monitoring summaries, open risks, recent reports, and portal users. Use it to maintain an accurate view of every account your agency manages and to prepare for client reviews, escalations, and revenue reporting.",
  callouts: [
    {
      variant: "info",
      title: "Revenue visibility",
      body: "Monthly revenue fields on client records are visible only to roles with revenue permissions—typically owners and admins. Staff and viewers see client operational data without revenue figures.",
    },
    {
      variant: "tip",
      title: "Health score context",
      body: "Health score reflects operational signals such as SLA compliance, monitoring events, and report cadence. Review open risks and incidents alongside the score before escalating to clients.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "The Clients list provides searchable access to your managed portfolio with status, health score, and owner at a glance. Filters help operators focus on Watch and Critical accounts during weekly reviews. Opening a client detail page consolidates operational context in one place instead of cross-referencing tickets, email, and spreadsheets.",
        "Client detail pages show health trend, SLA summary, monitoring activity, linked risks and incidents, recent reports, and portal user management. Each section updates as underlying records change, giving account managers a live picture before QBRs or escalation calls.",
        "Clients are always scoped to your organization. A client record is the anchor for reports, risks, incidents, monitoring connectors, and client portal access. Deleting or archiving a client does not remove historical records tied to it—they remain for audit and reporting.",
        "Portfolio-level views on the Operations Command Center aggregate signals from client records. Accurate status labels, assigned owners, and SLA policies on each client ensure dashboard metrics and health scores reflect reality rather than stale defaults.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Agencies need a single source of truth for who they serve, who owns delivery internally, and how each account is performing against commitments. The Clients module centralizes that context so operators do not chase information across disconnected systems during incidents or client calls.",
        "Portfolio-level visibility supports weekly operations reviews, quarterly business reviews, and escalation decisions. When every client has an assigned owner and aligned SLA policy, leadership can compare accounts fairly and allocate resources to accounts that need attention.",
        "Revenue fields—where your role permits—help finance and leadership connect operational health to account value. Even without revenue access, staff benefit from health scores and linked records when prioritizing daily work and preparing published reports.",
      ],
    },
    {
      title: "Core Concepts",
      subsections: [
        {
          title: "Client status",
          table: {
            caption: "Client status values",
            headers: ["Status", "Description"],
            rows: [
              [
                "Active",
                "Standard delivery; included in active portfolio views and health scoring.",
              ],
              [
                "Watch",
                "Elevated attention; may reflect recent incidents, declining health, or contract risk.",
              ],
              [
                "Critical",
                "Requires immediate operational focus; often paired with escalation review.",
              ],
              [
                "Archived",
                "No longer actively managed; excluded from default list filters but history retained.",
              ],
            ],
          },
        },
        {
          title: "Health score",
          paragraphs: [
            "Health score is a composite signal derived from operational activity: SLA violations, critical monitoring events, missing reports, portal engagement, and recent incident patterns. Scores update as underlying data changes rather than on a fixed schedule.",
            "Use the score as an early indicator, not a substitute for reviewing open risks and incidents. A client with a moderate score may have one critical open incident; a high score does not eliminate the need for pre-QBR preparation.",
          ],
        },
        {
          title: "Ownership and accountability",
          bullets: [
            "Client owner — internal team member accountable for delivery, follow-through, and client communication.",
            "Primary contact fields — optional name and email for the client's operational point of contact.",
            "Internal notes — free-form context visible to your team but not exposed in the client portal.",
          ],
        },
        {
          title: "SLA and portal linkage",
          paragraphs: [
            "Each client can receive an assigned SLA policy that drives incident and risk timers. Portal users are managed on the client detail page and sign in to a client-scoped portal where published reports and selected incident summaries appear.",
            "Monitoring connectors linked to the client feed events into the monitoring summary card. Critical events may reduce health scores and should follow your documented path to incidents when client impact exists.",
          ],
        },
      ],
    },
    {
      title: "Features",
      bullets: [
        "Searchable client list with status and health filters.",
        "Client detail page with health history, SLA summary, and monitoring summary cards.",
        "Assign internal owner and SLA policy from the client record.",
        "Manual status updates reflecting delivery posture across the portfolio.",
        "View recent reports and open risks linked to the client.",
        "Open incident counts and severity context on client detail pages.",
        "Manage portal users when you have portal administration permissions.",
        "Edit contact name, email, and internal notes for operational reference.",
        "Monthly revenue field for roles with revenue permissions.",
        "Activity history and linked records for audit-friendly client timelines.",
        "Health score trend visible as operational data accumulates.",
        "Integration with Operations Command Center portfolio metrics.",
        "Archive workflow to keep active portfolio views accurate after offboarding.",
        "Client-scoped context for report generation and publishing.",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Open Clients → New client and enter the client name, status, and internal owner.",
        "Add contact name and email if you track primary client contacts on the record.",
        "On the client detail page, assign an SLA policy that matches the contract tier.",
        "Review Settings → Usage if you are approaching client limits on your current plan.",
        "Link monitoring connectors to the client when uptime or integration checks apply.",
        "Create portal users when you are ready to share published reports and status externally.",
        "Generate and publish a report from the Reports module linked to this client.",
        "Review health and monitoring sections after reports, incidents, or monitoring events exist.",
        "Update client status as the relationship evolves—for example, move to Watch after repeated incidents.",
        "Log risks and incidents from their modules with the client pre-selected or linked.",
        "Conduct weekly portfolio review using status filters and health score ordering.",
        "Archive clients when offboarded to keep active portfolio views and dashboards accurate.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Assign exactly one primary owner per client; use notes for secondary contacts.",
        "Align client status with reality—stale Active labels distort portfolio reporting.",
        "Review health scores weekly as part of operations standups or QBR prep.",
        "Assign SLA policies before logging incidents so timers evaluate correctly.",
        "Disable or remove portal users promptly when client contacts change roles.",
        "Document major delivery changes as risks or incidents rather than notes alone.",
        "Use Watch status consistently when accounts need leadership visibility without full Critical escalation.",
        "Verify monitoring connectors are linked to the correct client before relying on summary cards.",
        "Keep client naming conventions consistent for search and report template automation.",
        "Reconcile revenue fields monthly if your role includes revenue permissions.",
      ],
      paragraphs: [
        "Before each QBR, open the client detail page and walk through health, SLA summary, open risks, recent incidents, and the latest published report. This five-minute review prevents surprises in client meetings and ensures portal content matches what you plan to discuss live.",
      ],
    },
    {
      title: "Examples",
      subsections: [
        {
          title: "Marketing agency",
          paragraphs: [
            "A marketing agency creates Active clients for each retainer account, assigns account directors as owners, and attaches Standard SLA policies. They enable portal users for CMO stakeholders and publish monthly performance reports after internal review, using Watch status when campaign delivery slips repeatedly.",
          ],
        },
        {
          title: "AI automation agency",
          paragraphs: [
            "An automation agency links HTTP monitoring connectors to clients running production workflows, sets owners on the engineering lead for each account, and moves clients to Watch when critical monitoring events repeat. Published quarterly summaries explain integration uptime alongside open risks.",
          ],
        },
        {
          title: "MSP",
          paragraphs: [
            "An MSP maintains forty active clients with tiered SLA policies—Premium for 24x7 accounts and Standard for business-hours support. Client detail pages are the starting point for every ticket escalation; portal users at each account see published incident summaries when transparency is required.",
          ],
        },
        {
          title: "Consultancy",
          paragraphs: [
            "A management consultancy tracks engagement health through status and health score rather than monitoring connectors. They archive clients after project closeout, retain report history for reference, and assign partners as owners on strategic accounts under Watch during delivery stress.",
          ],
        },
        {
          title: "Enterprise deployment",
          paragraphs: [
            "A large agency segments hundreds of clients by owner teams, enforces naming standards for global accounts, and uses Critical status to trigger executive review. Revenue fields feed internal profitability analysis available to owners while staff focus on operational cards and SLA compliance.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting",
      table: {
        caption: "Common client module issues",
        headers: ["Problem", "Cause", "Solution"],
        rows: [
          [
            "Cannot create new clients",
            "Client limit reached on subscription",
            "Review limits in Settings → Usage; upgrade via Settings → Billing if at capacity.",
          ],
          [
            "Health score unavailable or stale",
            "Insufficient operational activity on new clients",
            "Ensure reports, incidents, or monitoring data exists; scores improve as activity accumulates.",
          ],
          [
            "SLA summary empty on client page",
            "No SLA policy assigned",
            "Assign a policy on the client detail page under SLA settings or create one in Settings → SLA.",
          ],
          [
            "Portal user cannot sign in",
            "Disabled user or wrong portal URL",
            "Verify the user belongs to this client, is active, and uses the client portal login URL.",
          ],
          [
            "Revenue field not visible",
            "Role lacks revenue permissions",
            "Contact an owner or admin; revenue is restricted to permitted roles by design.",
          ],
          [
            "Monitoring summary shows no events",
            "Connectors not linked to this client",
            "Confirm monitoring connectors reference the correct client in Monitoring configuration.",
          ],
          [
            "Cannot edit client owner or SLA",
            "Insufficient write permissions",
            "Ask an admin to verify your role includes clients.write and related settings access.",
          ],
        ],
      },
    },
  ],
  faq: [
    {
      question: "What is the difference between client status and health score?",
      answer:
        "Status is a manual label your team sets to reflect delivery posture. Health score is calculated from operational signals such as SLA compliance, monitoring events, and report cadence.",
    },
    {
      question: "Can one person own many clients?",
      answer:
        "Yes. Assign the same internal owner to multiple clients when one account manager handles a portfolio. Ensure workload is visible in your operations review process.",
    },
    {
      question: "How do I share reports with a client?",
      answer:
        "Publish the report from the Reports module, then ensure portal users exist on the client detail page. Published reports appear in the client portal for that client.",
    },
    {
      question: "What happens when I archive a client?",
      answer:
        "Archived clients are excluded from default list filters but remain in the system with linked history. Restore by changing status when re-engaging the account.",
    },
    {
      question: "Can staff edit client records?",
      answer:
        "Staff with clients.write permission can edit operational fields. Revenue, SLA policy assignment, and portal user management may require additional permissions.",
    },
    {
      question: "Do archived clients count toward plan limits?",
      answer:
        "Review Settings → Usage for how archived clients affect your current plan. Limits typically apply to active portfolio size; confirm against your subscription details.",
    },
  ],
  relatedLinks: [
    { href: "/docs/reports", label: "Reports" },
    { href: "/docs/client-portal", label: "Client portal" },
    { href: "/docs/monitoring", label: "Monitoring" },
    { href: "/docs/sla", label: "SLA policies" },
  ],
};

export const REPORTS_DOC: DocPageInput = {
  slug: "reports",
  title: "Reports",
  description: "Templates, schedules, publish workflow, and portal delivery.",
  intro:
    "Reports package operational outcomes for client conversations. Auroranexis supports reusable templates, draft and published lifecycles, scheduled generation, PDF export, email delivery, and client portal publishing. Every report is linked to a client and can surface health scores, SLA metrics, and related open risks and incidents in a consistent format your agency controls.",
  callouts: [
    {
      variant: "warning",
      title: "Publishing is client-visible",
      body: "Published reports may appear in the client portal immediately for that client's portal users. Complete internal review before publishing.",
    },
    {
      variant: "tip",
      title: "Generate before editing",
      body: "Run Generate on draft reports so metrics and narrative sections reflect the selected reporting period before your team edits executive summary and key risks.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "The Reports module spans the full lifecycle: define structure in templates, generate content for a reporting period, review and edit, then publish or export. Reports → Templates holds reusable section layouts your agency standardizes on; Reports → Schedules automates recurring generation where your plan allows.",
        "Report statuses progress from draft through generated to published. Draft reports are internal work in progress. Generated reports have metrics and default narrative populated for the selected period. Published reports are finalized and eligible for portal delivery, PDF export, and email. Archived reports remain for history but are not actively delivered.",
        "The report detail page shows version history, metrics captured at generation time, delivery options, and activity logging. Each report links to exactly one client, which determines portal audience and which operational data feeds into generated sections.",
        "Templates reduce preparation time and enforce consistency across account managers. Schedules help teams meet contractual cadence without manual reminders, though every generated report should still pass human review before publishing to clients.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Clients expect periodic visibility into what your agency delivered and what needs attention. Reports standardize that narrative—executive summary, key wins, risks, next actions, and operational metrics—so every account manager presents consistent, defensible information in QBRs and email updates.",
        "Template-driven reporting reduces preparation time and improves quality control. Instead of rebuilding slide decks from scratch, operators start from agency-approved structure, generate period-specific metrics, edit narrative sections, and publish through channels clients already use.",
        "Published reports in the client portal create a durable record of what you communicated externally. That history supports renewal conversations, dispute resolution, and internal audits when questions arise about what the client was told and when.",
      ],
    },
    {
      title: "Core Concepts",
      subsections: [
        {
          title: "Report lifecycle",
          table: {
            caption: "Report status values",
            headers: ["Status", "Description"],
            rows: [
              [
                "Draft",
                "Work in progress; not visible to clients; may lack generated metrics.",
              ],
              [
                "Generated",
                "Content and metrics populated for the reporting period; ready for review.",
              ],
              [
                "Published",
                "Finalized; eligible for client portal, PDF export, and email delivery.",
              ],
              [
                "Archived",
                "Retained for history; not actively delivered or promoted externally.",
              ],
            ],
          },
        },
        {
          title: "Templates and schedules",
          bullets: [
            "Template — reusable structure for sections and default content your agency standardizes on.",
            "Schedule — ties a template and client to a recurring generation cadence when your plan includes scheduling.",
            "Reporting period — start and end dates that frame metrics and narrative content for each report.",
            "Sections — typical areas include executive summary, key wins, key risks, next actions, and operational metrics.",
          ],
        },
        {
          title: "Delivery channels",
          paragraphs: [
            "Published reports can be viewed in the client portal by active portal users on the linked client. PDF export supports attachments for email or offline QBR decks. Email delivery with PDF attachment is available where configured in Settings → Email and on the report detail page.",
            "Portal delivery requires published status and at least one active portal user. Internal reviewers should confirm narrative accuracy and metric alignment before publishing because clients may see content immediately.",
          ],
        },
        {
          title: "Metrics at generation",
          paragraphs: [
            "When you run Generate, the platform captures health score, SLA compliance metrics, and related open risks and incidents for the selected client and period. These values reflect point-in-time operational state and do not retroactively change if underlying data shifts later unless you regenerate.",
          ],
        },
      ],
    },
    {
      title: "Features",
      bullets: [
        "Report templates with configurable sections under Reports → Templates.",
        "Create reports linked to a client and reporting period.",
        "Generate draft content including executive summary, wins, risks, and next actions.",
        "Capture health score and SLA score at generation time.",
        "Edit narrative sections after generation while status remains internal.",
        "Publish to client portal with activity logging.",
        "PDF export from the report detail page.",
        "Email delivery with PDF attachment where enabled.",
        "Schedules for automated generation under Reports → Schedules.",
        "Version history for published report iterations.",
        "Archive workflow for superseded reports without deleting history.",
        "Client-linked report lists on client detail pages.",
        "Role-based permissions for create, generate, publish, and archive actions.",
        "Integration with operational modules for metrics and linked risk references.",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Open Reports → Templates and create or select a template that matches your delivery format.",
        "From Reports, create a new report and choose the client and reporting period dates.",
        "Save as draft and confirm the linked client and period are correct before generating.",
        "Run Generate to populate metrics and default narrative sections from operational data.",
        "Review and edit executive summary, key wins, key risks, and next actions for accuracy.",
        "Conduct internal peer review while status is draft or generated—never publish prematurely.",
        "Publish when the report is client-ready; confirm activity shows published status.",
        "Verify portal users exist on the client detail page if external portal delivery is required.",
        "Export PDF or send by email from the report detail page as needed for non-portal stakeholders.",
        "Optionally create a schedule under Reports → Schedules for recurring generation on the same template.",
        "After client feedback, archive superseded versions rather than deleting published history.",
        "Reference the published report in your next client meeting and update risks if new issues emerged.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Maintain separate templates for executive summaries, monthly operations, and post-incident reviews.",
        "Generate before editing so metrics reflect the correct reporting period boundaries.",
        "Conduct internal review while status is draft or generated—never publish prematurely.",
        "Align report cadence with contract obligations and QBR calendars.",
        "Reference linked risks and incidents when clients expect transparency on open items.",
        "Archive superseded reports rather than deleting history clients may have viewed.",
        "Use consistent template naming so staff select the correct format under time pressure.",
        "Confirm portal users are active before publishing sensitive operational content.",
        "Store PDF exports for accounts without portal access to maintain delivery records.",
        "Review schedule output promptly—automated generation still requires human approval before publish.",
      ],
      paragraphs: [
        "Assign a report reviewer who is not the primary author for strategic accounts. A second pair of eyes catches metric mismatches and client-facing language issues that authors overlook after hours of editing.",
      ],
    },
    {
      title: "Examples",
      subsections: [
        {
          title: "Marketing agency",
          paragraphs: [
            "A marketing agency uses a Monthly Operations template for all retainer clients, generates on the first business day of each month, and publishes after the account director reviews key wins and risks. Portal users at each client access reports without email attachments.",
          ],
        },
        {
          title: "AI automation agency",
          paragraphs: [
            "An automation agency publishes quarterly executive summaries highlighting integration uptime from linked monitoring data and open incidents resolved during the period. They maintain a separate post-incident template for failure reviews shared selectively through PDF export.",
          ],
        },
        {
          title: "MSP",
          paragraphs: [
            "An MSP schedules weekly operational reports for Premium clients using Reports → Schedules, triages generated drafts during Monday standup, and publishes by midday. Standard-tier clients receive monthly reports with SLA compliance sections generated from assigned policies.",
          ],
        },
        {
          title: "Consultancy",
          paragraphs: [
            "A consultancy produces engagement-close reports from a custom template with next actions and lessons learned, publishes to portal users on the client steering committee, and archives reports when follow-on work begins under a new reporting period.",
          ],
        },
        {
          title: "Enterprise deployment",
          paragraphs: [
            "A large agency enforces three approved templates globally, requires admin publish approval on Critical-status clients, and exports PDF batches for legal records. Schedules run per region with local account owners responsible for narrative edits before publish.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting",
      table: {
        caption: "Common reports module issues",
        headers: ["Problem", "Cause", "Solution"],
        rows: [
          [
            "Report not visible in client portal",
            "Not published or no portal users",
            "Confirm status is Published and active portal users exist on the client detail page.",
          ],
          [
            "Generate action unavailable",
            "Report not in draft status",
            "Only draft reports can be generated; check current status on the report detail page.",
          ],
          [
            "Metrics missing or zero in generated report",
            "No operational data in reporting period",
            "Verify incidents, SLA activity, or health data exists for the client during the selected dates.",
          ],
          [
            "PDF export fails",
            "Transient generation error",
            "Retry after a few minutes; contact support if the issue persists across attempts.",
          ],
          [
            "Schedule did not run",
            "Inactive schedule or plan limit",
            "Verify the schedule is active and your plan includes scheduled reporting in Settings → Usage.",
          ],
          [
            "Email delivery failed",
            "Email settings or invalid recipient",
            "Check Settings → Email configuration and the recipient address on the report detail page.",
          ],
          [
            "Cannot publish report",
            "Insufficient role permissions",
            "Ask an owner or admin to verify your role includes report publish permissions.",
          ],
        ],
      },
    },
  ],
  faq: [
    {
      question: "What is the difference between draft and generated?",
      answer:
        "Draft is an empty or partially edited report. Generated means the platform populated metrics and narrative content for the selected period. Both are internal until published.",
    },
    {
      question: "Can I edit a published report?",
      answer:
        "Published reports are finalized for client delivery. Create a new version or archive the report and produce an updated draft if material changes are required.",
    },
    {
      question: "Do reports require a template?",
      answer:
        "Templates standardize structure and speed creation. You can work from an existing template or create one under Reports → Templates before generating reports at scale.",
    },
    {
      question: "Which roles can publish reports?",
      answer:
        "Publishing requires report lifecycle permissions assigned to your role. Staff may create and generate; owners and admins typically control publish actions.",
    },
    {
      question: "Are schedules available on all plans?",
      answer:
        "Scheduled reporting availability depends on your subscription. Review Settings → Usage and Settings → Billing for plan-specific limits.",
    },
    {
      question: "Do published reports update if client health changes?",
      answer:
        "No. Metrics reflect values at generation time. Regenerate or create a new report if you need updated figures after significant operational changes.",
    },
  ],
  relatedLinks: [
    { href: "/docs/clients", label: "Clients" },
    { href: "/docs/client-portal", label: "Client portal" },
    { href: "/docs/risks", label: "Risks" },
    { href: "/docs/sla", label: "SLA policies" },
  ],
};

export const RISKS_DOC: DocPageInput = {
  slug: "risks",
  title: "Risks",
  description: "Track operational risks with ownership and audit history.",
  intro:
    "The Risks module documents operational threats before they become client-impacting incidents. Register risks with severity and status, assign internal owners, link records to clients, and track mitigation through resolution or dismissal. Open risks contribute to client health signals, SLA evaluation, and operational dashboards used in reviews and governance discussions.",
  callouts: [
    {
      variant: "tip",
      title: "Search before creating",
      body: "Check existing risks for the client before opening a duplicate record. Consistent titles and descriptions make portfolio reporting and client transparency easier.",
    },
    {
      variant: "info",
      title: "SLA on risks",
      body: "When a client has an assigned SLA policy, open risks evaluate response targets based on severity. Review timers on the risk detail page and the client SLA summary.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "Each risk record captures title, description, severity, status, client linkage, owner, and due dates where applicable. The Risks list supports filtering by status and severity so operators can prioritize portfolio-wide reviews. Client detail pages show open risks alongside health and SLA context for account-level conversations.",
        "Risks can be created manually by staff or originate from platform signals such as health engine evaluation, SLA breaches, reports, or activity events. Regardless of source, owners are responsible for status progression and documented rationale when closing records.",
        "Severity drives SLA timer evaluation when the linked client has an assigned policy. High and critical risks should appear in weekly operations meetings alongside open incidents. Risk score summaries on client detail pages aggregate open items for quick triage.",
        "Unlike incidents, risks represent potential or emerging threats rather than active client impact. Maintaining accurate distinction between the two keeps SLA metrics, health scores, and client communications aligned with what actually happened versus what might happen.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Operational risk tracking gives agencies a defensible record of known issues, mitigation plans, and accepted exposures. It supports internal governance, selective client transparency through published reports, and post-incident analysis when risks were identified but not yet resolved.",
        "Linking risks to clients ensures portfolio views and reports reflect the correct account context. SLA policies apply response targets to open risks based on severity, aligning platform metrics with contractual commitments your team can demonstrate in QBRs.",
        "Risk history also helps agencies avoid repeating mistakes. When a similar issue resurfaces, searchable records show what was tried, who owned mitigation, and why prior records were resolved or dismissed.",
      ],
    },
    {
      title: "Core Concepts",
      subsections: [
        {
          title: "Severity levels",
          table: {
            caption: "Risk severity definitions",
            headers: ["Severity", "Description"],
            rows: [
              [
                "Low",
                "Minor operational concern with limited client impact; track for awareness.",
              ],
              [
                "Medium",
                "Meaningful issue requiring planned mitigation within normal cadence.",
              ],
              [
                "High",
                "Significant exposure; prioritize in operations reviews and owner follow-up.",
              ],
              [
                "Critical",
                "Immediate attention; may pair with Settings → Escalation rules and leadership review.",
              ],
            ],
          },
        },
        {
          title: "Status lifecycle",
          table: {
            caption: "Risk status values",
            headers: ["Status", "Description"],
            rows: [
              [
                "Open",
                "Identified; mitigation not yet started or confirmed by owner.",
              ],
              [
                "Acknowledged",
                "Owner confirmed; active work underway toward mitigation.",
              ],
              [
                "Mitigated",
                "Controls applied; team monitors for recurrence before closure.",
              ],
              [
                "Resolved",
                "Closed with successful mitigation and documented outcome.",
              ],
              [
                "Dismissed",
                "Closed without action; document rationale for audit purposes.",
              ],
            ],
          },
        },
        {
          title: "Sources and ownership",
          paragraphs: [
            "Risks may be created manually or generated from platform sources including health engine rules, SLA evaluation, reports, activity feeds, and portal submissions. Source metadata helps reviewers understand why a record exists without inferring from the title alone.",
            "Every open risk should have an internal owner accountable for status updates. Due dates optional but recommended when contracts or playbooks require time-bound mitigation.",
          ],
        },
      ],
    },
    {
      title: "Features",
      bullets: [
        "Create and edit risks from Risks → New risk with client assignment.",
        "Severity and status lifecycle with activity history.",
        "Internal owner assignment and optional due date tracking.",
        "Client-linked views on portfolio and client detail pages.",
        "SLA timer evaluation based on assigned client policy and severity.",
        "Risk score summaries on client detail pages for open items.",
        "Filtering and search across the organization portfolio.",
        "Integration with reports—related open risks can appear in generated reports.",
        "Manual and platform-originated risk creation with source metadata.",
        "Dismiss workflow with rationale for accepted or invalid risks.",
        "Linkage to incidents when risks materialize into client impact.",
        "Dashboard and health engine integration for portfolio-level visibility.",
        "Role-based permissions for create, update, and close actions.",
        "Audit-friendly activity log on each risk record.",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Search existing risks for the client to avoid duplicates before creating a new record.",
        "Open Risks → New risk and enter title, client, severity, and description.",
        "Assign an internal owner responsible for mitigation and follow-up.",
        "Set a due date if your delivery playbook requires time-bound response.",
        "Move status to Acknowledged when work begins; add notes as mitigation progresses.",
        "Monitor SLA timers on the risk detail page if the client has an assigned policy.",
        "Set Mitigated when controls are in place; continue monitoring before final closure.",
        "Resolve or Dismiss with documented rationale when the risk is no longer applicable.",
        "Link related incidents if the risk materializes into active client impact.",
        "Reference significant open risks in client reports when transparency is expected.",
        "Review open risks weekly in operations meetings alongside incidents and SLA breaches.",
        "Use Settings → Escalation rules for critical risks that breach response targets.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Define severity criteria in your internal playbook so the team applies labels consistently.",
        "Review open risks weekly in operations meetings alongside incidents and SLA breaches.",
        "Avoid duplicate records—search by client and title before creating new entries.",
        "Close risks with clear resolution notes suitable for audit or client review.",
        "Escalate critical risks through your defined path including Settings → Escalation rules.",
        "Link related incidents when a risk materializes into client impact.",
        "Use Acknowledged status promptly so SLA timers reflect active ownership.",
        "Dismiss only with written rationale when accepting exposure or invalidating the threat.",
        "Include open high-severity risks in published report key risks sections when appropriate.",
        "Revisit mitigated risks after thirty days to confirm controls remain effective.",
      ],
      paragraphs: [
        "Risk registers fail when teams treat them as write-once archives. Successful agencies assign owners, set review cadence, and close loops in the same meeting where incidents are discussed.",
      ],
    },
    {
      title: "Examples",
      subsections: [
        {
          title: "Marketing agency",
          paragraphs: [
            "A marketing agency registers Medium risks when creative capacity conflicts with launch dates, assigns delivery directors as owners, and cites open items in monthly reports. Resolved risks document what staffing changes prevented recurrence before the next campaign cycle.",
          ],
        },
        {
          title: "AI automation agency",
          paragraphs: [
            "An automation agency logs High risks when third-party API dependencies lack fallback paths, links risks to clients running affected workflows, and resolves after redundant integrations are deployed. SLA timers on critical risks trigger escalation to engineering leads.",
          ],
        },
        {
          title: "MSP",
          paragraphs: [
            "An MSP tracks infrastructure risks—end-of-life hardware, missing backups—per client with due dates aligned to maintenance windows. Critical risks escalate through Settings → Escalation while Watch client status signals leadership review on the client record.",
          ],
        },
        {
          title: "Consultancy",
          paragraphs: [
            "A consultancy documents scope creep and key-person dependency as Medium risks during engagements, dismisses accepted exposures with client sign-off noted in resolution text, and references mitigated risks in closeout reports published to portal users.",
          ],
        },
        {
          title: "Enterprise deployment",
          paragraphs: [
            "A large agency standardizes risk titles across regions, requires admin review before Dismiss on High or Critical items, and exports portfolio risk summaries during quarterly governance reviews. Platform-originated risks from SLA evaluation are triaged within defined response windows.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting",
      table: {
        caption: "Common risks module issues",
        headers: ["Problem", "Cause", "Solution"],
        rows: [
          [
            "Cannot edit a risk",
            "Role is read-only for risks module",
            "Contact an admin to verify risks write permissions on your role.",
          ],
          [
            "Risk missing from client detail page",
            "Incorrect or missing client linkage",
            "Confirm the correct client is linked on the risk record.",
          ],
          [
            "SLA timer not shown on risk",
            "No SLA policy on client",
            "Assign a policy on the client detail page or in Settings → SLA.",
          ],
          [
            "Duplicate risks for same issue",
            "Manual creation without search",
            "Merge narrative in one record; dismiss duplicates with documented rationale.",
          ],
          [
            "Unexpected platform-created risk",
            "Health engine or SLA evaluation trigger",
            "Review source metadata on the record; acknowledge or resolve per playbook.",
          ],
          [
            "Risk not appearing in generated report",
            "Report generated before risk created",
            "Regenerate the report or include the risk in manual narrative edits before publish.",
          ],
          [
            "Cannot dismiss risk",
            "Insufficient close permissions",
            "Ask an admin to verify your role includes permission to move status to Dismissed.",
          ],
        ],
      },
    },
  ],
  faq: [
    {
      question: "What is the difference between mitigated and resolved?",
      answer:
        "Mitigated means controls are in place but the team is still monitoring. Resolved means the risk is fully closed with no further action expected.",
    },
    {
      question: "Do risks appear in the client portal?",
      answer:
        "Risks are primarily an internal operational record. Client-facing transparency is typically delivered through published reports or incident summaries rather than direct risk portal views.",
    },
    {
      question: "How do SLA policies apply to risks?",
      answer:
        "When a client has an assigned SLA policy, open risks evaluate response targets based on severity. Review SLA summaries on the client detail page and in Settings → SLA.",
    },
    {
      question: "Can I link a risk to an incident?",
      answer:
        "Incidents can reference linked risks when logging client-impacting events. Use this linkage to maintain traceability from identified risk to realized impact.",
    },
    {
      question: "Who can dismiss a risk?",
      answer:
        "Users with risk write permissions can move status to Dismissed. Document why the risk was accepted or deemed not applicable for audit purposes.",
    },
    {
      question: "When should I create a risk versus an incident?",
      answer:
        "Create a risk for potential or emerging threats without active client impact. Create an incident when delivery is actively affected or service is disrupted.",
    },
  ],
  relatedLinks: [
    { href: "/docs/incidents", label: "Incidents" },
    { href: "/docs/clients", label: "Clients" },
    { href: "/docs/sla", label: "SLA policies" },
    { href: "/docs/reports", label: "Reports" },
  ],
};

export const INCIDENTS_DOC: DocPageInput = {
  slug: "incidents",
  title: "Incidents",
  description: "Manage incidents, SLA impact, and client visibility.",
  intro:
    "Incidents record operational events that affect client delivery. Log impact, assign responders, track resolution against SLA targets, and control what client portal users see. Each incident belongs to a client, supports severity classification, optional linkage to related risks, and maintains history suitable for post-incident review and contractual reporting.",
  callouts: [
    {
      variant: "warning",
      title: "Portal visibility",
      body: "When portal visibility is enabled, client portal users may see the incident summary you provide. Write client-facing text carefully and update it as status changes.",
    },
    {
      variant: "tip",
      title: "Log early",
      body: "Create incidents as soon as client impact is confirmed. Delayed creation skews SLA response metrics and weakens post-incident timelines.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "Incidents move through statuses from open through investigating to resolved and archived. The Incidents list and client detail pages show open items, severity, assigned owner, and SLA timer status. Critical incidents surface in dashboard alerts and may trigger escalation rules configured in Settings → Escalation.",
        "SLA policies assigned to clients determine response and resolution targets by severity. Timers start when incidents are created and update as responders change status and add resolution notes. Breach and warning states appear on incident detail pages and client SLA summaries.",
        "Each incident supports separate internal and client-facing content. Internal description and resolution notes capture technical detail for your team. Client summary and portal visibility control what external users see when transparency is required.",
        "Linked risks maintain traceability when an identified threat becomes active impact. Post-incident, teams often open new risks for preventive work discovered during root cause analysis.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Incident management gives agencies a structured response path when something goes wrong. Recording incidents promptly preserves timelines for SLA measurement, client communication, and internal retrospectives that improve future delivery.",
        "Separating internal technical detail from client-facing summaries lets operators be thorough internally while presenting clear, appropriate information in the client portal. Clients receive status updates without unnecessary jargon; your team retains full context for remediation.",
        "Incident history feeds health scores, published reports, and compliance discussions. Accurate severity classification and timely status updates ensure metrics reflect real performance rather than administrative backlog.",
      ],
    },
    {
      title: "Core Concepts",
      subsections: [
        {
          title: "Severity levels",
          table: {
            caption: "Incident severity definitions",
            headers: ["Severity", "Description"],
            rows: [
              [
                "Low",
                "Limited impact; standard response cadence per client SLA policy.",
              ],
              [
                "Medium",
                "Noticeable client impact; prioritize in daily standups and owner updates.",
              ],
              [
                "High",
                "Significant disruption; involve account owner and leadership promptly.",
              ],
              [
                "Critical",
                "Severe impact; follow escalation playbook and Settings → Escalation rules immediately.",
              ],
            ],
          },
        },
        {
          title: "Status lifecycle",
          table: {
            caption: "Incident status values",
            headers: ["Status", "Description"],
            rows: [
              [
                "Open",
                "Reported; initial triage underway; SLA response timer active.",
              ],
              [
                "Investigating",
                "Active diagnosis and remediation in progress.",
              ],
              [
                "Resolved",
                "Service restored or issue addressed; pending closure review.",
              ],
              [
                "Archived",
                "Closed record retained for history and reporting.",
              ],
            ],
          },
        },
        {
          title: "Client visibility",
          paragraphs: [
            "Portal visibility and client summary fields control what external users see on the client portal. Enable visibility only when you have client-appropriate text ready. Update summaries as situations evolve so portal users are not left with stale status.",
            "Internal fields remain visible to your team regardless of portal settings. Align severity labels with SLA policy tier definitions on the client record so timers evaluate correctly.",
          ],
        },
      ],
    },
    {
      title: "Features",
      bullets: [
        "Create incidents from Incidents → New incident with client and severity.",
        "Assign internal responder and link related risks where applicable.",
        "SLA response and resolution timers based on client policy and severity.",
        "Status updates with activity history and timestamps.",
        "Portal visibility toggle and client-facing summary field.",
        "Resolution notes and resolved-at timestamp for closure documentation.",
        "Open incident counts on client detail pages and operational dashboards.",
        "Related incident references in generated client reports.",
        "Critical incident surfacing on Operations Command Center.",
        "Integration with Settings → Escalation for breach notifications.",
        "Severity-based SLA evaluation consistent with assigned client policy.",
        "Archive workflow after post-incident review completion.",
        "Search and filter across organization incident portfolio.",
        "Health score impact from open and recent critical incidents.",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Confirm client impact exists; if only potential impact, consider creating a risk instead.",
        "Open Incidents → New incident and select the affected client.",
        "Set severity aligned with your SLA policy tiers and describe impact in the internal description.",
        "Assign a responder responsible for triage and communication.",
        "Set status to Investigating when active work begins; save to update timestamps.",
        "Monitor SLA timers on the incident detail page and client SLA summary.",
        "Enable portal visibility and write a client summary if external transparency is required.",
        "Update client summary as status changes so portal users see current information.",
        "Move to Resolved when impact is addressed; add resolution notes with root cause context.",
        "Link related risks if the incident realized a previously identified threat.",
        "Conduct brief post-incident review for repeat issues; open follow-up risks if needed.",
        "Archive after final client communication and internal documentation are complete.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Log incidents as soon as client impact is confirmed—delayed creation skews SLA metrics.",
        "Update status promptly; stale investigating records distort compliance reporting.",
        "Use client summaries written for non-technical readers; avoid internal jargon and blame.",
        "Conduct brief post-incident reviews for repeat issues and document follow-up risks.",
        "Align severity with your SLA policy tier definitions on each client.",
        "Link related risks when the incident realizes a previously identified threat.",
        "Notify account owners on High and Critical incidents even if they are not the assigned responder.",
        "Disable portal visibility for internal-only issues that do not require client notification.",
        "Reference significant incidents in published reports when contracts require disclosure.",
        "Review breach incidents monthly to identify process improvements, not only individual fault.",
      ],
      paragraphs: [
        "Maintain a severity cheat sheet aligned with your SLA policies and train on-call staff to use it during stressful outages. Consistent classification matters more than perfect labels in the first minute.",
      ],
    },
    {
      title: "Examples",
      subsections: [
        {
          title: "Marketing agency",
          paragraphs: [
            "A marketing agency logs a Medium incident when a scheduled campaign fails to launch, assigns the channel lead as responder, and keeps portal visibility off while resolving internally. They reference the incident in the next monthly report transparency section per contract requirements.",
          ],
        },
        {
          title: "AI automation agency",
          paragraphs: [
            "An automation agency opens a Critical incident when a production workflow stops processing client orders, enables portal visibility with a plain-language summary, and resolves after rollback. A linked High risk captures the missing dependency that caused the failure.",
          ],
        },
        {
          title: "MSP",
          paragraphs: [
            "An MSP logs High incidents for network outages affecting multiple sites, triggers Settings → Escalation on SLA warning states, and updates client summaries hourly until Resolved. Post-incident review produces a Medium risk for firmware updates scheduled during the next maintenance window.",
          ],
        },
        {
          title: "Consultancy",
          paragraphs: [
            "A consultancy documents a Low incident when a deliverable misses internal review deadline without client impact, resolves after publication, and avoids portal visibility. The account owner cites timeline lessons in the engagement closeout report.",
          ],
        },
        {
          title: "Enterprise deployment",
          paragraphs: [
            "A large agency routes Critical incidents through a defined command channel, requires manager approval before portal visibility on global accounts, and archives only after legal review when client communications touched regulated data.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting",
      table: {
        caption: "Common incidents module issues",
        headers: ["Problem", "Cause", "Solution"],
        rows: [
          [
            "SLA breach shown incorrectly",
            "Wrong policy or severity on client",
            "Verify client SLA assignment and incident severity matches policy tier definitions.",
          ],
          [
            "Client cannot see incident in portal",
            "Portal visibility disabled or no portal users",
            "Enable portal visibility on the incident and confirm active portal users on the client.",
          ],
          [
            "Cannot change status to resolved",
            "Role limited to early statuses",
            "Staff roles may be limited; ask an admin for incident close permissions if appropriate.",
          ],
          [
            "Timers not appearing on new incident",
            "No SLA policy assigned to client",
            "Assign an SLA policy on the client detail page before relying on timer evaluation.",
          ],
          [
            "Escalation did not notify team",
            "Escalation rules misconfigured",
            "Review Settings → Escalation for severity, client, and SLA state conditions.",
          ],
          [
            "Incident missing from client detail page",
            "Wrong client selected at creation",
            "Edit the incident and confirm the correct client linkage.",
          ],
          [
            "Health score dropped after resolution",
            "Recent critical history still weighted",
            "Health scores reflect recent activity; sustained compliance improves score over time.",
          ],
        ],
      },
    },
  ],
  faq: [
    {
      question: "When should I create an incident versus a risk?",
      answer:
        "Create a risk for potential or emerging threats. Create an incident when client delivery is actively affected or service is disrupted.",
    },
    {
      question: "Do incidents affect client health scores?",
      answer:
        "Yes. Open incidents, SLA violations, and critical monitoring events contribute to client health scoring alongside other operational signals.",
    },
    {
      question: "Can I edit the client summary after enabling portal visibility?",
      answer:
        "Yes. Update the client summary as the situation evolves so portal users see current information. Major changes should be reflected in status updates.",
    },
    {
      question: "How are SLA response and resolution times calculated?",
      answer:
        "Targets come from the SLA policy assigned to the client, using severity-specific response and resolution minutes defined in Settings → SLA.",
    },
    {
      question: "What is the difference between resolved and archived?",
      answer:
        "Resolved indicates the issue is addressed. Archived closes the record for long-term history after any final review or client communication is complete.",
    },
    {
      question: "Should every incident be visible in the client portal?",
      answer:
        "No. Enable portal visibility only when clients need transparency. Internal-only issues can remain off the portal while still documented for SLA and health metrics.",
    },
  ],
  relatedLinks: [
    { href: "/docs/sla", label: "SLA policies" },
    { href: "/docs/client-portal", label: "Client portal" },
    { href: "/docs/risks", label: "Risks" },
    { href: "/docs/monitoring", label: "Monitoring" },
  ],
};

export const MONITORING_DOC: DocPageInput = {
  slug: "monitoring",
  title: "Monitoring",
  description: "Track monitored endpoints and client operational signals.",
  intro:
    "Monitoring helps your team observe configured checks and external signals tied to clients. Connectors represent monitoring sources; events record detected conditions with severity and status. Summaries on client detail pages and the Monitoring module support early awareness alongside health scores and incidents, so operators can escalate before clients report problems.",
  callouts: [
    {
      variant: "info",
      title: "Plan limits",
      body: "Monitoring connector counts are limited by subscription tier. Review current usage in Settings → Usage before adding connectors across a large portfolio.",
    },
    {
      variant: "warning",
      title: "Escalate confirmed impact",
      body: "Monitoring events indicate detected conditions—not every event requires an incident. Open Incidents → New incident when client delivery is actively affected.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "The Monitoring module lists connectors configured for your organization—each linked to a client where applicable. Connectors support providers such as Manual entry, Webhook, HTTP checks, Healthcheck, and common integration targets. Events capture severity, message, detection time, and resolution status.",
        "Client detail pages include a monitoring summary card showing recent activity for linked connectors. Critical events can affect client health scores and may optionally trigger incident or risk creation based on connector configuration such as create incident on critical.",
        "Connector status reflects operational health of the check itself—active, paused, failed, disabled, or archived. A failed connector may indicate configuration or reachability problems rather than client system outage; investigate before ignoring subsequent events.",
        "Monitoring complements but does not replace incident management. Events provide signals; incidents document client impact with SLA timers and optional portal visibility when your team confirms delivery is affected.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Agencies often monitor client systems, integrations, or delivery checkpoints outside a single ticket queue. Centralizing monitoring signals in Auroranexis places them next to SLA status, incidents, and reports—the same context operators use for client conversations.",
        "Documented escalation from monitoring events to incidents preserves timeline integrity and supports post-incident analysis. When a critical HTTP check fails and your team opens an incident within minutes, SLA metrics and client summaries reflect a coherent story.",
        "Portfolio-level monitoring usage is constrained by plan limits in Settings → Usage. Planning connector allocation per client tier prevents surprise blocks during onboarding spikes.",
      ],
    },
    {
      title: "Core Concepts",
      subsections: [
        {
          title: "Connectors",
          paragraphs: [
            "A connector defines what you monitor and how checks run. Each connector has a provider type, status, and configuration including the linked client, endpoint or webhook details, and optional automation such as creating incidents on critical events or enabling health impact tracking.",
          ],
        },
        {
          title: "Events",
          table: {
            caption: "Event fields and values",
            headers: ["Concept", "Description"],
            rows: [
              [
                "Severity",
                "Low, Medium, High, or Critical—guides triage priority and optional automation.",
              ],
              [
                "Status",
                "Open while active, Resolved after remediation, Ignored for benign or duplicate signals.",
              ],
              [
                "Detection time",
                "When the connector recorded the condition; used in timelines and client summaries.",
              ],
              [
                "Client linkage",
                "Events inherit client context from connector configuration for portfolio reporting.",
              ],
            ],
          },
        },
        {
          title: "Health impact",
          bullets: [
            "Critical monitoring events apply penalties to client health scores when health impact is enabled.",
            "Repeated failures on the same connector should follow your documented path to incidents.",
            "Resolved events stop contributing to open-event counts on client summary cards.",
          ],
        },
        {
          title: "Provider types",
          paragraphs: [
            "Manual entry supports ad hoc signals your team records. Webhook receives payloads from external tools. HTTP and Healthcheck run scheduled reachability or endpoint validation. Choose the provider that matches how your agency already observes client systems.",
          ],
        },
      ],
    },
    {
      title: "Features",
      bullets: [
        "Monitoring list with connector status and last check timestamps.",
        "Create and configure connectors with client linkage.",
        "Multiple provider types including Manual, Webhook, HTTP, and Healthcheck.",
        "Event history with severity, status, and detection time.",
        "Client monitoring summary on client detail pages.",
        "Optional automatic incident creation on critical failures.",
        "Optional health impact tracking on supported connector configurations.",
        "Activity logging for connector and event changes.",
        "Usage limits visible in Settings → Usage.",
        "Pause and resume connectors without deleting configuration history.",
        "Resolve or ignore events with status workflow.",
        "Integration with Operations Command Center portfolio signals.",
        "Escalation alignment via Settings → Escalation for critical event patterns.",
        "Plan-gated connector counts enforced at organization level.",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Review Settings → Usage to confirm available monitoring connector capacity.",
        "Open Monitoring and review existing connectors for your portfolio.",
        "Create a connector, select provider type, and link it to the relevant client.",
        "Configure endpoint URL, webhook secret, or manual check parameters per provider documentation.",
        "Set options such as create incident on critical and health impact if appropriate for the client tier.",
        "Enable the connector and confirm status shows active after successful checks.",
        "Review events on the Monitoring detail view and client summary card during daily standup.",
        "Triage open critical events—open Incidents → New incident when client impact is confirmed.",
        "Resolve events after remediation is complete with notes if your playbook requires them.",
        "Ignore benign or duplicate events after documenting why no action was required.",
        "Pause connectors during planned maintenance to avoid false critical events.",
        "Upgrade via Settings → Billing if connector limits block new client onboarding.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Define which clients require active monitoring versus periodic manual review.",
        "Document escalation paths from monitoring signals to incidents in your runbook.",
        "Pause rather than delete connectors when temporarily disabling checks.",
        "Review monitoring usage before onboarding many new clients on the same plan.",
        "Align critical event handling with on-call coverage and Settings → Escalation rules.",
        "Investigate repeated failed connector status before ignoring events.",
        "Link each connector to exactly one client for clear portfolio reporting.",
        "Name connectors consistently so staff identify production versus staging checks.",
        "Test webhook endpoints after credential rotation to prevent silent failures.",
        "Review ignored events monthly to ensure triage criteria remain valid.",
      ],
      paragraphs: [
        "Treat monitoring as a signal layer, not a notification firehose. Agencies that define severity thresholds and on-call response in advance respond faster than those that open incidents for every transient blip.",
      ],
    },
    {
      title: "Examples",
      subsections: [
        {
          title: "Marketing agency",
          paragraphs: [
            "A marketing agency runs HTTP checks on client landing pages during campaign launches, links connectors to Active clients, and triages Medium events during business hours. Critical failures during live campaigns trigger incidents with portal summaries for affected clients.",
          ],
        },
        {
          title: "AI automation agency",
          paragraphs: [
            "An automation agency configures Webhook connectors receiving alerts from external uptime tools, maps events to the correct client, and enables create incident on critical for production workflows. Staff resolve events after confirming automated remediation succeeded.",
          ],
        },
        {
          title: "MSP",
          paragraphs: [
            "An MSP deploys Healthcheck connectors across Premium client infrastructure, hits plan limits at forty connectors, and upgrades through Settings → Billing. Critical events feed on-call rotation paired with Settings → Escalation for breach-adjacent response.",
          ],
        },
        {
          title: "Consultancy",
          paragraphs: [
            "A consultancy uses Manual connectors to record milestone checkpoints on short engagements without persistent infrastructure monitoring. Events provide audit trail context in monthly reports without automatic incident creation.",
          ],
        },
        {
          title: "Enterprise deployment",
          paragraphs: [
            "A large agency standardizes connector naming by region and environment, disables health impact on staging checks, and requires incident linkage within thirty minutes for unresolved Critical events on tier-one clients.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting",
      table: {
        caption: "Common monitoring module issues",
        headers: ["Problem", "Cause", "Solution"],
        rows: [
          [
            "Cannot create new connector",
            "Monitoring limit reached on plan",
            "Upgrade via Settings → Billing or archive unused connectors.",
          ],
          [
            "Summary empty on client detail page",
            "No linked connectors or recent events",
            "Confirm connectors reference the client and have completed at least one check.",
          ],
          [
            "Connector status shows failed",
            "Invalid URL, credentials, or network block",
            "Verify endpoint configuration and reachability from your deployment environment.",
          ],
          [
            "Events not creating incidents",
            "create incident on critical disabled",
            "Enable the option on connector configuration and confirm severity threshold.",
          ],
          [
            "Health score unaffected by events",
            "Health impact disabled on connector",
            "Enable health impact where supported on the connector detail configuration.",
          ],
          [
            "Webhook events not appearing",
            "Incorrect webhook URL or authentication",
            "Regenerate webhook credentials and confirm payload reaches the connector endpoint.",
          ],
          [
            "False critical events during maintenance",
            "Connector still active during planned downtime",
            "Pause the connector before maintenance; resume after validation checks pass.",
          ],
        ],
      },
    },
  ],
  faq: [
    {
      question: "What is the difference between a connector and an event?",
      answer:
        "A connector is the configured monitoring source. An event is a single detected condition recorded by that connector with severity and status.",
    },
    {
      question: "Can one connector monitor multiple clients?",
      answer:
        "Connectors are linked to one client in configuration. Create separate connectors per client for clear portfolio reporting and health impact.",
    },
    {
      question: "Do monitoring events appear in the client portal?",
      answer:
        "Monitoring detail is primarily internal. Client-facing impact is usually communicated through incidents, reports, or portal summaries you choose to share.",
    },
    {
      question: "How often do checks run?",
      answer:
        "Check interval depends on connector provider and configuration. Review last check timestamps on the connector detail page for actual frequency.",
    },
    {
      question: "Should I ignore or resolve an event?",
      answer:
        "Resolve when remediation is complete. Ignore for benign or duplicate signals after documenting why no action was required.",
    },
    {
      question: "Where do I see monitoring usage against my plan?",
      answer:
        "Open Settings → Usage to view connector consumption and limits for your subscription tier.",
    },
  ],
  relatedLinks: [
    { href: "/docs/clients", label: "Clients" },
    { href: "/docs/incidents", label: "Incidents" },
    { href: "/docs/billing", label: "Billing" },
    { href: "/docs/sla", label: "SLA policies" },
  ],
};

export const SLA_DOC: DocPageInput = {
  slug: "sla",
  title: "SLA Policies",
  description: "Define response-time targets for incidents and risks.",
  intro:
    "SLA policies define response and resolution expectations for incidents and risks. Configure policies in Settings → SLA, assign them to clients, and the platform evaluates timers automatically when records are created or updated. Client detail pages and operational dashboards show compliance status, breaches, and upcoming deadlines so your team meets contractual obligations.",
  callouts: [
    {
      variant: "tip",
      title: "Pair with escalation",
      body: "Configure Settings → Escalation to notify the right people when SLA timers enter warning or breach states for critical clients.",
    },
    {
      variant: "info",
      title: "Assignment required",
      body: "Clients without an assigned SLA policy do not show timers on incidents or risks. Assign policies during client onboarding before logging operational records.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "SLA policies are organization-level templates stored under Settings → SLA. Each policy includes default incident and risk hour targets plus severity-specific response and resolution minutes for low through critical tiers. Clients receive an assigned policy; summaries on client detail pages show effective targets and current compliance.",
        "Open incidents and risks evaluate against the client's assigned policy. Timers display remaining time, warning states, and breach indicators on record detail pages and in SLA dashboard metrics on the Operations Command Center.",
        "Policies can be named to mirror contract language—Standard MSA, Premium 24x7, Enterprise Gold—so staff assign the correct tier without interpreting abstract identifiers. A default policy optional designation speeds onboarding when most clients share the same tier.",
        "Settings → Escalation complements SLA policies by notifying stakeholders when timers enter warning or breach states. Together they convert contractual commitments into visible operational signals rather than spreadsheet tracking.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Contracts specify response expectations, but informal tracking in spreadsheets breaks down as portfolios grow. SLA policies encode those commitments in Auroranexis so every incident and risk is measured consistently across account managers and regions.",
        "Compliance visibility supports client QBRs, internal performance review, and escalation when teams approach breach thresholds. When leadership asks whether you met response targets last quarter, dashboard metrics and client SLA summaries provide defensible answers.",
        "SLA evaluation also feeds client health scores. Sustained breaches reduce health signals; consistent compliance contributes positively when other operational data is healthy. Accurate policy assignment is therefore both a contractual and portfolio health requirement.",
      ],
    },
    {
      title: "Core Concepts",
      subsections: [
        {
          title: "Policy fields",
          table: {
            caption: "SLA policy configuration",
            headers: ["Concept", "Description"],
            rows: [
              [
                "Name",
                "Label aligned with contract tier or service level name visible to staff.",
              ],
              [
                "Incident hours",
                "Baseline incident targets where severity tiers do not override.",
              ],
              [
                "Risk hours",
                "Baseline risk targets where severity tiers do not override.",
              ],
              [
                "Severity tiers",
                "Response and resolution minutes for low, medium, high, and critical.",
              ],
              [
                "Default policy",
                "Optional fallback suggested when assigning new clients.",
              ],
            ],
          },
        },
        {
          title: "Client assignment",
          paragraphs: [
            "Assign a policy on the client detail page or during client creation. The effective policy drives all SLA evaluation for that client's incidents and risks. Changing assignment mid-contract updates evaluation for subsequent timer calculations; review open items after policy changes.",
          ],
        },
        {
          title: "Timer states",
          table: {
            caption: "SLA evaluation states",
            headers: ["State", "Description"],
            rows: [
              [
                "On track",
                "Time remaining within defined targets for the record severity.",
              ],
              [
                "Warning",
                "Approaching deadline; review workload and notify owner if needed.",
              ],
              [
                "Breached",
                "Target exceeded; follow escalation playbook and document response.",
              ],
            ],
          },
        },
      ],
    },
    {
      title: "Features",
      bullets: [
        "Create and edit policies in Settings → SLA → New policy.",
        "Severity-specific response and resolution minutes per tier.",
        "Default policy designation for streamlined new client assignment.",
        "Per-client assignment on client detail pages.",
        "SLA summary cards on client records with compliance metrics.",
        "Timers on incident and risk detail pages with warning and breach states.",
        "Dashboard metrics for breaches, warnings, and compliance percentage.",
        "Integration with Settings → Escalation for automated notifications.",
        "Separate incident and risk targets within the same policy.",
        "Organization-scoped policy library shared across the workspace.",
        "Health score integration when SLA violations occur.",
        "Activity visibility in Operations Command Center portfolio views.",
        "Role-based permissions for policy management versus assignment.",
        "Support for multiple tiers across a heterogeneous client portfolio.",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Open Settings → SLA and review existing policies or create Settings → SLA → New policy.",
        "Enter policy name aligned with contract language and define incident hours, risk hours, and severity-tier minutes.",
        "Mark a default policy if most clients share the same service tier.",
        "Assign the policy on each client detail page under SLA settings during onboarding.",
        "Verify assignment on existing clients before logging new incidents or risks at scale.",
        "Create or update incidents and risks normally—timers evaluate automatically from creation time.",
        "Monitor SLA summary on client pages and address warning states before breach.",
        "Configure Settings → Escalation rules for critical breach notifications if not already done.",
        "Review breach incidents in weekly operations meetings with assigned responders.",
        "Update policies when contracts renew or service tiers change; communicate changes to account teams.",
        "Reference SLA compliance metrics in published client reports during QBRs.",
        "Review monthly compliance trends in operational dashboards for portfolio-wide improvement.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Mirror contract language in policy names—for example, Standard MSA or Premium 24x7.",
        "Review policies when contracts renew or service tiers change.",
        "Assign policies before logging incidents so timelines start correctly.",
        "Pair SLA policies with escalation rules for high-value or critical clients.",
        "Train staff to set incident and risk severity consistently—timers depend on accurate classification.",
        "Use breach reviews to improve processes, not only to assign individual blame.",
        "Document policy changes in internal release notes when tiers shift mid-year.",
        "Compare compliance across tiers quarterly to validate pricing and staffing models.",
        "Ensure on-call coverage matches Premium critical response targets.",
        "Include SLA summary review in client owner weekly checklist.",
      ],
      paragraphs: [
        "When clients dispute response times, incident creation timestamps, severity labels, and policy tier minutes in Settings → SLA provide the audit trail. Keep severity definitions in your internal playbook aligned with policy configuration.",
      ],
    },
    {
      title: "Examples",
      subsections: [
        {
          title: "Marketing agency",
          paragraphs: [
            "A marketing agency defines Business Hours and Priority policies in Settings → SLA, assigns Priority to enterprise retainers with one-hour critical response, and reviews compliance monthly before client steering meetings. Breaches trigger account director follow-up documented in incident resolution notes.",
          ],
        },
        {
          title: "AI automation agency",
          paragraphs: [
            "An automation agency uses a single policy with aggressive critical tiers for production clients and a relaxed policy for sandbox accounts. Engineers acknowledge High risks within targets; delayed acknowledgment triggers warning states visible on client SLA summaries.",
          ],
        },
        {
          title: "MSP",
          paragraphs: [
            "An MSP mirrors three MSA tiers—Standard, Plus, Premium—with distinct critical response minutes. Premium clients pair Premium policies with Settings → Escalation paging on-call engineers. Portfolio dashboards compare breach rates across tiers each quarter.",
          ],
        },
        {
          title: "Consultancy",
          paragraphs: [
            "A consultancy assigns lightweight policies with longer risk hours for advisory engagements, focuses SLA review on incident response for deliverable-blocking issues, and cites compliance trends in published quarterly reports for governance clients.",
          ],
        },
        {
          title: "Enterprise deployment",
          paragraphs: [
            "A global agency maintains region-specific policy variants under one workspace, restricts policy editing to owners, and exports compliance metrics for internal KPI reviews. Default policy accelerates onboarding for high-volume small-business accounts.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting",
      table: {
        caption: "Common SLA policy issues",
        headers: ["Problem", "Cause", "Solution"],
        rows: [
          [
            "No SLA shown for client",
            "No policy assigned to client record",
            "Assign a policy on the client detail page in SLA settings.",
          ],
          [
            "Unexpected breach on incident",
            "Severity mismatch or wrong creation time",
            "Confirm incident severity, creation timestamp, and tier minutes in Settings → SLA.",
          ],
          [
            "Timers differ between risk and incident",
            "Separate targets per entity type in policy",
            "Review incident hours, risk hours, and severity tiers in the assigned policy.",
          ],
          [
            "Cannot edit policies",
            "Insufficient admin permissions",
            "SLA management requires appropriate permissions; contact a workspace owner.",
          ],
          [
            "Escalation did not fire on breach",
            "Escalation rules misconfigured",
            "Verify rules in Settings → Escalation reference correct severity and SLA states.",
          ],
          [
            "Policy change did not update open timers",
            "Evaluation uses assignment at record lifecycle points",
            "Review open incidents and risks after policy changes; create new records to confirm new targets.",
          ],
          [
            "Compliance percentage seems low portfolio-wide",
            "Unassigned clients or misclassified severity",
            "Audit client assignments and train staff on severity cheat sheet aligned to policies.",
          ],
        ],
      },
    },
  ],
  faq: [
    {
      question: "Where do I configure SLA policies?",
      answer:
        "Open Settings → SLA from the dashboard settings area. Create, edit, and set default policies there; assign policies on individual client records.",
    },
    {
      question: "Do all clients need the same policy?",
      answer:
        "No. Assign the policy that matches each client's contract. Use naming conventions that reflect tier differences for clarity.",
    },
    {
      question: "What happens if no policy is assigned?",
      answer:
        "Incidents and risks still function, but SLA timers and compliance metrics do not evaluate until a policy is assigned to the client.",
    },
    {
      question: "Can I change a client's policy mid-contract?",
      answer:
        "Yes. Update the assignment on the client detail page. New timers apply to subsequent evaluations; review open items after changing policies.",
    },
    {
      question: "How does SLA relate to client health scores?",
      answer:
        "SLA violations reduce client health scores. Sustained compliance contributes positive signals when other operational data is healthy.",
    },
    {
      question: "Do SLA policies apply to monitoring events?",
      answer:
        "SLA timers evaluate incidents and risks. Monitoring events escalate to incidents when client impact exists; timers then follow the assigned client policy.",
    },
  ],
  relatedLinks: [
    { href: "/docs/incidents", label: "Incidents" },
    { href: "/docs/risks", label: "Risks" },
    { href: "/docs/clients", label: "Clients" },
    { href: "/docs/client-portal", label: "Client portal" },
  ],
};
