import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { COMPANY_CONTACT } from "@/lib/company";
import { buildEmailCtaButton, escapeHtml } from "@/lib/email/html";
import { getAppUrl } from "@/lib/env";

export type PlanChangeScheduledEmailInput = {
  organizationName: string;
  currentPlanName: string;
  targetPlanName: string;
  changeType: "upgrade" | "downgrade";
  effectiveAtLabel: string | null;
};

export type PlanChangeAppliedEmailInput = {
  organizationName: string;
  previousPlanName: string;
  newPlanName: string;
  changeType: "upgrade" | "downgrade";
};

function resolveBillingSettingsUrl(): string {
  return `${getAppUrl().replace(/\/$/, "")}/settings/billing`;
}

function resolvePlansUrl(): string {
  return `${getAppUrl().replace(/\/$/, "")}/settings/plans`;
}

export function buildPlanChangeScheduledSubject(input: {
  changeType: "upgrade" | "downgrade";
  targetPlanName: string;
}): string {
  const verb = input.changeType === "upgrade" ? "Upgrade" : "Downgrade";
  return `${verb} to ${input.targetPlanName} scheduled — ${PLATFORM_NAME}`;
}

export function buildPlanChangeAppliedSubject(input: {
  newPlanName: string;
}): string {
  return `Your ${input.newPlanName} plan is now active — ${PLATFORM_NAME}`;
}

export function buildPlanChangeScheduledPlainText(input: PlanChangeScheduledEmailInput): string {
  const direction = input.changeType === "upgrade" ? "upgrade" : "downgrade";
  const effective = input.effectiveAtLabel
    ? `on ${input.effectiveAtLabel}`
    : "at your next billing cycle";
  return [
    `${PLATFORM_NAME} plan change scheduled`,
    "",
    `Workspace: ${input.organizationName}`,
    "",
    `Your ${direction} from ${input.currentPlanName} to ${input.targetPlanName} is scheduled ${effective}.`,
    `${input.currentPlanName} remains your active plan until then.`,
    "",
    "View billing:",
    resolveBillingSettingsUrl(),
    "",
    `Need help? Contact ${COMPANY_CONTACT.supportEmail}.`,
    "",
    `— ${PLATFORM_NAME} Notifications`,
  ].join("\n");
}

export function buildPlanChangeAppliedPlainText(input: PlanChangeAppliedEmailInput): string {
  return [
    `${PLATFORM_NAME} plan update`,
    "",
    `Workspace: ${input.organizationName}`,
    "",
    `Your plan changed from ${input.previousPlanName} to ${input.newPlanName}.`,
    `${input.newPlanName} is now your active plan and entitlements have been updated.`,
    "",
    "View plans:",
    resolvePlansUrl(),
    "",
    `Need help? Contact ${COMPANY_CONTACT.supportEmail}.`,
    "",
    `— ${PLATFORM_NAME} Notifications`,
  ].join("\n");
}

export function buildPlanChangeScheduledHtml(input: PlanChangeScheduledEmailInput): string {
  const org = escapeHtml(input.organizationName);
  const current = escapeHtml(input.currentPlanName);
  const target = escapeHtml(input.targetPlanName);
  const platform = escapeHtml(PLATFORM_NAME);
  const support = escapeHtml(COMPANY_CONTACT.supportEmail);
  const direction = input.changeType === "upgrade" ? "upgrade" : "downgrade";
  const effective = input.effectiveAtLabel
    ? `on <strong>${escapeHtml(input.effectiveAtLabel)}</strong>`
    : "at your next billing cycle";
  const subject = buildPlanChangeScheduledSubject({
    changeType: input.changeType,
    targetPlanName: input.targetPlanName,
  });
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
                <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#0f172a;">Plan change scheduled</h1>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">Workspace <strong>${org}</strong></p>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
                  Your ${direction} from <strong>${current}</strong> to <strong>${target}</strong> is scheduled ${effective}.
                  <strong>${current}</strong> remains your active plan until then.
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

export function buildPlanChangeAppliedHtml(input: PlanChangeAppliedEmailInput): string {
  const org = escapeHtml(input.organizationName);
  const previous = escapeHtml(input.previousPlanName);
  const next = escapeHtml(input.newPlanName);
  const platform = escapeHtml(PLATFORM_NAME);
  const support = escapeHtml(COMPANY_CONTACT.supportEmail);
  const subject = buildPlanChangeAppliedSubject({ newPlanName: input.newPlanName });
  const cta = buildEmailCtaButton("View plans", resolvePlansUrl());

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
                <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:700;color:#0f172a;">Your plan is now active</h1>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">Workspace <strong>${org}</strong></p>
                <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
                  Your plan changed from <strong>${previous}</strong> to <strong>${next}</strong>.
                  <strong>${next}</strong> is now your active plan.
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
