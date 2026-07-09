import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { getAppUrl } from "@/lib/env";
import { getDefaultFromEmail } from "@/lib/env/email";
import { sendEmail } from "@/lib/email/provider";
import {
  buildReportEmailHtml,
  buildReportEmailPlainText,
  buildReportEmailSubject,
  resolveEmailSender,
  type ReportEmailTemplateInput,
} from "@/lib/email/report-email-template";
import type { OrganizationEmailSettings } from "@/types/database";
import type { ReportWithRelations } from "@/lib/reports/types";

export type SendReportEmailInput = {
  organizationName: string;
  branding: ResolvedOrganizationBranding;
  emailSettings: OrganizationEmailSettings | null;
  report: ReportWithRelations;
  recipientEmail: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
};

export type SendReportEmailResult = {
  success: boolean;
  error?: string;
  messageId?: string;
  /** @deprecated Use messageId — kept for delivery record compatibility */
  resendMessageId?: string;
  subject?: string;
  plainText?: string;
};

export function buildReportPortalUrls(reportId: string): {
  viewReportUrl: string;
  downloadPdfUrl: string;
} {
  const appUrl = getAppUrl().replace(/\/$/, "");

  return {
    viewReportUrl: `${appUrl}/client-portal/reports/${reportId}`,
    downloadPdfUrl: `${appUrl}/client-portal/reports/${reportId}/export`,
  };
}

export function buildReportEmailTemplateInput(
  input: SendReportEmailInput,
): ReportEmailTemplateInput {
  const clientName = input.report.clients?.name ?? "Client";
  const portalUrls = buildReportPortalUrls(input.report.id);

  return {
    organizationName: input.organizationName,
    branding: input.branding,
    clientName,
    reportTitle: input.report.title,
    reportingPeriodStart: input.report.reporting_period_start,
    reportingPeriodEnd: input.report.reporting_period_end,
    executiveSummary: input.report.executive_summary,
    viewReportUrl: portalUrls.viewReportUrl,
    downloadPdfUrl: portalUrls.downloadPdfUrl,
  };
}

/** Send a branded report email with PDF attachment via the configured provider. */
export async function sendReportEmail(input: SendReportEmailInput): Promise<SendReportEmailResult> {
  const templateInput = buildReportEmailTemplateInput(input);
  const subject = buildReportEmailSubject(templateInput.clientName);
  const html = buildReportEmailHtml(templateInput);
  const text = buildReportEmailPlainText(templateInput);
  const sender = resolveEmailSender(
    input.emailSettings,
    getDefaultFromEmail(),
    input.organizationName,
  );

  const result = await sendEmail({
    from: sender.from,
    to: input.recipientEmail,
    replyTo: sender.replyTo,
    subject,
    html,
    text,
    attachments: [
      {
        filename: input.pdfFilename,
        content: input.pdfBuffer,
      },
    ],
  });

  if (!result.success) {
    return { success: false, error: result.error, subject, plainText: text };
  }

  return {
    success: true,
    messageId: result.messageId,
    resendMessageId: result.messageId,
    subject,
    plainText: text,
  };
}

// Re-export for callers that only need subject building
export { buildReportEmailSubject } from "@/lib/email/report-email-template";
