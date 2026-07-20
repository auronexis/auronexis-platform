import type { DocPageInput } from "@/lib/docs/types";

/** Supporting documentation for Knowledge Hub, profitability, customer success, and activity. */

export const KNOWLEDGE_DOC: DocPageInput = {
  slug: "knowledge",
  title: "Knowledge Hub",
  description:
    "Organization-scoped runbooks, delivery procedures, and operational reference content for agency teams.",
  intro:
    "The Knowledge Hub stores runbooks, procedures, and delivery reference content inside your Auroranexis workspace. Teams find guidance alongside client work instead of searching disconnected wikis and shared drives.",
  callouts: [
    {
      variant: "info",
      title: "Also called Knowledge Base",
      body: "Marketing and product surfaces may say Knowledge Hub or Knowledge Base — both refer to the same organization-scoped knowledge module.",
    },
  ],
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "Knowledge Hub content is scoped to your organization. Owners and admins manage articles and categories; staff use them while handling clients, incidents, and reports.",
        "Articles support operational procedures — incident response steps, reporting checklists, portal publication rules, and client-specific delivery notes your team agrees to reuse.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Agencies lose time when institutional knowledge lives in personal notes. The Knowledge Hub reduces ramp time and keeps delivery quality consistent across assignees.",
      ],
    },
    {
      title: "Core Concepts",
      bullets: [
        "Article — a searchable knowledge entry with title, body, and optional category.",
        "Runbook — procedure content used during incidents, onboarding, or reporting cycles.",
        "Organization scope — content is never shared across unrelated workspaces.",
      ],
    },
    {
      title: "Features",
      bullets: [
        "Searchable organization knowledge library",
        "Role-based access for authors and readers",
        "Links from operational modules to related procedures",
        "Audit-friendly updates when procedures change",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Open Knowledge Hub from the workspace navigation.",
        "Create or update articles for recurring delivery procedures.",
        "Link critical runbooks from incident and reporting workflows your team uses most.",
        "Review and retire outdated articles during quarterly operations reviews.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Keep runbooks short and actionable — link to related modules instead of duplicating product docs.",
        "Assign an owner for each high-traffic procedure.",
        "Prefer one canonical article per procedure to avoid conflicting guidance.",
      ],
    },
    {
      title: "Examples",
      paragraphs: [
        "An MSP documents a standard incident triage runbook. New analysts follow the same severity and client-notification steps, reducing handoff errors during after-hours coverage.",
      ],
    },
    {
      title: "Troubleshooting",
      bullets: [
        "If Knowledge Hub is unavailable, confirm your plan includes the module in Settings → Billing and Settings → Usage.",
        "If staff cannot edit articles, review role permissions in Settings → Team.",
      ],
    },
  ],
  faq: [
    {
      question: "Is Knowledge Hub the same as the marketing Knowledge Base page?",
      answer:
        "Yes. The product module is the Knowledge Hub; the public feature page describes the same capability.",
    },
    {
      question: "Can clients read Knowledge Hub articles?",
      answer:
        "Knowledge Hub content is for internal delivery teams. Clients see only what you publish through the client portal.",
    },
  ],
  relatedDocs: [
    { href: "/docs/incidents", label: "Incidents" },
    { href: "/docs/getting-started", label: "Getting started" },
  ],
};

export const PROFITABILITY_DOC: DocPageInput = {
  slug: "profitability",
  title: "Profitability",
  description:
    "Client-level profitability context that connects delivery effort with portfolio financial visibility.",
  intro:
    "Profitability surfaces help operations and leadership see which clients consume disproportionate delivery effort relative to contract value. Use them alongside incidents, reports, and customer success signals — not as a standalone accounting system.",
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "Auroranexis profitability views summarize client-level financial and delivery context inside the operations workspace. They support pricing reviews, scope conversations, and resource allocation.",
        "Figures reflect data your workspace maintains for clients and delivery activity. They do not replace your accounting or ERP system of record.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Agencies often discover margin pressure too late. Profitability context next to operational signals helps leaders intervene before renewals or staffing commitments lock in unprofitable patterns.",
      ],
    },
    {
      title: "Core Concepts",
      bullets: [
        "Client profitability indicator — summarized margin or effort context for a client.",
        "Portfolio comparison — relative view across clients for leadership review.",
        "Delivery correlation — incident volume and reporting cadence as operational cost signals.",
      ],
    },
    {
      title: "Features",
      bullets: [
        "Client-level profitability context in the operations workspace",
        "Portfolio comparison for margin-aware decisions",
        "Correlation with delivery and incident activity",
        "Export-friendly summaries for leadership reviews",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Open Profitability from the workspace navigation.",
        "Review portfolio rankings and open clients that show elevated delivery effort.",
        "Cross-check incidents, reports, and success signals before changing commercial terms.",
        "Export summaries for partner or finance reviews when needed.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Treat profitability as decision support — validate figures against finance records before contracting changes.",
        "Combine with customer success and health signals for a complete account review.",
        "Revisit rankings before major renewals or capacity planning cycles.",
      ],
    },
    {
      title: "Examples",
      paragraphs: [
        "A consultancy notices a retainer client generating high incident volume relative to contract value. Leadership uses profitability context plus incident history to renegotiate scope before renewal.",
      ],
    },
    {
      title: "Troubleshooting",
      bullets: [
        "Missing figures usually mean incomplete client commercial fields or plan gating — check Settings → Billing and client records.",
        "Large swings after imports warrant a finance reconciliation before acting on rankings.",
      ],
    },
  ],
  faq: [
    {
      question: "Does profitability replace accounting software?",
      answer:
        "No. It provides operations-adjacent financial context. Keep your accounting system as the ledger of record.",
    },
    {
      question: "Who can view profitability?",
      answer:
        "Access follows workspace roles. Restrict finance-sensitive views to owners and designated admins.",
    },
  ],
  relatedDocs: [
    { href: "/docs/clients", label: "Clients" },
    { href: "/docs/customer-success", label: "Customer success" },
  ],
};

export const CUSTOMER_SUCCESS_DOC: DocPageInput = {
  slug: "customer-success",
  title: "Customer Success",
  description:
    "Account health, playbooks, and portfolio success workflows for multi-client agencies.",
  intro:
    "Customer Success in Auroranexis helps teams prioritize accounts, run intervention playbooks, and track portfolio outcomes using operational signals — not invented NPS scores or fabricated benchmarks.",
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "The Customer Success module organizes client attention around health, risk, and delivery signals already present in the workspace. Teams see which accounts need intervention and what to do next.",
        "Playbooks and tasks guide follow-up without replacing your existing CRM relationships.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "Service providers lose revenue when at-risk clients are noticed too late. Customer Success workflows make early warning signals actionable for account owners.",
      ],
    },
    {
      title: "Core Concepts",
      bullets: [
        "Success portfolio — ranked or filtered view of clients needing attention.",
        "Playbook — guided intervention steps for common success scenarios.",
        "Health and risk signals — operational inputs that inform prioritization.",
      ],
    },
    {
      title: "Features",
      bullets: [
        "Portfolio views for accounts needing attention",
        "Playbook-driven intervention tasks",
        "Links to health, risk, and reporting context",
        "Organization-scoped ownership and activity history",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Open Customer Success from the workspace navigation.",
        "Review priority accounts and open the client record for context.",
        "Start or continue a playbook when intervention is required.",
        "Confirm outcomes in activity and health views after follow-up.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Assign clear account owners before enabling playbooks at scale.",
        "Use health and risk modules as evidence — do not invent external scores.",
        "Close the loop with reports or portal updates when clients need visibility.",
      ],
    },
    {
      title: "Examples",
      paragraphs: [
        "An MSP watches declining health on a managed client, opens a success playbook for executive check-in, and publishes an updated status report through the portal.",
      ],
    },
    {
      title: "Troubleshooting",
      bullets: [
        "Empty portfolios usually mean clients lack health or success signals yet — complete onboarding and monitoring first.",
        "Plan gates may hide advanced success tooling — verify entitlements in Settings → Billing.",
      ],
    },
  ],
  faq: [
    {
      question: "Is Customer Success a CRM?",
      answer:
        "No. It operationalizes success workflows from Auroranexis delivery signals. Keep CRM systems for pipeline and relationship history.",
    },
    {
      question: "Does it invent satisfaction scores?",
      answer:
        "No. Prioritization uses operational signals from your workspace. We do not fabricate NPS or benchmark statistics.",
    },
  ],
  relatedDocs: [
    { href: "/docs/predictive", label: "Predictive intelligence" },
    { href: "/docs/clients", label: "Clients" },
  ],
};

export const ACTIVITY_DOC: DocPageInput = {
  slug: "activity",
  title: "Activity Timeline",
  description:
    "Organization-scoped activity history across clients, incidents, risks, reports, and automation.",
  intro:
    "The Activity Timeline reconstructs what changed in your workspace — who updated records, published reports, or triggered automation — so teams can audit delivery work without searching multiple modules.",
  sections: [
    {
      title: "Overview",
      paragraphs: [
        "Activity events are written when users and automations change operational records. The timeline filters by client, actor, and entity type.",
        "Clients do not see the full internal timeline. They see published portal content only.",
      ],
    },
    {
      title: "Purpose",
      paragraphs: [
        "After-action reviews and compliance sampling need a trustworthy chronology. The Activity Timeline provides that chronology inside the same system of record as delivery work.",
      ],
    },
    {
      title: "Core Concepts",
      bullets: [
        "Activity event — a logged change with actor, entity, and timestamp.",
        "Timeline filter — client, module, or actor constraints for investigation.",
        "Retention — history length depends on plan and organization settings.",
      ],
    },
    {
      title: "Features",
      bullets: [
        "Chronological feed across operational modules",
        "Filters for client, user, and record type",
        "Links back to source records",
        "Export-friendly summaries for reviews",
      ],
    },
    {
      title: "Step-by-step usage",
      ordered: [
        "Open Activity from the workspace navigation or a client detail view.",
        "Filter to the client or time window under review.",
        "Open linked records to inspect the underlying change.",
        "Export or capture evidence when preparing audits or QBRs.",
      ],
    },
    {
      title: "Best Practices",
      bullets: [
        "Use activity during incident postmortems alongside incident records.",
        "Limit broad exports to the minimum window needed for the review.",
        "Confirm retention settings with compliance owners for regulated clients.",
      ],
    },
    {
      title: "Examples",
      paragraphs: [
        "An operations lead reconstructs who published a client report and which automation fired afterward before answering a customer question about timing.",
      ],
    },
    {
      title: "Troubleshooting",
      bullets: [
        "Missing events can mean the action type is not logged or retention trimmed older history.",
        "If filters return empty results, widen the date range or clear client constraints.",
      ],
    },
  ],
  faq: [
    {
      question: "Can portal users see the activity timeline?",
      answer:
        "No. The full timeline is an internal operations view. Portal users see published content only.",
    },
    {
      question: "How long is activity retained?",
      answer:
        "Retention depends on your plan and organization settings. Enterprise workspaces can retain longer history for governance requirements.",
    },
  ],
  relatedDocs: [
    { href: "/docs/incidents", label: "Incidents" },
    { href: "/docs/automation", label: "Automation" },
  ],
};
