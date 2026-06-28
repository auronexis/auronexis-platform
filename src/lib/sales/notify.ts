import "server-only";

import { Resend } from "resend";
import { getResendApiKey, getResendFromEmail } from "@/lib/env";
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
};

export async function sendLeadNotificationEmail(input: LeadNotificationInput): Promise<boolean> {
  try {
    const to = getInboxEmail(input.inboxKey);
    const resend = new Resend(getResendApiKey());
    const from = getResendFromEmail();
    const sourceLabel = getLeadSourceLabel(input.source);

    await resend.emails.send({
      from,
      to,
      replyTo: input.contactEmail,
      subject: `[${sourceLabel}] ${input.contactName}${input.companyName ? ` — ${input.companyName}` : ""}`,
      text: [
        `New inbound lead (${sourceLabel})`,
        "",
        `Name: ${input.contactName}`,
        `Email: ${input.contactEmail}`,
        input.companyName ? `Company: ${input.companyName}` : null,
        input.message ? `\nMessage:\n${input.message}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });

    return true;
  } catch (error) {
    console.error("[sales] Lead notification email failed:", error);
    return false;
  }
}
