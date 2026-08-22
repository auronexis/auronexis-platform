import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { COMPANY_CONTACT } from "@/lib/company";
import { buildEmailCtaButton, escapeHtml } from "@/lib/email/html";
import { getAppUrl } from "@/lib/env";

export type PurchaseActivatedEmailInput = {
  organizationName: string;
  planName: string;
  receiptUrl: string | null;
};

function resolveBillingSettingsUrl(): string {
  return `${getAppUrl().replace(/\/$/, "")}/settings/billing`;
}

export function buildPurchaseActivatedSubject(input: { planName: string }): string {
  return `Your ${input.planName} subscription is active — ${PLATFORM_NAME}`;
}

export function buildPurchaseActivatedPlainText(input: PurchaseActivatedEmailInput): string {
  const receiptLine = input.receiptUrl
    ? `View payment details: ${input.receiptUrl}`
    : "View billing history in your workspace settings.";
  return [
    `${PLATFORM_NAME} subscription activated`,
    "",
    `Workspace: ${input.organizationName}`,
    "",
    `Your ${input.planName} subscription is now active.`,
    receiptLine,
    "",
    "View billing:",
    resolveBillingSettingsUrl(),
    "",
    `Need help? Contact ${COMPANY_CONTACT.supportEmail}.`,
    "",
    `— ${PLATFORM_NAME} Notifications`,
  ].join("\n");
}

export function buildPurchaseActivatedHtml(input: PurchaseActivatedEmailInput): string {
  const receiptBlock = input.receiptUrl
    ? `<p><a href="${escapeHtml(input.receiptUrl)}">View payment details</a></p>`
    : "<p>Your payment receipt will appear in billing history when available.</p>";

  return `
    <p>Your <strong>${escapeHtml(input.planName)}</strong> subscription for <strong>${escapeHtml(input.organizationName)}</strong> is now active.</p>
    ${receiptBlock}
    ${buildEmailCtaButton("View billing", resolveBillingSettingsUrl())}
    <p style="margin-top:24px;color:#64748b;font-size:13px;">Need help? Contact ${escapeHtml(COMPANY_CONTACT.supportEmail)}.</p>
  `;
}

export function buildPurchaseActivatedTemplateKey(
  providerSubscriptionId: string,
  providerPaymentId: string,
): string {
  return `purchase_activated:${providerSubscriptionId}:${providerPaymentId}`;
}
