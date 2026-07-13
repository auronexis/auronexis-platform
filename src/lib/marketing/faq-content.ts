import {
  MARKETING_ROUTES,
  SECURITY_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/contact";
import { COMPANY_NAME } from "@/lib/company/company-information";

export type FaqTopic = {
  id: string;
  title: string;
  items: ReadonlyArray<{ question: string; answer: string }>;
};

export const FAQ_TOPICS: readonly FaqTopic[] = [
  {
    id: "general",
    title: "General",
    items: [
      {
        question: "Who is Auroranexis for?",
        answer: `${COMPANY_NAME} is built for MSPs, IT agencies, consultancies, and automation firms that manage multiple client operations from a single portfolio.`,
      },
      {
        question: "How do I get started?",
        answer: `Create a workspace from the signup page, invite your team, and connect your first clients. Documentation is available at ${MARKETING_ROUTES.documentation}.`,
      },
      {
        question: "Is there a pilot program?",
        answer: `Pilot Partner is an invite-only onboarding program — not a public plan tier. Visit ${MARKETING_ROUTES.pilotProgram} or contact sales if you received an invitation.`,
      },
    ],
  },
  {
    id: "billing",
    title: "Billing",
    items: [
      {
        question: "What plans are available?",
        answer: `Professional, Business, and Enterprise are the public self-serve tiers. See ${MARKETING_ROUTES.pricing} for plan comparison. Enterprise pricing is negotiated for custom limits and onboarding.`,
      },
      {
        question: "How is billing handled?",
        answer: "Subscriptions are processed through Stripe. Workspace owners and billing admins manage plans, invoices, and payment methods in Settings → Billing.",
      },
      {
        question: "Can I change plans later?",
        answer: "Yes. Plan upgrades and downgrades apply to the entire workspace. Usage limits update after the subscription change is processed.",
      },
    ],
  },
  {
    id: "security",
    title: "Security",
    items: [
      {
        question: "How do you handle encryption?",
        answer: "Data is encrypted in transit with TLS. Platform data stores use encryption at rest. See the security page for access controls and operational practices.",
      },
      {
        question: "How do I report a security issue?",
        answer: `Email ${SECURITY_EMAIL} with reproduction steps and impact assessment. Do not include live credentials in your initial report.`,
      },
      {
        question: "Do you claim SOC 2 or ISO certifications?",
        answer: "No. We describe readiness posture only and do not claim certifications we have not obtained.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Data privacy",
    items: [
      {
        question: "Where is data hosted?",
        answer: "Production deployments use EU-capable infrastructure (Supabase, Vercel). Specific residency is confirmed during enterprise onboarding.",
      },
      {
        question: "Is Auroranexis GDPR-ready?",
        answer: `Yes. The platform supports data subject requests, retention controls, and includes a standard DPA. See ${MARKETING_ROUTES.compliance} and the privacy policy.`,
      },
      {
        question: "Who can access client data?",
        answer: "Access is scoped by organization and role. Workspace owners configure permissions for staff, admins, and viewers.",
      },
    ],
  },
  {
    id: "ai",
    title: "OpenAI and AI",
    items: [
      {
        question: "How does Auroranexis use AI?",
        answer: "AI assists with executive report drafting, copilot workflows, and structured summaries. Source operational data remains visible so reviewers can validate outputs before publication.",
      },
      {
        question: "Is AI usage plan-gated?",
        answer: "Yes. AI copilot credits and advanced narrative features depend on your subscription tier. Usage is visible in Settings → Usage.",
      },
      {
        question: "Are prompts stored in logs?",
        answer: "Request logs record metadata for governance and billing. Raw prompts and responses are not exposed in customer-facing surfaces.",
      },
    ],
  },
  {
    id: "client-portal",
    title: "Client portal",
    items: [
      {
        question: "What can clients see in the portal?",
        answer: "You control portal visibility per report, incident, and status update. Clients see only what your team publishes to their portal workspace.",
      },
      {
        question: "Can the portal be white-labeled?",
        answer: "Business and Enterprise plans support white-label branding. Configure logos, colors, and domain settings in workspace branding.",
      },
      {
        question: "How do clients access the portal?",
        answer: "Clients receive secure invitations to their portal workspace. Access is separate from your internal operations dashboard.",
      },
    ],
  },
  {
    id: "reports",
    title: "Reports",
    items: [
      {
        question: "What report formats are supported?",
        answer: "Reports support structured templates, PDF export, scheduled delivery, and optional client portal publication.",
      },
      {
        question: "Can reports include AI-generated summaries?",
        answer: "Yes. Executive summaries can be generated from operational data with reviewer approval before client delivery.",
      },
      {
        question: "How do I schedule recurring reports?",
        answer: "Define templates and schedules per client in the reports module. Execution history is logged for audit purposes.",
      },
    ],
  },
  {
    id: "integrations",
    title: "Integrations",
    items: [
      {
        question: "What integrations are available?",
        answer: `See ${MARKETING_ROUTES.integrations} for the connector catalog including OAuth providers, Stripe, email, and REST API access.`,
      },
      {
        question: "Is there a public API?",
        answer: "Yes. REST API and webhook documentation is available at /docs/api and /api/docs.",
      },
      {
        question: "Can I connect custom tools?",
        answer: "Webhooks and the REST API support custom integrations. Enterprise plans include higher rate limits and dedicated onboarding.",
      },
    ],
  },
  {
    id: "automation",
    title: "Automation",
    items: [
      {
        question: "What can automation workflows do?",
        answer: "Define triggers and actions for operational events — report reminders, status changes, and connector-driven follow-up.",
      },
      {
        question: "Is execution history logged?",
        answer: "Yes. Every automation run is recorded with organization scope for troubleshooting and audit review.",
      },
      {
        question: "Which plans include automation?",
        answer: "Automation workflows are available on Professional and above. Specific limits vary by plan tier.",
      },
    ],
  },
  {
    id: "monitoring",
    title: "Monitoring",
    items: [
      {
        question: "What does the platform monitor?",
        answer: "Portfolio health, SLA breaches, incident volume, connector sync status, and automation execution outcomes.",
      },
      {
        question: "Is there a public status page?",
        answer: `Yes. Visit ${MARKETING_ROUTES.status} for platform, API, billing, AI, and automation availability.`,
      },
      {
        question: "Can I receive alerts?",
        answer: "In-app notifications and email alerts are available for critical operational events based on your workspace configuration.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing",
    items: [
      {
        question: "Is there a free trial?",
        answer: "Create a workspace to evaluate the platform. Pilot Partner offers invite-only terms for qualified agencies.",
      },
      {
        question: "What is included in Enterprise?",
        answer: `Custom limits, priority support, dedicated onboarding, and negotiated arrangements. Contact sales via ${MARKETING_ROUTES.contact}.`,
      },
      {
        question: "Are there per-client fees?",
        answer: "Plans include client limits that scale by tier. Enterprise arrangements can define custom portfolio sizes.",
      },
    ],
  },
  {
    id: "enterprise",
    title: "Enterprise",
    items: [
      {
        question: "What does Enterprise onboarding include?",
        answer: "Dedicated setup, security review support, custom limit configuration, and priority support channel access.",
      },
      {
        question: "Can we negotiate custom terms?",
        answer: "Yes. Enterprise contracts cover custom limits, SLA expectations, and procurement requirements.",
      },
      {
        question: "How do I request an enterprise demo?",
        answer: `Book a demo at ${MARKETING_ROUTES.contact} or email sales with your portfolio size and requirements.`,
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [
      {
        question: "How do I contact support?",
        answer: `Visit ${MARKETING_ROUTES.support} or email ${SUPPORT_EMAIL}. Product and billing requests typically receive a response within one business day.`,
      },
      {
        question: "Where is documentation?",
        answer: `Product guides are at ${MARKETING_ROUTES.documentation} and /docs. Release notes are published at /docs/release-notes.`,
      },
      {
        question: "Is priority support available?",
        answer: "Enterprise plans include priority support. Business and Professional use standard support channels.",
      },
    ],
  },
] as const;

export const FAQ_ALL_ITEMS = FAQ_TOPICS.flatMap((topic) => topic.items);
