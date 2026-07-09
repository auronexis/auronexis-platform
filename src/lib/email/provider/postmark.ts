import "server-only";

import type { EmailMessage, EmailSendResult } from "@/lib/email/types";

function getPostmarkToken(): string | null {
  const value = process.env.POSTMARK_SERVER_TOKEN?.trim();
  return value && value.length > 0 ? value : null;
}

export async function sendViaPostmark(message: EmailMessage): Promise<EmailSendResult> {
  const token = getPostmarkToken();
  if (!token) {
    return { success: false, error: "Postmark server token is not configured." };
  }

  try {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify({
        From: message.from,
        To: Array.isArray(message.to) ? message.to.join(",") : message.to,
        Subject: message.subject,
        HtmlBody: message.html,
        TextBody: message.text,
        ReplyTo: message.replyTo,
      }),
    });

    const payload = (await response.json()) as { MessageID?: string; Message?: string };

    if (!response.ok) {
      return {
        success: false,
        error: payload.Message ?? "Postmark rejected the email request.",
      };
    }

    return { success: true, messageId: payload.MessageID };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unable to send email via Postmark.";
    return { success: false, error: messageText };
  }
}
