import type { SalesInboxKey, SalesLeadSource, SalesPipelineStage } from "@/types/database";
import {
  INFO_EMAIL,
  SALES_EMAIL,
  SECURITY_EMAIL,
  SUPPORT_EMAIL,
} from "@/lib/company/contact";

export const PIPELINE_STAGES: ReadonlyArray<{
  key: SalesPipelineStage;
  label: string;
  description: string;
}> = [
  { key: "pilot_lead", label: "Pilot Leads", description: "Inbound interest from marketing surfaces." },
  { key: "pilot_application", label: "Pilot Applications", description: "Submitted pilot program applications." },
  { key: "discovery_call", label: "Discovery Calls", description: "Scheduled discovery conversations." },
  { key: "qualified", label: "Qualified", description: "Fit confirmed — moving toward proposal." },
  { key: "proposal_sent", label: "Proposal Sent", description: "Commercial proposal delivered." },
  { key: "negotiation", label: "Negotiation", description: "Terms and pricing in discussion." },
  { key: "won", label: "Won", description: "Closed won — customer acquired." },
  { key: "lost", label: "Lost", description: "Closed lost — no longer active." },
];

export const LEAD_SOURCES: ReadonlyArray<{ key: SalesLeadSource; label: string }> = [
  { key: "contact", label: "Contact form" },
  { key: "pilot", label: "Pilot application" },
  { key: "demo", label: "Book demo" },
  { key: "newsletter", label: "Newsletter" },
  { key: "referral", label: "Referral" },
  { key: "signup", label: "Product signup" },
  { key: "other", label: "Other" },
];

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
