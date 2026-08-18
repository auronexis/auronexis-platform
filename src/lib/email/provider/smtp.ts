import "server-only";

import nodemailer from "nodemailer";
import type { EmailMessage, EmailSendResult } from "@/lib/email/types";

type SmtpTransportConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
};

function parseSmtpPort(raw: string | undefined): number | null {
  const port = Number(raw?.trim());
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return null;
  return port;
}

/** Port 465 always uses implicit TLS. SMTP_SECURE=true enables it on other ports. */
function resolveSmtpSecure(port: number): boolean {
  if (port === 465) {
    return true;
  }

  const raw = process.env.SMTP_SECURE?.trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

function getNativeSmtpConfig(): SmtpTransportConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const port = parseSmtpPort(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  const from = process.env.SMTP_FROM?.trim();
  if (!host || port === null || !user || !password || !from) {
    return null;
  }

  return {
    host,
    port,
    secure: resolveSmtpSecure(port),
    user,
    password,
  };
}

function redactSecret(text: string, secret: string): string {
  if (!secret) return text;
  return text.split(secret).join("[redacted]");
}

function sanitizeSmtpOperationalError(error: unknown): string {
  const fallback = "Unable to send email via SMTP.";
  if (!(error instanceof Error) || !error.message.trim()) {
    return fallback;
  }

  const secret = process.env.SMTP_PASSWORD?.trim() ?? "";
  let text = redactSecret(error.message, secret);
  text = text.replace(/pass(?:word)?\s*[:=]\s*\S+/gi, "password=[redacted]");

  if (secret && text.includes(secret)) {
    return fallback;
  }

  if (/SMTP_PASSWORD/i.test(text)) {
    return fallback;
  }

  const compact = text.replace(/\s+/g, " ").trim();
  if (!compact) {
    return fallback;
  }

  return compact.length > 180 ? fallback : compact;
}

function formatEnvelopeAddress(value: string | string[]): string {
  return Array.isArray(value) ? value.join(",") : value;
}

/** Exact payload passed to Nodemailer sendMail — recipient is message.to, never SMTP_USER/SMTP_FROM. */
export function buildSmtpMailOptions(message: EmailMessage) {
  return {
    from: message.from,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
    replyTo: message.replyTo,
    attachments: message.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType,
    })),
  };
}

/**
 * Native SMTP transport (STRATO: smtp.strato.de:465, secure TLS).
 * Requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM.
 */
export async function sendViaSmtp(message: EmailMessage): Promise<EmailSendResult> {
  const config = getNativeSmtpConfig();
  if (!config) {
    return { success: false, error: "SMTP is not configured for this environment." };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  try {
    const mail = buildSmtpMailOptions(message);
    console.info(`[email] smtp sendMail to=${formatEnvelopeAddress(mail.to)} from=${mail.from}`);
    const info = await transporter.sendMail(mail);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: sanitizeSmtpOperationalError(error) };
  } finally {
    transporter.close();
  }
}
