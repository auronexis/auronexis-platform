import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { getPoweredByLine, PLATFORM_NAME } from "@/lib/branding/defaults";
import type { OrganizationEmailSettings } from "@/types/database";

export type ResolvedEmailSender = {
  from: string;
  replyTo?: string;
};

export type ReportEmailTemplateInput = {
  organizationName: string;
  branding: ResolvedOrganizationBranding;
  clientName: string;
  reportTitle: string;
  reportingPeriodStart: string;
  reportingPeriodEnd: string;
  executiveSummary: string | null;
  viewReportUrl: string;
  downloadPdfUrl: string;
};

export const DEFAULT_EMAIL_FROM_NAME = PLATFORM_NAME;

export function formatReportingPeriod(start: string, end: string): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `${formatter.format(new Date(start))} – ${formatter.format(new Date(end))}`;
}

export function buildReportEmailSubject(clientName: string): string {
  return `Monthly Operations Report – ${clientName}`;
}

export function buildReportEmailPlainText(input: ReportEmailTemplateInput): string {
  const period = formatReportingPeriod(
    input.reportingPeriodStart,
    input.reportingPeriodEnd,
  );
  const summary = input.executiveSummary?.trim() || "Your latest operational report is ready.";

  return [
    `${input.organizationName} Operations Report`,
    "",
    `Client: ${input.clientName}`,
    `Reporting period: ${period}`,
    "",
    summary,
    "",
    `View report: ${input.viewReportUrl}`,
    `Download PDF: ${input.downloadPdfUrl}`,
    "",
    "The full report PDF is also attached to this email.",
    "",
    getPoweredByLine(input.branding),
  ].join("\n");
}

export function buildReportEmailHtml(input: ReportEmailTemplateInput): string {
  const period = formatReportingPeriod(
    input.reportingPeriodStart,
    input.reportingPeriodEnd,
  );
  const summary = input.executiveSummary?.trim() || "Your latest operational report is ready.";
  const escapedSummary = escapeHtml(summary);
  const escapedClient = escapeHtml(input.clientName);
  const escapedOrg = escapeHtml(input.organizationName);
  const escapedTitle = escapeHtml(input.reportTitle);
  const escapedCompany = escapeHtml(input.branding.companyName);
  const poweredByLine = escapeHtml(getPoweredByLine(input.branding));
  const logoBlock = input.branding.logoUrl
    ? `<img src="${escapeHtml(input.branding.logoUrl)}" alt="${escapedCompany}" width="40" height="40" style="display:block;border-radius:8px;object-fit:contain;background-color:#ffffff;" />`
    : `<p style="margin:0;width:40px;height:40px;line-height:40px;text-align:center;border-radius:8px;background-color:${input.branding.primaryColor};color:#ffffff;font-size:18px;font-weight:700;">${escapeHtml(input.branding.companyName.charAt(0).toUpperCase() || "A")}</p>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(buildReportEmailSubject(input.clientName))}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:${input.branding.secondaryColor};padding:28px 32px;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding-right:14px;vertical-align:middle;">${logoBlock}</td>
                    <td style="vertical-align:middle;">
                      <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">${escapedCompany}</p>
                      <p style="margin:8px 0 0;font-size:13px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;">Operations Report Delivery</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Prepared for</p>
                <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#071A3D;">${escapedClient}</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
                  ${escapedOrg} has shared your latest operations report.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                  <tr>
                    <td style="padding:20px;">
                      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Report</p>
                      <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#0f172a;">${escapedTitle}</p>
                      <p style="margin:0;font-size:14px;color:#475569;"><strong>Reporting period:</strong> ${escapeHtml(period)}</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;">Summary</p>
                <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#334155;white-space:pre-wrap;">${escapedSummary}</p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
                  <tr>
                    <td style="padding-right:12px;">
                      <a href="${input.viewReportUrl}" style="display:inline-block;background-color:${input.branding.primaryColor};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">View Report</a>
                    </td>
                    <td>
                      <a href="${input.downloadPdfUrl}" style="display:inline-block;background-color:${input.branding.secondaryColor};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">Download PDF</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                  The full report PDF is attached to this email. Portal links require your client portal login.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:11px;line-height:1.6;color:#94a3b8;">
                  ${poweredByLine}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function resolveEmailSender(
  settings: OrganizationEmailSettings | null,
  fallbackFromEmail: string,
  organizationName: string,
): ResolvedEmailSender {
  if (settings) {
    return {
      from: `${settings.from_name} <${settings.from_email}>`,
      replyTo: settings.reply_to ?? undefined,
    };
  }

  const fromName = organizationName || DEFAULT_EMAIL_FROM_NAME;

  return {
    from: `${fromName} <${extractEmailAddress(fallbackFromEmail)}>`,
    replyTo: extractReplyTo(fallbackFromEmail),
  };
}

function extractEmailAddress(fromValue: string): string {
  const match = fromValue.match(/<([^>]+)>/);
  return match?.[1]?.trim() ?? fromValue.trim();
}

function extractReplyTo(fromValue: string): string | undefined {
  const email = extractEmailAddress(fromValue);
  return email.includes("@") ? email : undefined;
}
