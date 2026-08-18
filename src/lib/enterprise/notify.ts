import "server-only";

import { SALES_EMAIL } from "@/lib/company/company-contact";
import { safeReplyToAddress } from "@/lib/email/addresses";
import { getDefaultFromEmail } from "@/lib/env/email";
import { sendEmail } from "@/lib/email/provider";

type EnterpriseRequestNotificationInput = {
  contactEmail: string;
  companyName: string;
  requestedSeats: number | null;
  requestedClients: number | null;
  notes: string | null;
  organizationId: string;
  requestId: string | null;
  /** When true, DB persist failed — email is the sole delivery path. */
  persistFailed?: boolean;
  correlationId?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function displayOrFallback(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function numericOrFallback(value: number | null | undefined, fallback: string): string {
  return value != null ? String(value) : fallback;
}

function labeledPlainText(label: string, value: string): string {
  return `${label}:\n${value}`;
}

function labeledHtmlBlock(label: string, value: string, monospace = false): string {
  const rendered = monospace
    ? `<code style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:13px;word-break:break-all;">${escapeHtml(value)}</code>`
    : escapeHtml(value).replace(/\n/g, "<br>");
  return `<p style="margin:0 0 4px 0;font-weight:600;">${escapeHtml(label)}:</p><p style="margin:0 0 16px 0;">${rendered}</p>`;
}

function buildEnterpriseRequestBodies(input: EnterpriseRequestNotificationInput): {
  text: string;
  html: string;
} {
  const correlationId = input.correlationId ?? "unknown";
  const persistWarning = input.persistFailed
    ? "WARNING: Database persist failed — this email is the only copy of the request."
    : null;
  const company = displayOrFallback(input.companyName, "(not specified)");
  const contactEmail = displayOrFallback(input.contactEmail, "(not specified)");
  const requestedSeats = numericOrFallback(input.requestedSeats, "(not specified)");
  const requestedClients = numericOrFallback(input.requestedClients, "(not specified)");
  const organizationId = displayOrFallback(input.organizationId, "(not specified)");
  const requestId = displayOrFallback(input.requestId, "(not persisted)");
  const notes = displayOrFallback(input.notes, "(none)");

  const text = [
    "ENTERPRISE REQUEST",
    persistWarning,
    "",
    labeledPlainText("Company", company),
    "",
    labeledPlainText("Contact Email", contactEmail),
    "",
    "Requested capacity",
    "",
    labeledPlainText("Requested Seats", requestedSeats),
    "",
    labeledPlainText("Requested Clients", requestedClients),
    "",
    "Provisioning identifiers",
    "",
    labeledPlainText("Organization ID", organizationId),
    "",
    labeledPlainText("Request ID", requestId),
    "",
    labeledPlainText("Notes", notes),
    "",
    labeledPlainText("Correlation ID", correlationId),
  ]
    .filter((line) => line !== null)
    .join("\n");

  const html = [
    `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:14px;line-height:1.5;color:#111827;">`,
    `<h1 style="margin:0 0 16px 0;font-size:18px;">ENTERPRISE REQUEST</h1>`,
    persistWarning
      ? `<p style="margin:0 0 16px 0;font-weight:600;">${escapeHtml(persistWarning)}</p>`
      : "",
    labeledHtmlBlock("Company", company),
    labeledHtmlBlock("Contact Email", contactEmail),
    `<h2 style="margin:8px 0 12px 0;font-size:15px;">Requested capacity</h2>`,
    labeledHtmlBlock("Requested Seats", requestedSeats),
    labeledHtmlBlock("Requested Clients", requestedClients),
    `<h2 style="margin:8px 0 12px 0;font-size:15px;">Provisioning identifiers</h2>`,
    labeledHtmlBlock("Organization ID", organizationId, true),
    labeledHtmlBlock("Request ID", requestId, true),
    labeledHtmlBlock("Notes", notes),
    labeledHtmlBlock("Correlation ID", correlationId, true),
    `</div>`,
  ]
    .filter(Boolean)
    .join("");

  return { text, html };
}

/**
 * Best-effort operator email for new Enterprise requests.
 * Destination is fixed (sales@) — never client-controlled.
 */
export async function sendEnterpriseRequestNotificationEmail(
  input: EnterpriseRequestNotificationInput,
): Promise<boolean> {
  const correlationId = input.correlationId ?? "unknown";
  try {
    const from = getDefaultFromEmail();
    const replyTo = safeReplyToAddress(input.contactEmail);
    const { text, html } = buildEnterpriseRequestBodies(input);
    const result = await sendEmail({
      from,
      to: SALES_EMAIL,
      ...(replyTo ? { replyTo } : {}),
      subject: `${input.persistFailed ? "[UNPERSISTED] " : ""}[Enterprise request] ${input.companyName}`,
      text,
      html,
    });

    if (!result.success) {
      console.error(`[enterprise] Request notification email failed (${correlationId})`);
      return false;
    }

    return true;
  } catch {
    console.error(`[enterprise] Request notification email threw (${correlationId})`);
    return false;
  }
}
