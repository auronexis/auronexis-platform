import type { ReportAIActionKey, ReportAISectionKey } from "@/lib/ai/types";

/** Sections generated sequentially in Entire Report mode. */
export const ENTIRE_REPORT_SECTIONS: ReportAISectionKey[] = [
  "executive_summary",
  "key_wins",
  "key_risks",
  "next_actions",
  "recommendations",
  "business_summary",
];

export const FORM_PERSISTED_SECTIONS: ReportAISectionKey[] = [
  "executive_summary",
  "key_wins",
  "key_risks",
  "next_actions",
];

export function emptyFieldValues(): Record<ReportAISectionKey, string> {
  return {
    executive_summary: "",
    business_summary: "",
    key_wins: "",
    key_risks: "",
    next_actions: "",
    recommendations: "",
    customer_highlights: "",
    operational_health_summary: "",
    management_summary: "",
    customer_email: "",
    meeting_agenda: "",
  };
}

export function contextToFieldValues(context: {
  executiveSummary: string;
  businessSummary: string;
  keyWins: string;
  keyRisks: string;
  nextActions: string;
  recommendations: string;
  customerHighlights: string;
  operationalHealthSummary: string;
  managementSummary: string;
}): Record<ReportAISectionKey, string> {
  return {
    executive_summary: context.executiveSummary,
    business_summary: context.businessSummary,
    key_wins: context.keyWins,
    key_risks: context.keyRisks,
    next_actions: context.nextActions,
    recommendations: context.recommendations,
    customer_highlights: context.customerHighlights,
    operational_health_summary: context.operationalHealthSummary,
    management_summary: context.managementSummary,
    customer_email: "",
    meeting_agenda: "",
  };
}

export function normalizeAction(action: ReportAIActionKey): ReportAIActionKey {
  switch (action) {
    case "generate_summary":
      return "generate_executive_summary";
    case "generate_wins":
      return "generate_key_wins";
    case "generate_risks":
      return "generate_key_risks";
    case "improve_writing":
      return "rewrite_professionally";
    case "shorten":
      return "rewrite_shorter";
    case "expand":
      return "rewrite_longer";
    case "tone_technical":
      return "explain_technically";
    case "tone_executive":
      return "explain_for_executives";
    case "tone_professional":
      return "rewrite_professionally";
    default:
      return action;
  }
}

export function inferTargetSection(action: ReportAIActionKey): ReportAISectionKey | undefined {
  const normalized = normalizeAction(action);

  switch (normalized) {
    case "generate_executive_summary":
      return "executive_summary";
    case "generate_business_summary":
      return "business_summary";
    case "generate_key_wins":
      return "key_wins";
    case "generate_key_risks":
      return "key_risks";
    case "generate_next_actions":
      return "next_actions";
    case "generate_recommendations":
      return "recommendations";
    case "generate_customer_highlights":
      return "customer_highlights";
    case "generate_operational_health":
      return "operational_health_summary";
    case "generate_management_summary":
      return "management_summary";
    case "generate_customer_email":
      return "customer_email";
    case "generate_meeting_agenda":
      return "meeting_agenda";
    default:
      return undefined;
  }
}

export function actionForSection(section: ReportAISectionKey): ReportAIActionKey {
  switch (section) {
    case "executive_summary":
      return "generate_executive_summary";
    case "business_summary":
      return "generate_business_summary";
    case "key_wins":
      return "generate_key_wins";
    case "key_risks":
      return "generate_key_risks";
    case "next_actions":
      return "generate_next_actions";
    case "recommendations":
      return "generate_recommendations";
    default:
      return "generate_executive_summary";
  }
}
