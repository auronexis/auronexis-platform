import { Resend } from "resend";
import type { ResolvedOrganizationBranding } from "@/lib/branding/defaults";
import { getAppUrl, getResendApiKey, getResendFromEmail } from "@/lib/env";
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

/** Send a branded report email with PDF attachment via Resend. */
export async function sendReportEmail(input: SendReportEmailInput): Promise<SendReportEmailResult> {
  const templateInput = buildReportEmailTemplateInput(input);
  const subject = buildReportEmailSubject(templateInput.clientName);
  const html = buildReportEmailHtml(templateInput);
  const text = buildReportEmailPlainText(templateInput);
  const sender = resolveEmailSender(
    input.emailSettings,
    getResendFromEmail(),
    input.organizationName,
  );
  const resend = new Resend(getResendApiKey());

  try {
    const { data, error } = await resend.emails.send({
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

    if (error) {
      return { success: false, error: error.message, subject, plainText: text };
    }

    return {
      success: true,
      resendMessageId: data?.id,
      subject,
      plainText: text,
    };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unable to send email.";
    return { success: false, error: messageText, subject, plainText: text };
  }
}

// Re-export for callers that only need subject building
export { buildReportEmailSubject } from "@/lib/email/report-email-template";
