import "server-only";

import { Resend } from "resend";
import { getOptionalResendApiKey } from "@/lib/env/email";
import type { EmailMessage, EmailSendResult } from "@/lib/email/types";

export async function sendViaResend(message: EmailMessage): Promise<EmailSendResult> {
  const apiKey = getOptionalResendApiKey();
  if (!apiKey) {
    return { success: false, error: "Resend API key is not configured." };
  }

  const resend = new Resend(apiKey);

  try {
    const payload = {
      from: message.from,
      to: message.to,
      subject: message.subject,
      replyTo: message.replyTo,
      attachments: message.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
      })),
      ...(message.html
        ? { html: message.html, text: message.text }
        : { text: message.text ?? message.subject }),
    };

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unable to send email via Resend.";
    return { success: false, error: messageText };
  }
}
