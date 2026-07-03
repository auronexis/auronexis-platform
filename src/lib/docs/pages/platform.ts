import type { DocPageInput } from "@/lib/docs/types";

export const AUTOMATION_DOC: DocPageInput = {
  slug: "automation",
  title: "Automation",
  description:
    "Workflow builder, triggers, conditions, actions, execution history, connectors, and integration secrets.",
  intro:
    "Automation turns operational events into repeatable workflows your agency can trust. Define triggers, apply conditions, chain actions, and review execution history when something needs attention. Connect external systems through Automation → Connectors and store API credentials at Integrations → Secrets. The automation builder is plan-gated—confirm your subscription includes workflow access in Settings → Billing before building production automations.",
  callouts: [
    {
      variant: "info",
      title: "Plan availability",
      body: "The automation builder is included on Professional and higher tiers. If the Automation module shows an upgrade prompt, review Settings → Billing or contact your workspace owner before creating workflows.",
    },
    {
      variant: "tip",
      title: "Test in draft first",
      body: "Keep workflows in Draft while configuring triggers and actions. Use manual trigger or a low-risk test client to validate execution history before setting status to Active.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "The Automation module is your agency's workflow engine inside Auroranexis. When something happens in the platform—a report is published, an incident is created, an SLA threshold is crossed, or a client record changes—automation can respond with notifications, internal updates, or calls to connected systems.",
        "Workflows are organization-scoped. Only users with workflow permissions can create or edit them. Each workflow has a status (draft, active, or disabled), a single trigger, optional conditions, and one or more actions executed in sequence. The workflow list shows status, last execution time, and recent failure counts so operators can spot problems quickly.",
        "Connector-backed actions require authorized connections at Automation → Connectors and, where applicable, stored credentials at Integrations → Secrets. Execution history records every run with step-level detail—the audit trail you need for troubleshooting, client reviews, and compliance discussions.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Agencies manage dozens of clients and hundreds of operational signals. Manual follow-up does not scale. Automation reduces repetitive work, enforces consistent response patterns, and keeps external systems in sync without requiring your team to copy data between tools.",
        "Well-designed workflows complement human judgment rather than replacing it. They handle predictable reactions—notify the account owner, log an activity, open a ticket—so your team can focus on client conversations, root-cause analysis, and delivery quality.",
      ],
      subsections: [
        {
          title: "When to use automation",
          bullets: [
            "Notify account owners when a high-severity incident is created for a key client.",
            "Post a summary to Slack or Microsoft Teams when a report is published.",
            "Create a ticket in Jira, Linear, or Zendesk when an SLA breach occurs.",
            "Assign an internal owner or create an activity when a risk crosses a severity threshold.",
            "Send a webhook to a custom endpoint when monitoring events reach critical severity.",
          ],
        },
        {
          title: "What automation does not replace",
          bullets: [
            "Human judgment on sensitive client communications or executive summaries.",
            "One-off project work that does not follow a repeatable pattern.",
            "Full bidirectional data migration—use connector sync in the Integrations area for ongoing alignment.",
          ],
        },
      ],
    },
    {
      title: "Core Concepts",
      subsections: [
        {
          title: "Workflow",
          paragraphs: [
            "A workflow is a named definition consisting of a trigger, optional conditions, and actions. Workflows move through draft → active → disabled. Only active workflows respond to platform events. Disabled workflows are preserved for history but do not execute.",
          ],
        },
        {
          title: "Trigger",
          paragraphs: [
            "The trigger is the event that starts a workflow run. Common triggers include client created, incident created or updated, report published, risk created, SLA warning or breached, monitoring event detected, and manual trigger for on-demand testing. Each workflow has exactly one trigger—create separate workflows for separate events.",
          ],
        },
        {
          title: "Conditions",
          paragraphs: [
            "Conditions filter which events actually run the workflow. Match on severity, client, owner, SLA status, tags, and other fields using equals, contains, greater than, and similar operators. Condition groups support AND/OR logic so high-volume triggers do not flood your team or external systems.",
          ],
        },
        {
          title: "Actions",
          paragraphs: [
            "Actions are the steps executed after a trigger fires and conditions pass. Built-in actions include send notification, create activity, assign owner, update record fields, and AI-assisted summaries where your plan includes them. Connector-backed actions—such as create Jira issue or send Slack message—require an authorized connection at Automation → Connectors.",
          ],
        },
        {
          title: "Execution history",
          paragraphs: [
            "Each time a workflow runs, an execution record is created with a timestamp, status (success, failed, or partial), and per-step detail. Open execution history on the workflow detail page to see which step failed and why. Export execution logs when you need an offline record for post-incident review.",
          ],
        },
        {
          title: "Connectors and secrets",
          paragraphs: [
            "Automation → Connectors holds OAuth-linked external systems used as workflow action targets. Integrations → Secrets stores API keys or tokens for integrations that require manual credential entry. Secrets are encrypted at rest and referenced at runtime. Rotate secrets on your security schedule and update stored values before revoking old credentials at the provider.",
          ],
        },
      ],
      table: {
        caption: "Workflow status reference",
        headers: ["Status", "Behavior"],
        rows: [
          ["Draft", "Editable; does not respond to triggers."],
          ["Active", "Listens for trigger events and runs actions."],
          ["Disabled", "Preserved but inactive; no new executions."],
        ],
      },
    },
    {
      title: "Features",
      bullets: [
        "Visual workflow builder at Automation → New with trigger, condition tree, and action chain.",
        "Platform event triggers for incidents, reports, risks, clients, SLA states, and monitoring events.",
        "Condition filters with AND/OR groups to narrow high-frequency triggers.",
        "Built-in actions: send notification, create activity, assign owner, update fields.",
        "Connector-backed actions for Slack, Jira, HubSpot, Linear, Zendesk, and other OAuth systems.",
        "Execution history with step-level success, failure messages, and duration.",
        "Manual trigger for on-demand testing before activation.",
        "Automation → Connectors catalog for OAuth authorization and connection status.",
        "Integrations → Secrets for API keys and tokens referenced by connector actions.",
        "Plan-gated access with limits visible in Settings → Usage.",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Confirm your plan includes automation in Settings → Billing and Settings → Usage.",
        "Open Automation from the sidebar and review existing workflows or click Create automation.",
        "Name the workflow and select a trigger event that matches your operational scenario.",
        "Add conditions if the trigger is broad—for example, limit to a specific client or severity level.",
        "Add actions in order: start with send notification to validate behavior, then add connector actions.",
        "Authorize required connectors at Automation → Connectors; add secrets at Integrations → Secrets if needed.",
        "Save the workflow in Draft, run a manual test if supported, and review execution history.",
        "Set status to Active when each step shows success; monitor execution history during the first week.",
      ],
      subsections: [
        {
          title: "Testing before activation",
          bullets: [
            "Keep the workflow in Draft while configuring triggers and conditions.",
            "Use manual trigger or a low-risk test client to produce a real event.",
            "Confirm the execution record shows success for each step before enabling on production traffic.",
            "Disable the workflow before bulk imports that could generate unintended trigger volume.",
          ],
        },
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Name workflows with the trigger and outcome, e.g. \"Incident P1 → Slack + Jira\".",
        "Start with read-only or notification actions before write actions to external systems.",
        "Use conditions aggressively on high-frequency triggers to avoid duplicate tickets or messages.",
        "Review failed executions weekly; unresolved failures often indicate expired OAuth tokens or rotated secrets.",
        "Document which workflow owns each external side effect so operators know where to look during incidents.",
        "Maintain one canonical connector per external system—duplicate connections cause conflicting writes.",
        "Coordinate secret rotation: update Integrations → Secrets before revoking old keys at the provider.",
      ],
      paragraphs: [
        "Assign a workflow owner on your operations team responsible for reviewing execution history and updating conditions when delivery playbooks change. This role pairs naturally with integration administration in the Automation area.",
      ],
    },
    {
      title: "Examples",
      subsections: [
        {
          title: "Marketing agency",
          paragraphs: [
            "A digital marketing agency on Professional connects HubSpot at Automation → Connectors. When a monthly performance report is published for a retainer client, a workflow sends a Slack message to the account channel and logs a HubSpot activity with the report title. Conditions limit execution to Active clients with a specific tag. Execution history confirms each delivery before the account manager emails the client.",
          ],
        },
        {
          title: "AI automation agency",
          paragraphs: [
            "An AI automation consultancy builds workflows triggered on incident created with condition severity equals high. Actions create a Linear ticket with the incident summary, assign the client owner internally, and send notification to the on-call engineer. A second workflow on SLA breached posts to a Teams channel for leadership visibility. Secrets for a custom webhook endpoint are stored at Integrations → Secrets.",
          ],
        },
        {
          title: "MSP",
          paragraphs: [
            "A managed services provider monitors dozens of clients. Workflows on monitoring event detected with condition severity equals critical create incidents automatically, notify the assigned owner, and open Zendesk tickets for the NOC queue. A separate workflow on report published ensures QBR deliverables trigger client-owner notifications without manual polling of the Reports module.",
          ],
        },
        {
          title: "Consultancy",
          paragraphs: [
            "A strategy consultancy uses lighter automation: report published triggers send notification to the engagement lead and create activity on the client timeline. Risk created with high severity assigns the partner of record. The team reviews execution history monthly rather than daily because external write volume is low and notifications are the primary outcome.",
          ],
        },
        {
          title: "Enterprise deployment",
          paragraphs: [
            "An enterprise agency with custom plan limits runs tiered workflows per client segment. Premium clients get immediate Jira escalation on SLA breach; standard clients get notification only. Workflow permissions are restricted to admins; staff can view execution history but not edit definitions. OAuth connectors are authorized once per workspace with secrets rotated quarterly per security policy.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting",
      table: {
        caption: "Automation troubleshooting",
        headers: ["Problem", "Cause", "Solution"],
        rows: [
          [
            "Workflow not firing",
            "Status is Draft or Disabled, or conditions are too narrow.",
            "Set status to Active; verify the trigger event occurred; review and broaden conditions.",
          ],
          [
            "Execution failed on connector action",
            "Expired OAuth token or revoked provider consent.",
            "Reconnect at Automation → Connectors; confirm the provider account still has required permissions.",
          ],
          [
            "Execution failed on secret-based action",
            "API key rotated or revoked at the provider.",
            "Update the value at Integrations → Secrets; rerun with manual trigger to confirm.",
          ],
          [
            "Duplicate external tickets or messages",
            "Multiple active workflows share the same trigger without exclusive conditions.",
            "Consolidate workflows or add mutually exclusive conditions; prefer created over updated triggers.",
          ],
          [
            "Automation module not visible",
            "Plan does not include the builder or role lacks workflow permissions.",
            "Upgrade via Settings → Billing; ask a workspace owner to verify role permissions.",
          ],
          [
            "Partial execution status",
            "One action succeeded but a later step failed.",
            "Open execution detail for the failing step; fix connector or secret; earlier steps may need manual cleanup externally.",
          ],
          [
            "High execution volume after import",
            "Bulk data changes fired many trigger events.",
            "Disable affected workflows before imports; re-enable after validating execution history.",
          ],
        ],
      },
    },
  ],
  faq: [
    {
      question: "Can one workflow have multiple triggers?",
      answer:
        "Each workflow has a single trigger. Create separate workflows for separate events, or use conditions to handle variants within one trigger type.",
    },
    {
      question: "Where do I connect Slack, Jira, or CRM tools?",
      answer:
        "Authorize OAuth connectors at Automation → Connectors. Once connected, their action types appear in the workflow builder.",
    },
    {
      question: "What is the difference between Connectors and Secrets?",
      answer:
        "Connectors use OAuth authorization flows for supported systems. Secrets store API keys or tokens for integrations that require manual credential entry. Both are managed under the Automation area.",
    },
    {
      question: "How long is execution history retained?",
      answer:
        "Execution records remain available on the workflow detail page for review and export. Retention limits may apply by plan—check Settings → Usage for your workspace.",
    },
    {
      question: "Can I run a workflow without waiting for an event?",
      answer:
        "Workflows with a manual trigger can be run on demand from the workflow detail page, which is useful for testing before activation.",
    },
    {
      question: "Is automation available on all plans?",
      answer:
        "The workflow builder is plan-gated. Workspaces without automation entitlements may see an upgrade prompt; Professional and higher tiers include automation. Review Settings → Billing for your effective entitlements.",
    },
  ],
  relatedLinks: [
    { href: "/docs/integrations", label: "Integrations" },
    { href: "/docs/incidents", label: "Incidents" },
    { href: "/docs/reports", label: "Reports" },
    { href: "/docs/api", label: "API" },
  ],
};

export const INTEGRATIONS_DOC: DocPageInput = {
  slug: "integrations",
  title: "Integrations",
  description:
    "OAuth connectors for CRM, ticketing, and productivity tools; sync jobs; integration logs.",
  intro:
    "Integrations connect Auroranexis to the CRM, ticketing, messaging, and productivity systems your agency already uses. Authorize connectors via OAuth at Automation → Connectors, run sync where supported, store API keys at Integrations → Secrets, and diagnose delivery through integration logs. Connectivity established here powers automation workflows and keeps operational data aligned with external tools your delivery, sales, and support teams monitor daily.",
  callouts: [
    {
      variant: "warning",
      title: "Organization-scoped tokens",
      body: "OAuth connections act on behalf of your entire workspace. Limit connector authorization to owners, admins, or designated integration owners.",
    },
    {
      variant: "info",
      title: "Automation area",
      body: "The integration catalog, connector management, secrets, and logs all live under Automation in the dashboard sidebar—not a separate top-level module.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "The integration catalog lives under Automation in the dashboard. Each connector represents a supported external platform—CRM tools like HubSpot and Salesforce, ticketing systems like Jira, Linear, and Zendesk, messaging via Slack and Microsoft Teams, and workspace productivity through Google and Microsoft 365.",
        "Connections are organization-scoped. An admin or authorized integration owner completes the OAuth flow once per connector per workspace. Connected systems become available to automation workflows and, where supported, scheduled sync jobs that keep selected records aligned even when no platform trigger fires.",
        "Integration activity—successful deliveries, sync runs, OAuth refreshes, and errors—is recorded in integration logs for operational visibility. Logs are the first place to look when CRM data is stale, tickets fail to create, or channel messages stop arriving.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Agencies operate across many tools. Auroranexis is the operational source of truth for client health, incidents, and reports; integrations extend that truth into systems your delivery, sales, and support teams already monitor.",
        "Without integrations, operators manually copy incident summaries into ticketing systems, log delivery milestones in CRMs, and post status updates in chat channels. Connectors and sync reduce that friction while preserving Auroranexis as the authoritative record for SLA compliance and client reporting.",
      ],
      subsections: [
        {
          title: "Primary use cases",
          bullets: [
            "Push incident or SLA events into Jira, Linear, or Zendesk so engineering tracks work in familiar boards.",
            "Log client activities or deal updates in HubSpot or Salesforce when operational milestones occur.",
            "Send channel notifications through Slack or Teams when reports publish or risks escalate.",
            "Keep selected records aligned through connector sync instead of manual copy-paste.",
          ],
        },
        {
          title: "Integration vs. automation",
          paragraphs: [
            "Integrations establish connectivity and optional sync. Automation consumes that connectivity in workflows. Connect first at Automation → Connectors; then reference connectors in workflow actions. Manage API keys at Integrations → Secrets when OAuth alone is insufficient for a given endpoint or custom integration.",
          ],
        },
      ],
    },
    {
      title: "Core Concepts",
      subsections: [
        {
          title: "Connector",
          paragraphs: [
            "A connector is a pre-built integration module for a specific external platform. Each connector declares supported actions (write operations), inbound triggers where applicable, and OAuth requirements. Browse the full catalog at Automation → Connectors.",
          ],
        },
        {
          title: "OAuth authorization",
          paragraphs: [
            "Most connectors use OAuth 2.0. An authorized user is redirected to the external provider, grants consent, and is returned to Auroranexis with a stored refresh token. The platform uses that token for subsequent API calls on behalf of your organization until consent is revoked or the token expires.",
          ],
        },
        {
          title: "Connection status",
          paragraphs: [
            "Each connector shows connected, disconnected, or error state on the Connectors page. Error state usually indicates an expired token, revoked consent, or misconfigured environment credentials. Click Reconnect to repeat the OAuth flow.",
          ],
        },
        {
          title: "Sync",
          paragraphs: [
            "Supported connectors can run sync jobs that pull or push selected data on a schedule or on demand. Sync complements event-driven automation for data that must stay current even when no platform trigger fires. Sync runs appear in integration logs with record counts and error summaries.",
          ],
        },
        {
          title: "Integration logs",
          paragraphs: [
            "Every significant integration operation—OAuth refresh, sync run, workflow action delivery—is logged with timestamp, connector, outcome, and error detail when applicable. Open Automation → Integrations → Logs to review recent activity across all connectors.",
          ],
        },
        {
          title: "Secrets",
          paragraphs: [
            "Some custom or legacy endpoints require API keys stored at Automation → Integrations → Secrets. Secrets are encrypted at rest, referenced by connector configuration or workflow actions, and should be rotated on your security schedule.",
          ],
        },
      ],
      table: {
        caption: "Connector categories (representative)",
        headers: ["Category", "Examples", "Typical use"],
        rows: [
          ["CRM", "HubSpot, Salesforce", "Log activities, update deals or opportunities"],
          ["Helpdesk / ticketing", "Zendesk, Jira, Linear", "Create or update tickets from incidents"],
          ["Messaging", "Slack, Microsoft Teams", "Channel alerts for operational events"],
          ["Workspace", "Google, Microsoft 365", "Email, calendar, and document workflows"],
          ["DevOps", "GitHub, GitLab", "Link incidents to issues and pipelines"],
        ],
      },
    },
    {
      title: "Features",
      bullets: [
        "OAuth connector catalog at Automation → Connectors with one-click authorization.",
        "Connection status indicators: connected, disconnected, and error with reconnect action.",
        "Connector sync for supported platforms with on-demand and scheduled runs.",
        "Integration logs at Automation → Integrations → Logs with filter by connector and outcome.",
        "Secrets management at Integrations → Secrets for API keys and manual credentials.",
        "Workflow action targets unlocked after successful OAuth authorization.",
        "Activity logging for OAuth refresh, sync, and delivery operations.",
        "Plan-gated connectors with availability reflected in Settings → Usage.",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Open Automation → Connectors from the dashboard sidebar.",
        "Locate the target system—for example Zendesk for ticketing or HubSpot for CRM.",
        "Click Connect and sign in to the external provider with an account that has sufficient permissions.",
        "Grant the requested scopes and confirm you are redirected back with status Connected.",
        "Optional: configure sync on the connector detail page if your use case requires ongoing data alignment.",
        "Add API keys at Integrations → Secrets if the connector or workflow requires manual credentials.",
        "Reference the connector in an automation workflow action, or rely on sync for passive alignment.",
        "If deliveries fail, open Automation → Integrations → Logs and review the error entry for that connector.",
      ],
      subsections: [
        {
          title: "Revoking a connection",
          ordered: [
            "Disable workflows that reference the connector to prevent repeated failures.",
            "Disconnect the connector in Automation → Connectors.",
            "Revoke the application access at the external provider's admin console if offboarding the tool entirely.",
          ],
        },
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Limit OAuth authorization to workspace owners, admins, or designated integration owners.",
        "Maintain one canonical connection per external system—duplicate connections cause conflicting sync and duplicate records.",
        "Document which connector and workflow owns each external write path.",
        "Review integration logs weekly for silent failures, especially after provider-side policy changes.",
        "Revoke unused connections promptly when offboarding a tool or client engagement ends.",
        "Prefer narrow sync scope to reduce API rate-limit pressure on external systems.",
        "Coordinate secret rotation: update Integrations → Secrets before revoking old keys at the provider.",
      ],
    },
    {
      title: "Examples",
      subsections: [
        {
          title: "Marketing agency",
          paragraphs: [
            "A performance marketing firm connects HubSpot and Slack at Automation → Connectors. A workflow logs HubSpot activities when reports publish; Slack receives channel alerts for client health drops. Weekly sync keeps deal stages aligned with client status changes in Auroranexis. Integration logs confirm each sync run; the ops lead reviews failures every Monday.",
          ],
        },
        {
          title: "AI automation agency",
          paragraphs: [
            "An AI consultancy connects Linear, GitHub, and a custom webhook via Integrations → Secrets. Incident workflows create Linear issues linked to GitHub repositories mentioned in incident notes. The webhook posts structured payloads to an internal orchestration layer. OAuth covers Linear and GitHub; the webhook secret rotates quarterly.",
          ],
        },
        {
          title: "MSP",
          paragraphs: [
            "An MSP connects Zendesk and Microsoft Teams for NOC operations. High-severity incidents create Zendesk tickets automatically; Teams channels receive bridge-call summaries. Sync pulls ticket status back for display on incident detail pages where supported. Integration logs filter quickly to Zendesk when clients report missing tickets.",
          ],
        },
        {
          title: "Consultancy",
          paragraphs: [
            "A management consultancy connects Salesforce only for strategic accounts. Workflows log delivery milestones when reports publish; sync is limited to opportunity stages for those clients. Messaging integrations are intentionally omitted to keep client communication human-led. Logs are reviewed monthly because write volume is low.",
          ],
        },
        {
          title: "Enterprise deployment",
          paragraphs: [
            "An enterprise agency authorizes connectors through a dedicated integration service account at each provider. Salesforce, Jira, and Teams are connected once per workspace with secrets stored in a managed rotation process. Sync jobs run on conservative schedules to respect enterprise API quotas. Integration logs export to the compliance team quarterly.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting",
      table: {
        caption: "Integration troubleshooting",
        headers: ["Problem", "Cause", "Solution"],
        rows: [
          [
            "OAuth authorization fails",
            "Insufficient permissions at the provider or conflicting browser session.",
            "Sign in with an admin or integration-manager account; try an incognito session; verify redirect URLs for your deployment.",
          ],
          [
            "Connector shows error status",
            "Expired token or revoked application consent.",
            "Click Reconnect at Automation → Connectors; verify the app was not removed in the provider's connected-apps settings.",
          ],
          [
            "Sync delayed or incomplete",
            "API rate limits or reduced scope on the connected account.",
            "Review integration logs for the latest sync run; narrow sync scope or increase interval; confirm account access to synced resources.",
          ],
          [
            "Workflow action fails despite connected status",
            "OAuth token lacks a required scope.",
            "Disconnect and reconnect granting full requested permissions; check Integrations → Secrets if the action uses a stored API key.",
          ],
          [
            "Duplicate records in external system",
            "Multiple workflows or connections writing the same data.",
            "Consolidate workflows; maintain one canonical connector; add conditions to prevent repeat writes.",
          ],
          [
            "Connector not listed in catalog",
            "Plan does not include the integration or environment configuration is incomplete.",
            "Review Settings → Billing; contact support if the catalog is unexpectedly empty for your tier.",
          ],
          [
            "Integration logs show repeated OAuth refresh failures",
            "Provider policy change or revoked refresh token.",
            "Reconnect the connector; confirm the authorizing user account is still active at the provider.",
          ],
        ],
      },
    },
  ],
  faq: [
    {
      question: "Who can authorize OAuth connectors?",
      answer:
        "Users with permission to manage automation and integrations can complete OAuth flows. Restrict this to trusted admins because connected tokens act on behalf of your entire organization.",
    },
    {
      question: "Where are integration logs?",
      answer:
        "Open Automation → Integrations → Logs. Entries include connector name, operation type, timestamp, and success or failure detail.",
    },
    {
      question: "Does sync replace automation?",
      answer:
        "No. Sync keeps selected data aligned on a schedule or on demand. Automation reacts to platform events in real time. Most agencies use both: sync for baseline alignment, automation for event-driven actions.",
    },
    {
      question: "How do I store an API key instead of using OAuth?",
      answer:
        "Add the key at Automation → Integrations → Secrets. Reference it from the connector or workflow configuration that requires manual credentials.",
    },
    {
      question: "What happens if I disconnect a connector?",
      answer:
        "Workflow actions targeting that connector will fail until you reconnect or update the workflow. Disable affected workflows before disconnecting to avoid repeated failed executions.",
    },
    {
      question: "Which connectors are available on my plan?",
      answer:
        "Connector availability depends on your subscription tier. Review the catalog at Automation → Connectors and Settings → Usage for plan-specific entitlements.",
    },
  ],
  relatedLinks: [
    { href: "/docs/automation", label: "Automation" },
    { href: "/docs/api", label: "API" },
    { href: "/docs/security", label: "Security" },
    { href: "/docs/clients", label: "Clients" },
  ],
};

export const CLIENT_PORTAL_DOC: DocPageInput = {
  slug: "client-portal",
  title: "Client Portal",
  description:
    "External client login, portal users, published reports, incident visibility, and white-label branding.",
  intro:
    "The client portal gives your customers a secure, branded view of deliverables and operational status you choose to share. Portal users sign in separately at /client-portal/login and see only data for their assigned client. Internal admins manage portal users from each client's detail page, publish reports after internal review, control incident visibility per record, and apply white-label branding from Settings → Branding.",
  callouts: [
    {
      variant: "warning",
      title: "Publishing is client-visible",
      body: "Published reports may appear in the client portal immediately for that client's portal users. Complete internal review before publishing.",
    },
    {
      variant: "tip",
      title: "One user per contact",
      body: "Create separate portal users for each client contact. Shared credentials make access revocation difficult and violate audit best practices.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "The client portal is a dedicated external experience, separate from your internal dashboard. Client contacts authenticate at /client-portal/login with credentials tied to a single client record. They cannot see other clients in your portfolio or access internal-only modules such as billing, team management, or automation configuration.",
        "Internal admins manage portal users from each client's detail page in the dashboard. Published reports, portal-visible incidents, and branding configured in Settings → Branding determine what contacts see after sign-in. The portal is read-focused: clients review reports, track incident summaries you expose, and view health and SLA context appropriate for external audiences.",
        "Portal authentication is independent from internal team login. Portal sessions cannot access dashboard routes, and internal sessions cannot impersonate portal users without explicit admin action. This separation keeps external access narrowly scoped.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Agencies need a professional, controlled way to share deliverables and status without granting full platform access. The portal reduces email attachment churn, gives clients a single destination for QBR reports, and builds trust through transparent incident communication when you enable it.",
        "White-label branding from Settings → Branding ensures the portal reflects your agency identity—or co-branding where configured—rather than generic platform chrome. Clients experience a polished, on-brand destination that matches proposals and SOW materials.",
      ],
      subsections: [
        {
          title: "Problems the portal solves",
          bullets: [
            "Scattered report delivery via email with no central archive for the client.",
            "Ad-hoc status updates that do not match what your team records internally.",
            "Generic login pages that do not reflect your agency brand or white-label agreement.",
          ],
        },
        {
          title: "Audience",
          bullets: [
            "Client executives and stakeholders who need report access and high-level status.",
            "Client IT or operations contacts who need visibility into incidents you mark as portal-visible.",
            "Not intended for internal staff—team members use the main dashboard login instead.",
          ],
        },
      ],
    },
    {
      title: "Core Concepts",
      subsections: [
        {
          title: "Portal user",
          paragraphs: [
            "A portal user is an external contact with email, name, and password scoped to exactly one client. Multiple portal users can exist per client—each person should have their own account rather than shared credentials. Disable portal users promptly when contacts leave the client organization.",
          ],
        },
        {
          title: "Portal login at /client-portal/login",
          paragraphs: [
            "Share your deployment URL with the /client-portal/login path—for example https://your-domain/client-portal/login. The login form accepts portal user email and password. Password reset flows are available from the login page when enabled for your deployment.",
          ],
        },
        {
          title: "Published reports",
          paragraphs: [
            "Reports must be published from the internal Reports module before they appear in the portal. Draft and generated reports are never visible externally. Publishing is the explicit gate between internal review and client delivery.",
          ],
        },
        {
          title: "Incident visibility",
          paragraphs: [
            "Incidents are internal by default. Enable portal visibility on individual incidents to share summary, status, and timeline appropriate for the client. Incidents without portal visibility do not appear in the portal. Internal description and resolution notes remain for your team only.",
          ],
        },
        {
          title: "White-label branding",
          paragraphs: [
            "Organization branding—logo, colors, and display name—configured in Settings → Branding applies to the client portal shell, login page, and authenticated views. Clients see your agency identity, not generic marketing chrome.",
          ],
        },
      ],
      table: {
        caption: "Internal vs. portal access",
        headers: ["Capability", "Internal dashboard", "Client portal"],
        rows: [
          ["Login URL", "Standard app login", "/client-portal/login"],
          ["Scope", "Full organization (by role)", "Single client only"],
          ["Reports", "Draft and published", "Published only"],
          ["Incidents", "All incidents", "Portal-visible incidents only"],
          ["Branding", "Dashboard theme", "Settings → Branding white-label"],
        ],
      },
    },
    {
      title: "Features",
      bullets: [
        "Dedicated portal login at /client-portal/login with password reset support.",
        "Portal user management from each client detail page in the dashboard.",
        "One client per portal user; users cannot switch clients or see portfolio data.",
        "Published report delivery in the portal Reports section with detail and export where enabled.",
        "Per-incident portal visibility toggle with client-facing summary field.",
        "Health and SLA context appropriate for external audiences on portal views.",
        "White-label branding from Settings → Branding: logo, colors, and display name.",
        "Disable portal users without deleting delivery history.",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Configure white-label branding in Settings → Branding (logo, name, colors).",
        "Open the target client in Clients and navigate to portal user management.",
        "Create a portal user for each client contact with their work email address.",
        "Deliver initial credentials securely—prefer individual accounts over shared passwords.",
        "Publish the report from Reports after internal review.",
        "On incidents you want the client to see, enable portal visibility and write a client summary.",
        "Share the portal login URL (/client-portal/login) and confirm the contact can sign in.",
        "Review portal-visible content before major client calls so external view matches talking points.",
      ],
      subsections: [
        {
          title: "Ongoing maintenance",
          bullets: [
            "Publish new reports on your delivery cadence; clients see them automatically after publish.",
            "Disable portal users when engagements end or contacts change roles.",
            "Update incident client summaries as status changes so portal users see current information.",
            "Refresh branding in Settings → Branding when your agency identity changes.",
          ],
        },
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Issue separate portal users per contact—never share one login across a client team.",
        "Review report content on internal draft before publishing; publishing is irreversible from the client's perspective.",
        "Use incident portal visibility selectively; default to internal-only until you are ready to communicate.",
        "Align portal branding with client-facing proposals and SOW materials for a consistent experience.",
        "Run a pilot with one client before rolling portal access across your portfolio.",
        "Disable portal users the same day a contact offboards—do not leave dormant external access.",
        "Write client summaries in plain language without internal jargon or blame-oriented phrasing.",
      ],
    },
    {
      title: "Examples",
      subsections: [
        {
          title: "Marketing agency",
          paragraphs: [
            "A marketing agency white-labels the portal in Settings → Branding with their agency logo. Each retainer client receives two portal users—the marketing director and a finance contact. Monthly performance reports publish after internal review; clients sign in at /client-portal/login to download PDF exports before QBR calls. Incidents are rarely portal-visible; transparency flows through reports instead.",
          ],
        },
        {
          title: "AI automation agency",
          paragraphs: [
            "An AI automation firm enables portal access for clients running production workflows. Portal users see published monthly operations reports and portal-visible incidents when automations affect client systems. The agency uses co-branded Settings → Branding for reseller clients. Portal users are provisioned during onboarding and disabled within 24 hours of contract end.",
          ],
        },
        {
          title: "MSP",
          paragraphs: [
            "An MSP grants portal access to IT leads at each managed client. Published reports summarize uptime, incidents, and SLA compliance. High-severity incidents enable portal visibility with client summaries updated during bridge calls. Portal users cannot see internal technical notes or unrelated clients in the portfolio.",
          ],
        },
        {
          title: "Consultancy",
          paragraphs: [
            "A strategy consultancy uses the portal primarily for report delivery. Partners publish engagement summaries and executive decks; portal visibility on incidents is rare. Branding matches proposal materials configured in Settings → Branding. One portal user per stakeholder keeps access auditable for regulated clients.",
          ],
        },
        {
          title: "Enterprise deployment",
          paragraphs: [
            "An enterprise agency deploys the portal across hundreds of clients with standardized branding and SSO considerations per contract. Portal user provisioning follows an ITIL-style access request process. Published reports require a two-person review before publish. Incident portal visibility follows a communications playbook with pre-approved summary templates.",
          ],
        },
      ],
    },
    {
      title: "Troubleshooting",
      table: {
        caption: "Client portal troubleshooting",
        headers: ["Problem", "Cause", "Solution"],
        rows: [
          [
            "Portal user cannot sign in",
            "Wrong email, disabled account, or incorrect login URL.",
            "Verify the email on the client detail page; confirm the user is enabled; share /client-portal/login; use password reset if needed.",
          ],
          [
            "Report not visible in portal",
            "Report is Draft or belongs to a different client.",
            "Publish the report from Reports; confirm the report client matches the portal user's client.",
          ],
          [
            "Incident missing from portal",
            "Portal visibility is disabled by default.",
            "Enable portal visibility on the incident record and add a client-facing summary.",
          ],
          [
            "Wrong logo or colors in portal",
            "Branding not saved or browser cache serving old assets.",
            "Review and save Settings → Branding; hard-refresh the portal or sign out and back in.",
          ],
          [
            "User sees unexpected client data",
            "Portal user created on the wrong client record.",
            "Verify the user was created on the correct client; disable and recreate if misassigned; contact support if cross-client data appears.",
          ],
          [
            "PDF export unavailable in portal",
            "Export not enabled for the report or plan limitation.",
            "Confirm export settings on the report; verify plan includes portal PDF export where applicable.",
          ],
          [
            "Branding not applied to login page",
            "Branding changes not published or plan lacks white-label.",
            "Save and publish branding in Settings → Branding; upgrade via Settings → Billing if white-label is plan-gated.",
          ],
        ],
      },
    },
  ],
  faq: [
    {
      question: "What is the client portal login URL?",
      answer:
        "Clients sign in at /client-portal/login on your Auroranexis deployment. Share the full URL including your domain.",
    },
    {
      question: "Can one portal user access multiple clients?",
      answer:
        "No. Each portal user is tied to a single client. Create separate users for contacts who work with multiple clients you manage.",
    },
    {
      question: "Do draft reports appear in the portal?",
      answer:
        "No. Only published reports are visible. Complete internal review before publishing.",
    },
    {
      question: "How do I show an incident to a client?",
      answer:
        "Enable portal visibility on the incident record and write a client summary. Incidents without this flag remain internal only.",
    },
    {
      question: "Where do I configure portal branding?",
      answer:
        "Open Settings → Branding in the internal dashboard. Logo and color settings apply to the client portal login and authenticated views.",
    },
    {
      question: "How many portal users can I create per client?",
      answer:
        "Multiple portal users are supported per client. Create one account per contact rather than sharing credentials across a client team.",
    },
  ],
  relatedLinks: [
    { href: "/docs/reports", label: "Reports" },
    { href: "/docs/clients", label: "Clients" },
    { href: "/docs/incidents", label: "Incidents" },
    { href: "/docs/white-label", label: "White label" },
  ],
};
