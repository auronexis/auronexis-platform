import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { COMPANY_CONTACT } from "@/lib/company";
import { buildEmailCtaButton, escapeHtml } from "@/lib/email/html";

export const WELCOME_EMAIL_SUBJECT = `Welcome to ${PLATFORM_NAME}`;

export type WelcomeEmailTemplateInput = {
  fullName: string;
  organizationName: string;
  /** Absolute sign-in URL (never includes auth secrets). */
  signInUrl: string;
};

export function buildWelcomeEmailPlainText(input: WelcomeEmailTemplateInput): string {
  const name = input.fullName.trim() || "there";
  return [
    `Welcome to ${PLATFORM_NAME}`,
    "",
    `Hi ${name},`,
    "",
    `Your workspace "${input.organizationName}" is ready.`,
    "",
    `Sign in to ${PLATFORM_NAME}:`,
    input.signInUrl,
    "",
    `Need help? Contact ${COMPANY_CONTACT.supportEmail}.`,
    "",
    `— The ${PLATFORM_NAME} team`,
  ].join("\n");
}

export function buildWelcomeEmailHtml(input: WelcomeEmailTemplateInput): string {
  const name = escapeHtml(input.fullName.trim() || "there");
  const org = escapeHtml(input.organizationName);
  const support = escapeHtml(COMPANY_CONTACT.supportEmail);
  const platform = escapeHtml(PLATFORM_NAME);
  const cta = buildEmailCtaButton(`Sign in to ${PLATFORM_NAME}`, input.signInUrl);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(WELCOME_EMAIL_SUBJECT)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:#071A3D;padding:28px 32px;">
                <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">${platform}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#0f172a;">Welcome to ${platform}</h1>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">Hi ${name},</p>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
                  Your workspace <strong>${org}</strong> has been created. You can sign in anytime to manage clients, automation, and reporting.
                </p>
                <p style="margin:24px 0;" align="center">${cta}</p>
                <p style="margin:24px 0 0 0;font-size:13px;line-height:1.5;color:#64748b;">
                  Need help? Contact
                  <a href="mailto:${support}" style="color:#2563EB;text-decoration:none;">${support}</a>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px 32px;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:12px;color:#94a3b8;">— The ${platform} team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
