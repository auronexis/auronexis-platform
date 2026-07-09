import "server-only";

import { getEmailProviderId, isEmailConfigured } from "@/lib/env/email";
import { sendViaMailgun } from "@/lib/email/provider/mailgun";
import { sendViaPostmark } from "@/lib/email/provider/postmark";
import { sendViaResend } from "@/lib/email/provider/resend";
import { sendViaSes } from "@/lib/email/provider/ses";
import { sendViaSmtp } from "@/lib/email/provider/smtp";
import type { EmailMessage, EmailSendResult } from "@/lib/email/types";

/** Send a transactional email through the configured provider. */
export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  if (!isEmailConfigured()) {
    return { success: false, error: "Email delivery is not configured for this environment." };
  }

  switch (getEmailProviderId()) {
    case "resend":
      return sendViaResend(message);
    case "postmark":
      return sendViaPostmark(message);
    case "mailgun":
      return sendViaMailgun(message);
    case "ses":
      return sendViaSes(message);
    case "smtp":
      return sendViaSmtp(message);
    default:
      return { success: false, error: "Unknown email provider configuration." };
  }
}
