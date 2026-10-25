import { COMPANY_INFORMATION } from "@/lib/company/company-information";

/**
 * Newsletter email content. Plain, readable HTML (inline styles only) plus a text part.
 * Every newsletter email carries the sender's legal identity and, for issues, an unsubscribe link.
 */

export type NewsletterEmailContent = { subject: string; html: string; text: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const LEGAL_LINE = `${COMPANY_INFORMATION.legalName} · ${COMPANY_INFORMATION.street} · ${COMPANY_INFORMATION.postalCode} ${COMPANY_INFORMATION.city} · Germany`;

function layout(bodyHtml: string, footerHtml: string): string {
  return `<!doctype html><html lang="en"><body style="margin:0;padding:0;background:#f4f6fa;">
<div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:Arial,Helvetica,sans-serif;color:#0b1b3a;font-size:15px;line-height:1.6;">
<p style="margin:0 0 24px;font-weight:bold;font-size:18px;color:#0b1b3a;">Auroranexis</p>
${bodyHtml}
<hr style="border:none;border-top:1px solid #dfe4ee;margin:32px 0 16px;">
<p style="margin:0;font-size:12px;color:#5a6680;">${footerHtml}</p>
</div></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#1f5fd6;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;">${escapeHtml(label)}</a></p>`;
}

export function buildNewsletterConfirmationEmail(confirmUrl: string): NewsletterEmailContent {
  const subject = "Please confirm your Auroranexis newsletter subscription";
  const html = layout(
    `<p style="margin:0 0 12px;">Hello,</p>
<p style="margin:0 0 12px;">You asked to receive product updates and occasional news from Auroranexis. Please confirm your email address with the button below.</p>
${button(confirmUrl, "Confirm subscription")}
<p style="margin:0 0 12px;">If the button does not work, copy this link into your browser:<br><span style="word-break:break-all;color:#1f5fd6;">${escapeHtml(confirmUrl)}</span></p>
<p style="margin:0;">If you did not sign up, simply ignore this email. You will not be subscribed and will not hear from us again.</p>`,
    `${escapeHtml(LEGAL_LINE)}<br>You received this email because this address was entered in the newsletter form on auroranexis.com.`,
  );
  const text = [
    "Hello,",
    "",
    "You asked to receive product updates and occasional news from Auroranexis. Please confirm your email address by opening this link:",
    "",
    confirmUrl,
    "",
    "If you did not sign up, simply ignore this email. You will not be subscribed and will not hear from us again.",
    "",
    "--",
    LEGAL_LINE,
  ].join("\n");
  return { subject, html, text };
}

export function buildNewsletterIssueEmail(input: {
  subject: string;
  /** Body as plain text; blank lines separate paragraphs. */
  bodyText: string;
  unsubscribeUrl: string;
}): NewsletterEmailContent {
  const paragraphs = input.bodyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const html = layout(
    paragraphs
      .map((p) => `<p style="margin:0 0 14px;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
      .join("\n"),
    `${escapeHtml(LEGAL_LINE)}<br>You receive this newsletter because you subscribed on auroranexis.com. <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#5a6680;">Unsubscribe</a>`,
  );
  const text = [
    ...paragraphs.flatMap((p) => [p, ""]),
    "--",
    LEGAL_LINE,
    `Unsubscribe: ${input.unsubscribeUrl}`,
  ].join("\n");
  return { subject: input.subject, html, text };
}
