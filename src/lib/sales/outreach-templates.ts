export type OutreachTemplateKey =
  | "cold_outreach"
  | "warm_outreach"
  | "linkedin_dm"
  | "email_sequence"
  | "follow_up"
  | "meeting_confirmation"
  | "proposal_mail"
  | "pilot_acceptance"
  | "pilot_rejection"
  | "win_back";

export type OutreachTemplate = {
  key: OutreachTemplateKey;
  title: string;
  channel: "email" | "linkedin" | "mixed";
  subject: string;
  body: string;
  cadenceStep?: number;
};

export const OUTREACH_TEMPLATES: OutreachTemplate[] = [
  {
    key: "cold_outreach",
    title: "Cold outreach",
    channel: "email",
    subject: "Quick question about {{company_name}} compliance workload",
    body: "Hi {{contact_name}},\n\nI noticed {{company_name}} manages client risk and compliance — many agencies we speak with spend 10+ hours per client on reporting alone.\n\nAuroranexis helps agencies centralize GRC, incidents, and client reporting in one workspace. Would a 15-minute discovery call be useful?\n\nBest,\n{{sender_name}}",
  },
  {
    key: "warm_outreach",
    title: "Warm outreach",
    channel: "email",
    subject: "Following up — Auroranexis for {{company_name}}",
    body: "Hi {{contact_name}},\n\nThanks for engaging with our pilot program / demo. Based on {{pain_points}}, I think a founding customer slot could be a strong fit.\n\nWe have {{slots_remaining}} founding slots left at 50% beta pricing. Shall we schedule a discovery call?\n\n{{booking_link}}",
  },
  {
    key: "linkedin_dm",
    title: "LinkedIn DM",
    channel: "linkedin",
    subject: "LinkedIn connection",
    body: "Hi {{contact_name}} — I work with agencies modernizing GRC and client reporting. Would love to connect and share how peers are cutting manual compliance hours with Auroranexis.",
  },
  {
    key: "email_sequence",
    title: "Email sequence (day 1)",
    channel: "email",
    subject: "Day 1 — How agencies reduce compliance overhead",
    body: "Hi {{contact_name}},\n\nSharing a quick overview of how founding customers use Auroranexis for multi-client GRC.\n\nReply \"interested\" and I'll send our pilot checklist.",
    cadenceStep: 1,
  },
  {
    key: "follow_up",
    title: "Follow-up",
    channel: "email",
    subject: "Re: Auroranexis pilot — still relevant?",
    body: "Hi {{contact_name}},\n\nWanted to bump this in case timing shifted. Happy to share a 2-minute loom or jump on a brief call.\n\nNo pressure either way.",
    cadenceStep: 3,
  },
  {
    key: "meeting_confirmation",
    title: "Meeting confirmation",
    channel: "email",
    subject: "Confirmed: discovery call with Auroranexis",
    body: "Hi {{contact_name}},\n\nLooking forward to our call on {{meeting_date}}.\n\nMeet link: {{google_meet_url}}\n\nAgenda: current workflow, pain points, pilot fit.",
  },
  {
    key: "proposal_mail",
    title: "Proposal mail",
    channel: "email",
    subject: "Auroranexis proposal for {{company_name}}",
    body: "Hi {{contact_name}},\n\nAttached is our commercial proposal covering scope, timeline, and founding customer pricing.\n\nEstimated MRR: ${{potential_mrr}}/mo\n\nLet me know if you'd like to walk through it together.",
  },
  {
    key: "pilot_acceptance",
    title: "Pilot acceptance",
    channel: "email",
    subject: "Welcome to the Auroranexis founding pilot",
    body: "Hi {{contact_name}},\n\nCongratulations — you're accepted into our founding customer program (slot {{slot_number}}/10).\n\nNext steps: onboarding checklist, workspace setup, and kickoff call.",
  },
  {
    key: "pilot_rejection",
    title: "Pilot rejection",
    channel: "email",
    subject: "Update on your Auroranexis pilot application",
    body: "Hi {{contact_name}},\n\nThank you for applying. We're at capacity for this cohort but would love to stay in touch for the next opening.\n\nWe'll notify you when a slot opens.",
  },
  {
    key: "win_back",
    title: "Win-back sequence",
    channel: "mixed",
    subject: "Checking back in — Auroranexis updates",
    body: "Hi {{contact_name}},\n\nIt's been a while since we connected. We've shipped several founding-customer features since then.\n\nWould a quick re-sync be helpful?",
    cadenceStep: 7,
  },
];

export function listOutreachTemplates(): OutreachTemplate[] {
  return OUTREACH_TEMPLATES;
}

export function getOutreachTemplate(key: OutreachTemplateKey): OutreachTemplate | undefined {
  return OUTREACH_TEMPLATES.find((template) => template.key === key);
}

export function renderTemplate(
  template: OutreachTemplate,
  vars: Record<string, string | number | null | undefined>,
): { subject: string; body: string } {
  const replace = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(vars[name] ?? `{{${name}}}`));

  return {
    subject: replace(template.subject),
    body: replace(template.body),
  };
}
