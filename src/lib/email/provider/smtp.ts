import "server-only";

import type { EmailMessage, EmailSendResult } from "@/lib/email/types";

function getSmtpConfig(): {
  host: string;
  port: number;
  user: string;
  password: string;
} | null {
  const host = process.env.SMTP_HOST?.trim();
  const portRaw = process.env.SMTP_PORT?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  if (!host || !portRaw || !user || !password) return null;

  const port = Number(portRaw);
  if (!Number.isFinite(port)) return null;

  return { host, port, user, password };
}

/**
 * SMTP relay via provider HTTP bridge or future native transport.
 * Configure Supabase Auth custom SMTP with the same credentials in production.
 */
export async function sendViaSmtp(message: EmailMessage): Promise<EmailSendResult> {
  const config = getSmtpConfig();
  if (!config) {
    return { success: false, error: "SMTP host, port, user, or password is not configured." };
  }

  const relayUrl = process.env.SMTP_RELAY_URL?.trim();
  if (!relayUrl) {
    return {
      success: false,
      error:
        "SMTP relay URL is not configured. Use SMTP_RELAY_URL for an HTTPS relay, or switch EMAIL_PROVIDER to resend/postmark/mailgun.",
    };
  }

  try {
    const response = await fetch(relayUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(process.env.SMTP_RELAY_TOKEN?.trim()
          ? { Authorization: `Bearer ${process.env.SMTP_RELAY_TOKEN.trim()}` }
          : {}),
      },
      body: JSON.stringify({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        message,
      }),
    });

    const payload = (await response.json()) as { messageId?: string; error?: string };

    if (!response.ok) {
      return { success: false, error: payload.error ?? "SMTP relay rejected the email request." };
    }

    return { success: true, messageId: payload.messageId };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unable to send email via SMTP relay.";
    return { success: false, error: messageText };
  }
}
