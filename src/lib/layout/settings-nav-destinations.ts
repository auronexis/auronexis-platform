/**
 * Canonical Settings hub destinations.
 * Shared by Settings page cards and Ctrl+K workspace search to prevent drift.
 */

export type SettingsNavDestination = {
  href: string;
  title: string;
  description: string;
  keywords: string;
  /** When true, only owners/admins see this destination in search. */
  adminOnly?: boolean;
};

export const SETTINGS_NAV_DESTINATIONS: readonly SettingsNavDestination[] = [
  {
    href: "/settings/organization",
    title: "Organization",
    description: "Update your agency name and workspace profile.",
    keywords: "organization workspace profile agency name",
  },
  {
    href: "/settings/branding",
    title: "White Label Branding",
    description: "Rebrand dashboard, login, portal, emails, and PDF exports.",
    keywords: "branding white label theme logo portal email pdf",
  },
  {
    href: "/settings/email",
    title: "Email delivery",
    description: "Configure sender name, from address, and reply-to for report emails.",
    keywords: "email smtp sender from reply delivery",
  },
  {
    href: "/settings/sla",
    title: "SLA policies",
    description: "Define response-time targets for incidents and risks.",
    keywords: "sla policies response time targets",
  },
  {
    href: "/settings/escalation",
    title: "Escalation rules",
    description: "Automate reactions to SLA breaches and critical operational events.",
    keywords: "escalation rules sla breach alerts",
  },
  {
    href: "/settings/billing",
    title: "Subscription & Billing",
    description: "Manage plan, invoices, discounts, limits, and Mollie checkout.",
    keywords: "billing subscription invoices payment mollie plans",
  },
  {
    href: "/settings/usage",
    title: "Usage",
    description: "Track AI, API, automation, storage, and team consumption against plan quotas.",
    keywords: "usage quotas limits consumption ai api",
  },
  {
    href: "/settings/team",
    title: "Workspace Members",
    description: "Manage members, roles, invitations, and access.",
    keywords: "team members invite users roles",
  },
  {
    href: "/settings/support",
    title: "Support",
    description: "Contact support, sales, security, and share product feedback.",
    keywords: "support contact help feedback",
  },
  {
    href: "/settings/legal",
    title: "Legal",
    description: "Privacy policy, terms of service, imprint, and cookies.",
    keywords: "legal privacy terms imprint cookies",
  },
  {
    href: "/settings/about",
    title: "About",
    description: "Version, environment, pilot program, and product roadmap.",
    keywords: "about version roadmap environment",
  },
  {
    href: "/settings/integrations",
    title: "Integration Center",
    description: "Operational status for OpenAI, Mollie, Slack, webhooks, and REST API.",
    keywords: "integrations openai mollie slack webhooks api",
    adminOnly: true,
  },
  {
    href: "/settings/enterprise",
    title: "Enterprise",
    description: "Request Enterprise access, review limits, and enabled capabilities.",
    keywords: "enterprise access limits capabilities",
    adminOnly: true,
  },
  {
    href: "/settings/api",
    title: "Public API",
    description: "Manage API keys, scopes, outbound webhooks, and view usage metrics.",
    keywords: "api keys scopes webhooks public rest",
    adminOnly: true,
  },
  {
    href: "/settings/diagnostics",
    title: "Diagnostics",
    description: "Inspect plan resolution, billing, AI readiness, and environment configuration.",
    keywords: "diagnostics readiness billing plan health environment",
    adminOnly: true,
  },
] as const;
