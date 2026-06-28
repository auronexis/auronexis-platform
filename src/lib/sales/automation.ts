import "server-only";

import type { SalesLead } from "@/types/database";

export const REMINDER_TYPES = ["followup", "cadence", "escalation", "meeting"] as const;
export type ReminderType = (typeof REMINDER_TYPES)[number];

export const EMAIL_CADENCE_DAYS = [1, 3, 7, 14] as const;
export const LEAD_AGING_DAYS = 7;
export const NO_RESPONSE_DAYS = 5;
export const ESCALATION_DAYS = 14;

export type AutomationSnapshot = {
  pendingReminders: number;
  overdueReminders: number;
  noResponseLeads: number;
  escalatedLeads: number;
  agingLeads: number;
  cadenceSteps: typeof EMAIL_CADENCE_DAYS;
  reminderTypes: typeof REMINDER_TYPES;
};

type LeadAutomationFields = Pick<
  SalesLead,
  "last_outreach_at" | "last_contact_at" | "next_followup_at" | "no_response_flag" | "escalated_at" | "created_at"
>;

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

export function isLeadAging(lead: LeadAutomationFields): boolean {
  const reference = lead.last_contact_at ?? lead.last_outreach_at ?? lead.created_at;
  const days = daysSince(reference);
  return days !== null && days >= LEAD_AGING_DAYS;
}

export function shouldFlagNoResponse(lead: LeadAutomationFields): boolean {
  if (lead.no_response_flag) return true;
  const reference = lead.last_outreach_at ?? lead.last_contact_at;
  const days = daysSince(reference);
  return days !== null && days >= NO_RESPONSE_DAYS && !lead.next_followup_at;
}

export function shouldEscalate(lead: LeadAutomationFields): boolean {
  if (lead.escalated_at) return true;
  const days = daysSince(lead.last_outreach_at ?? lead.created_at);
  return days !== null && days >= ESCALATION_DAYS && lead.no_response_flag;
}

export function nextCadenceDueAt(step: number): string {
  const dayOffset = EMAIL_CADENCE_DAYS[Math.min(step, EMAIL_CADENCE_DAYS.length - 1)] ?? 14;
  const due = new Date();
  due.setDate(due.getDate() + dayOffset);
  return due.toISOString();
}

export function buildAutomationSnapshot(
  leads: LeadAutomationFields[],
  pendingReminders: number,
  overdueReminders: number,
): AutomationSnapshot {
  return {
    pendingReminders,
    overdueReminders,
    noResponseLeads: leads.filter(shouldFlagNoResponse).length,
    escalatedLeads: leads.filter(shouldEscalate).length,
    agingLeads: leads.filter(isLeadAging).length,
    cadenceSteps: EMAIL_CADENCE_DAYS,
    reminderTypes: REMINDER_TYPES,
  };
}
