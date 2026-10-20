import type { MarketingBenefit } from "@/components/marketing/marketing-benefits-grid";
import type { MarketingStat } from "@/components/marketing/marketing-stats";

export const ENTERPRISE_CONTENT = {
  title: "Enterprise operations for multi-client delivery teams",
  description:
    "Scale client intelligence, reporting, risk, incident, and SLA workflows with unlimited AI credits, custom limits, and priority support.",
  stats: [
    { value: "∞", label: "AI credits", detail: "Unlimited monthly AI copilot usage on Enterprise." },
    { value: "RBAC", label: "Access control", detail: "Role-based permissions, with data isolated per workspace." },
    { value: "Audit", label: "Activity history", detail: "Operational events for governance and review." },
    { value: "EU", label: "Data posture", detail: "EU-capable regions with subprocessors documented." },
  ] satisfies readonly MarketingStat[],
  benefits: [
    {
      title: "Unlimited AI copilot",
      description: "Ask Auroranexis across portfolio and client contexts with enterprise credit limits.",
    },
    {
      title: "Custom limits",
      description: "Seat, client, and automation thresholds aligned to your delivery model.",
    },
    {
      title: "Priority support",
      description: "Escalation path for production incidents and onboarding assistance.",
    },
    {
      title: "Advanced security",
      description: "Tenant isolation, RLS, CSP, and responsible disclosure program.",
    },
    {
      title: "Executive intelligence",
      description: "Rule-based portfolio metrics with AI explanations that cite their sources.",
    },
    {
      title: "Procurement documentation",
      description: "Art. 28 DPA, sub-processor list, and security policy available for vendor review.",
    },
  ] satisfies readonly MarketingBenefit[],
  securityHighlights: [
    "Strict data isolation between workspaces",
    "Encryption in transit (TLS) and at rest through our infrastructure providers",
    "Audit-friendly activity and usage metadata",
    "Optional AI providers documented as sub-processors",
    "Cookie consent architecture for analytics and marketing tags",
  ],
  faq: [
    {
      question: "Who is Enterprise designed for?",
      answer:
        "Agencies and MSPs managing larger client portfolios that need custom limits, priority support, and unlimited AI copilot usage.",
    },
    {
      question: "How is AI usage handled on Enterprise?",
      answer:
        "Enterprise includes unlimited monthly AI credits. Usage is metered server-side for governance — prompts and responses are not stored in activity feeds.",
    },
    {
      question: "Can we review security and compliance documentation?",
      answer:
        "Yes. Security policy, privacy policy, DPA, and sub-processor list are available on the public site for procurement review.",
    },
  ],
} as const;
