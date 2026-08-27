import { PLATFORM_NAME } from "@/lib/branding/defaults";
import { COMPANY_CONTACT } from "@/lib/company";
import { buildEmailCtaButton, escapeHtml } from "@/lib/email/html";
import { getAppUrl } from "@/lib/env";

export type SalesInvoiceIssuedEmailInput = {
  buyerLegalName: string | null;
  invoiceNumber: string;
  invoiceDateLabel: string;
  billingPeriodLabel: string | null;
  totalLabel: string;
  currency: string;
};

/** Deterministic idempotency key — one delivery per issued sales invoice. */
export function buildSalesInvoiceIssuedTemplateKey(invoiceId: string): string {
  const id = invoiceId.trim();
  return `sales_invoice:${id}:issued`;
}

function resolveBillingSettingsUrl(): string {
  return `${getAppUrl().replace(/\/$/, "")}/settings/billing`;
}

/** Strip CR/LF to prevent email header injection. */
export function sanitizeEmailHeaderValue(value: string): string {
  return value.replace(/[\r\n\u0000]+/g, " ").trim();
}

export function buildSalesInvoiceIssuedSubject(input: { invoiceNumber: string }): string {
  const number = sanitizeEmailHeaderValue(input.invoiceNumber);
  return `Your ${PLATFORM_NAME} invoice ${number}`;
}

function greetingName(buyerLegalName: string | null): string {
  const trimmed = buyerLegalName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "there";
}

export function buildSalesInvoiceIssuedPlainText(input: SalesInvoiceIssuedEmailInput): string {
  const periodLine = input.billingPeriodLabel
    ? `Billing period: ${input.billingPeriodLabel}`
    : null;
  return [
    `${PLATFORM_NAME} invoice`,
    "",
    `Hello ${greetingName(input.buyerLegalName)},`,
    "",
    `Your ${PLATFORM_NAME} invoice ${input.invoiceNumber} is available.`,
    "",
    `Invoice date: ${input.invoiceDateLabel}`,
    ...(periodLine ? [periodLine] : []),
    `Total: ${input.totalLabel} (${input.currency.toUpperCase()})`,
    "",
    "The invoice PDF is attached to this email and remains available from your Auroranexis Billing area.",
    "",
    "View billing:",
    resolveBillingSettingsUrl(),
    "",
    `If you have questions regarding your subscription or invoice, contact ${COMPANY_CONTACT.supportEmail} or ${COMPANY_CONTACT.salesEmail}.`,
    "",
    `— ${PLATFORM_NAME}`,
  ].join("\n");
}

export function buildSalesInvoiceIssuedHtml(input: SalesInvoiceIssuedEmailInput): string {
  const name = escapeHtml(greetingName(input.buyerLegalName));
  const invoiceNumber = escapeHtml(input.invoiceNumber);
  const invoiceDate = escapeHtml(input.invoiceDateLabel);
  const total = escapeHtml(input.totalLabel);
  const currency = escapeHtml(input.currency.toUpperCase());
  const periodBlock = input.billingPeriodLabel
    ? `<p style="margin:4px 0;"><strong>Billing period:</strong> ${escapeHtml(input.billingPeriodLabel)}</p>`
    : "";

  return `
    <p>Hello ${name},</p>
    <p>Your <strong>${escapeHtml(PLATFORM_NAME)}</strong> invoice <strong>${invoiceNumber}</strong> is available.</p>
    <p style="margin:4px 0;"><strong>Invoice date:</strong> ${invoiceDate}</p>
    ${periodBlock}
    <p style="margin:4px 0;"><strong>Total:</strong> ${total} (${currency})</p>
    <p>The invoice PDF is attached to this email and remains available from your Auroranexis Billing area.</p>
    ${buildEmailCtaButton("View billing", resolveBillingSettingsUrl())}
    <p style="margin-top:24px;color:#64748b;font-size:13px;">If you have questions regarding your subscription or invoice, contact ${escapeHtml(COMPANY_CONTACT.supportEmail)} or ${escapeHtml(COMPANY_CONTACT.salesEmail)}.</p>
    <p style="margin-top:16px;color:#64748b;font-size:13px;">— ${escapeHtml(PLATFORM_NAME)}</p>
  `;
}
