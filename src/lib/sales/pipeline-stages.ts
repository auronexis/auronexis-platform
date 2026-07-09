import type { SalesInboxKey, SalesLeadSource, SalesPipelineStage } from "@/types/database";
import {
  INFO_EMAIL,
  SALES_EMAIL,
  SECURITY_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/contact";

/** B2B SaaS pipeline stages — keys map to existing DB enum values. */
export const PIPELINE_STAGES: ReadonlyArray<{
  key: SalesPipelineStage;
  label: string;
  description: string;
  badgeClass: string;
}> = [
  {
    key: "pilot_lead",
    label: "New",
    description: "Inbound interest — not yet contacted.",
    badgeClass: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  },
  {
    key: "pilot_application",
    label: "Contacted",
    description: "Initial outreach completed.",
    badgeClass: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  {
    key: "discovery_call",
    label: "Demo Scheduled",
    description: "Discovery or product demo booked.",
    badgeClass: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
  {
    key: "qualified",
    label: "Qualified",
    description: "Fit confirmed — moving toward proposal.",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  {
    key: "proposal_sent",
    label: "Proposal Sent",
    description: "Commercial proposal delivered.",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  {
    key: "negotiation",
    label: "Negotiation",
    description: "Terms and pricing in discussion.",
    badgeClass: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  },
  {
    key: "won",
    label: "Won",
    description: "Closed won — customer acquired.",
    badgeClass: "bg-green-500/15 text-green-700 dark:text-green-300",
  },
  {
    key: "lost",
    label: "Lost",
    description: "Closed lost — no longer active.",
    badgeClass: "bg-red-500/15 text-red-700 dark:text-red-300",
  },
];

export const LEAD_SOURCES: ReadonlyArray<{ key: SalesLeadSource; label: string }> = [
  { key: "contact", label: "Contact form" },
  { key: "pilot", label: "Pilot application" },
  { key: "demo", label: "Demo request" },
  { key: "newsletter", label: "Newsletter" },
  { key: "referral", label: "Referral" },
  { key: "signup", label: "Product signup" },
  { key: "other", label: "Manual / other" },
];

export const SALES_ACTIVITY_TYPES = [
  { key: "note", label: "Note" },
  { key: "email", label: "Email" },
  { key: "call", label: "Call" },
  { key: "meeting", label: "Meeting" },
  { key: "outreach", label: "Outreach" },
] as const;

export type SalesActivityTypeKey = (typeof SALES_ACTIVITY_TYPES)[number]["key"];

export const SALES_INBOXES: ReadonlyArray<{
  key: SalesInboxKey;
  label: string;
  email: string;
}> = [
  { key: "support", label: "Support", email: SUPPORT_EMAIL },
  { key: "sales", label: "Sales", email: SALES_EMAIL },
  { key: "info", label: "Info", email: INFO_EMAIL },
  { key: "security", label: "Security", email: SECURITY_EMAIL },
];

export const ACTIVE_PIPELINE_STAGES: SalesPipelineStage[] = PIPELINE_STAGES.filter(
  (stage) => stage.key !== "won" && stage.key !== "lost",
).map((stage) => stage.key);

export const CLOSED_WON_STAGE: SalesPipelineStage = "won";
export const CLOSED_LOST_STAGE: SalesPipelineStage = "lost";

export function getPipelineStageLabel(stage: SalesPipelineStage): string {
  return PIPELINE_STAGES.find((item) => item.key === stage)?.label ?? stage;
}

export function getPipelineStageBadgeClass(stage: SalesPipelineStage): string {
  return PIPELINE_STAGES.find((item) => item.key === stage)?.badgeClass ?? "bg-muted/20 text-muted";
}

export function getLeadSourceLabel(source: SalesLeadSource): string {
  return LEAD_SOURCES.find((item) => item.key === source)?.label ?? source;
}

export function getInboxEmail(key: SalesInboxKey): string {
  return SALES_INBOXES.find((item) => item.key === key)?.email ?? SALES_EMAIL;
}

export function defaultStageForSource(source: SalesLeadSource): SalesPipelineStage {
  switch (source) {
    case "pilot":
      return "pilot_application";
    case "demo":
      return "discovery_call";
    default:
      return "pilot_lead";
  }
}

export function defaultInboxForSource(source: SalesLeadSource): SalesInboxKey {
  switch (source) {
    case "contact":
    case "newsletter":
    case "referral":
      return "info";
    case "pilot":
    case "demo":
    case "signup":
      return "sales";
    default:
      return "sales";
  }
}
