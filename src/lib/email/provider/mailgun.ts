import "server-only";

import type { EmailMessage, EmailSendResult } from "@/lib/email/types";

function getMailgunConfig(): { apiKey: string; domain: string } | null {
  const apiKey = process.env.MAILGUN_API_KEY?.trim();
  const domain = process.env.MAILGUN_DOMAIN?.trim();
  if (!apiKey || !domain) return null;
  return { apiKey, domain };
}

export async function sendViaMailgun(message: EmailMessage): Promise<EmailSendResult> {
  const config = getMailgunConfig();
  if (!config) {
    return { success: false, error: "Mailgun API key or domain is not configured." };
  }

  const body = new URLSearchParams();
  body.set("from", message.from);
  body.set(
    "to",
    Array.isArray(message.to) ? message.to.join(",") : message.to,
  );
  body.set("subject", message.subject);
  if (message.html) body.set("html", message.html);
  if (message.text) body.set("text", message.text);
  if (message.replyTo) body.set("h:Reply-To", message.replyTo);

  try {
    const response = await fetch(
      `https://api.mailgun.net/v3/${config.domain}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );

    const payload = (await response.json()) as { id?: string; message?: string };

    if (!response.ok) {
      return {
        success: false,
        error: payload.message ?? "Mailgun rejected the email request.",
      };
    }

    return { success: true, messageId: payload.id };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unable to send email via Mailgun.";
    return { success: false, error: messageText };
  }
}
