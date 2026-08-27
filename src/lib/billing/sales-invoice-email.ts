/**
 * C2 — Transactional delivery of issued Auroranexis sales invoices.
 * Invoked only after an ISSUED sales_invoices row is persisted.
 * Never creates/mutates invoices, payments, subscriptions, or entitlements.
 */

import "server-only";

import type { SalesInvoiceRecord } from "@/lib/billing/sales-invoice";
import {
  buildSalesInvoicePdfFilename,
  generateSalesInvoicePdf,
} from "@/lib/billing/sales-invoice-render";
import { COMPANY_CONTACT } from "@/lib/company";
import { safeReplyToAddress } from "@/lib/email/addresses";
import { resolvePrimaryBillingRecipientForEmail } from "@/lib/email/billing-recipient";
import { EMAIL_CATEGORIES } from "@/lib/email/categories";
import {
  claimTransactionalDelivery,
  finalizeTransactionalDelivery,
  getTransactionalFromEmail,
  sendClaimedTransactionalEmail,
} from "@/lib/email/transactional";
import {
  buildSalesInvoiceIssuedHtml,
  buildSalesInvoiceIssuedPlainText,
  buildSalesInvoiceIssuedSubject,
  buildSalesInvoiceIssuedTemplateKey,
  sanitizeEmailHeaderValue,
} from "@/lib/email/templates/sales-invoice";
import { formatAppDate } from "@/lib/i18n/date";
import { formatMoneyFromCentsLocale } from "@/lib/i18n/format";

export type DeliverIssuedSalesInvoiceEmailResult = {
  success: boolean;
  skipped?: boolean;
  reason?:
    | "idempotent_skip"
    | "missing_recipient"
    | "missing_ledger_user"
    | "pdf_failed"
    | "send_failed"
    | "not_issued";
};

export type DeliverIssuedSalesInvoiceEmailDeps = {
  generatePdf: typeof generateSalesInvoicePdf;
  resolveLedgerUser: typeof resolvePrimaryBillingRecipientForEmail;
  claim: typeof claimTransactionalDelivery;
  finalize: typeof finalizeTransactionalDelivery;
  sendClaimed: typeof sendClaimedTransactionalEmail;
};

const defaultDeps: DeliverIssuedSalesInvoiceEmailDeps = {
  generatePdf: generateSalesInvoicePdf,
  resolveLedgerUser: resolvePrimaryBillingRecipientForEmail,
  claim: claimTransactionalDelivery,
  finalize: finalizeTransactionalDelivery,
  sendClaimed: sendClaimedTransactionalEmail,
};

/**
 * Recipient is the immutable snapshotted buyer billing email on the invoice only.
 * Never falls back to owner/admin/Mollie/operator addresses.
 */
export function resolveIssuedInvoiceEmailRecipient(
  invoice: Pick<SalesInvoiceRecord, "buyerBillingEmail">,
): string | null {
  return safeReplyToAddress(invoice.buyerBillingEmail) ?? null;
}

function formatBillingPeriodLabel(invoice: SalesInvoiceRecord): string | null {
  const start = invoice.billingPeriodStart;
  const end = invoice.billingPeriodEnd;
  if (!start && !end) return null;
  const startLabel = start ? formatAppDate(start, "en") : null;
  const endLabel = end ? formatAppDate(end, "en") : null;
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  return startLabel ?? endLabel;
}

function buildTemplateInput(invoice: SalesInvoiceRecord) {
  const invoiceDateSource = invoice.issuedAt ?? invoice.createdAt;
  return {
    buyerLegalName: invoice.buyerLegalName,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDateLabel: formatAppDate(invoiceDateSource, "en"),
    billingPeriodLabel: formatBillingPeriodLabel(invoice),
    totalLabel: formatMoneyFromCentsLocale(invoice.grossMinor, invoice.currency, "en"),
    currency: invoice.currency,
  };
}

/**
 * Send exactly one invoice email with the production PDF for an issued sales invoice.
 * Failures are recorded and never throw to callers (invoice remains issued).
 */
export async function deliverIssuedSalesInvoiceEmail(
  invoice: SalesInvoiceRecord,
  deps: Partial<DeliverIssuedSalesInvoiceEmailDeps> = {},
): Promise<DeliverIssuedSalesInvoiceEmailResult> {
  const runtime: DeliverIssuedSalesInvoiceEmailDeps = { ...defaultDeps, ...deps };

  if (invoice.status !== "issued") {
    console.error("[billing][sales-invoice-email] refused — invoice not issued", {
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      status: invoice.status,
    });
    return { success: false, reason: "not_issued" };
  }

  const templateKey = buildSalesInvoiceIssuedTemplateKey(invoice.id);
  const recipient = resolveIssuedInvoiceEmailRecipient(invoice);

  let ledgerUser: { userId: string; email: string } | null;
  try {
    ledgerUser = await runtime.resolveLedgerUser(invoice.organizationId);
  } catch {
    console.error("[billing][sales-invoice-email] ledger user lookup failed", {
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      invoiceNumber: invoice.invoiceNumber,
    });
    return { success: false, reason: "missing_ledger_user" };
  }

  if (!ledgerUser?.userId) {
    console.error("[billing][sales-invoice-email] no ledger user for delivery claim", {
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      invoiceNumber: invoice.invoiceNumber,
    });
    return { success: false, reason: "missing_ledger_user" };
  }

  const claim = await runtime.claim({
    organizationId: invoice.organizationId,
    userId: ledgerUser.userId,
    category: EMAIL_CATEGORIES.BILLING_SYSTEM,
    templateKey,
  });

  if (!claim.claimed) {
    console.info("[billing][sales-invoice-email] skipped (idempotent)", {
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      invoiceNumber: invoice.invoiceNumber,
      templateKey,
    });
    return { success: true, skipped: true, reason: "idempotent_skip" };
  }

  if (!recipient) {
    await runtime.finalize({
      deliveryId: claim.deliveryId,
      status: "skipped",
      errorCode: "missing_recipient",
    });
    console.error("[billing][sales-invoice-email] missing buyer billing email (invoice retained)", {
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      invoiceNumber: invoice.invoiceNumber,
      deliveryId: claim.deliveryId,
    });
    return { success: false, skipped: true, reason: "missing_recipient" };
  }

  let pdf: Buffer;
  let filename: string;
  try {
    pdf = await runtime.generatePdf(invoice, { preview: false, locale: "en" });
    filename = buildSalesInvoicePdfFilename(invoice.invoiceNumber);
  } catch {
    await runtime.finalize({
      deliveryId: claim.deliveryId,
      status: "failed",
      errorCode: "pdf_generation_failed",
    });
    console.error("[billing][sales-invoice-email] PDF generation failed (invoice retained)", {
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      invoiceNumber: invoice.invoiceNumber,
      deliveryId: claim.deliveryId,
    });
    return { success: false, reason: "pdf_failed" };
  }

  const templateInput = buildTemplateInput(invoice);
  const subject = sanitizeEmailHeaderValue(buildSalesInvoiceIssuedSubject(templateInput));

  try {
    const result = await runtime.sendClaimed({
      deliveryId: claim.deliveryId,
      category: EMAIL_CATEGORIES.BILLING_SYSTEM,
      templateKey,
      from: getTransactionalFromEmail(),
      to: recipient,
      subject,
      html: buildSalesInvoiceIssuedHtml(templateInput),
      text: buildSalesInvoiceIssuedPlainText(templateInput),
      replyTo: COMPANY_CONTACT.supportEmail,
      attachments: [
        {
          filename,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    });

    if (result.success) {
      console.info("[billing][sales-invoice-email] sent", {
        invoiceId: invoice.id,
        organizationId: invoice.organizationId,
        invoiceNumber: invoice.invoiceNumber,
        deliveryId: claim.deliveryId,
        templateKey,
      });
      return { success: true };
    }

    console.error("[billing][sales-invoice-email] send failed (invoice retained)", {
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      invoiceNumber: invoice.invoiceNumber,
      deliveryId: claim.deliveryId,
      templateKey,
    });
    return { success: false, reason: "send_failed" };
  } catch {
    await runtime.finalize({
      deliveryId: claim.deliveryId,
      status: "failed",
      errorCode: "provider_exception",
    });
    console.error("[billing][sales-invoice-email] send threw (invoice retained)", {
      invoiceId: invoice.id,
      organizationId: invoice.organizationId,
      invoiceNumber: invoice.invoiceNumber,
      deliveryId: claim.deliveryId,
      templateKey,
    });
    return { success: false, reason: "send_failed" };
  }
}
