import type { DocPageInput } from "@/lib/docs/types";

export const COMPLIANCE_DOC: DocPageInput = {
  slug: "compliance",
  title: "Compliance",
  description:
    "Audit readiness, GDPR workflows, retention policies, security incidents, and evidence exports.",
  intro:
    "The Compliance module helps agency owners and admins prepare for audits, procurement reviews, and regulatory conversations. Open Dashboard → Compliance to review readiness scores, search the audit explorer, manage GDPR data subject requests, configure retention rules, record security incidents, and export evidence bundles. These tools support operational readiness — they do not certify your agency for any framework or regulation.",
  callouts: [
    {
      variant: "warning",
      title: "Readiness, not certification",
      body: "Compliance scores, framework mappings, and evidence exports help you document controls and processes inside Auroranexis. They do not constitute GDPR compliance, SOC 2 Type II certification, ISO 27001 certification, or any other formal attestation. Your legal counsel and auditors remain the authority on regulatory status.",
    },
    {
      variant: "info",
      title: "Who can access compliance",
      body: "Dashboard → Compliance is available to workspace owners and admins with organization settings permissions. Staff and viewer roles cannot open the compliance workspace.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "Auroranexis records significant workspace activity — user actions, configuration changes, report publishing, integration events, API usage, and more — in an organization-scoped audit trail. The Compliance module aggregates that activity with governance controls, retention configuration, GDPR request tracking, and security incident records into a single readiness view at Dashboard → Compliance.",
        "The compliance dashboard shows a composite compliance score, maturity level, framework readiness percentages, open findings, and counts of open GDPR requests and security incidents. Framework cards cover common procurement targets including SOC 2, ISO 27001, GDPR, NIS2, DORA, and HIPAA readiness mappings. Percentages reflect implemented controls with available evidence — not certification status.",
        "From the compliance workspace you can open the audit explorer for filtered event search, manage the GDPR center for data subject requests, review retention rules with simulation status, register security incidents, and download structured evidence exports. Full compliance features are included on the Business plan and above; Starter and Professional workspaces can review security settings and activity history elsewhere, but the dedicated compliance workspace and evidence tooling require Business or Enterprise.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Agencies managing client data face increasing pressure to demonstrate control over access, retention, incident response, and data subject rights. Enterprise prospects send security questionnaires; regulated clients ask for evidence of logging and retention alignment; internal governance teams need a single place to track GDPR requests without ad hoc spreadsheets.",
        "The Compliance module exists to reduce the scramble before an audit by keeping evidence, policies, and request workflows in one place tied to your actual operational data. Rather than maintaining separate sampling spreadsheets, you can search audit events, export structured evidence bundles, and show how retention rules align with your documented policies.",
        "GDPR tooling tracks access, deletion, export, correction, restriction, and consent withdrawal requests through a defined lifecycle. Your team still executes the legal process — Auroranexis provides the operational record, status tracking, and audit trail. Security incident records complement operational incident management by giving compliance reviewers a dedicated registry for posture-affecting events.",
      ],
    },
    {
      title: "Core Concepts",
      bullets: [
        "Compliance score — composite indicator of governance maturity based on configured controls, evidence availability, and open items.",
        "Framework readiness — mapped progress against SOC 2, ISO 27001, GDPR, NIS2, DORA, and HIPAA control sets. Percentages reflect implemented controls with evidence, not certification.",
        "Audit trail — event log of workspace actions with entity type, severity, source, actor, and deep links back to related records.",
        "Audit explorer — searchable interface for filtering audit events by entity type, event type, severity, date range, and free-text query.",
        "Retention rule — per-category policy (AI logs, reports, audit events, connector history, executions, API logs, invoices, notifications, knowledge entries, portal activity) with a defined period. v1 policies run in simulation mode only — they document intent without automatic deletion.",
        "GDPR request — tracked data subject request with type, subject email, status (open, processing, completed, rejected, expired), and internal notes.",
        "Security incident — internal registry entry for events affecting security posture, with severity and investigation status distinct from operational client incidents.",
        "Evidence bundle — downloadable JSON export of compliance-relevant records for external reviewers and procurement workflows.",
      ],
    },
    {
      title: "Features",
      bullets: [
        "Compliance dashboard with scorecards for readiness, open findings, and security events.",
        "Framework readiness grid showing control coverage per framework with evidence counts.",
        "Audit explorer with search filters and CSV/JSON export from Dashboard → Compliance → Audit explorer.",
        "GDPR center for creating and tracking data subject requests across all request types.",
        "Security incident registry for recording and monitoring internal security events.",
        "Retention overview with per-category rules, simulation-only status, and coverage percentage.",
        "Evidence export and audit CSV/JSON exports for procurement and audit workflows.",
        "Actionable recommendations when controls or evidence gaps are detected on the dashboard.",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Sign in as an owner or admin and open Dashboard → Compliance.",
        "Review the compliance score, readiness percentage, and framework cards. Note any frameworks below your target threshold.",
        "Open Audit explorer from the compliance page header or Evidence section to search historical events.",
        "Filter audit events by date range, entity type, severity, and free-text query when preparing a sample for an external auditor.",
        "In the GDPR center, create a new request when a data subject contacts your agency. Select the request type, enter the subject email, and add internal notes.",
        "Update request status as your legal process progresses — Auroranexis tracks the lifecycle but does not auto-fulfill requests.",
        "Record security incidents promptly when you detect unauthorized access, data exposure, or policy violations affecting security posture.",
        "Review retention rules under Retention overview. Adjust periods to match your documented retention policy; confirm simulation-only mode — v1 does not auto-delete data.",
        "Download an evidence bundle before procurement calls or scheduled audits from the Evidence section.",
        "Follow dashboard recommendations to close evidence gaps — for example, completing incident records or defining retention categories.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Assign a compliance owner separate from day-to-day delivery leads so audit prep does not compete with client deadlines.",
        "Review retention settings whenever client contracts change or you onboard regulated industries.",
        "Run a monthly compliance review: open findings, overdue GDPR requests, and unresolved security incidents.",
        "Keep incident and risk records in Auroranexis complete — auditors often sample operational modules alongside compliance exports.",
        "Export evidence bundles on a schedule (quarterly) even when no audit is imminent to verify export completeness.",
        "Treat framework readiness percentages as gap analysis, not pass/fail certification results.",
        "Coordinate with Settings → Team to ensure only required users hold owner or admin roles.",
        "Document retention simulation alignment in internal policy reviews until active enforcement is approved for a future release.",
      ],
    },
    {
      title: "Examples",
      subsections: [
        {
          title: "Marketing agency",
          paragraphs: [
            "A European-focused marketing agency receives monthly data subject access requests from former portal users. The admin creates Access requests in the GDPR center with subject emails and assigns internal ownership. As the legal process completes, status moves from open to processing to completed. Request records remain for audit sampling. Retention rules for portal_activity and reports are configured in simulation mode to mirror the agency's one-year client data policy.",
          ],
        },
        {
          title: "AI automation agency",
          paragraphs: [
            "An automation agency documents one-year retention for AI interaction logs alongside seven-year invoice retention. They configure retention rules for ai_logs (1y) and invoices (7y) in the retention overview. Coverage percentage increases as categories are defined. All rules show simulation-only status — the firm uses this in internal policy reviews to demonstrate alignment between documented policy and platform configuration without triggering automatic deletion.",
          ],
        },
        {
          title: "MSP",
          paragraphs: [
            "A forty-client MSP on Business plan receives a vendor security questionnaire from a healthcare prospect. The operations director opens Dashboard → Compliance, reviews framework readiness cards as an internal checklist, and downloads an evidence bundle. Using Audit explorer, they filter high-severity configuration changes from the last ninety days and attach exported JSON plus screenshots to the questionnaire response. The agency's legal counsel validates all claims before submission.",
          ],
        },
        {
          title: "Consultancy",
          paragraphs: [
            "After detecting unauthorized API key usage, a security consultancy records a high-severity security incident in Dashboard → Compliance with investigation status. They cross-reference the operational incident in the Incidents module for client delivery while keeping the compliance registry entry for governance review. Audit explorer confirms the key revocation and settings change events are captured with timestamps for the quarterly internal audit.",
          ],
        },
        {
          title: "Enterprise deployment",
          paragraphs: [
            "An agency with three regional offices previously maintained separate audit sampling spreadsheets. After upgrading to Business, the central compliance owner exports a single evidence bundle from Dashboard → Compliance before the annual internal review. Framework readiness cards highlight gaps in logging and incident management controls. Recommendations on the dashboard drive closure of two open findings before the external auditor arrives.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting",
      table: {
        caption: "Common compliance issues",
        headers: ["Problem", "Cause", "Solution"],
        rows: [
          [
            "Compliance menu not visible",
            "User lacks owner or admin role with organization settings access",
            "Confirm role in Settings → Team; only owners and admins with settings permissions can open Dashboard → Compliance",
          ],
          [
            "Module unavailable on your plan",
            "Workspace is on Starter or Professional without Business compliance features",
            "Upgrade to Business via Settings → Billing or contact sales for Enterprise compliance tooling",
          ],
          [
            "Missing audit entries for an action",
            "Not all read operations are logged; action may predate audit capture or occurred outside authenticated session",
            "Verify the action was performed by an authenticated user in your workspace; filter Audit explorer by date range and entity type",
          ],
          [
            "Low readiness score despite active usage",
            "Controls require explicit configuration — retention rules, incident records, or evidence exports may be incomplete",
            "Review dashboard recommendations and close open findings; define retention categories and record security incidents",
          ],
          [
            "Retention shows simulation only",
            "v1 retention policies document intent without auto-deletion by design",
            "Use simulation status in policy reviews; coordinate with support before any future active enforcement rollout",
          ],
          [
            "Evidence export fails or times out",
            "Large workspace volume or concurrent export load",
            "Retry during low-traffic periods; contact support with the timestamp if failures persist",
          ],
          [
            "GDPR request stuck in open status",
            "Platform tracks lifecycle but does not auto-complete legal workflows",
            "Update status manually as your legal process advances; add internal notes for audit context",
          ],
        ],
      },
    },
  ],
  faq: [
    {
      question: "Does Auroranexis certify us for GDPR or SOC 2?",
      answer:
        "No. The platform provides readiness scoring, control mapping, and evidence exports to support your own compliance program. Formal certification requires independent auditors and processes outside Auroranexis.",
    },
    {
      question: "Does retention automatically delete data?",
      answer:
        "No. In the current v1 release, retention policies operate in simulation mode only. They show how your configured periods align with policy without deleting records automatically. Active enforcement requires explicit approval in a future release.",
    },
    {
      question: "Who can see GDPR requests?",
      answer:
        "GDPR requests and the compliance workspace are visible to owners and admins with organization settings permissions. They are not exposed to client portal users or staff without admin access.",
    },
    {
      question: "Can I export audit logs for an external auditor?",
      answer:
        "Yes. Use Audit explorer to filter and review events, export CSV or JSON from the explorer, or download a full evidence bundle from the Evidence section on the compliance dashboard.",
    },
    {
      question: "What is the difference between security incidents and operational incidents?",
      answer:
        "Operational incidents in the Incidents module track client-affecting delivery events. Security incidents in Dashboard → Compliance are an internal registry for events affecting security posture — useful for governance reviews and audit sampling alongside the audit trail.",
    },
    {
      question: "Which plan includes the compliance workspace?",
      answer:
        "Business and Enterprise plans include the dedicated compliance workspace, audit explorer, GDPR center, retention overview, and evidence exports. Starter and Professional workspaces should use Security and Activity modules for baseline review.",
    },
  ],
  relatedLinks: [
    { href: "/docs/security", label: "Security" },
    { href: "/docs/incidents", label: "Incidents" },
    { href: "/docs/enterprise", label: "Enterprise" },
    { href: "/docs/billing", label: "Billing" },
  ],
};

export const WHITE_LABEL_DOC: DocPageInput = {
  slug: "white-label",
  title: "White Label",
  description:
    "Agency branding across login, portal, email, and PDF exports.",
  intro:
    "White label settings let your agency present Auroranexis as your own platform. Configure logos, colors, portal messaging, login appearance, email sender identity, and PDF export branding from Settings → Branding and Settings → Email. Clients and staff see your brand — not default Auroranexis styling — across customer-facing surfaces.",
  callouts: [
    {
      variant: "info",
      title: "Plan requirements",
      body: "Core white label branding (logos, colors, login, and portal) is available on the Professional plan and above. Branded PDF export customization (custom footer and PDF logo) requires Business or Enterprise. Email sender configuration requires Professional or above with email delivery enabled.",
    },
    {
      variant: "tip",
      title: "Draft and publish",
      body: "Branding changes can be saved as drafts before publishing. Preview login, portal, dashboard, email, and PDF surfaces in the branding workspace before making them live for users.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "White label branding replaces default Auroranexis visual identity with your agency name, logos, color palette, and messaging. Changes apply to staff login pages, dashboard accents, the client portal, outbound report emails, and PDF exports — depending on your plan tier and published settings.",
        "Open Settings → Branding to manage the full branding workspace. The interface is organized into sections: General (company and platform names), Brand (logo uploads), Theme (primary, secondary, and accent colors), Portal (welcome message and portal-specific styling), Emails (email header and footer branding), PDF (footer text and PDF logo on Business+ plans), and Domain (custom domain configuration status).",
        "Email sender identity — the from name and reply-to address clients see when receiving reports — is configured separately in Settings → Email. White label and email settings work together: branding controls appearance while email settings control delivery identity and deliverability.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Agencies reselling managed services or delivering reports under their own brand need a consistent client experience. White label removes visible Auroranexis branding from customer-facing touchpoints so deliverables, portal access, and login screens reflect your agency identity.",
        "This matters for contract alignment (clients expect your logo on PDFs), trust (portal users recognize your brand), and operational professionalism (report emails originate from your agency name). Without white label, default platform styling signals that tooling is third-party — which may be acceptable internally but often is not for client-facing delivery.",
        "Business and Enterprise customers additionally customize PDF exports with agency footers and dedicated PDF logos — ensuring printed and downloaded deliverables match the same brand standards as the portal and email channels.",
      ],
    },
    {
      title: "Core Concepts",
      bullets: [
        "Resolved branding — the effective brand configuration applied after merging saved settings with platform defaults.",
        "Logo variants — horizontal logo for headers, light logo for dark backgrounds, favicon for browser tabs, and PDF-specific logo for export headers on Business+ plans.",
        "CSS variables — theme colors mapped to dashboard and portal design tokens for consistent accent application.",
        "Portal welcome message — custom text shown to client portal users on sign-in or landing surfaces.",
        "Hide platform branding — option to suppress default Auroranexis marks on supported surfaces when your plan allows.",
        "Published vs draft — saved settings may exist as drafts until explicitly published to all users.",
        "Custom domain — optional branded hostname for portal or login (configuration status shown in the Domain section).",
        "Email sender — display name, from address, and reply-to configured in Settings → Email, separate from visual branding.",
      ],
    },
    {
      title: "Features",
      bullets: [
        "Logo upload for standard, light, favicon, and PDF variants with recommended dimension guidance.",
        "Primary, secondary, and accent color pickers with live preview across surfaces.",
        "Login page branding preview (desktop, tablet, mobile viewports).",
        "Client portal branding with welcome message and theme application.",
        "Dashboard accent branding for staff-facing surfaces.",
        "Email template branding (header, footer) integrated with report delivery.",
        "PDF export branding with custom footer and PDF logo on Business+ plans.",
        "Custom domain status and configuration guidance in the Domain section.",
        "Reset to defaults and publish workflow for controlled rollouts.",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Confirm your workspace is on Professional or above (Business+ for PDF branding). Open Settings → Branding.",
        "In General, set your company name and the platform name shown to users (for example, your agency ops portal name).",
        "In Brand, upload your horizontal logo, light variant, and favicon. Use high-resolution PNG or SVG within recommended dimensions.",
        "In Theme, set primary, secondary, and accent colors. Switch preview to login or portal to validate contrast.",
        "In Portal, write a welcome message that orients client portal users to your delivery model.",
        "In Emails, configure email header and footer branding that appears on report delivery messages.",
        "On Business or Enterprise, open the PDF section. Set PDF footer text and upload a PDF logo. Preview the PDF surface.",
        "Save your changes, review all preview surfaces (dashboard, login, portal, email, PDF), then Publish.",
        "Open Settings → Email. Set sender display name, from address, and reply-to for report delivery.",
        "Generate a test report and export PDF or send via email to confirm end-to-end branding.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Use high-contrast logos readable on both light and dark backgrounds — upload a separate light variant if needed.",
        "Align portal branding and welcome messaging with client contract deliverables and support instructions.",
        "Test email deliverability after changing from-address domains; verify SPF, DKIM, and DMARC with your mail provider.",
        "Preview on mobile viewports — many client portal users access reports from phones.",
        "Publish branding during a low-traffic window and notify internal staff before client-facing changes go live.",
        "Keep a copy of original assets in your design system; use Reset cautiously in production workspaces.",
        "Coordinate PDF footer text with legal disclaimers your agency requires on client deliverables.",
        "Verify Business+ plan before expecting custom PDF footer and logo — Professional exports PDFs without agency PDF branding.",
      ],
    },
    {
      title: "Examples",
      subsections: [
        {
          title: "Marketing agency",
          paragraphs: [
            "A marketing agency on Business plan opens the PDF section in Settings → Branding. They set footer text to their legal name and upload a PDF logo optimized for print. Quarterly campaign reports export with the agency header and footer. They send a pilot PDF to an internal reviewer before enabling scheduled delivery to clients.",
          ],
        },
        {
          title: "AI automation agency",
          paragraphs: [
            "An automation agency white-labels the client portal so workflow status and published reports appear under the agency brand. They configure Settings → Branding with logo and theme colors, set a portal welcome message describing automation deliverables, and publish before inviting portal users. Settings → Email uses the same sender name and colors so notification emails match the portal experience.",
          ],
        },
        {
          title: "MSP",
          paragraphs: [
            "An MSP on Professional configures Settings → Branding with their logo, brand colors, and a portal welcome message explaining how clients access monthly reports. They set Settings → Email with reports@mspname.com as the sender. After publishing, portal users see the MSP brand on login and receive report emails with matching header styling — no default platform marks on customer-facing surfaces.",
          ],
        },
        {
          title: "Consultancy",
          paragraphs: [
            "A consultancy acquired by a larger firm updates Settings → Branding with the parent company logo set, new theme colors, and an updated platform name in General. They change the portal welcome message and publish during a maintenance window. Settings → Email sender name is updated to the new operations team identity before notifying portal users.",
          ],
        },
        {
          title: "Enterprise deployment",
          paragraphs: [
            "An agency preparing a custom portal hostname reviews the Domain section in Settings → Branding for CNAME configuration status. While DNS propagates, they publish interim branding on the default login URL. Once the custom domain is verified, portal users access the fully branded experience at the agency hostname with consistent login and portal previews validated on mobile viewports.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting",
      table: {
        caption: "Common white label issues",
        headers: ["Problem", "Cause", "Solution"],
        rows: [
          [
            "Branding page locked or unavailable",
            "Workspace is on Starter plan without white_label feature",
            "Upgrade to Professional via Settings → Billing",
          ],
          [
            "Logo not appearing after upload",
            "Unsupported file format, size limit exceeded, or browser cache",
            "Verify PNG, SVG, or WebP within size limits; hard-refresh the browser after upload",
          ],
          [
            "Changes not visible to users",
            "Settings saved as draft without publishing",
            "Click Publish after saving; drafts do not apply to all surfaces",
          ],
          [
            "Portal still shows old colors",
            "CDN cache or active portal session",
            "Ask portal users to sign out and back in; allow a few minutes for cache propagation",
          ],
          [
            "Emails show default sender",
            "Settings → Email not configured or DNS not verified for custom from domain",
            "Update sender name and from address in Settings → Email; verify SPF, DKIM, and DMARC records",
          ],
          [
            "PDF branding missing on exports",
            "Workspace is on Professional — PDF footer and logo require Business+",
            "Upgrade to Business or Enterprise, configure PDF section in Settings → Branding, then republish",
          ],
          [
            "Custom domain stuck in pending",
            "DNS records not propagated or incorrect CNAME",
            "Verify CNAME records shown in the Domain section; propagation can take up to 48 hours",
          ],
        ],
      },
    },
  ],
  faq: [
    {
      question: "Which plan do I need for white label?",
      answer:
        "Professional and above includes logos, colors, login, portal, and email template branding. Branded PDF exports (custom footer and PDF logo) require Business or Enterprise.",
    },
    {
      question: "Will clients see Auroranexis branding?",
      answer:
        "When white label is configured and published, and hide platform branding is enabled where supported, client-facing surfaces show your agency identity. Exact coverage depends on surface and plan.",
    },
    {
      question: "Do I configure email and branding separately?",
      answer:
        "Yes. Settings → Branding controls visual appearance. Settings → Email controls sender name, from address, and reply-to for report delivery.",
    },
    {
      question: "Can I preview before publishing?",
      answer:
        "Yes. The branding workspace includes live previews for dashboard, login, portal, email, and PDF surfaces across desktop, tablet, and mobile viewports.",
    },
    {
      question: "Does white label affect staff login?",
      answer:
        "Yes. Published branding applies to the staff login page including logo, colors, and optional background imagery. Preview the login surface before publishing.",
    },
    {
      question: "Can I reset branding to defaults?",
      answer:
        "Yes. Settings → Branding includes a reset action to restore platform defaults. Use cautiously in production — export or note current assets before resetting.",
    },
  ],
  relatedLinks: [
    { href: "/docs/client-portal", label: "Client portal" },
    { href: "/docs/reports", label: "Reports" },
    { href: "/docs/billing", label: "Billing" },
    { href: "/docs/getting-started", label: "Getting started" },
  ],
};

export const PREDICTIVE_DOC: DocPageInput = {
  slug: "predictive",
  title: "Predictive Intelligence",
  description:
    "Portfolio health scores, forecasts, and early warning signals.",
  intro:
    "Predictive Intelligence combines operational data — reports, incidents, risks, SLA performance, monitoring, and automation history — into health scores, trend analysis, and forward-looking signals across your client portfolio. Open Dashboard → Predictive to review portfolio summaries and drill into per-client forecasts. Access is gated by the ai_predictive_intelligence plan feature, available on Professional and above.",
  callouts: [
    {
      variant: "info",
      title: "Plan-gated feature",
      body: "Predictive Intelligence requires the ai_predictive_intelligence feature on your subscription. Starter workspaces see an upgrade prompt. Professional, Business, and Enterprise plans include health scores and portfolio signals.",
    },
    {
      variant: "tip",
      title: "Deterministic signals",
      body: "Predictive views are computed from your workspace data using transparent, rule-based models — not opaque black-box predictions. Confidence labels indicate how much historical data supports each forecast.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "Predictive Intelligence gives agency leaders a portfolio-level view of client health before problems surface in QBRs or escalation calls. Open Dashboard → Predictive to see overall confidence, executive overview narrative, forecast counts, and key metric cards for churn risk, SLA breaches, incident likelihood, and revenue trajectory.",
        "Each client with sufficient operational history receives a health score, trend direction (improving, stable, declining, critical), and contributing factors drawn from recent activity. Portfolio views highlight clients flagged for attention so account owners can prioritize outreach.",
        "Per-client predictive pages show historical windows (7 days, 30 days, 90 days, 12 months), trend comparisons, incident and risk forecasts, SLA breach probability, and actionable recommendations linked to relevant records. The module checks ai_predictive_intelligence at the plan level — API access via predictive.read scope requires the same feature.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Reactive account management — learning about churn risk only when a client complains — is expensive and damages trust. Predictive Intelligence exists to shift portfolio reviews from backward-looking reporting to forward-looking intervention.",
        "Health scores and early warning signals help operations leaders allocate attention across dozens or hundreds of clients. Rather than reviewing every account equally, teams can focus on declining trajectories, elevated churn probability, or SLA breach forecasts while maintaining lighter touch on stable and growing accounts.",
        "Portfolio signals consolidate data that already lives in Clients, Reports, Risks, Incidents, Monitoring, and SLA modules. Predictive does not replace account owner judgment — it surfaces patterns that are easy to miss when reviewing clients individually.",
      ],
    },
    {
      title: "Core Concepts",
      bullets: [
        "Health score — composite numeric signal reflecting operational activity, SLA adherence, incident volume, report cadence, and related factors for a single client.",
        "Trend direction — whether a client's health is improving, stable, declining, or critical compared to prior windows.",
        "Confidence label — Very High, High, Medium, or Low; indicates how much data supports the forecast.",
        "Churn segment — likely churn, stable, or growing classification based on probability and health trajectory.",
        "Portfolio signals — aggregated dashboard metrics highlighting at-risk clients, SLA breach forecasts, and incident likelihood across the portfolio.",
        "SLA breach forecast — projected probability that open items will breach response targets.",
        "Incident forecast — predicted incident likelihood and severity band for at-risk clients.",
        "Historical window — rolling comparison period (7d, 30d, 90d, 12m) for trend analysis.",
        "ai_predictive_intelligence — plan feature flag gating Dashboard → Predictive, per-client predictive pages, and predictive.read API scope.",
      ],
    },
    {
      title: "Features",
      bullets: [
        "Portfolio dashboard with executive overview and overall confidence score.",
        "Customer forecast cards segmenting likely churn, stable, and growing accounts.",
        "Health scores and trend badges per client with contributing factors.",
        "SLA breach forecast with per-client probability and open item counts.",
        "Incident forecast highlighting at-risk clients with predicted severity.",
        "Revenue forecast with recurring revenue trend and healthy vs declining account counts (when profitability data exists).",
        "Per-client predictive detail with health history and linked recommendations.",
        "Manual refresh for on-demand recalculation after bulk data changes.",
        "API access via predictive.read scope for integrations (requires ai_predictive_intelligence).",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Confirm your plan includes ai_predictive_intelligence (Professional or above). Open Dashboard → Predictive.",
        "Read the executive overview and note overall confidence — low confidence means insufficient historical data across the portfolio.",
        "Review customer forecast cards. Identify clients in the likely churn segment for immediate account owner review.",
        "Check SLA breach forecast for clients with elevated breach probability and open SLA-tracked items.",
        "Review incident forecast for clients with high predicted severity — validate with recent monitoring and risk records.",
        "Click a client name to open the per-client predictive detail page.",
        "On the client page, compare historical windows to understand whether trends are new or sustained.",
        "Follow linked recommendations to create risks, incidents, or client notes as follow-up actions.",
        "Include predictive highlights in weekly portfolio standups and QBR preparation.",
        "Use Refresh after importing historical data or closing a large batch of incidents to update scores immediately.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Treat scores as signals, not verdicts — validate with account owners before client conversations.",
        "Ensure underlying data is current: stale reports, unrecorded incidents, and missing SLA assignments reduce forecast accuracy.",
        "Review predictive insights weekly in portfolio standups; assign owners to flagged clients within 48 hours.",
        "Use declining trends as prompts for internal review, not automatic client escalation.",
        "Document interventions as risks or incidents so future forecasts reflect your response history.",
        "Compare confidence labels before acting — Medium or Low confidence forecasts need more validation.",
        "Pair predictive views with Monitoring and Clients modules for full operational context.",
        "Verify ai_predictive_intelligence is enabled before building integrations against predictive.read API endpoints.",
      ],
    },
    {
      title: "Examples",
      subsections: [
        {
          title: "Marketing agency",
          paragraphs: [
            "Before a quarterly business review, the account manager opens the client's predictive detail page, notes 90-day trend comparisons, and documents improving report cadence alongside one elevated SLA breach forecast. The QBR deck includes both achievements and proactive items the agency is addressing, backed by health score history from Dashboard → Predictive.",
          ],
        },
        {
          title: "AI automation agency",
          paragraphs: [
            "An automation agency newly upgraded to Professional enables ai_predictive_intelligence and opens Dashboard → Predictive. Initial confidence is Low because historical data is sparse. Over six weeks, consistent report publishing and incident recording raise confidence labels. The portfolio owner establishes a baseline health score review as part of the monthly operations cadence.",
          ],
        },
        {
          title: "MSP",
          paragraphs: [
            "Every Monday, the operations lead opens Dashboard → Predictive and focuses on the likely churn segment. Three clients show declining health over 30 days. The lead assigns each to its account owner, who reviews per-client contributing factors — missed reports, open incidents, SLA warnings — and schedules internal check-ins before any client-facing outreach.",
          ],
        },
        {
          title: "Consultancy",
          paragraphs: [
            "SLA forecast shows elevated breach probability for a client with four open incidents. The delivery lead reassigns capacity, resolves two items same-day, and creates a risk record documenting root cause. After Refresh on Dashboard → Predictive, breach probability drops and the intervention is auditable in the operational modules.",
          ],
        },
        {
          title: "Enterprise deployment",
          paragraphs: [
            "An agency managing eighty clients cannot review every account weekly. The director uses portfolio signals on Dashboard → Predictive to identify twelve accounts in declining or critical trend bands. Account owners receive a prioritized list with health scores, contributing factors, and recommended actions — stable and growing segments receive lighter scheduled touchpoints.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting",
      table: {
        caption: "Common predictive intelligence issues",
        headers: ["Problem", "Cause", "Solution"],
        rows: [
          [
            "Module locked or missing from navigation",
            "Plan lacks ai_predictive_intelligence feature (Starter workspace)",
            "Upgrade to Professional via Settings → Billing or contact sales for Enterprise",
          ],
          [
            "All clients show unknown or low confidence",
            "Insufficient historical activity across the portfolio",
            "Ensure reports, incidents, monitoring data, and SLA assignments exist for active clients",
          ],
          [
            "Stale scores after major data changes",
            "Forecasts refresh on nightly schedule by default",
            "Click Refresh on Dashboard → Predictive after bulk imports or incident closures",
          ],
          [
            "Client missing from forecasts",
            "New client without activity history or archived status",
            "Confirm client status is active; allow time for data across at least one historical window",
          ],
          [
            "Revenue forecast empty",
            "Profitability data unavailable on plan or not configured",
            "Configure client revenue in profitability module; verify plan includes profitability feature",
          ],
          [
            "Health score differs between dashboard and client page",
            "Scores recalculate on different refresh schedules",
            "Use Refresh on both views for consistency after significant changes",
          ],
          [
            "API returns 403 on predictive endpoints",
            "Plan missing ai_predictive_intelligence or API key lacks predictive.read scope",
            "Verify plan tier and create a new API key with predictive.read scope in Settings → API",
          ],
        ],
      },
    },
  ],
  faq: [
    {
      question: "Which plan includes Predictive Intelligence?",
      answer:
        "Professional, Business, and Enterprise plans include the ai_predictive_intelligence feature with health scores and portfolio forecasts. Starter workspaces do not have access.",
    },
    {
      question: "How often are forecasts updated?",
      answer:
        "Forecasts refresh automatically on a nightly schedule. You can trigger an immediate recalculation with the Refresh button on Dashboard → Predictive.",
    },
    {
      question: "Should I share health scores directly with clients?",
      answer:
        "Predictive views are designed for internal portfolio management. Validate signals with account context before external conversations — scores reflect operational data, not client relationship quality alone.",
    },
    {
      question: "What data improves forecast confidence?",
      answer:
        "Consistent report publishing, recorded incidents and risks, SLA policy assignment, monitoring signals, and automation execution history all increase data density and raise confidence labels.",
    },
    {
      question: "What is the ai_predictive_intelligence feature flag?",
      answer:
        "It is the plan-level gate for Dashboard → Predictive, per-client predictive pages, manual refresh actions, and API endpoints requiring predictive.read scope. Diagnostics show feature status at Settings → Diagnostics.",
    },
    {
      question: "Are predictions AI-generated black-box outputs?",
      answer:
        "No. Predictive views use transparent, rule-based models computed from your workspace data. Confidence labels indicate data sufficiency; contributing factors show which signals drive each score.",
    },
  ],
  relatedLinks: [
    { href: "/docs/clients", label: "Clients" },
    { href: "/docs/monitoring", label: "Monitoring" },
    { href: "/docs/risks", label: "Risks" },
    { href: "/docs/sla", label: "SLA policies" },
  ],
};

export const DOCS_HUB_DOC: DocPageInput = {
  slug: "hub",
  title: "Documentation",
  description: "Auroranexis product documentation hub and navigation guide.",
  intro:
    "Welcome to Auroranexis documentation. These guides explain how to use each module in your workspace — from onboarding and client delivery to billing, security, integrations, and intelligence features. Browse the docs home page to find the guide that matches your role and task.",
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "Documentation is organized by module and workflow so you can jump directly to the topic you need. Each guide includes overview, concepts, step-by-step instructions, agency examples, troubleshooting, and FAQ. Feature availability always reflects your current subscription plan.",
      ],
    },
    {
      title: "How to navigate",
      bullets: [
        "New to Auroranexis — start with Getting Started.",
        "Day-to-day delivery — Operations guides (Clients, Reports, Risks, Incidents, Monitoring, SLA).",
        "Platform extension — Automation, Integrations, Client Portal, and API.",
        "Account and governance — Billing, Security, Enterprise, White Label, and Compliance.",
        "Portfolio intelligence — Predictive Intelligence (Professional+, ai_predictive_intelligence).",
      ],
    },
  ],
  relatedLinks: [
    { href: "/docs/getting-started", label: "Getting started" },
    { href: "/docs/billing", label: "Billing" },
    { href: "/docs/security", label: "Security" },
    { href: "/docs/compliance", label: "Compliance" },
    { href: "/docs/white-label", label: "White label" },
    { href: "/docs/predictive", label: "Predictive intelligence" },
    { href: "/docs/api", label: "API" },
  ],
};
