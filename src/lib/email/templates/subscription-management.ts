import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { COMPANY_CONTACT } from "@/lib/company";
import { buildEmailCtaButton, escapeHtml } from "@/lib/email/html";
import { getAppUrl } from "@/lib/env";

export type PlanChangeCanceledEmailInput = {
  organizationName: string;
  currentPlanName: string;
  canceledPlanName: string;
  changeType: "upgrade" | "downgrade";
};

export type SubscriptionCancellationScheduledEmailInput = {
  organizationName: string;
  planName: string;
  accessUntilLabel: string | null;
};

export type SubscriptionEndedEmailInput = {
  organizationName: string;
  planName: string;
  accessUntilLabel: string | null;
};

export type SubscriptionCancellationWithdrawnEmailInput = {
  organizationName: string;
  planName: string;
  renewalLabel: string | null;
};

function resolveBillingSettingsUrl(): string {
  return `${getAppUrl().replace(/\/$/, "")}/settings/billing`;
}

export function buildPlanChangeCanceledSubject(input: {
  currentPlanName: string;
}): string {
  return `Scheduled plan change canceled — ${input.currentPlanName} continues — ${PLATFORM_NAME}`;
}

export function buildSubscriptionCancellationScheduledSubject(): string {
  return `Subscription cancellation scheduled — ${PLATFORM_NAME}`;
}

export function buildSubscriptionEndedSubject(): string {
  return `Your subscription has ended — ${PLATFORM_NAME}`;
}

export function buildSubscriptionCancellationWithdrawnSubject(input: {
  planName: string;
}): string {
  return `Your ${input.planName} subscription will continue — ${PLATFORM_NAME}`;
}

export function buildPlanChangeCanceledPlainText(input: PlanChangeCanceledEmailInput): string {
  const direction = input.changeType === "upgrade" ? "upgrade" : "downgrade";
  return [
    `${PLATFORM_NAME} plan change canceled`,
    "",
    `Workspace: ${input.organizationName}`,
    "",
    `Your scheduled ${direction} to ${input.canceledPlanName} was canceled.`,
    `${input.currentPlanName} remains your active plan.`,
    "",
    "View billing:",
    resolveBillingSettingsUrl(),
    "",
    `Need help? Contact ${COMPANY_CONTACT.supportEmail}.`,
    "",
    `— ${PLATFORM_NAME} Notifications`,
  ].join("\n");
}

export function buildSubscriptionCancellationScheduledPlainText(
  input: SubscriptionCancellationScheduledEmailInput,
): string {
  const until = input.accessUntilLabel
    ? `until ${input.accessUntilLabel}`
    : "until the end of your current billing period";
  return [
    `${PLATFORM_NAME} subscription cancellation scheduled`,
    "",
    `Workspace: ${input.organizationName}`,
    "",
    `Your ${input.planName} subscription will not renew. You keep access ${until}.`,
    "Any scheduled plan change was removed.",
    "",
    "View billing:",
    resolveBillingSettingsUrl(),
    "",
    `Need help? Contact ${COMPANY_CONTACT.supportEmail}.`,
    "",
    `— ${PLATFORM_NAME} Notifications`,
  ].join("\n");
}

export function buildSubscriptionEndedPlainText(input: SubscriptionEndedEmailInput): string {
  const ended = input.accessUntilLabel
    ? `on ${input.accessUntilLabel}`
    : "at the end of your billing period";
  return [
    `${PLATFORM_NAME} subscription ended`,
    "",
    `Workspace: ${input.organizationName}`,
    "",
    `Your ${input.planName} subscription ended ${ended}. Paid access has now expired.`,
    "",
    "View billing:",
    resolveBillingSettingsUrl(),
    "",
    `Need help? Contact ${COMPANY_CONTACT.supportEmail}.`,
    "",
    `— ${PLATFORM_NAME} Notifications`,
  ].join("\n");
}

export function buildSubscriptionCancellationWithdrawnPlainText(
  input: SubscriptionCancellationWithdrawnEmailInput,
): string {
  const renewalLine = input.renewalLabel
    ? `Next renewal: ${input.renewalLabel}`
    : "Your renewal date has been restored.";
  return [
    `${PLATFORM_NAME} subscription will continue`,
    "",
    `Workspace: ${input.organizationName}`,
    "",
    `Your ${input.planName} cancellation was withdrawn.`,
    `${input.planName} remains active.`,
    renewalLine,
    "No charge today — your existing payment mandate will be used at renewal.",
    "",
    "View billing:",
    resolveBillingSettingsUrl(),
    "",
    `Need help? Contact ${COMPANY_CONTACT.supportEmail}.`,
    "",
    `— ${PLATFORM_NAME} Notifications`,
  ].join("\n");
}

export function buildPlanChangeCanceledHtml(input: PlanChangeCanceledEmailInput): string {
  const org = escapeHtml(input.organizationName);
  const current = escapeHtml(input.currentPlanName);
  const canceled = escapeHtml(input.canceledPlanName);
  const platform = escapeHtml(PLATFORM_NAME);
  const support = escapeHtml(COMPANY_CONTACT.supportEmail);
  const direction = input.changeType === "upgrade" ? "upgrade" : "downgrade";
  const subject = buildPlanChangeCanceledSubject({ currentPlanName: input.currentPlanName });
  const cta = buildEmailCtaButton("View billing", resolveBillingSettingsUrl());

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
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
                <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#0f172a;">Scheduled plan change canceled</h1>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">Workspace <strong>${org}</strong></p>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
                  Your scheduled ${direction} to <strong>${canceled}</strong> was canceled.
                  <strong>${current}</strong> remains your active plan.
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
                <p style="margin:0;font-size:12px;color:#94a3b8;">— ${platform} Notifications</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildSubscriptionCancellationScheduledHtml(
  input: SubscriptionCancellationScheduledEmailInput,
): string {
  const org = escapeHtml(input.organizationName);
  const plan = escapeHtml(input.planName);
  const platform = escapeHtml(PLATFORM_NAME);
  const support = escapeHtml(COMPANY_CONTACT.supportEmail);
  const until = input.accessUntilLabel
    ? `until <strong>${escapeHtml(input.accessUntilLabel)}</strong>`
    : "until the end of your current billing period";
  const subject = buildSubscriptionCancellationScheduledSubject();
  const cta = buildEmailCtaButton("View billing", resolveBillingSettingsUrl());

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
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
                <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#0f172a;">Cancellation scheduled</h1>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">Workspace <strong>${org}</strong></p>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
                  Your <strong>${plan}</strong> subscription will not renew. You keep access ${until}.
                  Any scheduled plan change was removed.
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
                <p style="margin:0;font-size:12px;color:#94a3b8;">— ${platform} Notifications</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildSubscriptionEndedHtml(input: SubscriptionEndedEmailInput): string {
  const org = escapeHtml(input.organizationName);
  const plan = escapeHtml(input.planName);
  const platform = escapeHtml(PLATFORM_NAME);
  const support = escapeHtml(COMPANY_CONTACT.supportEmail);
  const ended = input.accessUntilLabel
    ? `on <strong>${escapeHtml(input.accessUntilLabel)}</strong>`
    : "at the end of your billing period";
  const subject = buildSubscriptionEndedSubject();
  const cta = buildEmailCtaButton("View billing", resolveBillingSettingsUrl());

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
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
                <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#0f172a;">Subscription ended</h1>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">Workspace <strong>${org}</strong></p>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
                  Your <strong>${plan}</strong> subscription ended ${ended}. Paid access has now expired.
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
                <p style="margin:0;font-size:12px;color:#94a3b8;">— ${platform} Notifications</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildSubscriptionCancellationWithdrawnHtml(
  input: SubscriptionCancellationWithdrawnEmailInput,
): string {
  const org = escapeHtml(input.organizationName);
  const plan = escapeHtml(input.planName);
  const platform = escapeHtml(PLATFORM_NAME);
  const support = escapeHtml(COMPANY_CONTACT.supportEmail);
  const renewalBlock = input.renewalLabel
    ? `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">Next renewal: <strong>${escapeHtml(input.renewalLabel)}</strong>.</p>`
    : `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">Your renewal date has been restored.</p>`;
  const subject = buildSubscriptionCancellationWithdrawnSubject({ planName: input.planName });
  const cta = buildEmailCtaButton("View billing", resolveBillingSettingsUrl());

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
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
                <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#0f172a;">Your subscription will continue</h1>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">Workspace <strong>${org}</strong></p>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
                  Your <strong>${plan}</strong> cancellation was withdrawn. <strong>${plan}</strong> remains active.
                </p>
                ${renewalBlock}
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
                  No charge today — your existing payment mandate will be used at renewal.
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
                <p style="margin:0;font-size:12px;color:#94a3b8;">— ${platform} Notifications</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
