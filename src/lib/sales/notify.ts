import "server-only";

import { getDefaultFromEmail } from "@/lib/env/email";
import { sendEmail } from "@/lib/email/provider";
import { getInboxEmail } from "@/lib/sales/pipeline-stages";
import type { SalesInboxKey, SalesLeadSource } from "@/types/database";
import { getLeadSourceLabel } from "@/lib/sales/pipeline-stages";

type LeadNotificationInput = {
  inboxKey: SalesInboxKey;
  source: SalesLeadSource;
  contactName: string;
  contactEmail: string;
  companyName?: string | null;
  message?: string | null;
  /** When true, DB persist failed — email is the sole delivery path. */
  persistFailed?: boolean;
};

export async function sendLeadNotificationEmail(input: LeadNotificationInput): Promise<boolean> {
  try {
    const to = getInboxEmail(input.inboxKey);
    const from = getDefaultFromEmail();
    const sourceLabel = getLeadSourceLabel(input.source);
    const persistNote = input.persistFailed
      ? "WARNING: Database persist failed — this email is the only copy of the lead."
      : null;

    const result = await sendEmail({
      from,
      to,
      replyTo: input.contactEmail,
      subject: `${input.persistFailed ? "[UNPERSISTED] " : ""}[${sourceLabel}] ${input.contactName}${input.companyName ? ` — ${input.companyName}` : ""}`,
      text: [
        `New inbound lead (${sourceLabel})`,
        persistNote,
        "",
        `Name: ${input.contactName}`,
        `Email: ${input.contactEmail}`,
        input.companyName ? `Company: ${input.companyName}` : null,
        input.message ? `\nMessage:\n${input.message}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    if (!result.success) {
      console.error("[sales] Lead notification email failed:", result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[sales] Lead notification email failed:", error);
    return false;
  }
}
